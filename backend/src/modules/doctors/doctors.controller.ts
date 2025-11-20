import { Request, Response, NextFunction } from 'express';
import doctorsService from './doctors.service';
import { AuthenticatedRequest } from '@/types';

export class DoctorsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await doctorsService.getAll(page, limit);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorsService.getById(req.params.id);
      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOnlineDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await doctorsService.getOnlineDoctors();
      res.json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOnlineStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const { estadoOnline } = req.body;
      const doctor = await doctorsService.updateOnlineStatus(req.params.id, estadoOnline);
      res.json({
        success: true,
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const statistics = await doctorsService.getStatistics(req.params.id);
      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorsController();

