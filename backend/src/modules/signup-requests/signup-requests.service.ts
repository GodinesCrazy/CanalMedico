import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { getPaginationParams, createPaginatedResponse } from '@/utils/pagination';
import identityVerificationService from '../identity-verification/identity-verification.service';
import rnpiVerificationService from '../rnpi-verification/rnpi-verification.service';
import { formatRut, extractRutAndDv } from '@/utils/rut';
import { hashPassword } from '@/utils/hash';
import notificationsService from '../notifications/notifications.service';

export interface CreateSignupRequestDto {
  name: string;
  rut?: string;
  birthDate?: string;
  specialty: string;
  registrationNumber?: string;
  email: string;
  phone?: string;
  clinicOrCenter?: string;
  notes?: string;
}

export class SignupRequestsService {
  async create(data: CreateSignupRequestDto) {
    try {
      const existingRequest = await prisma.doctorSignupRequest.findFirst({
        where: {
          email: data.email,
          status: {
            in: ['PENDING', 'REVIEWED', 'AUTO_REJECTED'],
          },
        },
      });

      if (existingRequest) {
        throw createError('Ya existe una solicitud pendiente con este correo electronico', 409);
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw createError('Ya existe un usuario registrado con este correo electronico', 409);
      }

      if (!data.rut) {
        throw createError('El RUT es obligatorio para el registro de medicos', 400);
      }

      const { rut: run, dv } = extractRutAndDv(data.rut);
      if (!run || !dv) {
        throw createError('Formato de RUT invalido. Use formato: 12345678-9', 400);
      }

      const request = await prisma.doctorSignupRequest.create({
        data: {
          name: data.name,
          rut: formatRut(data.rut),
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          specialty: data.specialty,
          registrationNumber: data.registrationNumber || null,
          email: data.email,
          phone: data.phone || null,
          clinicOrCenter: data.clinicOrCenter || null,
          notes: data.notes || null,
          status: 'PENDING',
          identityVerificationStatus: 'PENDING',
          rnpiVerificationStatus: 'PENDING',
        },
      });

      logger.info(`Nueva solicitud de registro medico creada: ${request.email}. Iniciando validaciones automaticas...`);

      this.performAutomaticVerifications(request.id, run, dv, data.name, data.specialty, data.birthDate)
        .catch((error) => {
          logger.error(`Error en validaciones automaticas para solicitud ${request.id}:`, error);
        });

      return request;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Error al crear solicitud de registro:', error);
      throw createError('Error al crear solicitud de registro', 500);
    }
  }

  private async performAutomaticVerifications(
    requestId: string,
    run: string,
    dv: string,
    name: string,
    specialty: string,
    birthDate?: string
  ): Promise<void> {
    try {
      const errors: string[] = [];

      logger.info(`[${requestId}] Iniciando validacion de identidad...`);
      const identityResult = await identityVerificationService.verifyIdentity({
        rut: run,
        dv,
        name,
        birthDate,
      });

      await prisma.doctorSignupRequest.update({
        where: { id: requestId },
        data: {
          identityVerificationStatus: identityResult.status,
          identityVerificationResult: JSON.stringify(identityResult),
          identityVerifiedAt: identityResult.verifiedAt || new Date(),
        },
      });

      logger.info(`[${requestId}] Validacion de identidad: ${identityResult.status}`);

      if (identityResult.status === 'RUN_INVALIDO') {
        errors.push('RUN invalido o no existe en el Registro Civil');
        await this.rejectRequest(requestId, errors);
        return;
      }

      if (identityResult.status === 'IDENTIDAD_NO_COINCIDE') {
        errors.push('El nombre proporcionado no coincide con el nombre registrado en el Registro Civil');
        await this.rejectRequest(requestId, errors);
        return;
      }

      if (identityResult.status === 'ERROR_VALIDACION') {
        logger.warn(`[${requestId}] Error en validacion de identidad, requiere revision manual`);
        await prisma.doctorSignupRequest.update({
          where: { id: requestId },
          data: {
            status: 'REVIEWED',
            autoVerificationErrors: JSON.stringify(errors),
          },
        });
        return;
      }

      logger.info(`[${requestId}] Iniciando validacion RNPI...`);
      const rnpiResult = await rnpiVerificationService.verifyProfessional({
        rut: run,
        dv,
        name,
        specialty,
      });

      await prisma.doctorSignupRequest.update({
        where: { id: requestId },
        data: {
          rnpiVerificationStatus: rnpiResult.status,
          rnpiVerificationResult: JSON.stringify(rnpiResult),
          rnpiVerifiedAt: rnpiResult.verifiedAt || new Date(),
        },
      });

      logger.info(`[${requestId}] Validacion RNPI: ${rnpiResult.status}`);

      if (rnpiResult.status === 'NO_MEDICO' || rnpiResult.status === 'RNPI_NO_EXISTE' || rnpiResult.status === 'RNPI_PROFESION_INVALIDA') {
        errors.push('El profesional no es medico o no esta registrado en RNPI');
        await this.rejectRequest(requestId, errors);
        return;
      }

      if (rnpiResult.status === 'SUSPENDIDO' || rnpiResult.status === 'RNPI_NO_HABILITADO') {
        errors.push('El medico esta suspendido o no habilitado en RNPI');
        await this.rejectRequest(requestId, errors);
        return;
      }

      if (rnpiResult.status === 'INCONSISTENCIA' || rnpiResult.status === 'RNPI_INCONSISTENCIA_NOMBRE') {
        errors.push(...(rnpiResult.inconsistencies || []));
        await prisma.doctorSignupRequest.update({
          where: { id: requestId },
          data: {
            status: 'REVIEWED',
            autoVerificationErrors: JSON.stringify(errors),
          },
        });
        return;
      }

      if (rnpiResult.status === 'ERROR_VALIDACION' || rnpiResult.status === 'RNPI_API_ERROR') {
        errors.push('Error al consultar RNPI. Requiere revision manual.');
        await prisma.doctorSignupRequest.update({
          where: { id: requestId },
          data: {
            status: 'REVIEWED',
            autoVerificationErrors: JSON.stringify(errors),
          },
        });
        return;
      }

      if (
        identityResult.status === 'IDENTIDAD_VERIFICADA' &&
        (rnpiResult.status === 'MEDICO_VERIFICADO' || rnpiResult.status === 'RNPI_OK')
      ) {
        await this.approveRequestAutomatically(requestId, rnpiResult);
        logger.info(`[${requestId}] Solicitud aprobada automaticamente`);
      }
    } catch (error: any) {
      logger.error(`Error en validaciones automaticas para solicitud ${requestId}:`, error);
      
      await prisma.doctorSignupRequest.update({
        where: { id: requestId },
        data: {
          status: 'REVIEWED',
          autoVerificationErrors: JSON.stringify([
            `Error en validacion automatica: ${error.message}`,
          ]),
        },
      });
    }
  }

  private async rejectRequest(requestId: string, errors: string[]): Promise<void> {
    await prisma.doctorSignupRequest.update({
      where: { id: requestId },
      data: {
        status: 'AUTO_REJECTED',
        autoVerificationErrors: JSON.stringify(errors),
        reviewedAt: new Date(),
      },
    });

    logger.info(`Solicitud ${requestId} rechazada automaticamente:`, errors);
  }

  private async approveRequestAutomatically(
    requestId: string,
    rnpiResult: any
  ): Promise<void> {
    const request = await prisma.doctorSignupRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await prisma.user.create({
      data: {
        email: request.email,
        password: hashedPassword,
        role: 'DOCTOR',
      },
    });

    const rnpiData = rnpiResult.professionalData;

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        name: rnpiData?.nameOfficial || request.name,
        rut: request.rut,
        speciality: request.specialty,
        tarifaConsulta: 0,
        tarifaUrgencia: 0,
        estadoOnline: false,
      } as any,
    });

    await prisma.doctorSignupRequest.update({
      where: { id: requestId },
      data: {
        status: 'AUTO_APPROVED',
        reviewedAt: new Date(),
        reviewedBy: 'SYSTEM',
      },
    });

    logger.info(`Medico creado automaticamente: ${doctor.id} - Usuario: ${user.id}`);

    // Enviar notificacion con credenciales temporales
    try {
      await notificationsService.sendPushNotification({
        userId: user.id,
        title: 'Bienvenido a CanalMedico',
        body: `Tu cuenta ha sido aprobada. Email: ${request.email} - Password temporal: ${temporaryPassword}`,
        data: {
          type: 'ACCOUNT_APPROVED',
          email: request.email,
          temporaryPassword: temporaryPassword,
        },
      });
      logger.info(`Notificacion enviada al medico: ${user.id}`);
    } catch (error) {
      logger.warn(`No se pudo enviar notificacion al medico ${user.id}:`, error);
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async getAll(page?: number, limit?: number, status?: string) {
    try {
      const { skip, take } = getPaginationParams(page, limit);

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [requests, total] = await Promise.all([
        prisma.doctorSignupRequest.findMany({
          skip,
          take,
          where,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.doctorSignupRequest.count({ where }),
      ]);

      return createPaginatedResponse(requests, total, page || 1, limit || 10);
    } catch (error) {
      logger.error('Error al obtener solicitudes de registro:', error);
      throw error;
    }
  }

  async getById(requestId: string) {
    try {
      const request = await prisma.doctorSignupRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw createError('Solicitud no encontrada', 404);
      }

      return request;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Error al obtener solicitud de registro:', error);
      throw error;
    }
  }

  async updateStatus(requestId: string, status: string, reviewedBy: string) {
    try {
      const validStatuses = ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'AUTO_APPROVED', 'AUTO_REJECTED'];
      if (!validStatuses.includes(status)) {
        throw createError('Estado invalido', 400);
      }

      const request = await prisma.doctorSignupRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedBy,
          reviewedAt: new Date(),
        },
      });

      logger.info(`Solicitud ${requestId} actualizada a estado: ${status}`);

      return request;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Error al actualizar estado de solicitud:', error);
      throw error;
    }
  }

  async reRunVerifications(requestId: string): Promise<void> {
    const request = await prisma.doctorSignupRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || !request.rut) {
      throw createError('Solicitud no encontrada o sin RUT', 404);
    }

    const { rut: run, dv } = extractRutAndDv(request.rut);
    if (!run || !dv) {
      throw createError('RUT invalido en la solicitud', 400);
    }

    await this.performAutomaticVerifications(
      requestId,
      run,
      dv,
      request.name,
      request.specialty,
      request.birthDate?.toISOString()
    );
  }
}

export default new SignupRequestsService();
