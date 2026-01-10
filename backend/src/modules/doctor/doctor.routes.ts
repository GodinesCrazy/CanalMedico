import { Router } from 'express';
import consultationsController from '../consultations/consultations.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/doctor/consultations
 * Lista consultas propias del DOCTOR autenticado
 * 
 * @swagger
 * /api/doctor/consultations:
 *   get:
 *     summary: Lista consultas propias del DOCTOR autenticado
 *     tags: [Doctor]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de consultas del doctor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden ver sus consultas
 */
router.get('/consultations', authenticate, requireRole('DOCTOR'), consultationsController.getMyConsultations.bind(consultationsController));

export default router;

