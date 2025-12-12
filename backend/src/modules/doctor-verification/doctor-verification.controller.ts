/**
 * Controlador de verificacion de medicos
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { z } from 'zod';
import { validate } from '@/middlewares/validation.middleware';
import doctorVerificationService from './doctor-verification.service';
import { extractRutAndDv } from '@/utils/rut';

// Schemas de validacion
const verifyIdentitySchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invalido'),
    name: z.string().min(2, 'Nombre requerido'),
    birthDate: z.string().optional(),
  }),
});

const verifyRnpiSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invalido'),
    name: z.string().min(2, 'Nombre requerido'),
    specialty: z.string().optional(),
  }),
});

const verifyCompleteSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invalido'),
    name: z.string().min(2, 'Nombre requerido'),
    birthDate: z.string().optional(),
    specialty: z.string().optional(),
  }),
});

export const validateVerifyIdentity = validate(verifyIdentitySchema);
export const validateVerifyRnpi = validate(verifyRnpiSchema);
export const validateVerifyComplete = validate(verifyCompleteSchema);

export class DoctorVerificationController {
  /**
   * POST /api/medicos/validar-identidad
   */
  async verifyIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rut, name, birthDate } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        res.status(400).json({
          success: false,
          error: 'Formato de RUT invalido. Use formato: 12345678-9',
        });
        return;
      }

      const identityVerificationService = (await import('../identity-verification/identity-verification.service')).default;
      const result = await identityVerificationService.verifyIdentity({
        rut: run,
        dv,
        name,
        birthDate,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/medicos/validar-rnpi
   */
  async verifyRnpi(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rut, name, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        res.status(400).json({
          success: false,
          error: 'Formato de RUT invalido. Use formato: 12345678-9',
        });
        return;
      }

      const rnpiVerificationService = (await import('../rnpi-verification/rnpi-verification.service')).default;
      const result = await rnpiVerificationService.verifyProfessional({
        rut: run,
        dv,
        name,
        specialty,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/medicos/validacion-completa
   */
  async verifyComplete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      if (req.user.role !== 'DOCTOR') {
        res.status(403).json({ success: false, error: 'Solo medicos pueden ejecutar verificacion' });
        return;
      }

      const { rut, name, birthDate, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        res.status(400).json({
          success: false,
          error: 'Formato de RUT invalido. Use formato: 12345678-9',
        });
        return;
      }

      const prisma = (await import('@/database/prisma')).default;
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
      });

      if (!doctor) {
        res.status(404).json({
          success: false,
          error: 'Perfil de medico no encontrado',
        });
        return;
      }

      const result = await doctorVerificationService.verifyAndSave(doctor.id, {
        rut: run,
        dv,
        name,
        birthDate,
        specialty,
      });

      res.json({
        success: true,
        data: result,
        message: 'Verificacion completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medicos/:id/estado-validacion
   */
  async getVerificationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      const { id } = req.params;

      if (req.user.role === 'DOCTOR') {
        const prisma = (await import('@/database/prisma')).default;
        const doctor = await prisma.doctor.findUnique({
          where: { userId: req.user.id },
        });

        if (!doctor || doctor.id !== id) {
          res.status(403).json({
            success: false,
            error: 'Solo puedes ver tu propio estado de verificacion',
          });
          return;
        }
      }

      const status = await doctorVerificationService.getVerificationStatus(id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/revalidar-medico/:id
   */
  async reVerifyDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }

      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Solo administradores pueden re-verificar medicos',
        });
        return;
      }

      const { id } = req.params;
      const result = await doctorVerificationService.reVerifyDoctor(id);

      res.json({
        success: true,
        data: result,
        message: 'Re-verificacion completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorVerificationController();
