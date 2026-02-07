import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { getPaginationParams, createPaginatedResponse } from '@/utils/pagination';
import { calculateAvailability } from '@/utils/availability';

export class DoctorsService {
  async getAll(page?: number, limit?: number) {
    try {
      const { skip, take } = getPaginationParams(page, limit);

      // FIX P2022: select explícito - solo columnas presentes en migraciones (evita P2022)
      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          skip,
          take,
          select: {
            id: true,
            userId: true,
            name: true,
            rut: true,
            speciality: true,
            horarios: true,
            tarifaConsulta: true,
            tarifaUrgencia: true,
            estadoOnline: true,
            horariosAutomaticos: true,
            payoutMode: true,
            payoutDay: true,
            bankAccountInfo: true,
            whatsappBusinessNumber: true,
            whatsappBusinessId: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: { id: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.doctor.count(),
      ]);

      return createPaginatedResponse(doctors, total, page || 1, limit || 10);
    } catch (error) {
      logger.error('Error al obtener doctores:', error);
      throw error;
    }
  }

  async getById(doctorId: string) {
    try {
      // FIX P2022: select explícito - solo columnas presentes en migraciones
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          userId: true,
          name: true,
          rut: true,
          speciality: true,
          horarios: true,
          tarifaConsulta: true,
          tarifaUrgencia: true,
          estadoOnline: true,
          horariosAutomaticos: true,
          payoutMode: true,
          payoutDay: true,
          bankAccountInfo: true,
          whatsappBusinessNumber: true,
          whatsappBusinessId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      if (!doctor) {
        throw createError('Doctor no encontrado', 404);
      }

      // Calcular disponibilidad real (siempre modo MANUAL ya que modoDisponibilidad fue eliminado)
      const isAvailable = calculateAvailability(
        'MANUAL', // Siempre modo manual (campo modoDisponibilidad eliminado)
        doctor.estadoOnline,
        (doctor as any).horariosAutomaticos
      );

      // Retornar doctor con disponibilidad calculada
      return {
        ...doctor,
        estadoOnlineCalculado: isAvailable,
      } as any;
    } catch (error) {
      logger.error('Error al obtener doctor:', error);
      throw error;
    }
  }

  async getByUserId(userId: string) {
    try {
      // FIX P2022: select explícito - solo columnas presentes en migraciones
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          name: true,
          rut: true,
          speciality: true,
          horarios: true,
          tarifaConsulta: true,
          tarifaUrgencia: true,
          estadoOnline: true,
          horariosAutomaticos: true,
          payoutMode: true,
          payoutDay: true,
          bankAccountInfo: true,
          whatsappBusinessNumber: true,
          whatsappBusinessId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      if (!doctor) {
        throw createError('Doctor no encontrado para este usuario', 404);
      }

      return doctor;
    } catch (error) {
      logger.error('Error al obtener doctor por userId:', error);
      throw error;
    }
  }

  async getOnlineDoctors() {
    try {
      // FIX P2022: select explícito - solo columnas presentes en migraciones
      const allDoctors = await prisma.doctor.findMany({
        select: {
          id: true,
          userId: true,
          name: true,
          rut: true,
          speciality: true,
          horarios: true,
          tarifaConsulta: true,
          tarifaUrgencia: true,
          estadoOnline: true,
          horariosAutomaticos: true,
          payoutMode: true,
          payoutDay: true,
          bankAccountInfo: true,
          whatsappBusinessNumber: true,
          whatsappBusinessId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filtrar solo los que están disponibles (siempre modo MANUAL)
      const onlineDoctors = allDoctors.filter((doctor) => {
        const isAvailable = calculateAvailability(
          'MANUAL', // Siempre modo manual (campo modoDisponibilidad eliminado)
          doctor.estadoOnline,
          (doctor as any).horariosAutomaticos
        );
        return isAvailable;
      });

      return onlineDoctors;
    } catch (error) {
      logger.error('Error al obtener doctores en línea:', error);
      throw error;
    }
  }

  async updateOnlineStatus(doctorId: string, estadoOnline: boolean) {
    try {
      const doctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: { estadoOnline },
      });

      return doctor;
    } catch (error) {
      logger.error('Error al actualizar estado en línea:', error);
      throw error;
    }
  }

  async updateAvailabilitySettings(
    doctorId: string,
    settings: {
      horariosAutomaticos?: string;
      estadoOnline?: boolean;
    }
  ) {
    try {
      const updateData: any = {};

      if (settings.horariosAutomaticos !== undefined) {
        updateData.horariosAutomaticos = settings.horariosAutomaticos;
      }

      // Permitir actualizar estadoOnline directamente
      if (settings.estadoOnline !== undefined) {
        updateData.estadoOnline = settings.estadoOnline;
      }

      const doctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: updateData as any,
      });

      return doctor;
    } catch (error) {
      logger.error('Error al actualizar configuración de disponibilidad:', error);
      throw error;
    }
  }

  async getCurrentAvailability(doctorId: string) {
    try {
      // FIX P2022: select explícito - solo columnas necesarias
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          estadoOnline: true,
          horariosAutomaticos: true,
        },
      });

      if (!doctor) {
        throw createError('Doctor no encontrado', 404);
      }

      const isAvailable = calculateAvailability(
        'MANUAL', // Siempre modo manual (campo modoDisponibilidad eliminado)
        doctor.estadoOnline,
        (doctor as any).horariosAutomaticos
      );

      return {
        isAvailable,
        modoDisponibilidad: 'MANUAL', // Siempre manual (campo eliminado del schema)
        estadoOnlineManual: doctor.estadoOnline,
        horariosAutomaticos: (doctor as any).horariosAutomaticos,
      };
    } catch (error) {
      logger.error('Error al obtener disponibilidad actual:', error);
      throw error;
    }
  }
  async updatePayoutSettings(doctorId: string, settings: { payoutMode: string; payoutDay: number; bankAccountInfo?: string }) {
    try {
      const doctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          payoutMode: settings.payoutMode,
          payoutDay: settings.payoutDay,
          bankAccountInfo: settings.bankAccountInfo,
        } as any,
      });
      return doctor;
    } catch (error) {
      logger.error('Error al actualizar configuración de pagos:', error);
      throw error;
    }
  }

  async getStatistics(doctorId: string) {
    try {
      const [totalConsultations, activeConsultations, totalEarnings, monthlyEarnings] = await Promise.all([
        prisma.consultation.count({
          where: { doctorId },
        }),
        prisma.consultation.count({
          where: {
            doctorId,
            status: 'ACTIVE',
          },
        }),
        prisma.payment.aggregate({
          where: {
            consultation: {
              doctorId,
            },
            status: 'PAID',
          },
          _sum: {
            netAmount: true,
          },
        }),
        prisma.payment.aggregate({
          where: {
            consultation: {
              doctorId,
            },
            status: 'PAID',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: {
            netAmount: true,
          },
        }),
      ]);

      return {
        totalConsultations,
        activeConsultations,
        totalEarnings: totalEarnings._sum.netAmount || 0,
        monthlyEarnings: monthlyEarnings._sum.netAmount || 0,
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

export default new DoctorsService();

