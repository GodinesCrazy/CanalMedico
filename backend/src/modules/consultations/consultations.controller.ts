import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import consultationsService from './consultations.service';
import doctorsService from '../doctors/doctors.service';
import { validate } from '@/middlewares/validation.middleware';
import { AuthenticatedRequest } from '@/types';
import { ConsultationType, ConsultationStatus } from '@prisma/client';

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
      const consultation = await consultationsService.create(req.body);
      res.status(201).json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await consultationsService.getById(req.params.id);
      res.json({
        success: true,
        data: consultation,
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
      try {
        await doctorsService.getById(req.params.doctorId);
      } catch (error: any) {
        if (error.status === 404) {
          res.status(404).json({ error: 'Doctor no encontrado' });
          return;
        }
        throw error;
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

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
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

  async close(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const consultation = await consultationsService.close(req.params.id);
      res.json({
        success: true,
        data: consultation,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ConsultationsController();

export const validateCreateConsultation = validate(createConsultationSchema);

