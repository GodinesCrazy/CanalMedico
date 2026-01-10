import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';

export interface CreateMessageDto {
  consultationId: string;
  senderId: string;
  text?: string;
  fileUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;
}

export class MessagesService {
  async create(data: CreateMessageDto) {
    try {
      // Verificar que la consulta existe y está activa
      const consultation = await prisma.consultation.findUnique({
        where: { id: data.consultationId },
      });

      if (!consultation) {
        throw createError('Consulta no encontrada', 404);
      }

      // Solo permitir mensajes en consultas ACTIVAS
      if (consultation.status !== 'ACTIVE') {
        throw createError('Solo se pueden enviar mensajes en consultas activas. La consulta debe ser aceptada primero.', 400);
      }

      // Verificar que el sender es parte de la consulta
      const isDoctor = consultation.doctorId === data.senderId;
      const isPatient = consultation.patientId === data.senderId;

      if (!isDoctor && !isPatient) {
        throw createError('No tienes permiso para enviar mensajes en esta consulta', 403);
      }

      // Crear mensaje
      const message = await prisma.message.create({
        data: {
          consultationId: data.consultationId,
          senderId: data.senderId,
          text: data.text || null,
          fileUrl: data.fileUrl || null,
          audioUrl: data.audioUrl || null,
          pdfUrl: data.pdfUrl || null,
        },
        include: {
          consultation: {
            include: {
              doctor: true,
              patient: true,
            },
          },
        },
      });

      logger.info(`Mensaje creado: ${message.id} - Consulta: ${data.consultationId}`);

      return message;
    } catch (error) {
      logger.error('Error al crear mensaje:', error);
      throw error;
    }
  }

  async getByConsultation(consultationId: string) {
    try {
      const messages = await prisma.message.findMany({
        where: { consultationId },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return messages;
    } catch (error) {
      logger.error('Error al obtener mensajes:', error);
      throw error;
    }
  }

  async getById(messageId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          consultation: true,
        },
      });

      if (!message) {
        throw createError('Mensaje no encontrado', 404);
      }

      return message;
    } catch (error) {
      logger.error('Error al obtener mensaje:', error);
      throw error;
    }
  }
}

export default new MessagesService();

