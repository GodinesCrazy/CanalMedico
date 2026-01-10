import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from './auth.service';
import { validate } from '@/middlewares/validation.middleware';


// Schemas de validación
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']),
    age: z.number().int().positive().optional(),
    speciality: z.string().optional(),
    rut: z.string().optional(),
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

const sendOTPSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(8, 'Número de teléfono inválido'),
    attemptId: z.string().optional(),
    method: z.enum(['WHATSAPP', 'SMS']).optional().default('WHATSAPP'),
  }),
});

const verifyOTPSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(8, 'Número de teléfono inválido'),
    otp: z.string().length(6, 'El código OTP debe tener 6 dígitos'),
    attemptId: z.string().optional(),
  }),
});

export class AuthController {
  /**
   * Enviar OTP por WhatsApp o SMS
   * 
   * POST /api/auth/send-otp
   * 
   * FASE 3: Login invisible
   */
  async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOTP(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar OTP y crear/iniciar sesión automáticamente
   * 
   * POST /api/auth/verify-otp
   * 
   * FASE 3: Login invisible
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOTP(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
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
export const validateSendOTP = validate(sendOTPSchema);
export const validateVerifyOTP = validate(verifyOTPSchema);

