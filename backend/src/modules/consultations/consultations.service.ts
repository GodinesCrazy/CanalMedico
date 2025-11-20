import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { ConsultationType, ConsultationStatus } from '@prisma/client';
import { getPaginationParams, createPaginatedResponse } from '@/utils/pagination';

export interface CreateConsultationDto {
  doctorId: string;
  patientId: string;
  type: ConsultationType;
}

export class ConsultationsService {
  async create(data: CreateConsultationDto) {
    try {
      // Verificar que el doctor existe
      const doctor = await prisma.doctor.findUnique({
        where: { id: data.doctorId },
      });

      if (!doctor) {
        throw createError('Doctor no encontrado', 404);
      }

      // Verificar que el paciente existe
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
      });

      if (!patient) {
        throw createError('Paciente no encontrado', 404);
      }

      // Verificar si ya existe una consulta activa
      const existingConsultation = await prisma.consultation.findFirst({
        where: {
          doctorId: data.doctorId,
          patientId: data.patientId,
          status: {
            in: ['PENDING', 'PAID', 'ACTIVE'],
          },
        },
      });

      if (existingConsultation) {
        throw createError('Ya existe una consulta activa con este doctor', 409);
      }

      // Crear consulta
      const consultation = await prisma.consultation.create({
        data: {
          doctorId: data.doctorId,
          patientId: data.patientId,
          type: data.type,
          status: ConsultationStatus.PENDING,
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

  async close(consultationId: string) {
    try {
      const consultation = await prisma.consultation.update({
        where: { id: consultationId },
        data: {
          status: ConsultationStatus.CLOSED,
          closedAt: new Date(),
        },
        include: {
          doctor: true,
          patient: true,
        },
      });

      logger.info(`Consulta cerrada: ${consultationId}`);

      return consultation;
    } catch (error) {
      logger.error('Error al cerrar consulta:', error);
      throw error;
    }
  }
}

export default new ConsultationsService();

