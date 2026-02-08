import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import paymentsService from './payments.service';
import { validate } from '@/middlewares/validation.middleware';
import { raw } from 'express';
import { AuthenticatedRequest } from '@/types';
import env from '@/config/env';
import logger from '@/config/logger';

const createPaymentSessionSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1).optional(), // Opcional: si no se envía, se usa la consulta PENDING del paciente
    successUrl: z.string().url('URL de éxito inválida').optional(),
    cancelUrl: z.string().url('URL de cancelación inválida').optional(),
  }),
});

export class PaymentsController {
  async createPaymentSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.createPaymentSession(req.body, req.user?.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // VALIDACIÓN DE WEBHOOK MERCADOPAGO
      // MercadoPago no usa firmas criptográficas como Stripe.
      // La validación se realiza mediante:
      // 1. Verificar que el payment existe en MercadoPago usando el access token (IMPLEMENTADO)
      // 2. Validar que external_reference corresponde a una consulta válida (IMPLEMENTADO)
      // 3. Validar headers opcionales de MercadoPago si están presentes
      // 4. HTTPS obligatorio en producción (manejado por Railway)
      //
      // NOTA: Para mayor seguridad adicional:
      // - Configurar IP whitelist en MercadoPago Dashboard si está disponible
      // - Usar MERCADOPAGO_WEBHOOK_SECRET para validaciones adicionales (si MercadoPago lo implementa)
      
      // Obtener headers de MercadoPago (si están presentes)
      const requestId = req.headers['x-request-id'] as string | undefined;
      const signature = req.headers['x-signature'] as string | undefined;
      
      // Headers de MercadoPago típicos:
      // - x-request-id: ID único del webhook
      // - x-signature: Firma (si MercadoPago la implementa en el futuro)
      // - user-agent: Debe contener "MercadoPago" o similar
      
      // Validación básica de User-Agent (opcional pero recomendado)
      const userAgent = req.headers['user-agent'] || '';
      const isMercadoPagoAgent = userAgent.toLowerCase().includes('mercadopago') || 
                                  userAgent.toLowerCase().includes('mercadolibre');
      
      if (!isMercadoPagoAgent && env.NODE_ENV === 'production') {
        logger.warn('Webhook recibido con User-Agent sospechoso', {
          userAgent,
          requestId,
          ip: req.ip,
        });
        // No rechazamos inmediatamente, pero logueamos para monitoreo
      }
      
      // Pasar headers al servicio para logging/validación
      const result = await paymentsService.handleWebhook(
        signature || requestId || '', 
        req.body,
        req.headers as Record<string, string>
      );
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.getPaymentByConsultation(req.params.consultationId);
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentsByDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede ver sus propios pagos
      const doctorsService = require('../doctors/doctors.service').default;
      const doctor = await doctorsService.getById(req.params.doctorId);
      
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para ver estos pagos' });
        return;
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await paymentsService.getPaymentsByDoctor(req.params.doctorId, page, limit);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentsController();

export const validateCreatePaymentSession = validate(createPaymentSessionSchema);
export const webhookMiddleware = raw({ type: 'application/json' });

