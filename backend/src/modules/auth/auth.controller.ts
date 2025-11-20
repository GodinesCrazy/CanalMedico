import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from './auth.service';
import { validate } from '@/middlewares/validation.middleware';
import { UserRole } from '@prisma/client';

// Schemas de validación
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    role: z.nativeEnum(UserRole),
    age: z.number().int().positive().optional(),
    speciality: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
  }),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

// Middlewares de validación exportados
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);

