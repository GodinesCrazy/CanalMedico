import { Router } from 'express';
import authController, {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} from './auth.controller';
import { authRateLimiter } from '@/middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimiter, validateRegister, authController.register.bind(authController));
router.post('/login', authRateLimiter, validateLogin, authController.login.bind(authController));
router.post('/refresh', validateRefreshToken, authController.refreshToken.bind(authController));

export default router;

