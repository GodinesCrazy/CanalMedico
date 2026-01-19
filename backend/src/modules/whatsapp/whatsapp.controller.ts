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
      // Verificación de webhook (Meta envía GET para verificar)
      // CRÍTICO: El GET challenge DEBE funcionar SIEMPRE (incluso si el flag está desactivado)
      // Meta necesita validar el webhook antes de poder enviar eventos POST
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
          logger.info('[WHATSAPP] CHALLENGE_OK', {
            challenge: challenge ? 'present' : 'missing',
            featureFlag: featureFlags.WHATSAPP_AUTO_RESPONSE ? 'ACTIVE' : 'INACTIVE',
          });
          return res.status(200).send(challenge);
        }

        logger.warn('[WHATSAPP] CHALLENGE_FORBIDDEN', {
          mode,
          tokenProvided: !!token,
          featureFlag: featureFlags.WHATSAPP_AUTO_RESPONSE ? 'ACTIVE' : 'INACTIVE',
        });
        return res.status(403).send('Forbidden');
      }

      // Procesar mensajes (POST) - SOLO si el feature flag está activo
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        logger.info('[WHATSAPP] POST_DISABLED', {
          message: 'Feature flag ENABLE_WHATSAPP_AUTO_RESPONSE is not true',
        });
        // Responder OK para no recibir reintentos de Meta, pero no procesar
        return res.status(200).json({ ok: true, disabled: true });
      }

      logger.info('[WHATSAPP] POST_ENABLED', {
        message: 'Processing incoming webhook message',
      });

      // Procesar mensaje (POST)
      // Verificar signature del webhook
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!signature) {
        logger.warn('[WHATSAPP] POST webhook sin signature');
        return res.status(403).json({ error: 'Missing signature' });
      }

      // Obtener payload como string para verificar signature
      const rawBody = JSON.stringify(req.body);
      const isValidSignature = whatsappService.verifyWebhookSignature(rawBody, signature);

      if (!isValidSignature) {
        logger.warn('[WHATSAPP] POST webhook signature inválida');
        return res.status(403).json({ error: 'Invalid signature' });
      }

      logger.info('[WHATSAPP] POST webhook recibido y validado');

      const payload: WhatsAppWebhookPayload = req.body;

      // Validar estructura del payload
      if (payload.object !== 'whatsapp_business_account') {
        logger.warn('[WHATSAPP] POST webhook con object inválido', {
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
                      logger.error('[WHATSAPP] Error al procesar mensaje (async)', error);
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Guardar timestamp del último evento (en memoria)
      (global as any).__WHATSAPP_LAST_WEBHOOK_EVENT__ = new Date().toISOString();

      // Responder 200 OK a Meta inmediatamente (importante para no recibir reintentos)
      logger.info('[WHATSAPP] POST webhook procesado exitosamente');
      res.status(200).json({ ok: true });
      return;
    } catch (error) {
      logger.error('[WHATSAPP] Error en webhook:', error);
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

  /**
   * Enviar mensaje de texto por WhatsApp
   * 
   * POST /api/whatsapp/send/text
   * 
   * Requiere: X-Internal-Secret header o autenticación admin
   * 
   * IMPORTANTE: Solo funciona dentro de la ventana de 24 horas
   * después de que el usuario inició la conversación.
   */
  async sendTextMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      const { to, text } = req.body;

      if (!to || !text) {
        return res.status(400).json({ 
          error: 'Campos requeridos: to (número de teléfono) y text (mensaje)' 
        });
      }

      if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'El texto del mensaje no puede estar vacío' });
      }

      const result = await whatsappService.sendTextMessage(to, text);

      logger.info('[WHATSAPP] SEND_TEXT_OK', {
        messageId: result.messageId,
        to,
      });

      res.status(200).json({
        success: true,
        data: {
          messageId: result.messageId,
          to,
        },
      });
      return;
    } catch (error: any) {
      logger.error('[WHATSAPP] SEND_TEXT_FAIL', {
        error: error.message,
        to: req.body.to,
      });
      next(error);
      return;
    }
  }

  /**
   * Enviar mensaje template por WhatsApp
   * 
   * POST /api/whatsapp/send/template
   * 
   * Requiere: X-Internal-Secret header o autenticación admin
   */
  async sendTemplateMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verificar feature flag
      if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
        return res.status(404).json({ error: 'Feature not enabled' });
      }

      const { to, templateName, languageCode = 'es', parameters = [] } = req.body;

      if (!to || !templateName) {
        return res.status(400).json({ 
          error: 'Campos requeridos: to (número de teléfono) y templateName (nombre del template)' 
        });
      }

      if (!Array.isArray(parameters)) {
        return res.status(400).json({ error: 'parameters debe ser un array de strings' });
      }

      const result = await whatsappService.sendTemplateMessage(
        to,
        templateName,
        languageCode,
        parameters
      );

      res.status(200).json({
        success: true,
        data: {
          messageId: result.messageId,
          to,
          templateName,
        },
      });
      return;
    } catch (error: any) {
      logger.error('[WHATSAPP] Error al enviar template desde endpoint', {
        error: error.message,
        to: req.body.to,
        templateName: req.body.templateName,
      });
      next(error);
      return;
    }
  }

  /**
   * Obtener estado del módulo WhatsApp
   * 
   * GET /api/whatsapp/status
   * 
   * Requiere: X-Internal-Secret header
   * 
   * Retorna información sobre el estado del módulo:
   * - moduleLoaded: si el módulo real está cargado
   * - fallbackActive: si está usando fallback handler
   * - enableFlag: si ENABLE_WHATSAPP_AUTO_RESPONSE está activo
   * - Variables configuradas
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enableFlag = featureFlags.WHATSAPP_AUTO_RESPONSE;
      const verifyTokenSet = !!env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      const phoneNumberIdSet = !!env.WHATSAPP_PHONE_NUMBER_ID;
      const wabaIdSet = !!env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      const tokenSet = !!env.WHATSAPP_ACCESS_TOKEN;

      // Detectar si el módulo real está cargado
      // Si podemos acceder a whatsappService, el módulo está cargado
      let moduleLoaded = false;
      let fallbackActive = false;

      try {
        // Intentar acceder al servicio (si está cargado, esto funcionará)
        const service = require('./whatsapp.service');
        moduleLoaded = !!(service && service.default);
        fallbackActive = !moduleLoaded;
      } catch (error) {
        // Si falla, el módulo no está cargado
        moduleLoaded = false;
        fallbackActive = true;
      }

      // Obtener último evento de webhook (en memoria simple)
      // Esto se puede mejorar con un store más robusto si es necesario
      const lastWebhookEventAt = (global as any).__WHATSAPP_LAST_WEBHOOK_EVENT__ || null;

      const status = {
        moduleLoaded,
        fallbackActive,
        enableFlag,
        verifyTokenSet,
        phoneNumberIdSet,
        wabaIdSet,
        tokenSet,
        lastWebhookEventAt,
        timestamp: new Date().toISOString(),
      };

      logger.info('[WHATSAPP] STATUS', status);

      res.status(200).json({
        success: true,
        data: status,
      });
      return;
    } catch (error: any) {
      logger.error('[WHATSAPP] Error al obtener status', {
        error: error.message,
      });
      next(error);
      return;
    }
  }
}

export default new WhatsAppController();

