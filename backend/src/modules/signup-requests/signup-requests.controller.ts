import { Request, Response, NextFunction } from 'express';
import signupRequestsService from './signup-requests.service';
import { AuthenticatedRequest } from '@/types';
import { z } from 'zod';
import { validate } from '@/middlewares/validation.middleware';

// Schemas de validación
const createRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    rut: z.string().min(8, 'El RUT es obligatorio y debe tener formato válido (ej: 12345678-9)'),
    birthDate: z.string().optional(), // ISO 8601 date string
    specialty: z.string().min(2, 'La especialidad es requerida'),
    registrationNumber: z.string().optional(),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    clinicOrCenter: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED']),
  }),
});

export const validateCreateRequest = validate(createRequestSchema);
export const validateUpdateStatus = validate(updateStatusSchema);

export class SignupRequestsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await signupRequestsService.create(req.body);
      res.status(201).json({
        success: true,
        data: request,
        message: 'Solicitud de registro enviada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const status = req.query.status as string | undefined;

      const result = await signupRequestsService.getAll(page, limit, status);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await signupRequestsService.getById(req.params.id);
      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const { status } = req.body;
      const request = await signupRequestsService.updateStatus(
        req.params.id,
        status,
        req.user.id
      );

      res.json({
        success: true,
        data: request,
        message: 'Estado de solicitud actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/signup-requests/:id/re-verify
   * Re-ejecuta las validaciones automáticas
   */
  async reRunVerifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Solo admins pueden re-ejecutar validaciones
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Solo administradores pueden re-ejecutar validaciones' });
        return;
      }

      await signupRequestsService.reRunVerifications(req.params.id);

      res.json({
        success: true,
        message: 'Validaciones automáticas re-ejecutadas. Los resultados se actualizarán en breve.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SignupRequestsController();

