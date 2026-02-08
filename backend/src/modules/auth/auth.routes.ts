import { Router } from 'express';
import authController, {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateSendOTP,
  validateVerifyOTP,
} from './auth.controller';
import { authRateLimiter } from '@/middlewares/rateLimit.middleware';
import { featureFlags } from '@/config/featureFlags';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, PATIENT]
 *               age:
 *                 type: number
 *               speciality:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/register', authRateLimiter, validateRegister, authController.register.bind(authController));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authRateLimiter, validateLogin, authController.login.bind(authController));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token de acceso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *       401:
 *         description: Refresh token inválido
 */
router.post('/refresh', authRateLimiter, validateRefreshToken, authController.refreshToken.bind(authController));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión e invalidar el token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
 *       401:
 *         description: No autenticado
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Enviar código OTP por WhatsApp o SMS
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 minLength: 8
 *               attemptId:
 *                 type: string
 *                 description: ID del ConsultationAttempt (opcional)
 *               method:
 *                 type: string
 *                 enum: [WHATSAPP, SMS]
 *                 default: WHATSAPP
 *     responses:
 *       200:
 *         description: OTP enviado exitosamente
 *       400:
 *         description: Error de validación
 *       403:
 *         description: Feature no habilitado
 *       429:
 *         description: Demasiados intentos
 */
if (featureFlags.PHONE_LOGIN) {
  router.post(
    '/send-otp',
    authRateLimiter,
    validateSendOTP,
    authController.sendOTP.bind(authController)
  );
} else {
  router.post('/send-otp', (_req, res) => {
    res.status(404).json({ error: 'Feature not enabled' });
  });
}

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verificar código OTP y crear/iniciar sesión automáticamente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 minLength: 8
 *               otp:
 *                 type: string
 *                 length: 6
 *               attemptId:
 *                 type: string
 *                 description: ID del ConsultationAttempt (opcional, para crear consulta automática)
 *     responses:
 *       200:
 *         description: OTP verificado, usuario autenticado
 *       400:
 *         description: OTP inválido o expirado
 *       403:
 *         description: Feature no habilitado
 */
if (featureFlags.PHONE_LOGIN) {
  router.post(
    '/verify-otp',
    authRateLimiter,
    validateVerifyOTP,
    authController.verifyOTP.bind(authController)
  );
} else {
  router.post('/verify-otp', (_req, res) => {
    res.status(404).json({ error: 'Feature not enabled' });
  });
}

export default router;

