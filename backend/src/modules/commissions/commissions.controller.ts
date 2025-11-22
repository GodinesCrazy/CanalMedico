import { Response, NextFunction } from 'express';
import commissionsService from './commissions.service';
import { AuthenticatedRequest } from '@/types';
import { createError } from '@/middlewares/error.middleware';

export class CommissionsController {
    /**
     * Obtener estadísticas generales de comisiones
     */
    async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const stats = await commissionsService.getCommissionsStats();

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener comisiones por período
     */
    async getByPeriod(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                throw createError('Se requieren startDate y endDate', 400);
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            const result = await commissionsService.getCommissionsByPeriod(start, end);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener comisiones por médico
     */
    async getByDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const { startDate, endDate } = req.query;

            let start, end;
            if (startDate && endDate) {
                start = new Date(startDate as string);
                end = new Date(endDate as string);
            }

            const result = await commissionsService.getCommissionsByDoctor(start, end);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener detalle de comisiones de un médico
     */
    async getDoctorDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const { doctorId } = req.params;
            const { startDate, endDate } = req.query;

            let start, end;
            if (startDate && endDate) {
                start = new Date(startDate as string);
                end = new Date(endDate as string);
            }

            const result = await commissionsService.getDoctorCommissionsDetail(doctorId, start, end);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Obtener comisiones mensuales
     */
    async getMonthly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                throw createError('No autorizado', 403);
            }

            const result = await commissionsService.getMonthlyCommissions();

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new CommissionsController();
