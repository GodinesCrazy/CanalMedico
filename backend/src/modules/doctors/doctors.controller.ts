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

  async getOnlineDoctors(_req: Request, res: Response, next: NextFunction) {
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

      // Validar que el usuario solo puede actualizar su propio estado
      const doctor = await doctorsService.getById(req.params.id);
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para actualizar este perfil' });
        return;
      }

      const { estadoOnline } = req.body;
      const updatedDoctor = await doctorsService.updateOnlineStatus(req.params.id, estadoOnline);
      res.json({
        success: true,
        data: updatedDoctor,
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

      // Validar que el usuario solo puede ver sus propias estadísticas
      const doctor = await doctorsService.getById(req.params.id);
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para ver estas estadísticas' });
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

  async updatePayoutSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede actualizar su propia configuración
      const doctor = await doctorsService.getById(req.params.id);
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para actualizar esta configuración' });
        return;
      }

      const { payoutMode, payoutDay, bankAccountInfo } = req.body;
      const updatedDoctor = await doctorsService.updatePayoutSettings(
        req.params.id,
        { payoutMode, payoutDay, bankAccountInfo }
      );

      res.json({
        success: true,
        data: updatedDoctor,
        message: 'Configuración de pago actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvailabilitySettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede actualizar su propia configuración
      const doctor = await doctorsService.getById(req.params.id);
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para actualizar esta configuración' });
        return;
      }

      const { modoDisponibilidad, horariosAutomaticos, estadoOnline } = req.body;
      const updatedDoctor = await doctorsService.updateAvailabilitySettings(req.params.id, {
        modoDisponibilidad,
        horariosAutomaticos,
        estadoOnline,
      });

      res.json({
        success: true,
        data: updatedDoctor,
        message: 'Configuración de disponibilidad actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      // Validar que el usuario solo puede ver su propia disponibilidad
      const doctor = await doctorsService.getById(req.params.id);
      if (doctor.userId !== req.user.id) {
        res.status(403).json({ error: 'No tienes permiso para ver esta información' });
        return;
      }

      const availability = await doctorsService.getCurrentAvailability(req.params.id);
      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DoctorsController();

