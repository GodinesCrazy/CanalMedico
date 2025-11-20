import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import env from '@/config/env';
import logger from '@/config/logger';
import prisma from '@/database/prisma';

// Middlewares
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { generalRateLimiter } from '@/middlewares/rateLimit.middleware';

// Routes
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import doctorsRoutes from '@/modules/doctors/doctors.routes';
import patientsRoutes from '@/modules/patients/patients.routes';
import consultationsRoutes from '@/modules/consultations/consultations.routes';
import messagesRoutes from '@/modules/messages/messages.routes';
import paymentsRoutes from '@/modules/payments/payments.routes';
import filesRoutes from '@/modules/files/files.routes';
import notificationsRoutes from '@/modules/notifications/notifications.routes';

// Socket service
import socketService from '@/modules/chats/socket.service';

const app: Application = express();
const httpServer = createServer(app);

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CanalMedico API',
      version: '1.0.0',
      description: 'API para la plataforma de consultas médicas asíncronas CanalMedico',
      contact: {
        name: 'CanalMedico Support',
        email: 'support@canalmedico.com',
      },
    },
    servers: [
      {
        url: env.API_URL,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/**/*.routes.ts', './src/**/*.controller.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares globales
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_WEB_URL, env.MOBILE_APP_URL, 'http://localhost:5173', 'http://localhost:19000'],
    credentials: true,
  })
);
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializar Socket.io
socketService.initialize(httpServer);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    logger.info('✅ Conexión a la base de datos establecida');

    // Iniciar servidor HTTP
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Servidor corriendo en ${env.API_URL}`);
      logger.info(`📚 Documentación API disponible en ${env.API_URL}/api-docs`);
      logger.info(`🌍 Ambiente: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor HTTP cerrado');
  });
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  httpServer.close(() => {
    logger.info('Servidor HTTP cerrado');
  });
  await prisma.$disconnect();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

export default app;

