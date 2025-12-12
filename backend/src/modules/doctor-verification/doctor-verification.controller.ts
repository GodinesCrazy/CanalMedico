/**
 * Controlador de verificaci�n de m�dicos
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { z } from 'zod';
import { validate } from '@/middlewares/validation.middleware';
import doctorVerificationService from './doctor-verification.service';
import { extractRutAndDv } from '@/utils/rut';

// Schemas de validaci�n
const verifyIdentitySchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT inv�lido'),
    name: z.string().min(2, 'Nombre requerido'),
    birthDate: z.string().optional(),
  }),
});

const verifyRnpiSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT inv�lido'),
    name: z.string().min(2, 'Nombre requerido'),
    specialty: z.string().optional(),
  }),
});

const verifyCompleteSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT inv�lido'),
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
   * Valida solo la identidad contra Registro Civil
   */
  async verifyIdentity(req: Request, res: Response, next: NextFunction) {
    try {
      const { rut, name, birthDate } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        return res.status(400).json({
          success: false,
          error: 'Formato de RUT inv�lido. Use formato: 12345678-9',
        });
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
   * Valida solo la habilitaci�n profesional contra RNPI
   */
  async verifyRnpi(req: Request, res: Response, next: NextFunction) {
    try {
      const { rut, name, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        return res.status(400).json({
          success: false,
          error: 'Formato de RUT inv�lido. Use formato: 12345678-9',
        });
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
   * Ejecuta verificaci�n completa (identidad + RNPI)
   */
  async verifyComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      // Solo m�dicos pueden verificar su propia cuenta
      if (req.user.role !== 'DOCTOR') {
        return res.status(403).json({ success: false, error: 'Solo m�dicos pueden ejecutar verificaci�n' });
      }

      const { rut, name, birthDate, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        return res.status(400).json({
          success: false,
          error: 'Formato de RUT inv�lido. Use formato: 12345678-9',
        });
      }

      // Obtener doctorId del usuario autenticado
      const prisma = (await import('@/database/prisma')).default;
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          error: 'Perfil de m�dico no encontrado',
        });
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
        message: 'Verificaci�n completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medicos/:id/estado-validacion
   * Obtiene el estado de verificaci�n de un m�dico
   */
  async getVerificationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      const { id } = req.params;

      // M�dicos solo pueden ver su propio estado, admins pueden ver cualquiera
      if (req.user.role === 'DOCTOR') {
        const prisma = (await import('@/database/prisma')).default;
        const doctor = await prisma.doctor.findUnique({
          where: { userId: req.user.id },
        });

        if (!doctor || doctor.id !== id) {
          return res.status(403).json({
            success: false,
            error: 'Solo puedes ver tu propio estado de verificaci�n',
          });
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
   * Re-ejecuta la verificaci�n de un m�dico (solo admin)
   */
  async reVerifyDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Solo administradores pueden re-verificar m�dicos',
        });
      }

      const { id } = req.params;
      const result = await doctorVerificationService.reVerifyDoctor(id);

      res.json({
        success: true,
        data: result,
        message: 'Re-verificaci�n completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorVerificationController();
