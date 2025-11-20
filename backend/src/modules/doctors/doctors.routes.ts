import { Router } from 'express';
import doctorsController from './doctors.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Obtener todos los doctores
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Lista de doctores
 */
router.get('/', doctorsController.getAll.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/online:
 *   get:
 *     summary: Obtener doctores en línea
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: Lista de doctores en línea
 */
router.get('/online', doctorsController.getOnlineDoctors.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Obtener doctor por ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del doctor
 *       404:
 *         description: Doctor no encontrado
 */
router.get('/:id', doctorsController.getById.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/{id}/online-status:
 *   put:
 *     summary: Actualizar estado en línea del doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estadoOnline
 *             properties:
 *               estadoOnline:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden actualizar su estado
 */
router.put('/:id/online-status', authenticate, requireRole('DOCTOR'), doctorsController.updateOnlineStatus.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/{id}/statistics:
 *   get:
 *     summary: Obtener estadísticas del doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas del doctor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden ver sus estadísticas
 */
router.get('/:id/statistics', authenticate, requireRole('DOCTOR'), doctorsController.getStatistics.bind(doctorsController));

export default router;

