/**
 * OTP Service
 * 
 * Servicio para manejar códigos OTP (One-Time Password) por WhatsApp/SMS.
 * 
 * FASE 3: Implementación completa de login invisible.
 */

import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { hashPassword, comparePassword } from '@/utils/hash';
import { featureFlags } from '@/config/featureFlags';
import whatsappClient from '@/modules/whatsapp/whatsapp-client';

export interface SendOTPDto {
  phoneNumber: string;
  attemptId?: string; // ID del ConsultationAttempt (opcional)
  method?: 'WHATSAPP' | 'SMS';
}

export interface VerifyOTPDto {
  phoneNumber: string;
  otp: string;
  attemptId?: string; // ID del ConsultationAttempt (opcional)
}

export class OTPService {
  /**
   * Generar código OTP de 6 dígitos
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Normalizar número de teléfono
   * Remover caracteres no numéricos
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Enviar OTP por WhatsApp o SMS
   * 
   * @param data - Datos para enviar OTP
   * @returns Información del OTP enviado
   */
  async sendOTP(data: SendOTPDto): Promise<{ success: boolean; expiresIn: number }> {
    // Verificar feature flag
    if (!featureFlags.PHONE_LOGIN) {
      throw createError('Login con teléfono no está habilitado', 403);
    }

    try {
      const phoneNumber = this.normalizePhoneNumber(data.phoneNumber);
      const method = data.method || 'WHATSAPP';
      const attemptId = data.attemptId;

      // Validar formato de teléfono (mínimo 8 dígitos)
      if (phoneNumber.length < 8) {
        throw createError('Número de teléfono inválido', 400);
      }

      // Verificar rate limiting (máximo 3 OTP por hora por número)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOTPs = await (prisma as any).otpVerification.count({
        where: {
          phoneNumber,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });

      if (recentOTPs >= 3) {
        throw createError('Demasiados intentos. Intenta de nuevo en una hora.', 429);
      }

      // Invalidar OTPs anteriores no verificados del mismo número
      await (prisma as any).otpVerification.updateMany({
        where: {
          phoneNumber,
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          verified: true, // Marcar como usado para invalidar
        },
      });

      // Generar nuevo OTP
      const otpCode = this.generateOTP();
      const hashedOTP = await hashPassword(otpCode); // Hash del OTP para seguridad

      // Expiración: 5 minutos
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      // Guardar OTP en BD
      await (prisma as any).otpVerification.create({
        data: {
          phoneNumber,
          otp: hashedOTP,
          method,
          verified: false,
          expiresAt,
        },
      });

      // Enviar OTP por WhatsApp o SMS
      if (method === 'WHATSAPP') {
        try {
          // Enviar template de OTP por WhatsApp
          await whatsappClient.sendTemplateMessage(
            phoneNumber,
            'otp_verification',
            'es',
            [otpCode] // Código OTP como parámetro
          );

          logger.info('OTP enviado por WhatsApp', {
            phoneNumber,
            attemptId,
          });
        } catch (error: any) {
          logger.error('Error al enviar OTP por WhatsApp', {
            error: error.message,
            phoneNumber,
          });
          // No fallar si WhatsApp falla, el OTP está guardado
          // El usuario puede pedir reenvío
        }
      } else {
        // TODO: Implementar envío por SMS (Twilio, etc.) en el futuro
        logger.warn('Envío por SMS no implementado aún', { phoneNumber });
        throw createError('Envío por SMS no está disponible aún', 501);
      }

      return {
        success: true,
        expiresIn: 300, // 5 minutos en segundos
      };
    } catch (error: any) {
      logger.error('Error al enviar OTP', {
        error: error.message,
        phoneNumber: data.phoneNumber,
      });
      throw error;
    }
  }

  /**
   * Verificar OTP y crear/iniciar sesión automáticamente
   * 
   * @param data - Datos para verificar OTP
   * @returns Usuario y tokens (o null si no existe cuenta)
   */
  async verifyOTP(data: VerifyOTPDto): Promise<{
    user: any | null;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
    consultationId?: string; // Si se creó consulta automáticamente
  }> {
    // Verificar feature flag
    if (!featureFlags.PHONE_LOGIN) {
      throw createError('Login con teléfono no está habilitado', 403);
    }

    try {
      const phoneNumber = this.normalizePhoneNumber(data.phoneNumber);
      const otpCode = data.otp;
      const attemptId = data.attemptId;

      // Buscar OTP válido (no verificado, no expirado)
      const otpRecord = await (prisma as any).otpVerification.findFirst({
        where: {
          phoneNumber,
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!otpRecord) {
        throw createError('Código OTP no encontrado o expirado', 400);
      }

      // Verificar OTP
      const isOTPValid = await comparePassword(otpCode, otpRecord.otp);

      if (!isOTPValid) {
        // Incrementar intentos fallidos (para rate limiting)
        logger.warn('OTP inválido intentado', { phoneNumber });
        throw createError('Código OTP inválido', 400);
      }

      // Marcar OTP como verificado (no reutilizable)
      await (prisma as any).otpVerification.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Buscar usuario existente por número de teléfono
      let user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: {
          patient: true,
          doctor: true,
        },
      });

      let isNewUser = false;
      let consultationId: string | undefined;

      if (!user) {
        // Crear usuario y paciente automáticamente
        isNewUser = true;

        // Generar email temporal (no se usa para login, solo para BD)
        const tempEmail = `phone_${phoneNumber}@canalmedico.temp`;

        // Crear usuario sin contraseña (login solo por OTP)
        user = await prisma.user.create({
          data: {
            email: tempEmail,
            password: await hashPassword(`temp_${phoneNumber}_${Date.now()}`), // Password temporal (nunca se usa)
            role: 'PATIENT',
            phoneNumber,
          },
          include: {
            patient: true,
            doctor: true,
          },
        });

        // Crear perfil de paciente
        await prisma.patient.create({
          data: {
            userId: user.id,
            name: 'Paciente', // Nombre por defecto, puede editar después
            phoneNumber,
          },
        });

        // Recargar usuario con perfil
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            patient: true,
            doctor: true,
          },
        });

        logger.info('Usuario creado automáticamente con OTP', {
          userId: user!.id,
          phoneNumber,
        });
      } else {
        // Actualizar phoneNumber si no estaba configurado
        if (!user.phoneNumber) {
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber },
          });
        }

        // Actualizar phoneNumber en Patient si existe
        if (user.patient && !user.patient.phoneNumber) {
          await prisma.patient.update({
            where: { id: user.patient.id },
            data: { phoneNumber },
          });
        }
      }

      if (!user) {
        throw createError('Error al crear/obtener usuario', 500);
      }

      // Generar tokens JWT
      const { generateTokenPair } = await import('@/utils/jwt');
      const tokens = generateTokenPair(user.id, user.email, user.role as any);

      // Si viene desde WhatsApp (attemptId), crear consulta automáticamente
      if (attemptId && featureFlags.QUICK_CONSULTATION) {
        consultationId = await this.createQuickConsultation(attemptId, user.id);
      }

      logger.info('OTP verificado exitosamente', {
        userId: user.id,
        phoneNumber,
        isNewUser,
        consultationId,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          profile: user.patient || user.doctor,
        },
        ...tokens,
        isNewUser,
        ...(consultationId && { consultationId }),
      };
    } catch (error: any) {
      logger.error('Error al verificar OTP', {
        error: error.message,
        phoneNumber: data.phoneNumber,
      });
      throw error;
    }
  }

  /**
   * Crear consulta automáticamente desde ConsultationAttempt
   * 
   * @param attemptId - ID del ConsultationAttempt
   * @param userId - ID del usuario autenticado
   * @returns ID de la consulta creada
   */
  private async createQuickConsultation(attemptId: string, userId: string): Promise<string> {
    try {
      // Buscar ConsultationAttempt
      const attempt = await prisma.consultationAttempt.findUnique({
        where: { id: attemptId },
        include: {
          doctor: {
            select: {
              id: true,
              tarifaConsulta: true,
              tarifaUrgencia: true,
            },
          },
        },
      });

      if (!attempt) {
        throw createError('Intento de consulta no encontrado', 404);
      }

      // Verificar que el attempt no haya sido convertido ya
      if (attempt.status === 'CONVERTED' && attempt.consultationId) {
        // Ya existe consulta, retornar ID existente
        return attempt.consultationId;
      }

      // Obtener paciente del usuario
      const patient = await prisma.patient.findUnique({
        where: { userId },
      });

      if (!patient) {
        throw createError('Perfil de paciente no encontrado', 404);
      }

      // Verificar que no exista consulta activa ya
      const existingConsultation = await prisma.consultation.findFirst({
        where: {
          doctorId: attempt.doctorId,
          patientId: patient.id,
          status: {
            in: ['PENDING', 'PAID', 'ACTIVE'],
          },
        },
      });

      if (existingConsultation) {
        // Ya existe consulta activa, actualizar attempt y retornar
        await prisma.consultationAttempt.update({
          where: { id: attemptId },
          data: {
            consultationId: existingConsultation.id,
            status: 'CONVERTED',
            convertedAt: new Date(),
          },
        });
        return existingConsultation.id;
      }

      // Crear consulta automáticamente (tipo NORMAL por defecto)
      const consultation = await prisma.consultation.create({
        data: {
          doctorId: attempt.doctorId,
          patientId: patient.id,
          type: 'NORMAL',
          status: 'PENDING',
          source: 'WHATSAPP',
          consultationAttemptId: attemptId,
        },
      });

      // Actualizar ConsultationAttempt
      await prisma.consultationAttempt.update({
        where: { id: attemptId },
        data: {
          consultationId: consultation.id,
          status: 'CONVERTED',
          convertedAt: new Date(),
          deepLinkClicked: true,
        },
      });

      logger.info('Consulta creada automáticamente desde WhatsApp', {
        consultationId: consultation.id,
        attemptId,
        doctorId: attempt.doctorId,
        patientId: patient.id,
      });

      return consultation.id;
    } catch (error: any) {
      logger.error('Error al crear consulta rápida', {
        error: error.message,
        attemptId,
      });
      throw error;
    }
  }
}

export default new OTPService();

