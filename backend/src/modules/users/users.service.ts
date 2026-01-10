import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { calculateAvailability } from '@/utils/availability';

export class UsersService {
  async getProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          doctor: true,
          patient: true,
        },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      // ADMIN no tiene profile médico ni paciente
      if (user.role === 'ADMIN') {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          profile: null, // ADMIN no tiene profile
          createdAt: user.createdAt,
        };
      }

      // Si es doctor, calcular disponibilidad automática
      let profile: any = user.doctor || user.patient;
      if (user.doctor) {
        const isAvailable = calculateAvailability(
          'MANUAL', // Siempre modo manual (campo modoDisponibilidad eliminado)
          user.doctor.estadoOnline,
          (user.doctor as any).horariosAutomaticos
        );
        profile = {
          ...user.doctor,
          estadoOnlineCalculado: isAvailable,
        };
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        profile,
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
        select: {
          id: true,
          email: true,
          role: true,
          doctor: true,
          patient: true,
        },
      });

      if (!user) {
        throw createError('Usuario no encontrado', 404);
      }

      // ADMIN solo puede actualizar email (y password a través de endpoint específico)
      if (user.role === 'ADMIN') {
        // Validar que ADMIN no intente actualizar campos médicos
        if (data.tarifaConsulta !== undefined || data.tarifaUrgencia !== undefined || 
            data.speciality !== undefined || data.horarios !== undefined || 
            data.medicalHistory !== undefined || data.age !== undefined) {
          throw createError('ADMIN no puede actualizar campos médicos o de paciente', 403);
        }

        // ADMIN puede actualizar solo email (y password en endpoint separado)
        const updateData: any = {};
        if (data.email && data.email !== user.email) {
          // Verificar que el email no esté en uso
          const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
          });
          if (existingUser && existingUser.id !== userId) {
            throw createError('El email ya está en uso', 409);
          }
          updateData.email = data.email;
        }

        if (Object.keys(updateData).length === 0) {
          // No hay cambios, devolver usuario actual
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: null,
          };
        }

        const updated = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        return {
          id: updated.id,
          email: updated.email,
          role: updated.role,
          profile: null,
        };
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

