import { Response, NextFunction } from 'express';
import { z } from 'zod';
import usersService from './users.service';
import { validate } from '@/middlewares/validation.middleware';
import { AuthenticatedRequest } from '@/types';

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    speciality: z.string().optional(),
    age: z.number().int().positive().optional(),
    horarios: z.any().optional(),
    tarifaConsulta: z.number().nonnegative().optional(),
    tarifaUrgencia: z.number().nonnegative().optional(),
    medicalHistory: z.any().optional(),
  }),
});

export class UsersController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const profile = await usersService.getProfile(req.user.id);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const profile = await usersService.updateProfile(req.user.id, req.body);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();

export const validateUpdateProfile = validate(updateProfileSchema);

