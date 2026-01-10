import { Router } from 'express';
import adminController from './admin.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Todas las rutas de admin requieren autenticación y rol ADMIN
 */
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * /api/admin/dashboard-metrics:
 *   get:
 *     summary: Obtener métricas del dashboard administrativo
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas administrativas
 *       403:
 *         description: Solo administradores pueden acceder
 */
router.get('/dashboard-metrics', adminController.getDashboardMetrics.bind(adminController));

/**
 * @swagger
 * /api/admin/consultations:
 *   get:
 *     summary: Obtener todas las consultas (solo ADMIN)
 *     tags: [Admin]
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
 *         description: Lista de consultas
 *       403:
 *         description: Solo administradores pueden acceder
 */
router.get('/consultations', adminController.getAllConsultations.bind(adminController));

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: Obtener todos los médicos (solo ADMIN)
 *     tags: [Admin]
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
 *         description: Lista de médicos
 *       403:
 *         description: Solo administradores pueden acceder
 */
router.get('/doctors', adminController.getAllDoctors.bind(adminController));

export default router;

