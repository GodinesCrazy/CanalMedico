import { Router } from 'express';
import notificationsController, {
  validateRegisterToken,
  validateSendNotification,
} from './notifications.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/notifications/token:
 *   post:
 *     summary: Registrar token de dispositivo para notificaciones push
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [web, ios, android]
 *     responses:
 *       200:
 *         description: Token registrado exitosamente
 *       401:
 *         description: No autenticado
 */
router.post('/token', authenticate, validateRegisterToken, notificationsController.registerToken.bind(notificationsController));

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Enviar notificación push
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - body
 *             properties:
 *               userId:
 *                 type: string
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notificación enviada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo administradores y doctores pueden enviar notificaciones
 */
router.post('/send', authenticate, requireRole('ADMIN', 'DOCTOR'), validateSendNotification, notificationsController.sendNotification.bind(notificationsController));

export default router;

