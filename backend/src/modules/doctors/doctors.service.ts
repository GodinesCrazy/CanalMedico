import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { getPaginationParams, createPaginatedResponse } from '@/utils/pagination';

export class DoctorsService {
  async getAll(page?: number, limit?: number) {
    try {
      const { skip, take } = getPaginationParams(page, limit);

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
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
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
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

      if (!doctor) {
        throw createError('Doctor no encontrado', 404);
      }

      return doctor;
    } catch (error) {
      logger.error('Error al obtener doctor:', error);
      throw error;
    }
  }

  async getOnlineDoctors() {
    try {
      const doctors = await prisma.doctor.findMany({
        where: {
          estadoOnline: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return doctors;
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

