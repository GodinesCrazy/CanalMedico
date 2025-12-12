import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import paymentsService from './payments.service';
import { validate } from '@/middlewares/validation.middleware';
import { raw } from 'express';
import { AuthenticatedRequest } from '@/types';

const createPaymentSessionSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1, 'Consultation ID requerido'),
    successUrl: z.string().url('URL de éxito inválida').optional(), // Opcional: puede ser deep link o URL web
    cancelUrl: z.string().url('URL de cancelación inválida').optional(), // Opcional: puede ser deep link o URL web
  }),
});

export class PaymentsController {
  async createPaymentSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentsService.createPaymentSession(req.body);
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
      // NOTA: MercadoPago no usa firma de webhook como Stripe.
      // La validación se hace verificando que el payment existe en MercadoPago
      // usando el access token. Esto ya se hace en paymentsService.handleWebhook().
      // 
      // Para mayor seguridad, se recomienda:
      // 1. Configurar IP whitelist en MercadoPago (si está disponible)
      // 2. Validar que el payment ID existe en MercadoPago antes de procesar (ya implementado)
      // 3. Usar HTTPS en producción
      
      const signature = req.headers['x-signature'] || req.headers['x-request-id'] || '';
      const result = await paymentsService.handleWebhook(signature as string, req.body);
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

