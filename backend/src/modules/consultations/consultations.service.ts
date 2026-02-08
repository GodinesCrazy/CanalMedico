import { randomUUID } from 'crypto';
import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { ConsultationType, ConsultationStatus } from '@/types';
import { getPaginationParams, createPaginatedResponse } from '@/utils/pagination';

export interface CreateConsultationDto {
  doctorId: string;
  patientId: string;
  type: ConsultationType;
}

export class ConsultationsService {
  async create(data: CreateConsultationDto) {
    try {
      // Verificar que el doctor existe - FIX P2022: select explícito
      const doctor = await prisma.doctor.findUnique({
        where: { id: data.doctorId },
        select: { id: true, tarifaConsulta: true, tarifaUrgencia: true },
      });

      if (!doctor) {
        throw createError('Doctor no encontrado', 404);
      }

      // Verificar que el paciente existe - FIX P2022: select explícito
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
        select: { id: true },
      });

      if (!patient) {
        throw createError('Paciente no encontrado', 404);
      }

      // Calcular precio según tarifa del médico
      const amountValue = data.type === ConsultationType.URGENCIA
        ? Number(doctor.tarifaUrgencia)
        : Number(doctor.tarifaConsulta);

      if (!amountValue || amountValue <= 0) {
        throw createError('La tarifa del médico no está configurada', 400);
      }

      // INCIDENT FIX: findFirst/create con raw SQL - prod tiene solo columnas init (sin price/source).
      // Evita P2022 cuando migraciones posteriores no están aplicadas.
      const existingRows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM consultations
        WHERE "doctorId" = ${data.doctorId} AND "patientId" = ${data.patientId}
        AND status IN ('PENDING', 'ACTIVE') LIMIT 1
      `;
      if (existingRows.length > 0) {
        throw createError('Ya existe una consulta activa con este doctor', 409);
      }

      const consultationId = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO consultations (id, "doctorId", "patientId", type, status, "createdAt", "updatedAt")
        VALUES (${consultationId}, ${data.doctorId}, ${data.patientId}, ${data.type}, 'PENDING', NOW(), NOW())
      `;

      const [created] = await prisma.$queryRaw<
        { id: string; doctorId: string; patientId: string; type: string; status: string; createdAt: Date; updatedAt: Date }[]
      >`
        SELECT id, "doctorId", "patientId", type, status, "createdAt", "updatedAt"
        FROM consultations WHERE id = ${consultationId}
      `;
      const consultation = {
        ...created!,
        price: Math.round(amountValue),
      };

      logger.info(`Consulta creada: ${consultation.id} - Doctor: ${data.doctorId} - Paciente: ${data.patientId}`);

      return consultation;
    } catch (error) {
      logger.error('Error al crear consulta:', error);
      throw error;
    }
  }

  async getById(consultationId: string) {
    try {
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          payment: true,
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      return consultation;
    } catch (error) {
      logger.error('Error al obtener consulta:', error);
      throw error;
    }
  }

  async getByDoctor(doctorId: string, page?: number, limit?: number, status?: ConsultationStatus) {
    try {
      const { skip, take } = getPaginationParams(page, limit);

      const where: any = { doctorId };
      if (status) {
        where.status = status;
      }

      const [consultations, total] = await Promise.all([
        prisma.consultation.findMany({
          where,
          skip,
          take,
          include: {
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
            payment: true,
            messages: {
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.consultation.count({ where }),
      ]);

      return createPaginatedResponse(consultations, total, page || 1, limit || 10);
    } catch (error) {
      logger.error('Error al obtener consultas del doctor:', error);
      throw error;
    }
  }

  async getByPatient(patientId: string, page?: number, limit?: number, status?: ConsultationStatus) {
    try {
      const { skip, take } = getPaginationParams(page, limit);

      const where: any = { patientId };
      if (status) {
        where.status = status;
      }

      const [consultations, total] = await Promise.all([
        prisma.consultation.findMany({
          where,
          skip,
          take,
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
            payment: true,
            messages: {
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.consultation.count({ where }),
      ]);

      return createPaginatedResponse(consultations, total, page || 1, limit || 10);
    } catch (error) {
      logger.error('Error al obtener consultas del paciente:', error);
      throw error;
    }
  }

  async activate(consultationId: string, paymentId: string) {
    try {
      const consultation = await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: ConsultationStatus.ACTIVE,
          paymentId,
        },
        include: {
          doctor: true,
          patient: true,
        },
      });

      logger.info(`Consulta activada: ${consultationId}`);

      return consultation;
    } catch (error) {
      logger.error('Error al activar consulta:', error);
      throw error;
    }
  }

  /**
   * DOCTOR acepta consulta (PENDING â†’ ACTIVE)
   * Solo si status === PENDING
   * Establece startedAt = now()
   */
  async accept(consultationId: string, doctorId: string) {
    try {
      // Verificar que la consulta existe y pertenece al doctor
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      if (consultation.doctorId !== doctorId) {
        throw createError('No tienes permiso para aceptar esta consulta', 403);
      }

      if (consultation.status !== ConsultationStatus.PENDING) {
        throw createError('Solo se pueden aceptar consultas con estado PENDING', 400);
      }

      const updatedConsultation = await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: ConsultationStatus.ACTIVE,
          startedAt: new Date(),
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Consulta aceptada: ${consultationId} por doctor: ${doctorId}`);

      return updatedConsultation;
    } catch (error) {
      logger.error('Error al aceptar consulta:', error);
      throw error;
    }
  }

  /**
   * DOCTOR completa consulta (ACTIVE â†’ COMPLETED)
   * Solo si status === ACTIVE
   * Establece endedAt = now()
   */
  async complete(consultationId: string, doctorId: string) {
    try {
      // Verificar que la consulta existe y pertenece al doctor
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      if (consultation.doctorId !== doctorId) {
        throw createError('No tienes permiso para completar esta consulta', 403);
      }

      if (consultation.status !== ConsultationStatus.ACTIVE) {
        throw createError('Solo se pueden completar consultas con estado ACTIVE', 400);
      }

      const updatedConsultation = await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: ConsultationStatus.COMPLETED,
          endedAt: new Date(),
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      logger.info(`Consulta completada: ${consultationId} por doctor: ${doctorId}`);

      return updatedConsultation;
    } catch (error) {
      logger.error('Error al completar consulta:', error);
      throw error;
    }
  }

  /**
   * Cerrar consulta (para compatibilidad con cÃ³digo existente)
   * Deprecated: usar complete() en su lugar
   */
  async close(consultationId: string) {
    try {
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      // Si estÃ¡ ACTIVE, completarla
      if (consultation.status === ConsultationStatus.ACTIVE) {
        return this.complete(consultationId, consultation.doctorId);
      }

      // Si estÃ¡ PENDING, cancelarla
      if (consultation.status === ConsultationStatus.PENDING) {
        const updatedConsultation = await prisma.consultation.update({
          where: { id: consultationId },
          data: {
            status: ConsultationStatus.CANCELLED,
            endedAt: new Date(),
          },
          include: {
            doctor: true,
            patient: true,
          },
        });

        logger.info(`Consulta cancelada: ${consultationId}`);
        return updatedConsultation;
      }

      throw createError(`No se puede cerrar una consulta con estado ${consultation.status}`, 400);
    } catch (error) {
      logger.error('Error al cerrar consulta:', error);
      throw error;
    }
  }
}

export default new ConsultationsService();

