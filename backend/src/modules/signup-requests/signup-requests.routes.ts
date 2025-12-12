import { Router } from 'express';
import signupRequestsController, {
  validateCreateRequest,
  validateUpdateStatus,
} from './signup-requests.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/signup-requests:
 *   post:
 *     summary: Crear solicitud de registro médico
 *     tags: [SignupRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - specialty
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               rut:
 *                 type: string
 *               specialty:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               clinicOrCenter:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Ya existe una solicitud con este email
 */
router.post('/', validateCreateRequest, signupRequestsController.create.bind(signupRequestsController));

/**
 * @swagger
 * /api/signup-requests:
 *   get:
 *     summary: Obtener todas las solicitudes de registro (solo admin)
 *     tags: [SignupRequests]
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
 *           enum: [PENDING, REVIEWED, APPROVED, REJECTED, ALL]
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores pueden ver las solicitudes
 */
router.get('/', authenticate, requireRole('ADMIN'), signupRequestsController.getAll.bind(signupRequestsController));

/**
 * @swagger
 * /api/signup-requests/{id}:
 *   get:
 *     summary: Obtener solicitud por ID (solo admin)
 *     tags: [SignupRequests]
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
 *         description: Solicitud encontrada
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Solicitud no encontrada
 */
router.get('/:id', authenticate, requireRole('ADMIN'), signupRequestsController.getById.bind(signupRequestsController));

/**
 * @swagger
 * /api/signup-requests/{id}/status:
 *   patch:
 *     summary: Actualizar estado de solicitud (solo admin)
 *     tags: [SignupRequests]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, REVIEWED, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores pueden actualizar el estado
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN'),
  validateUpdateStatus,
  signupRequestsController.updateStatus.bind(signupRequestsController)
);

/**
 * @swagger
 * /api/signup-requests/{id}/re-verify:
 *   post:
 *     summary: Re-ejecutar validaciones automáticas de una solicitud
 *     tags: [SignupRequests]
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
 *         description: Validaciones re-ejecutadas
 *       403:
 *         description: Solo administradores
 */
router.post(
  '/:id/re-verify',
  authenticate,
  requireRole('ADMIN'),
  signupRequestsController.reRunVerifications.bind(signupRequestsController)
);

export default router;

