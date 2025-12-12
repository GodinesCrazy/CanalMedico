/**
 * Controlador de verificaciï¿½n de mï¿½dicos
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { z } from 'zod';
import { validate } from '@/middlewares/validation.middleware';
import doctorVerificationService from './doctor-verification.service';
import { extractRutAndDv } from '@/utils/rut';

// Schemas de validaciï¿½n
const verifyIdentitySchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invï¿½lido'),
    name: z.string().min(2, 'Nombre requerido'),
    birthDate: z.string().optional(),
  }),
});

const verifyRnpiSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invï¿½lido'),
    name: z.string().min(2, 'Nombre requerido'),
    specialty: z.string().optional(),
  }),
});

const verifyCompleteSchema = z.object({
  body: z.object({
    rut: z.string().min(8, 'RUT invï¿½lido'),
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
          error: 'Formato de RUT invï¿½lido. Use formato: 12345678-9',
        });
      }

      const identityVerificationService = (await import('../identity-verification/identity-verification.service')).default;
      const result = await identityVerificationService.verifyIdentity({
        rut: run,
        dv,
        name,
        birthDate,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/medicos/validar-rnpi
   * Valida solo la habilitaciï¿½n profesional contra RNPI
   */
  async verifyRnpi(req: Request, res: Response, next: NextFunction) {
    try {
      const { rut, name, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        return res.status(400).json({
          success: false,
          error: 'Formato de RUT invï¿½lido. Use formato: 12345678-9',
        });
      }

      const rnpiVerificationService = (await import('../rnpi-verification/rnpi-verification.service')).default;
      const result = await rnpiVerificationService.verifyProfessional({
        rut: run,
        dv,
        name,
        specialty,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/medicos/validacion-completa
   * Ejecuta verificaciï¿½n completa (identidad + RNPI)
   */
  async verifyComplete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      // Solo mï¿½dicos pueden verificar su propia cuenta
      if (req.user.role !== 'DOCTOR') {
        return res.status(403).json({ success: false, error: 'Solo mï¿½dicos pueden ejecutar verificaciï¿½n' });
      }

      const { rut, name, birthDate, specialty } = req.body;
      
      const { rut: run, dv } = extractRutAndDv(rut);
      if (!run || !dv) {
        return res.status(400).json({
          success: false,
          error: 'Formato de RUT invï¿½lido. Use formato: 12345678-9',
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
          error: 'Perfil de mï¿½dico no encontrado',
        });
      }

      const result = await doctorVerificationService.verifyAndSave(doctor.id, {
        rut: run,
        dv,
        name,
        birthDate,
        specialty,
      });

      return res.json({
        success: true,
        data: result,
        message: 'Verificaciï¿½n completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medicos/:id/estado-validacion
   * Obtiene el estado de verificaciï¿½n de un mï¿½dico
   */
  async getVerificationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      const { id } = req.params;

      // Mï¿½dicos solo pueden ver su propio estado, admins pueden ver cualquiera
      if (req.user.role === 'DOCTOR') {
        const prisma = (await import('@/database/prisma')).default;
        const doctor = await prisma.doctor.findUnique({
          where: { userId: req.user.id },
        });

        if (!doctor || doctor.id !== id) {
          return res.status(403).json({
            success: false,
            error: 'Solo puedes ver tu propio estado de verificaciï¿½n',
          });
        }
      }

      const status = await doctorVerificationService.getVerificationStatus(id);

      return res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/revalidar-medico/:id
   * Re-ejecuta la verificaciï¿½n de un mï¿½dico (solo admin)
   */
  async reVerifyDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autenticado' });
      }

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Solo administradores pueden re-verificar mï¿½dicos',
        });
      }

      const { id } = req.params;
      const result = await doctorVerificationService.reVerifyDoctor(id);

      return res.json({
        success: true,
        data: result,
        message: 'Re-verificaciï¿½n completada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorVerificationController();

