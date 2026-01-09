/**
 * WhatsApp Module - Controller
 * 
 * Controlador para endpoints de WhatsApp.
 * 
 * FASE 2: Implementación completa de webhook y panel web.
 */

import { Request, Response, NextFunction } from 'express';
import { featureFlags } from '@/config/featureFlags';
import logger from '@/config/logger';
import whatsappService from './whatsapp.service';
import { WhatsAppWebhookPayload, WhatsAppMessage } from './whatsapp.types';
import { AuthenticatedRequest } from '@/types';
import prisma from '@/database/prisma';
import env from '@/config/env';
export class WhatsAppController {
  /**
   * Webhook público de WhatsApp Cloud API
   * 
   * POST /api/whatsapp/webhook (para recibir mensajes)
   * GET /api/whatsapp/webhook (para verificación de Meta)
   * 
   * Este endpoint recibe mensajes de WhatsApp Cloud API.
   * No requiere autenticación (Meta valida con signature).
   */
  async webhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        logger.debug('WhatsApp webhook recibido pero feature flag desactivado');
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      // Verificación de webhook (Meta envía GET para verificar)
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
          logger.info('WhatsApp webhook verified by Meta');
          return res.status(200).send(challenge);
        }

        logger.warn('WhatsApp webhook verification failed', {
          mode,
          tokenProvided: !!token,
        });
        return res.status(403).send('Forbidden');
      }

      // Procesar mensaje (POST)
      // Verificar signature del webhook
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!signature) {
        logger.warn('WhatsApp webhook sin signature');
        return res.status(403).json({ error: 'Missing signature' });
      }

      // Obtener payload como string para verificar signature
      const rawBody = JSON.stringify(req.body);
      const isValidSignature = whatsappService.verifyWebhookSignature(rawBody, signature);

      if (!isValidSignature) {
        logger.warn('WhatsApp webhook signature inválida');
        return res.status(403).json({ error: 'Invalid signature' });
      }

      const payload: WhatsAppWebhookPayload = req.body;

      // Validar estructura del payload
      if (payload.object !== 'whatsapp_business_account') {
        logger.warn('WhatsApp webhook con object inválido', {
          object: payload.object,
        });
        return res.status(200).json({ status: 'ok' }); // Responder OK para no recibir reintentos
      }

      // Procesar cada entrada
      if (payload.entry && payload.entry.length > 0) {
        for (const entry of payload.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              // Procesar solo cambios de mensajes (no statuses)
              if (change.value.messages && change.value.messages.length > 0) {
                for (const message of change.value.messages) {
                  // Procesar solo mensajes de texto
                  if (message.type === 'text' && message.text) {
                    // Construir mensaje completo con metadata
                    const fullMessage: WhatsAppMessage = {
                      ...message,
                      from: message.from || change.value.contacts?.[0]?.wa_id || '',
                      to: change.value.metadata.phone_number_id,
                    };

                    // Procesar mensaje de forma asíncrona (no bloquear respuesta)
                    whatsappService.handleIncomingMessage(fullMessage).catch((error) => {
                      logger.error('Error al procesar mensaje de WhatsApp (async)', error);
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Responder 200 OK a Meta inmediatamente (importante para no recibir reintentos)
      res.status(200).json({ status: 'ok' });
      return;
    } catch (error) {
      logger.error('Error en webhook de WhatsApp', error);
      // Responder OK incluso si hay error para evitar reintentos de Meta
      res.status(200).json({ status: 'ok', error: 'Internal error' });
      return;
    }
  }

  /**
   * Listar intentos de WhatsApp no convertidos
   * 
   * GET /api/whatsapp/attempts/pending
   * 
   * Requiere autenticación DOCTOR
   */
  async getPendingAttempts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Solo doctores pueden ver intentos de WhatsApp' });
      }

      // Obtener doctorId del usuario autenticado
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Buscar intentos pendientes
      const attempts = await prisma.consultationAttempt.findMany({
        where: {
          doctorId: doctor.id,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Límite de 50 intentos
      });

      res.status(200).json({
        success: true,
        data: attempts,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Obtener estadísticas de WhatsApp
   * 
   * GET /api/whatsapp/stats
   * 
   * Requiere autenticación DOCTOR
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Solo doctores pueden ver estadísticas' });
      }

      // Obtener doctorId del usuario autenticado
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Calcular estadísticas
      const [total, pending, converted, abandoned] = await Promise.all([
        prisma.consultationAttempt.count({
          where: { doctorId: doctor.id },
        }),
        prisma.consultationAttempt.count({
          where: { doctorId: doctor.id, status: 'PENDING' },
        }),
        prisma.consultationAttempt.count({
          where: { doctorId: doctor.id, status: 'CONVERTED' },
        }),
        prisma.consultationAttempt.count({
          where: { doctorId: doctor.id, status: 'ABANDONED' },
        }),
      ]);

      const conversionRate = total > 0 ? (converted / total) * 100 : 0;

      res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          converted,
          abandoned,
          conversionRate: Math.round(conversionRate * 100) / 100, // 2 decimales
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  /**
   * Reenviar link a paciente
   * 
   * POST /api/whatsapp/attempts/:id/resend-link
   * 
   * Requiere autenticación DOCTOR
   */
  async resendLink(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Solo doctores pueden reenviar links' });
      }

      const { id } = req.params;

      // Obtener doctorId del usuario autenticado
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Buscar intento y verificar que pertenece al doctor
      const attempt = await prisma.consultationAttempt.findUnique({
        where: { id },
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
        return res.status(404).json({ error: 'Intento de consulta no encontrado' });
      }

      if (attempt.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'No tienes permiso para reenviar este link' });
      }

      // Reenviar link
      await whatsappService.resendLinkToPatient(id);

      res.status(200).json({
        success: true,
        message: 'Link reenviado exitosamente',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

export default new WhatsAppController();

