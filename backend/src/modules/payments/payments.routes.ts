import { Router } from 'express';
import paymentsController, { validateCreatePaymentSession, webhookMiddleware } from './payments.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { paymentRateLimiter } from '@/middlewares/rateLimit.middleware';
import { requirePaymentOwnership, requireDoctorOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

/**
 * @swagger
 * /api/payments/session:
 *   post:
 *     summary: Crear sesión de pago con Stripe
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consultationId
 *               - amount
 *             properties:
 *               consultationId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sesión de pago creada exitosamente
 *       401:
 *         description: No autenticado
 */
// Alias /preference = /session (MVP pagos MercadoPago)
router.post('/preference', authenticate, requireRole('PATIENT'), paymentRateLimiter, validateCreatePaymentSession, requirePaymentOwnership, paymentsController.createPaymentSession.bind(paymentsController));
router.post('/session', authenticate, requireRole('PATIENT'), paymentRateLimiter, validateCreatePaymentSession, requirePaymentOwnership, paymentsController.createPaymentSession.bind(paymentsController));

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook de Stripe para procesar pagos
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 */
router.post('/webhook', webhookMiddleware, paymentsController.handleWebhook.bind(paymentsController));

/**
 * @swagger
 * /api/payments/consultation/{consultationId}:
 *   get:
 *     summary: Obtener pago de una consulta
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del pago
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Pago no encontrado
 */
router.get('/consultation/:consultationId', authenticate, requirePaymentOwnership, paymentsController.getPaymentByConsultation.bind(paymentsController));

/**
 * @swagger
 * /api/payments/doctor/{doctorId}:
 *   get:
 *     summary: Obtener pagos de un doctor
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pagos del doctor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden ver sus pagos
 */
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), requireDoctorOwnership, paymentsController.getPaymentsByDoctor.bind(paymentsController));

export default router;

