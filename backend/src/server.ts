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
import snreRoutes from '@/modules/snre/snre.routes';

// Socket service
import socketService from '@/modules/chats/socket.service';

const app: Application = express();
const httpServer = createServer(app);

// ============================================================================
// CRÍTICO RAILWAY: /health debe estar ANTES de middlewares pesados
// ============================================================================
// Health check - DEBE responder instantáneamente incluso si DB está caída
// Railway hace healthcheck ANTES de que el servidor termine de iniciar
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});
logger.info('[BOOT] Health route mounted at /health');

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
    path.join(__dirname, './modules/**/*.routes.js'),
    path.join(__dirname, './modules/**/*.controller.js'),
    path.join(process.cwd(), 'src/modules/**/*.routes.ts'),
    path.join(process.cwd(), 'src/modules/**/*.controller.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares globales
// Configurar trust proxy para Railway (necesario para rate limiting y proxies reversos)
// Usar 1 en lugar de true para evitar ERR_ERL_PERMISSIVE_TRUST_PROXY
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: [
      env.FRONTEND_WEB_URL,
      env.MOBILE_APP_URL,
      'http://localhost:5173',
      'http://localhost:19000',
      'http://192.168.4.43:5173',
      'http://192.168.4.43:8081',
      'http://192.168.4.43:19000',
      'https://canalmedico-web-production.up.railway.app'
    ],
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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/doctors', doctorsRoutes);
import doctorRoutes from './modules/doctor/doctor.routes';
app.use('/api/doctor', doctorRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Importar rutas de payouts
import payoutsRoutes from './modules/payouts/payout.routes';
app.use('/api/payouts', payoutsRoutes);

// Importar rutas de comisiones
import commissionsRoutes from './modules/commissions/commissions.routes';
app.use('/api/commissions', commissionsRoutes);

// Importar rutas de seed (solo para desarrollo/pruebas)
import seedRoutes from './modules/seed/seed.routes';
app.use('/api/seed', seedRoutes);
logger.info('[SEED] Seed routes mounted at /api/seed');

// Importar rutas de solicitudes de registro
import signupRequestsRoutes from './modules/signup-requests/signup-requests.routes';
app.use('/api/signup-requests', signupRequestsRoutes);

// Importar rutas de recetas SNRE
app.use('/api/prescriptions', snreRoutes);

// Importar rutas administrativas
import adminRoutes from './modules/admin/admin.routes';
app.use('/api/admin', adminRoutes);

// Importar rutas de deploy (información de deploy)
import deployRoutes from './modules/deploy/deploy.routes';
app.use('/api/deploy', deployRoutes);
logger.info('[DEPLOY] Deploy routes mounted at /api/deploy');

// Importar rutas de verificación de médicos
import doctorVerificationRoutes, { doctorVerificationAdminRoutes } from './modules/doctor-verification/doctor-verification.routes';
app.use('/api/medicos', doctorVerificationRoutes);
app.use('/api/admin/doctor-verification', doctorVerificationAdminRoutes);

// Módulos opcionales se cargan dinámicamente (ver loadOptionalModules)
// Esto permite que el backend compile y arranque incluso si módulos opcionales no están disponibles

// Importar job de liquidaciones mensuales
import { startPayoutJob } from './jobs/payout.job';

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
      const migrateOutput = execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        env: process.env,
        encoding: 'utf-8',
      });
      logger.info('✅ Migraciones ejecutadas correctamente');
      if (migrateOutput && migrateOutput.trim()) {
        logger.info('Output:', migrateOutput.trim());
      }
    } catch (migrateError: any) {
      // Si no hay migraciones o fallan, intentar con db push (sincroniza el schema directamente)
      logger.warn('⚠️ No se pudieron aplicar migraciones con migrate deploy, intentando db push...');
      logger.warn('💡 Esto sincronizará el schema directamente con la base de datos');
      
      if (migrateError.stderr) {
        logger.debug('Error de migrate deploy:', migrateError.stderr.toString());
      }

      try {
        // Usar db push SIN --skip-generate para que Prisma regenere el cliente automáticamente
        // Esto asegura que los nuevos campos (price, startedAt, endedAt) estén disponibles
        const pushOutput = execSync('npx prisma db push --accept-data-loss', {
          stdio: 'pipe',
          env: process.env,
          encoding: 'utf-8',
        });
        logger.info('✅ Schema sincronizado correctamente con db push');
        if (pushOutput && pushOutput.trim()) {
          logger.info('Output:', pushOutput.trim());
        }
        
        // Regenerar Prisma Client explícitamente para asegurar que incluye los nuevos campos
        // (aunque db push sin --skip-generate ya lo hace, es bueno ser explícito)
        logger.info('🔄 Regenerando Prisma Client...');
        execSync('npx prisma generate', {
          stdio: 'pipe',
          env: process.env,
          encoding: 'utf-8',
        });
        logger.info('✅ Prisma Client regenerado correctamente');
      } catch (pushError: any) {
        logger.error('❌ Error al sincronizar el schema:');
        if (pushError.stdout) {
          logger.error('stdout:', pushError.stdout.toString());
        }
        if (pushError.stderr) {
          logger.error('stderr:', pushError.stderr.toString());
        }
        throw pushError;
      }
    }
  } catch (error: any) {
    logger.error('❌ Error al ejecutar migraciones:', error.message || error);
    // En producción, logueamos el error pero permitimos que el servidor inicie
    // para que el healthcheck pase y podamos diagnosticar mejor
    if (env.NODE_ENV === 'production') {
      logger.error('⚠️ ADVERTENCIA: El servidor iniciará sin migraciones exitosas');
      logger.error('⚠️ La aplicación puede no funcionar correctamente');
    } else {
      logger.warn('⚠️ Continuando en modo desarrollo aunque las migraciones fallaron');
    }
  }
}

// Función para iniciar el servidor
// CRÍTICO RAILWAY: listen() DEBE ejecutarse ANTES de lógica pesada para que /health responda
async function startServer() {
  try {
    logger.info('='.repeat(60));
    logger.info('[BOOT] Starting CanalMedico backend...');
    logger.info(`[BOOT] NODE_ENV: ${env.NODE_ENV}`);
    
    // CRÍTICO RAILWAY: PORT debe venir de process.env.PORT (Railway lo asigna dinámicamente)
    // Si no está, usar env.PORT (default 3000 para desarrollo)
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : (env.PORT || 3000);
    
    if (!port || isNaN(port) || port <= 0) {
      logger.error(`[BOOT] Invalid PORT: ${port}`);
      throw new Error(`Invalid PORT: ${port}. PORT must be a positive number.`);
    }
    
    logger.info(`[BOOT] PORT env detected: ${process.env.PORT || 'not set'}`);
    logger.info(`[BOOT] Using port: ${port}`);
    logger.info(`[BOOT] Health route mounted at /health`);
    logger.info('='.repeat(60));

    // ============================================================================
    // CRÍTICO: Hacer listen() INMEDIATAMENTE para que /health responda instantáneamente
    // Railway hace healthcheck inmediatamente, NO puede esperar migraciones/DB
    // ============================================================================
    
    return new Promise<void>((resolve, reject) => {
      httpServer.listen(port, '0.0.0.0', () => {
        logger.info('='.repeat(60));
        logger.info(`[BOOT] Server listening on 0.0.0.0:${port}`);
        logger.info(`[BOOT] Health check available at http://0.0.0.0:${port}/health`);
        logger.info('='.repeat(60));
        
        // Ahora que el servidor está escuchando, ejecutar lógica pesada en background
        // NO bloquea el healthcheck - Railway ya puede hacer healthcheck
        initializeBackend()
          .then(() => {
            logger.info('[BOOT] Backend initialization completed');
            resolve();
          })
          .catch((error) => {
            logger.error('[BOOT] Backend initialization failed (running in degraded mode):', error?.message || error);
            // No rechazamos la promesa - servidor sigue arriba en modo degraded
            logger.warn('[BOOT] Server is running in DEGRADED mode - /health still works');
            resolve();
          });
      });
      
      httpServer.on('error', (error: any) => {
        logger.error('[BOOT] Server listen error:', error);
        if (error.code === 'EADDRINUSE') {
          logger.error(`[BOOT] Port ${port} is already in use`);
        }
        reject(error);
      });
    });
  } catch (error: any) {
    logger.error('[BOOT] Fatal error starting server:', error?.message || error);
    // No salimos inmediatamente para permitir logs
    setTimeout(() => process.exit(1), 1000);
    throw error;
  }
}

// Función para inicializar backend (migraciones, DB, bootstrap)
// Se ejecuta DESPUÉS de que el servidor ya está escuchando (NO bloquea /health)
async function initializeBackend() {
  try {
    logger.info('[BOOT] Initializing backend services...');

    // Log de versión y commit hash para validar deploy
    const { getDeployInfo } = await import('./modules/deploy/deploy.service');
    const deployInfo = getDeployInfo();
    
    logger.info('='.repeat(60));
    logger.info('[DEPLOY] CanalMedico Backend');
    logger.info(`[DEPLOY] Version: ${deployInfo.version}`);
    logger.info(`[DEPLOY] Commit: ${deployInfo.commitHash}`);
    logger.info(`[DEPLOY] Environment: ${deployInfo.environment}`);
    logger.info(`[DEPLOY] Node Version: ${deployInfo.nodeVersion}`);
    logger.info(`[DEPLOY] Build Timestamp: ${deployInfo.buildTimestamp}`);
    logger.info(`[DEPLOY] Deploy Timestamp: ${deployInfo.deployTimestamp}`);
    logger.info(`[DEPLOY] API URL: ${env.API_URL}`);
    logger.info('='.repeat(60));

    // Ejecutar migraciones (NO bloqueante para /health)
    logger.info('[BOOT] Starting database migrations...');
    try {
      await runMigrations();
      logger.info('[BOOT] Database migrations completed');
    } catch (migrateError: any) {
      logger.error('[BOOT] Database migrations failed (degraded mode):', migrateError?.message || migrateError);
      logger.warn('[BOOT] Server continues without migrations - /health still works');
      // No throw - continuar en modo degraded
    }

    // Verificar variables temporales y mostrar advertencias
    if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.includes('temporal_placeholder')) {
      logger.warn('[BOOT] STRIPE_SECRET_KEY está usando un valor temporal.');
    }

    // Conectar a la base de datos (NO bloqueante para /health)
    logger.info('[BOOT] Connecting to database...');
    try {
      await prisma.$connect();
      logger.info('[BOOT] Database connection established');
    } catch (dbError: any) {
      logger.error('[BOOT] Database connection failed (degraded mode):', dbError?.message || dbError);
      logger.warn('[BOOT] Server continues without database - /health still works');
      logger.warn('[BOOT] API endpoints may not work correctly without database');
      // No throw - continuar en modo degraded
    }

    // RESET FORZADO ADMIN (TEMPORAL) - SOLO si FORCE_ADMIN_PASSWORD_RESET=true
    // ⚠️ Este código debe eliminarse después de usar en producción
    if (process.env.FORCE_ADMIN_PASSWORD_RESET === 'true') {
      try {
        logger.info('[BOOT] Executing forced admin password reset...');
        const { forceAdminPasswordReset } = await import('@/bootstrap/forceAdminReset');
        await forceAdminPasswordReset();
        logger.info('[BOOT] Forced admin password reset completed');
      } catch (forceResetError: any) {
        logger.error('[BOOT] Forced admin password reset failed:', forceResetError?.message || forceResetError);
        logger.warn('[BOOT] Server continues without forced admin reset');
        // No bloquear
      }
    }

    // Bootstrap: Crear admin de pruebas si está habilitado
    // IMPORTANTE: Se ejecuta SIEMPRE si ENABLE_TEST_ADMIN=true, incluso en producción
    // NO se verifica NODE_ENV. El único control es ENABLE_TEST_ADMIN.
    if (process.env.ENABLE_TEST_ADMIN === 'true') {
      try {
        logger.info('[BOOT] Executing test admin bootstrap...');
        const { bootstrapTestAdmin } = await import('@/bootstrap/admin');
        await bootstrapTestAdmin();
        logger.info('[BOOT] Test admin bootstrap completed');
      } catch (bootstrapError: any) {
        logger.error('[BOOT] Test admin bootstrap failed:', bootstrapError?.message || bootstrapError);
        logger.warn('[BOOT] Server continues without test admin');
        // No bloquear
      }
    }

    // Cargar módulos opcionales (WhatsApp, etc.)
    // IMPORTANTE: Usa require() dinámico, TypeScript NO analiza estos módulos durante la compilación
    if (process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true') {
      try {
        logger.info('[BOOT] Loading optional modules...');
        const { loadOptionalModules } = await import('@/bootstrap/loadOptionalModules');
        await loadOptionalModules(app);
        logger.info('[BOOT] Optional modules loaded');
      } catch (modulesError: any) {
        logger.warn('[BOOT] Optional modules failed to load:', modulesError?.message || modulesError);
        logger.warn('[BOOT] Server continues without optional modules');
        // No bloquear
      }
    }

    // Iniciar job de liquidaciones mensuales
    try {
      startPayoutJob();
      logger.info('[BOOT] Payout job started (runs daily at 00:00)');
    } catch (jobError: any) {
      logger.error('[BOOT] Payout job failed to start:', jobError?.message || jobError);
      logger.warn('[BOOT] Server continues without payout job');
      // No bloquear
    }

    logger.info('[BOOT] Backend initialization completed successfully');
  } catch (error: any) {
    logger.error('[BOOT] Backend initialization error:', error?.message || error);
    logger.warn('[BOOT] Server continues in DEGRADED mode - /health still works');
    // NO throw - servidor sigue arriba en modo degraded
    // El healthcheck debe funcionar incluso si la inicialización falla
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

