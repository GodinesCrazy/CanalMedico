import { Router } from 'express';
import patientsController from './patients.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requirePatientOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Obtener paciente por ID
 *     tags: [Patients]
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
 *         description: Información del paciente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:id', authenticate, requirePatientOwnership, patientsController.getById.bind(patientsController));

/**
 * @swagger
 * /api/patients/user/{userId}:
 *   get:
 *     summary: Obtener paciente por ID de usuario
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del paciente
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/user/:userId', authenticate, requirePatientOwnership, patientsController.getByUserId.bind(patientsController));

export default router;

