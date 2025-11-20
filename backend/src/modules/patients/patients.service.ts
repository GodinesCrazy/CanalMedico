import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export class PatientsService {
  async getById(patientId: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
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
      const patient = await prisma.patient.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
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

