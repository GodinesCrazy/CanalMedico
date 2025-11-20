import { Router } from 'express';
import notificationsController, {
  validateRegisterToken,
  validateSendNotification,
} from './notifications.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/token', authenticate, validateRegisterToken, notificationsController.registerToken.bind(notificationsController));
router.post('/send', authenticate, requireRole('ADMIN', 'DOCTOR'), validateSendNotification, notificationsController.sendNotification.bind(notificationsController));

export default router;

