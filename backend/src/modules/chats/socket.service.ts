import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthenticatedSocket } from '@/types';
import messagesService from '../messages/messages.service';
import logger from '@/config/logger';
import prisma from '@/database/prisma';

export class SocketService {
  private io!: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  initialize(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_WEB_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Token de autenticación requerido'));
        }

        const decoded = verifyAccessToken(token);
        (socket as AuthenticatedSocket).user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.user?.id;

      if (!userId) {
        socket.disconnect();
        return;
      }

      logger.info(`Usuario conectado: ${userId} - Socket: ${socket.id}`);

      // Guardar conexión
      this.connectedUsers.set(userId, socket.id);

      // Unirse a la sala de consulta
      socket.on('join-consultation', async (consultationId: string) => {
        socket.join(`consultation:${consultationId}`);
        logger.info(`Usuario ${userId} se unió a la consulta: ${consultationId}`);
      });

      // Dejar sala de consulta
      socket.on('leave-consultation', (consultationId: string) => {
        socket.leave(`consultation:${consultationId}`);
        logger.info(`Usuario ${userId} dejó la consulta: ${consultationId}`);
      });

      // Nuevo mensaje
      socket.on('new-message', async (data: any) => {
        try {
          // Seguridad: mapear userId -> doctorId/patientId de la consulta para evitar suplantación
          const consultation = await prisma.consultation.findUnique({
            where: { id: data.consultationId },
            include: {
              doctor: { select: { id: true, userId: true } },
              patient: { select: { id: true, userId: true } },
            },
          });

          if (!consultation) {
            throw new Error('Consulta no encontrada');
          }

          let senderConsultationId: string | null = null;
          if (consultation.doctor?.userId === userId) {
            senderConsultationId = consultation.doctor.id;
          } else if (consultation.patient?.userId === userId) {
            senderConsultationId = consultation.patient.id;
          } else {
            throw new Error('No autorizado para enviar en esta consulta');
          }

          if (!senderConsultationId) {
            throw new Error('No autorizado para enviar en esta consulta');
          }

          const message = await messagesService.create({
            consultationId: data.consultationId,
            senderId: senderConsultationId,
            text: data.text,
            fileUrl: data.fileUrl,
            audioUrl: data.audioUrl,
            pdfUrl: data.pdfUrl,
          });

          // Emitir mensaje a todos en la sala de consulta
          this.io.to(`consultation:${data.consultationId}`).emit('message-received', message);

          logger.info(`Mensaje enviado en consulta ${data.consultationId}: ${message.id}`);
        } catch (error: any) {
          logger.error('Error al enviar mensaje:', error);
          socket.emit('message-error', { error: error?.message || 'Error al enviar mensaje' });
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        if (userId) {
          this.connectedUsers.delete(userId);
          logger.info(`Usuario desconectado: ${userId}`);
        }
      });
    });

    logger.info('Socket.io inicializado');
  }

  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io no está inicializado. Llama a initialize() primero.');
    }
    return this.io;
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToConsultation(consultationId: string, event: string, data: any) {
    this.io.to(`consultation:${consultationId}`).emit(event, data);
  }
}

export default new SocketService();

