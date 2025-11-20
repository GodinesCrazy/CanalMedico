import { Router } from 'express';
import paymentsController, { validateCreatePaymentSession, webhookMiddleware } from './payments.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { paymentRateLimiter } from '@/middlewares/rateLimit.middleware';

const router = Router();

router.post('/session', authenticate, paymentRateLimiter, validateCreatePaymentSession, paymentsController.createPaymentSession.bind(paymentsController));
router.post('/webhook', webhookMiddleware, paymentsController.handleWebhook.bind(paymentsController));
router.get('/consultation/:consultationId', authenticate, paymentsController.getPaymentByConsultation.bind(paymentsController));
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), paymentsController.getPaymentsByDoctor.bind(paymentsController));

export default router;

