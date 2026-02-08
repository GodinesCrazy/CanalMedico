import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export class PatientsService {
  async getById(patientId: string) {
    try {
      // FIX P2022: select explícito - solo columnas de migraciones base
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          userId: true,
          name: true,
          age: true,
          medicalHistory: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      if (!patient) {
        throw createError('Paciente no encontrado', 404);
      }

      return patient;
    } catch (error) {
      logger.error('Error al obtener paciente:', error);
      throw error;
    }
  }

  async getByUserId(userId: string) {
    try {
      // FIX P2022: select explícito - solo columnas de migraciones base (phoneNumber puede no existir si FASE1 no aplicada)
      const patient = await prisma.patient.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          name: true,
          age: true,
          medicalHistory: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      if (!patient) {
        throw createError('Paciente no encontrado', 404);
      }

      return patient;
    } catch (error) {
      logger.error('Error al obtener paciente:', error);
      throw error;
    }
  }
}

export default new PatientsService();

