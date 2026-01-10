import { Response, NextFunction } from 'express';
import adminService from './admin.service';
import { AuthenticatedRequest } from '@/types';
import { createError } from '@/middlewares/error.middleware';

export class AdminController {
  /**
   * GET /api/admin/dashboard-metrics
   * Obtener métricas del dashboard administrativo
   */
  async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw createError('No autorizado. Solo ADMIN puede acceder a este endpoint', 403);
      }

      const metrics = await adminService.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/consultations
   * Obtener todas las consultas (solo ADMIN)
   */
  async getAllConsultations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw createError('No autorizado. Solo ADMIN puede acceder a este endpoint', 403);
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await adminService.getAllConsultations(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/doctors
   * Obtener todos los médicos (solo ADMIN)
   */
  async getAllDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw createError('No autorizado. Solo ADMIN puede acceder a este endpoint', 403);
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await adminService.getAllDoctors(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();

