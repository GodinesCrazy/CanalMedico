import { Response, NextFunction } from 'express';
import payoutService from './payout.service';
import { AuthenticatedRequest } from '@/types';
import { createError } from '@/middlewares/error.middleware';
import prisma from '@/database/prisma';

export class PayoutController {
    /**
     * Obtener liquidaciones del médico autenticado
     */
    async getMyPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user) {
                throw createError('No autenticado', 401);
            }

            // Obtener el doctor asociado al usuario
            const doctor = await prisma.doctor.findUnique({
                where: { userId: user.id }
            });

            if (!doctor) {
                throw createError('Médico no encontrado', 404);
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await payoutService.getDoctorPayouts(doctor.id, page, limit);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener estadísticas de pagos del médico autenticado
     */
    async getMyPayoutStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user) {
                throw createError('No autenticado', 401);
            }

            const doctor = await prisma.doctor.findUnique({
                where: { userId: user.id }
            });

            if (!doctor) {
                throw createError('Médico no encontrado', 404);
            }

            const stats = await payoutService.getDoctorPayoutStats(doctor.id);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener detalle de una liquidación específica
     */
    async getPayoutDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { batchId } = req.params;
            const detail = await payoutService.getPayoutBatchDetail(batchId);

            res.json({
                success: true,
                data: detail,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Procesar liquidaciones mensuales (solo admin)
     */
    async processMonthlyPayouts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const results = await payoutService.processMonthlyPayouts();

            res.json({
                success: true,
                message: `Procesadas ${results.length} liquidaciones`,
                data: results,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Crear liquidación manual para un médico específico (solo admin)
     */
    async createPayoutBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const { doctorId } = req.params;
            const batch = await payoutService.createPayoutBatch(doctorId);

            if (!batch) {
                res.json({
                    success: true,
                    message: 'No hay pagos pendientes para liquidar',
                    data: null,
                });
            } else {
                res.json({
                    success: true,
                    message: 'Liquidación creada exitosamente',
                    data: batch,
                });
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new PayoutController();
