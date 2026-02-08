import { Response, NextFunction } from 'express';
import { z } from 'zod';
import consultationsService from './consultations.service';
import doctorsService from '../doctors/doctors.service';
import { validate } from '@/middlewares/validation.middleware';
import { AuthenticatedRequest } from '@/types';
import { ConsultationType, ConsultationStatus } from '@/types';

const createConsultationSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID requerido'),
    patientId: z.string().min(1, 'Paciente ID requerido'),
    type: z.nativeEnum(ConsultationType),
    }),
});

export class ConsultationsController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede crear consultas como paciente
      if (req.user.role !== 'PATIENT') {
        res.status(403).json({ error: 'Solo los pacientes pueden crear consultas' });
        return;
      }

      // Validar que el patientId corresponde al usuario autenticado
      const patientsService = require('../patients/patients.service').default;
      const patient = await patientsService.getByUserId(req.user.id);
      
      if (patient.id !== req.body.patientId) {
        res.status(403).json({ error: 'No puedes crear consultas para otros pacientes' });
        return;
      }

      const consultation = await consultationsService.create(req.body);
      res.status(201).json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // La validaciÃ³n de propiedad ya se realizÃ³ en el middleware requireConsultationOwnership
      const consultation = await consultationsService.getById(req.params.id);
      res.json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doctor/consultations
   * Lista consultas propias del DOCTOR autenticado
   */
  async getMyConsultations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Solo DOCTOR puede ver sus consultas
      if (req.user.role !== 'DOCTOR') {
        res.status(403).json({ error: 'Solo los doctores pueden ver sus consultas' });
        return;
      }

      // Obtener el doctor del usuario autenticado
      const doctor = await doctorsService.getByUserId(req.user.id);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor no encontrado para este usuario' });
        return;
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const status = req.query.status as ConsultationStatus | undefined;

      const result = await consultationsService.getByDoctor(doctor.id, page, limit, status);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const status = req.query.status as ConsultationStatus | undefined;

      // Verificar que el doctor existe
      let doctor;
      try {
        doctor = await doctorsService.getById(req.params.doctorId);
      } catch (error: any) {
        if (error.status === 404) {
          res.status(404).json({ error: 'Doctor no encontrado' });
          return;
        }
        throw error;
      }

      // Validar que el usuario solo puede ver sus propias consultas
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para ver estas consultas' });
        return;
      }

      const result = await consultationsService.getByDoctor(req.params.doctorId, page, limit, status);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByPatient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede ver sus propias consultas
      // Obtener el paciente para verificar que pertenece al usuario autenticado
      const patientsService = require('../patients/patients.service').default;
      const patient = await patientsService.getByUserId(req.user.id);
      
      if (patient.id !== req.params.patientId) {
        res.status(403).json({ error: 'No tienes permiso para ver estas consultas' });
        return;
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const status = req.query.status as ConsultationStatus | undefined;

      const result = await consultationsService.getByPatient(req.params.patientId, page, limit, status);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async activate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // La validaciÃ³n de propiedad ya se realizÃ³ en el middleware requireConsultationOwnership
      // Solo el paciente de la consulta puede activarla despuÃ©s del pago
      const { paymentId } = req.body;
      const consultation = await consultationsService.activate(req.params.id, paymentId);
      res.json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/consultations/:id/accept
   * DOCTOR acepta consulta (PENDING â†’ ACTIVE)
   */
  async accept(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Solo DOCTOR puede aceptar consultas
      if (req.user.role !== 'DOCTOR') {
        res.status(403).json({ error: 'Solo los doctores pueden aceptar consultas' });
        return;
      }

      // Obtener el doctor del usuario autenticado
      const doctor = await doctorsService.getByUserId(req.user.id);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor no encontrado para este usuario' });
        return;
      }

      const consultation = await consultationsService.accept(req.params.id, doctor.id);
      res.json({
        success: true,
        data: consultation,
        message: 'Consulta aceptada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/consultations/:id/complete
   * DOCTOR completa consulta (ACTIVE â†’ COMPLETED)
   */
  async complete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Solo DOCTOR puede completar consultas
      if (req.user.role !== 'DOCTOR') {
        res.status(403).json({ error: 'Solo los doctores pueden completar consultas' });
        return;
      }

      // Obtener el doctor del usuario autenticado
      const doctor = await doctorsService.getByUserId(req.user.id);
      if (!doctor) {
        res.status(404).json({ error: 'Doctor no encontrado para este usuario' });
        return;
      }

      const consultation = await consultationsService.complete(req.params.id, doctor.id);
      res.json({
        success: true,
        data: consultation,
        message: 'Consulta completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async close(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // La validaciÃ³n de propiedad ya se realizÃ³ en el middleware requireConsultationOwnership
      // Solo el doctor de la consulta puede cerrarla (validado por requireRole('DOCTOR') + requireConsultationOwnership)
      const closedConsultation = await consultationsService.close(req.params.id);
      res.json({
        success: true,
        data: closedConsultation,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConsultationsController();

export const validateCreateConsultation = validate(createConsultationSchema);


