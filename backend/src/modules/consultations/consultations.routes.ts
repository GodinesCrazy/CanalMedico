import { Router } from 'express';
import consultationsController, { validateCreateConsultation } from './consultations.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { requireConsultationOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

/**
 * @swagger
 * /api/consultations:
 *   post:
 *     summary: Crear nueva consulta (solo PACIENTE)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - patientId
 *               - type
 *               - price
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [NORMAL, URGENCIA]
 *               price:
 *                 type: integer
 *                 description: Precio de la consulta en centavos/CLP
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Consulta creada exitosamente
 *       400:
 *         description: Error de validación (precio inválido)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo los pacientes pueden crear consultas
 */
router.post('/', authenticate, requireRole('PATIENT'), validateCreateConsultation, consultationsController.create.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/{id}:
 *   get:
 *     summary: Obtener consulta por ID
 *     tags: [Consultations]
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
 *         description: Información de la consulta
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Consulta no encontrada
 */
router.get('/:id', authenticate, requireConsultationOwnership, consultationsController.getById.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/doctor/{doctorId}:
 *   get:
 *     summary: Obtener consultas de un doctor
 *     tags: [Consultations]
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
 *         description: Lista de consultas del doctor
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden ver sus consultas
 */
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), consultationsController.getByDoctor.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/patient/{patientId}:
 *   get:
 *     summary: Obtener consultas de un paciente
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de consultas del paciente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo pacientes pueden ver sus consultas
 */
router.get('/patient/:patientId', authenticate, requireRole('PATIENT'), consultationsController.getByPatient.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/{id}/accept:
 *   patch:
 *     summary: DOCTOR acepta consulta (PENDING → ACTIVE)
 *     tags: [Consultations]
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
 *         description: Consulta aceptada exitosamente
 *       400:
 *         description: Solo se pueden aceptar consultas con estado PENDING
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden aceptar consultas
 */
router.patch('/:id/accept', authenticate, requireRole('DOCTOR'), consultationsController.accept.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/{id}/complete:
 *   patch:
 *     summary: DOCTOR completa consulta (ACTIVE → COMPLETED)
 *     tags: [Consultations]
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
 *         description: Consulta completada exitosamente
 *       400:
 *         description: Solo se pueden completar consultas con estado ACTIVE
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden completar consultas
 */
router.patch('/:id/complete', authenticate, requireRole('DOCTOR'), consultationsController.complete.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/{id}/activate:
 *   patch:
 *     summary: Activar consulta (después del pago) - DEPRECATED
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consulta activada exitosamente
 *       404:
 *         description: Consulta no encontrada
 */
router.patch('/:id/activate', authenticate, requireConsultationOwnership, consultationsController.activate.bind(consultationsController));

/**
 * @swagger
 * /api/consultations/{id}/close:
 *   patch:
 *     summary: Cerrar consulta - DEPRECATED (usar /accept o /complete)
 *     tags: [Consultations]
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
 *         description: Consulta cerrada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo doctores pueden cerrar consultas
 */
router.patch('/:id/close', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, consultationsController.close.bind(consultationsController));

// Importar rutas de recetas SNRE
import { consultationsPrescriptionsRoutes } from '../snre/snre.routes';
router.use('/', consultationsPrescriptionsRoutes);

export default router;

