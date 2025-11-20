import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import messagesService from './messages.service';
import { validate } from '@/middlewares/validation.middleware';

const createMessageSchema = z.object({
  body: z.object({
    consultationId: z.string().min(1, 'Consultation ID requerido'),
    senderId: z.string().min(1, 'Sender ID requerido'),
    text: z.string().optional(),
    fileUrl: z.string().url().optional(),
    audioUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
  }),
});

export class MessagesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await messagesService.create(req.body);
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await messagesService.getByConsultation(req.params.consultationId);
      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await messagesService.getById(req.params.id);
      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessagesController();

export const validateCreateMessage = validate(createMessageSchema);

