import { Router } from 'express';
import usersController, { validateUpdateProfile } from './users.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/profile', authenticate, usersController.getProfile.bind(usersController));
router.put('/profile', authenticate, validateUpdateProfile, usersController.updateProfile.bind(usersController));

export default router;

