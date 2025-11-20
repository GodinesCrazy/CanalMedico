import { Router } from 'express';
import patientsController from './patients.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/:id', authenticate, patientsController.getById.bind(patientsController));
router.get('/user/:userId', authenticate, patientsController.getByUserId.bind(patientsController));

export default router;

