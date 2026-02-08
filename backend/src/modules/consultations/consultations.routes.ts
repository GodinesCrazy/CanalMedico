import { Router } from 'express';
import consultationsController, { validateCreateConsultation } from './consultations.controller';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import { requireConsultationOwnership, requireDoctorOwnership, requirePatientIdOwnership } from '@/middlewares/ownership.middleware';

const router = Router();

router.post('/', authenticate, requireRole('PATIENT'), validateCreateConsultation, consultationsController.create.bind(consultationsController));

router.get('/:id', authenticate, requireConsultationOwnership, consultationsController.getById.bind(consultationsController));

router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), requireDoctorOwnership, consultationsController.getByDoctor.bind(consultationsController));

router.get('/patient/:patientId', authenticate, requireRole('PATIENT'), requirePatientIdOwnership, consultationsController.getByPatient.bind(consultationsController));

router.patch('/:id/accept', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, consultationsController.accept.bind(consultationsController));

router.patch('/:id/complete', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, consultationsController.complete.bind(consultationsController));

router.patch('/:id/activate', authenticate, requireConsultationOwnership, consultationsController.activate.bind(consultationsController));

router.patch('/:id/close', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, consultationsController.close.bind(consultationsController));

import { consultationsPrescriptionsRoutes } from '../snre/snre.routes';
router.use('/', consultationsPrescriptionsRoutes);

export default router;
