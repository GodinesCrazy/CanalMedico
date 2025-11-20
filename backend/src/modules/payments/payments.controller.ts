import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import paymentsService from './payments.service';
import { validate } from '@/middlewares/validation.middleware';
import { raw } from 'express';

const createPaymentSessionSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1, 'Consultation ID requerido'),
    successUrl: z.string().url('URL de éxito inválida'),
    cancelUrl: z.string().url('URL de cancelación inválida'),
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
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        res.status(400).json({ error: 'Firma de webhook requerida' });
        return;
      }

      const result = await paymentsService.handleWebhook(signature, req.body);
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

  async getPaymentsByDoctor(req: Request, res: Response, next: NextFunction) {
    try {
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

