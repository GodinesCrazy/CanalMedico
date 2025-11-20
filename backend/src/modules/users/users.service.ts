import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export class UsersService {
  async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.doctor || user.patient,
        createdAt: user.createdAt,
      };
    } catch (error) {
      logger.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      if (user.doctor) {
        const updated = await prisma.doctor.update({
          where: { userId },
          data: {
            name: data.name || user.doctor.name,
            speciality: data.speciality || user.doctor.speciality,
            horarios: data.horarios || user.doctor.horarios,
            tarifaConsulta: data.tarifaConsulta !== undefined ? data.tarifaConsulta : user.doctor.tarifaConsulta,
            tarifaUrgencia: data.tarifaUrgencia !== undefined ? data.tarifaUrgencia : user.doctor.tarifaUrgencia,
          },
        });
        return updated;
      }

      if (user.patient) {
        const updated = await prisma.patient.update({
          where: { userId },
          data: {
            name: data.name || user.patient.name,
            age: data.age !== undefined ? data.age : user.patient.age,
            medicalHistory: data.medicalHistory || user.patient.medicalHistory,
          },
        });
        return updated;
      }

      throw createError('Perfil no encontrado', 404);
    } catch (error) {
      logger.error('Error al actualizar perfil:', error);
      throw error;
    }
  }
}

export default new UsersService();

