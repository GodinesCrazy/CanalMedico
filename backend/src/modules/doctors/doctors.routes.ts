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

/**
 * @swagger
 * /api/doctors/{id}/payout-settings:
 *   patch:
 *     summary: Actualizar configuración de pago del doctor
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
 *             properties:
 *               payoutMode:
 *                 type: string
 *                 enum: [IMMEDIATE, MONTHLY]
 *               payoutDay:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               bankAccountInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden actualizar su configuración
 */
router.patch('/:id/payout-settings', authenticate, requireRole('DOCTOR'), doctorsController.updatePayoutSettings.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/{id}/availability:
 *   get:
 *     summary: Obtener disponibilidad actual del doctor
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
 *         description: Disponibilidad actual del doctor
 *       401:
 *         description: No autenticado
 */
router.get('/:id/availability', authenticate, requireRole('DOCTOR'), doctorsController.getCurrentAvailability.bind(doctorsController));

/**
 * @swagger
 * /api/doctors/{id}/availability-settings:
 *   patch:
 *     summary: Actualizar configuración de disponibilidad del doctor
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
 *             properties:
 *               modoDisponibilidad:
 *                 type: string
 *                 enum: [MANUAL, AUTOMATICO]
 *               horariosAutomaticos:
 *                 type: string
 *                 description: JSON string con configuración de horarios
 *               estadoOnline:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       401:
 *         description: No autenticado
 */
router.patch('/:id/availability-settings', authenticate, requireRole('DOCTOR'), doctorsController.updateAvailabilitySettings.bind(doctorsController));

export default router;

