import { Router } from 'express';
import consultationsController, { validateCreateConsultation } from './consultations.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, validateCreateConsultation, consultationsController.create.bind(consultationsController));
router.get('/:id', authenticate, consultationsController.getById.bind(consultationsController));
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), consultationsController.getByDoctor.bind(consultationsController));
router.get('/patient/:patientId', authenticate, requireRole('PATIENT'), consultationsController.getByPatient.bind(consultationsController));
router.patch('/:id/activate', consultationsController.activate.bind(consultationsController));
router.patch('/:id/close', authenticate, requireRole('DOCTOR'), consultationsController.close.bind(consultationsController));

export default router;

