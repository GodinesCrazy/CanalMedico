import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import notificationsService from './notifications.service';
import { validate } from '@/middlewares/validation.middleware';
import { AuthenticatedRequest } from '@/types';

const registerTokenSchema = z.object({
  body: z.object({
    deviceToken: z.string().min(1, 'Device token requerido'),
    platform: z.enum(['web', 'ios', 'android']).optional(),
  }),
});

const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID requerido'),
    title: z.string().min(1, 'Título requerido'),
    body: z.string().min(1, 'Cuerpo requerido'),
    data: z.record(z.any()).optional(),
  }),
});

export class NotificationsController {
  async registerToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const token = await notificationsService.registerToken(
        req.user.id,
        req.body.deviceToken,
        req.body.platform
      );

      res.json({
        success: true,
        data: token,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.sendPushNotification(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationsController();

export const validateRegisterToken = validate(registerTokenSchema);
export const validateSendNotification = validate(sendNotificationSchema);

