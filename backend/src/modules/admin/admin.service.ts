import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export class AdminService {
  /**
   * Obtener métricas del dashboard administrativo
   */
  async getDashboardMetrics() {
    try {
      // Total de consultas
      const totalConsultations = await prisma.consultation.count();

      // Total de ingresos (suma de todos los pagos completados)
      const totalPayments = await prisma.payment.aggregate({
        where: {
          status: 'PAID',
        },
        _sum: {
          amount: true,
        },
      });

      // Total de comisiones (suma de fees de todos los pagos completados)
      const totalCommissions = await prisma.payment.aggregate({
        where: {
          status: 'PAID',
        },
        _sum: {
          fee: true,
        },
      });

      // Médicos activos (médicos con estadoOnline = true)
      const activeDoctors = await prisma.doctor.count({
        where: {
          estadoOnline: true,
        },
      });

      // Total de médicos registrados
      const totalDoctors = await prisma.doctor.count();

      // Solicitudes pendientes
      const pendingSignupRequests = await prisma.doctorSignupRequest.count({
        where: {
          status: 'PENDING',
        },
      });

      // Consultas activas (status = 'ACTIVE')
      const activeConsultations = await prisma.consultation.count({
        where: {
          status: 'ACTIVE',
        },
      });

      // Consultas del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const consultationsThisMonth = await prisma.consultation.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Ingresos del mes actual
      const paymentsThisMonth = await prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // Comisiones del mes actual
      const commissionsThisMonth = await prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          fee: true,
        },
      });

      return {
        totalConsultations,
        activeConsultations,
        consultationsThisMonth,
        totalEarnings: totalPayments._sum.amount || 0,
        monthlyEarnings: paymentsThisMonth._sum.amount || 0,
        totalCommissions: totalCommissions._sum.fee || 0,
        monthlyCommissions: commissionsThisMonth._sum.fee || 0,
        activeDoctors,
        totalDoctors,
        pendingSignupRequests,
      };
    } catch (error) {
      logger.error('Error al obtener métricas del dashboard administrativo:', error);
      throw createError('Error al obtener métricas administrativas', 500);
    }
  }

  /**
   * Obtener todas las consultas (para ADMIN)
   */
  async getAllConsultations(page?: number, limit?: number, status?: string) {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [consultations, total] = await Promise.all([
        prisma.consultation.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            doctorId: true,
            patientId: true,
            type: true,
            status: true,
            price: true,
            paymentId: true,
            source: true,
            consultationAttemptId: true,
            createdAt: true,
            updatedAt: true,
            startedAt: true,
            endedAt: true,
            doctor: {
              select: {
                id: true,
                name: true,
                speciality: true,
              },
            },
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                fee: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.consultation.count({ where }),
      ]);

      return {
        data: consultations,
        pagination: page && limit
          ? {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Error al obtener consultas administrativas:', error);
      throw createError('Error al obtener consultas', 500);
    }
  }

  /**
   * Obtener todos los médicos (para ADMIN)
   */
  async getAllDoctors(page?: number, limit?: number) {
    try {
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit;

      // FIX P2022: select explícito - solo columnas presentes en migraciones
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
            _count: { select: { consultations: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.doctor.count(),
      ]);

      return {
        data: doctors,
        pagination: page && limit
          ? {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Error al obtener médicos administrativos:', error);
      throw createError('Error al obtener médicos', 500);
    }
  }
}

export default new AdminService();

