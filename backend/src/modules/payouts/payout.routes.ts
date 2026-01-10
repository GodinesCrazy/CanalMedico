import { Router } from 'express';
import payoutController from './payout.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { requirePayoutOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

/**
 * @swagger
 * /api/payouts/my-payouts:
 *   get:
 *     summary: Obtener liquidaciones del médico autenticado
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de liquidaciones
 */
router.get('/my-payouts', authenticate, requireRole('DOCTOR'), payoutController.getMyPayouts.bind(payoutController));

/**
 * @swagger
 * /api/payouts/my-stats:
 *   get:
 *     summary: Obtener estadísticas de pagos del médico autenticado
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de pagos
 */
router.get('/my-stats', authenticate, requireRole('DOCTOR'), payoutController.getMyPayoutStats.bind(payoutController));

/**
 * @swagger
 * /api/payouts/{batchId}:
 *   get:
 *     summary: Obtener detalle de una liquidación
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la liquidación
 */
router.get('/:batchId', authenticate, requirePayoutOwnership, payoutController.getPayoutDetail.bind(payoutController));

/**
 * @swagger
 * /api/payouts/process:
 *   post:
 *     summary: Procesar liquidaciones mensuales (solo admin)
 *     tags: [Payouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liquidaciones procesadas
 */
router.post('/process', authenticate, requireRole('ADMIN'), payoutController.processMonthlyPayouts.bind(payoutController));

/**
 * @swagger
 * /api/payouts/create/{doctorId}:
 *   post:
 *     summary: Crear liquidación manual para un médico (solo admin)
 *     tags: [Payouts]
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
 *         description: Liquidación creada
 */
router.post('/create/:doctorId', authenticate, requireRole('ADMIN'), payoutController.createPayoutBatch.bind(payoutController));

export default router;
