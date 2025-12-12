/**
 * Rutas de verificaci�n de m�dicos
 */

import { Router } from 'express';
import doctorVerificationController, {
  validateVerifyIdentity,
  validateVerifyRnpi,
  validateVerifyComplete,
} from './doctor-verification.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/medicos/validar-identidad:
 *   post:
 *     summary: Validar identidad contra Registro Civil
 *     tags: [DoctorVerification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rut
 *               - name
 *             properties:
 *               rut:
 *                 type: string
 *                 example: "12345678-9"
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Resultado de validaci�n de identidad
 */
router.post(
  '/validar-identidad',
  validateVerifyIdentity,
  doctorVerificationController.verifyIdentity.bind(doctorVerificationController)
);

/**
 * @swagger
 * /api/medicos/validar-rnpi:
 *   post:
 *     summary: Validar habilitaci�n profesional contra RNPI
 *     tags: [DoctorVerification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rut
 *               - name
 *             properties:
 *               rut:
 *                 type: string
 *               name:
 *                 type: string
 *               specialty:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de validaci�n RNPI
 */
router.post(
  '/validar-rnpi',
  validateVerifyRnpi,
  doctorVerificationController.verifyRnpi.bind(doctorVerificationController)
);

/**
 * @swagger
 * /api/medicos/validacion-completa:
 *   post:
 *     summary: Ejecutar verificaci�n completa (identidad + RNPI)
 *     tags: [DoctorVerification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rut
 *               - name
 *             properties:
 *               rut:
 *                 type: string
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               specialty:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verificaci�n completa exitosa
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo m�dicos pueden ejecutar verificaci�n
 */
router.post(
  '/validacion-completa',
  authenticate,
  requireRole('DOCTOR'),
  validateVerifyComplete,
  doctorVerificationController.verifyComplete.bind(doctorVerificationController)
);

/**
 * @swagger
 * /api/medicos/{id}/estado-validacion:
 *   get:
 *     summary: Obtener estado de verificaci�n de un m�dico
 *     tags: [DoctorVerification]
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
 *         description: Estado de verificaci�n
 *       403:
 *         description: No autorizado
 */
router.get(
  '/:id/estado-validacion',
  authenticate,
  doctorVerificationController.getVerificationStatus.bind(doctorVerificationController)
);

/**
 * @swagger
 * /api/admin/revalidar-medico/{id}:
 *   post:
 *     summary: Re-ejecutar verificaci�n de un m�dico (solo admin)
 *     tags: [DoctorVerification]
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
 *         description: Re-verificaci�n completada
 *       403:
 *         description: Solo administradores
 */
const adminRouter = Router();
adminRouter.post(
  '/revalidar-medico/:id',
  authenticate,
  requireRole('ADMIN'),
  doctorVerificationController.reVerifyDoctor.bind(doctorVerificationController)
);

export { adminRouter as doctorVerificationAdminRoutes };
export default router;
