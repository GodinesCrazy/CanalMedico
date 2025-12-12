/**
 * Controlador para endpoints de recetas SNRE
 */

import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '@/middlewares/validation.middleware';
import { AuthenticatedRequest } from '@/types';
import snreService from './snre.service';
// Logger y prisma no usados directamente

// Schema de validaciï¿½n para crear receta
const createPrescriptionSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1, 'ID de consulta requerido'),
    medications: z.array(
      z.object({
        medicationName: z.string().min(1, 'Nombre del medicamento requerido'),
        tfcCode: z.string().optional(),
        snomedCode: z.string().optional(),
        presentation: z.string().optional(),
        pharmaceuticalForm: z.string().optional(),
        dosage: z.string().min(1, 'Dosis requerida'),
        frequency: z.string().min(1, 'Frecuencia requerida'),
        duration: z.string().optional(),
        quantity: z.string().optional(),
        instructions: z.string().optional(),
      })
    ).min(1, 'Debe incluir al menos un medicamento'),
    recetaType: z.enum(['simple', 'retenida']).optional(),
    notes: z.string().optional(),
  }),
});

export const validateCreatePrescription = validate(createPrescriptionSchema);

export class SnreController {
  /**
   * POST /api/prescriptions
   * Crear una nueva receta electrï¿½nica
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Solo mï¿½dicos pueden crear recetas
      if (req.user.role !== 'DOCTOR') {
        res.status(403).json({ error: 'Solo los mï¿½dicos pueden emitir recetas' });
        return;
      }

      // Obtener ID del mï¿½dico desde el perfil
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.id },
      });

      if (!doctor) {
        res.status(404).json({ error: 'Perfil de mï¿½dico no encontrado' });
        return;
      }

      const prescription = await snreService.createPrescription(
        req.body,
        doctor.id
      );

      res.status(201).json({
        success: true,
        data: prescription,
        message: 'Receta electrï¿½nica creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/prescriptions/:id
   * Obtener una receta por ID
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Obtener ID del usuario segï¿½n su rol
      let userId: string;
      if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: req.user.id },
        });
        if (!doctor) {
          res.status(404).json({ error: 'Perfil de mï¿½dico no encontrado' });
          return;
        }
        userId = doctor.id;
      } else if (req.user.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({
          where: { userId: req.user.id },
        });
        if (!patient) {
          res.status(404).json({ error: 'Perfil de paciente no encontrado' });
          return;
        }
        userId = patient.id;
      } else {
        res.status(403).json({ error: 'Rol no autorizado' });
        return;
      }

      const prescription = await snreService.getPrescriptionById(
        req.params.id,
        userId,
        req.user.role
      );

      res.json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/consultations/:consultationId/prescriptions
   * Obtener todas las recetas de una consulta
   */
  async getByConsultation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Obtener ID del usuario segï¿½n su rol
      let userId: string;
      if (req.user.role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId: req.user.id },
        });
        if (!doctor) {
          res.status(404).json({ error: 'Perfil de mï¿½dico no encontrado' });
          return;
        }
        userId = doctor.id;
      } else if (req.user.role === 'PATIENT') {
        const patient = await prisma.patient.findUnique({
          where: { userId: req.user.id },
        });
        if (!patient) {
          res.status(404).json({ error: 'Perfil de paciente no encontrado' });
          return;
        }
        userId = patient.id;
      } else {
        res.status(403).json({ error: 'Rol no autorizado' });
        return;
      }

      const prescriptions = await snreService.getPrescriptionsByConsultation(
        req.params.consultationId,
        userId,
        req.user.role
      );

      res.json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Importar prisma aquï¿½ para evitar dependencia circular
import prisma from '@/database/prisma';

export default new SnreController();



