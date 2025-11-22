import { Router } from 'express';
import commissionsController from './commissions.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/commissions/stats:
 *   get:
 *     summary: Obtener estadísticas generales de comisiones
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de comisiones
 */
router.get('/stats', authenticate, requireRole('ADMIN'), commissionsController.getStats.bind(commissionsController));

/**
 * @swagger
 * /api/commissions/period:
 *   get:
 *     summary: Obtener comisiones por período
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comisiones del período
 */
router.get('/period', authenticate, requireRole('ADMIN'), commissionsController.getByPeriod.bind(commissionsController));

/**
 * @swagger
 * /api/commissions/by-doctor:
 *   get:
 *     summary: Obtener comisiones agrupadas por médico
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comisiones por médico
 */
router.get('/by-doctor', authenticate, requireRole('ADMIN'), commissionsController.getByDoctor.bind(commissionsController));

/**
 * @swagger
 * /api/commissions/doctor/{doctorId}:
 *   get:
 *     summary: Obtener detalle de comisiones de un médico
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Detalle de comisiones del médico
 */
router.get('/doctor/:doctorId', authenticate, requireRole('ADMIN'), commissionsController.getDoctorDetail.bind(commissionsController));

/**
 * @swagger
 * /api/commissions/monthly:
 *   get:
 *     summary: Obtener comisiones mensuales (últimos 12 meses)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comisiones mensuales
 */
router.get('/monthly', authenticate, requireRole('ADMIN'), commissionsController.getMonthly.bind(commissionsController));

export default router;
