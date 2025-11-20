import { Router } from 'express';
import doctorsController from './doctors.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/', doctorsController.getAll.bind(doctorsController));
router.get('/online', doctorsController.getOnlineDoctors.bind(doctorsController));
router.get('/:id', doctorsController.getById.bind(doctorsController));
router.put('/:id/online-status', authenticate, requireRole('DOCTOR'), doctorsController.updateOnlineStatus.bind(doctorsController));
router.get('/:id/statistics', authenticate, requireRole('DOCTOR'), doctorsController.getStatistics.bind(doctorsController));

export default router;

