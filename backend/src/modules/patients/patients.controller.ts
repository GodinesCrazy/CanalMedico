import { Request, Response, NextFunction } from 'express';
import patientsService from './patients.service';

export class PatientsController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientsService.getById(req.params.id);
      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientsService.getByUserId(req.params.userId);
      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PatientsController();

