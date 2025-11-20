import admin from 'firebase-admin';
import env from '@/config/env';
import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import { NotificationPayload } from '@/types';
import socketService from '../chats/socket.service';

// Inicializar Firebase Admin
let firebaseApp: admin.app.App | null = null;

if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    logger.info('Firebase Admin inicializado correctamente');
  } catch (error) {
    logger.error('Error al inicializar Firebase Admin:', error);
  }
}

export class NotificationsService {
  async registerToken(userId: string, deviceToken: string, platform?: string) {
    try {
      const token = await prisma.notificationToken.upsert({
        where: { deviceToken },
        update: {
          userId,
          platform,
          updatedAt: new Date(),
        },
        create: {
          userId,
          deviceToken,
          platform,
        },
      });

      logger.info(`Token de notificación registrado: ${userId} - ${platform}`);
      return token;
    } catch (error) {
      logger.error('Error al registrar token:', error);
      throw error;
    }
  }

  async sendPushNotification(payload: NotificationPayload) {
    try {
      // Obtener tokens del usuario
      const tokens = await prisma.notificationToken.findMany({
        where: { userId: payload.userId },
      });

      if (tokens.length === 0) {
        logger.info(`No hay tokens registrados para el usuario: ${payload.userId}`);
        return { sent: 0 };
      }

      const deviceTokens = tokens.map((t) => t.deviceToken);

      if (!firebaseApp) {
        // Fallback a notificación en tiempo real vía Socket.io
        socketService.emitToUser(payload.userId, 'notification', {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        });
        return { sent: deviceTokens.length, method: 'socket' };
      }

      // Enviar notificación push con FCM
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([key, value]) => [key, String(value)])
        ) : undefined,
        tokens: deviceTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Eliminar tokens inválidos
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(deviceTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await prisma.notificationToken.deleteMany({
          where: {
            deviceToken: {
              in: invalidTokens,
            },
          },
        });
      }

      logger.info(`Notificación enviada: ${response.successCount}/${deviceTokens.length} - Usuario: ${payload.userId}`);

      return {
        sent: response.successCount,
        failed: response.failureCount,
        method: 'fcm',
      };
    } catch (error) {
      logger.error('Error al enviar notificación push:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: Omit<NotificationPayload, 'userId'>) {
    try {
      const results = await Promise.allSettled(
        userIds.map((userId) =>
          this.sendPushNotification({
            ...payload,
            userId,
          })
        )
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { sent, failed, total: userIds.length };
    } catch (error) {
      logger.error('Error al enviar notificaciones múltiples:', error);
      throw error;
    }
  }
}

export default new NotificationsService();

