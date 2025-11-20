import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { execSync } from 'child_process';

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
        description: 'Servidor de producción',
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
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.js'),
    path.join(__dirname, '../modules/**/*.controller.js'),
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.controller.ts'),
  ],
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

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'CanalMedico API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Health check
app.get('/health', (_req, res) => {
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

// Función para ejecutar migraciones
async function runMigrations() {
  try {
    logger.info('🔄 Ejecutando migraciones de la base de datos...');
    
    // Intentar ejecutar migraciones (para producción, cuando ya hay migraciones creadas)
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        env: process.env,
      });
      logger.info('✅ Migraciones ejecutadas correctamente');
    } catch (migrateError) {
      // Si no hay migraciones o fallan, intentar con db push (sincroniza el schema directamente)
      logger.warn('⚠️ No se pudieron aplicar migraciones con migrate deploy, intentando db push...');
      logger.warn('💡 Esto sincronizará el schema directamente con la base de datos');
      
      try {
        execSync('npx prisma db push --accept-data-loss', {
          stdio: 'pipe',
          env: process.env,
        });
        logger.info('✅ Schema sincronizado correctamente con db push');
      } catch (pushError) {
        logger.error('❌ Error al sincronizar el schema:', pushError);
        throw pushError;
      }
    }
  } catch (error: any) {
    logger.error('❌ Error al ejecutar migraciones:', error.message || error);
    // En producción, si fallan las migraciones, el servidor no debe iniciar
    if (env.NODE_ENV === 'production') {
      logger.error('⚠️ En producción, el servidor no puede iniciar sin migraciones exitosas');
      process.exit(1);
    } else {
      logger.warn('⚠️ Continuando en modo desarrollo aunque las migraciones fallaron');
    }
  }
}

// Función para iniciar el servidor
async function startServer() {
  try {
    // Ejecutar migraciones antes de iniciar el servidor
    await runMigrations();
    
    // Verificar variables temporales y mostrar advertencias
    if (env.STRIPE_SECRET_KEY.includes('temporal_placeholder')) {
      logger.warn('⚠️ STRIPE_SECRET_KEY está usando un valor temporal. Configura tu clave real de Stripe.');
    }
    if (env.AWS_ACCESS_KEY_ID.includes('TEMPORAL_PLACEHOLDER')) {
      logger.warn('⚠️ Variables de AWS están usando valores temporales. Configura tus credenciales reales de AWS.');
    }
    if (env.FRONTEND_WEB_URL === 'http://localhost:5173') {
      logger.warn('⚠️ FRONTEND_WEB_URL está usando un valor temporal. Configura la URL real de tu frontend web.');
    }
    if (env.MOBILE_APP_URL === 'http://localhost:8081') {
      logger.warn('⚠️ MOBILE_APP_URL está usando un valor temporal. Configura la URL real de tu aplicación móvil.');
    }
    
    // Usar PORT de Railway si está disponible, sino usar env.PORT
    // Railway asigna PORT como string, necesitamos convertirlo a número
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;
    
    // Conectar a la base de datos antes de iniciar el servidor
    try {
      await prisma.$connect();
      logger.info('✅ Conexión a la base de datos establecida');
    } catch (dbError) {
      logger.error('❌ Error al conectar a la base de datos:', dbError);
      if (env.NODE_ENV === 'production') {
        logger.error('⚠️ En producción, el servidor no puede iniciar sin conexión a la base de datos');
        process.exit(1);
      } else {
        logger.warn('⚠️ Continuando en modo desarrollo aunque la conexión falló');
      }
    }
    
    // Iniciar servidor HTTP
    httpServer.listen(port, '0.0.0.0', () => {
      logger.info(`🚀 Servidor corriendo en puerto ${port}`);
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

