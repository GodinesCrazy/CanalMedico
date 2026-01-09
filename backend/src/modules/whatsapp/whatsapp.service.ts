/**
 * WhatsApp Module - Service
 * 
 * Servicio para manejar integración con WhatsApp Cloud API.
 * 
 * FASE 2: Implementación completa de auto-respuesta automática.
 */

import { featureFlags } from '@/config/featureFlags';
import logger from '@/config/logger';
import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import { WhatsAppMessage } from './whatsapp.types';
import whatsappClient from './whatsapp-client';

export class WhatsAppService {
  /**
   * Procesar mensaje entrante de WhatsApp
   * 
   * Esta función se llama desde el webhook cuando
   * un paciente escribe por WhatsApp al médico.
   * 
   * Flujo:
   * 1. Identificar médico por número de WhatsApp
   * 2. Crear ConsultationAttempt
   * 3. Generar deep link personalizado
   * 4. Enviar auto-respuesta con template
   * 
   * @param message - Mensaje recibido de WhatsApp
   */
  async handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
    // Verificar feature flag
    if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
      logger.debug('WhatsApp auto-response está desactivado (feature flag)');
      return;
    }

    try {
      // Validar que el mensaje es de texto
      if (message.type !== 'text' || !message.text?.body) {
        logger.debug('Ignorando mensaje no-texto de WhatsApp', {
          type: message.type,
          from: message.from,
        });
        return;
      }

      const patientPhone = message.from;
      const doctorWhatsAppNumber = message.to;
      const messageText = message.text.body;

      logger.info('Procesando mensaje de WhatsApp', {
        from: patientPhone,
        to: doctorWhatsAppNumber,
        messageId: message.messageId,
      });

      // 1. Identificar médico por número de WhatsApp
      const doctor = await this.findDoctorByWhatsAppNumber(doctorWhatsAppNumber);
      if (!doctor) {
        logger.warn('No se encontró médico con número de WhatsApp', {
          whatsappNumber: doctorWhatsAppNumber,
        });
        return; // No responder si no hay médico asociado
      }

      // 2. Verificar si ya existe un intento reciente (evitar duplicados)
      const recentAttempt = await prisma.consultationAttempt.findFirst({
        where: {
          doctorId: doctor.id,
          patientPhone,
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (recentAttempt) {
        logger.debug('Ya existe un intento reciente, no crear duplicado', {
          attemptId: recentAttempt.id,
          patientPhone,
        });
        // Reenviar el link existente
        await this.resendLinkToPatient(recentAttempt.id);
        return;
      }

      // 3. Crear ConsultationAttempt
      const attempt = await this.createConsultationAttempt({
        doctorId: doctor.id,
        patientPhone,
        messageText,
        source: 'WHATSAPP',
      });

      // 4. Generar deep link personalizado
      const deepLink = this.generateDeepLink({
        doctorId: doctor.id,
        attemptId: attempt.id,
        phone: patientPhone,
      });

      // 5. Enviar auto-respuesta con template
      await this.sendAutoResponse(patientPhone, doctor.name, deepLink);

      // 6. Marcar que se envió el deep link
      await prisma.consultationAttempt.update({
        where: { id: attempt.id },
        data: { deepLinkSent: true },
      });

      logger.info('Mensaje de WhatsApp procesado exitosamente', {
        attemptId: attempt.id,
        doctorId: doctor.id,
        patientPhone,
      });
    } catch (error: any) {
      logger.error('Error al procesar mensaje de WhatsApp', {
        error: error.message,
        message: message.messageId,
      });
      // No lanzar error para no causar reintentos de Meta
    }
  }

  /**
   * Buscar médico por número de WhatsApp Business
   * 
   * @param whatsappNumber - Número de WhatsApp Business (formato: 56912345678)
   * @returns Doctor o null si no se encuentra
   */
  async findDoctorByWhatsAppNumber(whatsappNumber: string): Promise<{ id: string; name: string; whatsappBusinessNumber: string | null } | null> {
    try {
      // Normalizar número (remover caracteres no numéricos)
      const normalizedNumber = whatsappNumber.replace(/\D/g, '');

      const doctor = await prisma.doctor.findFirst({
        where: {
          whatsappBusinessNumber: {
            // Buscar coincidencia exacta o con variaciones de formato
            contains: normalizedNumber,
          },
        },
        select: {
          id: true,
          name: true,
          whatsappBusinessNumber: true,
        },
      });

      return doctor;
    } catch (error) {
      logger.error('Error al buscar médico por número de WhatsApp', error);
      return null;
    }
  }

  /**
   * Crear ConsultationAttempt
   * 
   * @param data - Datos del intento
   * @returns ConsultationAttempt creado
   */
  async createConsultationAttempt(data: {
    doctorId: string;
    patientPhone: string;
    messageText: string;
    source: string;
  }) {
    try {
      const attempt = await prisma.consultationAttempt.create({
        data: {
          doctorId: data.doctorId,
          patientPhone: data.patientPhone,
          messageText: data.messageText,
          source: data.source,
          status: 'PENDING',
          deepLinkSent: false,
          deepLinkClicked: false,
        },
      });

      logger.info('ConsultationAttempt creado', {
        attemptId: attempt.id,
        doctorId: data.doctorId,
        patientPhone: data.patientPhone,
      });

      return attempt;
    } catch (error) {
      logger.error('Error al crear ConsultationAttempt', error);
      throw createError('Error al crear intento de consulta', 500);
    }
  }

  /**
   * Generar deep link personalizado
   * 
   * El deep link incluye:
   * - doctorId: ID del médico
   * - attemptId: ID del intento de WhatsApp
   * - phone: Número de teléfono del paciente
   * - source: whatsapp
   * 
   * @param params - Parámetros para el deep link
   * @returns URL del deep link (solo deep link, sin fallback web)
   */
  generateDeepLink(params: {
    doctorId: string;
    attemptId: string;
    phone: string;
  }): string {
    // Deep link para app móvil (Fase 3 implementará la lógica de creación de consulta)
    const deepLink = `canalmedico://consultation/create?` +
      `doctorId=${encodeURIComponent(params.doctorId)}&` +
      `attemptId=${encodeURIComponent(params.attemptId)}&` +
      `phone=${encodeURIComponent(params.phone)}&` +
      `source=whatsapp`;

    return deepLink;
  }

  /**
   * Enviar auto-respuesta automática con template
   * 
   * @param to - Número de teléfono del paciente
   * @param doctorName - Nombre del médico
   * @param deepLink - Deep link a CanalMedico
   */
  async sendAutoResponse(to: string, doctorName: string, deepLink: string): Promise<void> {
    try {
      // Template aprobado: consultation_redirect
      // Parámetros:
      // - {{1}}: Nombre del médico
      // - {{2}}: Deep link a CanalMedico
      
      const response = await whatsappClient.sendTemplateMessage(
        to,
        'consultation_redirect',
        'es',
        [doctorName, deepLink]
      );

      logger.info('Auto-respuesta de WhatsApp enviada', {
        to,
        messageId: response.messages[0]?.id,
      });
    } catch (error: any) {
      logger.error('Error al enviar auto-respuesta de WhatsApp', {
        error: error.message,
        to,
      });
      throw error;
    }
  }

  /**
   * Reenviar link a paciente
   * 
   * @param attemptId - ID del ConsultationAttempt
   */
  async resendLinkToPatient(attemptId: string): Promise<void> {
    try {
      const attempt = await prisma.consultationAttempt.findUnique({
        where: { id: attemptId },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!attempt) {
        throw createError('Intento de consulta no encontrado', 404);
      }

      const deepLink = this.generateDeepLink({
        doctorId: attempt.doctorId,
        attemptId: attempt.id,
        phone: attempt.patientPhone,
      });

      await this.sendAutoResponse(
        attempt.patientPhone,
        attempt.doctor.name,
        deepLink
      );

      // Actualizar timestamp
      await prisma.consultationAttempt.update({
        where: { id: attemptId },
        data: {
          deepLinkSent: true,
          updatedAt: new Date(),
        },
      });

      logger.info('Link reenviado a paciente', {
        attemptId,
        patientPhone: attempt.patientPhone,
      });
    } catch (error: any) {
      logger.error('Error al reenviar link', {
        error: error.message,
        attemptId,
      });
      throw error;
    }
  }

  /**
   * Verificar signature del webhook de Meta
   * 
   * @param payload - Payload del webhook (string)
   * @param signature - Signature del header X-Hub-Signature-256
   * @returns true si la signature es válida
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    return whatsappClient.verifyWebhookSignature(payload, signature);
  }
}

export default new WhatsAppService();

