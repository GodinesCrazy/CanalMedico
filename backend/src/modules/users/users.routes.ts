import { Router } from 'express';
import usersController, { validateUpdateProfile } from './users.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/profile', authenticate, usersController.getProfile.bind(usersController));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               speciality:
 *                 type: string
 *               age:
 *                 type: number
 *               horarios:
 *                 type: object
 *               tarifaConsulta:
 *                 type: number
 *               tarifaUrgencia:
 *                 type: number
 *               medicalHistory:
 *                 type: object
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       401:
 *         description: No autenticado
 */
router.put('/profile', authenticate, validateUpdateProfile, usersController.updateProfile.bind(usersController));

export default router;

