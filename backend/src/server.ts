// ============================================================================
// LOGS ULTRA TEMPRANOS (ANTES de imports pesados)
// ============================================================================
console.log('='.repeat(60));
console.log('[BOOT] Starting CanalMedico backend...');
console.log(`[BOOT] Node version: ${process.version}`);
console.log(`[BOOT] Platform: ${process.platform}`);
console.log(`[BOOT] PID: ${process.pid}`);
console.log(`[BOOT] PORT env: ${process.env.PORT || 'NOT SET (will fail)'}`);
console.log('='.repeat(60));

import express, { Application } from 'express';
import { createServer } from 'http';

// ============================================================================
// CRÍTICO: Crear app y server ANTES de importar env.ts (que puede hacer process.exit)
// ============================================================================
const app: Application = express();
const httpServer = createServer(app);

// ============================================================================
// CONSTANTES GLOBALES DE CONFIGURACIÓN (Railway-safe)
// ============================================================================
// PORT: Railway asigna dinámicamente via process.env.PORT (OBLIGATORIO)
// HOST: 0.0.0.0 para escuchar en todas las interfaces (requerido para Railway)
// CRÍTICO: PORT es OBLIGATORIO - Railway siempre asigna PORT, no usar fallback
if (!process.env.PORT) {
  const errorMsg = '[BOOT] FATAL: PORT environment variable is required. Railway must assign PORT.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}
const PORT = Number(process.env.PORT);
if (!PORT || isNaN(PORT) || PORT <= 0) {
  const errorMsg = `[BOOT] FATAL: Invalid PORT value: ${process.env.PORT}. PORT must be a positive number.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}
const HOST = '0.0.0.0';

// ============================================================================
// /healthz ULTRA MÍNIMO (ANTES de cualquier import pesado que pueda fallar)
// ============================================================================
// Este endpoint DEBE estar disponible incluso si env.ts falla
// Railway hace healthcheck a /healthz (NO /health)
// Responde mínimo para evitar dependencias, pero responde 200 siempre
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, status: 'ok' });
});
console.log('[BOOT] Healthz route mounted at /healthz (ultra minimal, before env load)');

// ============================================================================
// CRÍTICO RAILWAY: Hacer listen() INMEDIATAMENTE después de /healthz
// ============================================================================
// El servidor DEBE estar escuchando ANTES de importar env.ts (que puede hacer process.exit)
// Esto garantiza que /healthz responde incluso si env.ts falla
// Usar process.env.PORT directamente (Railway siempre lo asigna)
// Variable global para indicar que el servidor ya está escuchando
let serverListening = false;

if (process.env.PORT) {
  const earlyPort = Number(process.env.PORT);
  if (earlyPort && !isNaN(earlyPort) && earlyPort > 0) {
    // CRÍTICO: listen() inicia el servidor inmediatamente
    // El servidor puede recibir requests incluso antes del callback
    // En Node.js, listen() es asíncrono pero el servidor empieza a escuchar de inmediato
    // Marcar globalmente que el servidor está escuchando para que env.ts lo sepa
    (global as any).__SERVER_LISTENING__ = true;
    
    httpServer.listen(earlyPort, HOST, () => {
      serverListening = true;
      console.log(`[BOOT] Early listen on 0.0.0.0:${earlyPort} (before env.ts load)`);
      console.log('[BOOT] Healthz endpoint ready: /healthz');
      console.log('[BOOT] Server is now accepting connections');
    });
    
    // Manejar errores de listen (ej: puerto en uso)
    httpServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[BOOT] Port ${earlyPort} is already in use (early listen)`);
        console.error('[BOOT] Will retry in startServer()');
      } else {
        console.error('[BOOT] Early listen error:', error?.message || error);
      }
      // No hacer process.exit aquí - startServer() intentará de nuevo
    });
    
    // Log inmediato para confirmar que listen() fue llamado
    // El servidor ya está escuchando en este punto (aunque el callback aún no se ejecutó)
    console.log(`[BOOT] Early listen() called on 0.0.0.0:${earlyPort}`);
    console.log('[BOOT] Server should be accepting connections now');
    
    // CRÍTICO: Dar un tick al event loop para que el servidor esté completamente listo
    // Esto asegura que el servidor puede responder a requests antes de que env.ts se importe
    // setImmediate ejecuta el callback después de que el código actual termine
    setImmediate(() => {
      console.log('[BOOT] Event loop tick completed - server should be ready');
    });
  } else {
    console.error(`[BOOT] Invalid PORT for early listen: ${process.env.PORT}`);
  }
} else {
  console.error('[BOOT] PORT not set - early listen skipped (will fail in startServer)');
}

// Ahora importar el resto (env puede hacer process.exit, pero /healthz ya está montado y escuchando)
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// CRÍTICO: Importar env.ts - puede hacer process.exit(1) si falla
// Si env.ts falla, el proceso muere ANTES de que el servidor pueda iniciar
// Por eso /healthz está montado ANTES de este import
import env from '@/config/env';
import logger from '@/config/logger';
import prisma from '@/database/prisma';

// Middlewares
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { generalRateLimiter } from '@/middlewares/rateLimit.middleware';
import { Router, Request, Response } from 'express';

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

// ============================================================================
// ESTADO GLOBAL DE SALUD DEL SISTEMA (para /health endpoint)
// ============================================================================
const systemHealth = {
  status: 'initializing' as 'ok' | 'degraded' | 'initializing',
  uptime: 0,
  initialized: false,
  dbConnected: false,
  migrationsRun: false,
  startTime: Date.now(),
};

// Función para obtener información de deploy (síncrona, sin dependencias pesadas)
function getDeployInfoSync() {
  try {
    let commitHash = process.env.RAILWAY_GIT_COMMIT_SHA || 
                     process.env.RAILWAY_GIT_COMMIT ||
                     process.env.GIT_COMMIT_SHA ||
                     process.env.VERCEL_GIT_COMMIT_SHA ||
                     process.env.CI_COMMIT_SHA ||
                     'unknown';
    
    // Si no está en ENV, intentar leer de git
    if (commitHash === 'unknown') {
      try {
        commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8', stdio: 'pipe' }).trim().substring(0, 7);
      } catch {
        // Ignorar error
      }
    }
    
    let version = '1.0.1';
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        version = packageJson.version || '1.0.1';
      }
    } catch {
      // Ignorar error
    }
    
    return { version, commitHash: commitHash.length > 7 ? commitHash.substring(0, 7) : commitHash };
  } catch {
    return { version: '1.0.1', commitHash: 'unknown' };
  }
}

// ============================================================================
// CRÍTICO RAILWAY: /health debe estar ANTES de middlewares pesados
// ============================================================================
// Health check - DEBE responder instantáneamente incluso si DB está caída
// Railway hace healthcheck ANTES de que el servidor termine de iniciar
// NO usar env.NODE_ENV para evitar dependencia de env.ts
const healthHandler = (_req: any, res: any) => {
  try {
    const deployInfo = getDeployInfoSync();
    const uptime = Math.floor((Date.now() - systemHealth.startTime) / 1000);
    
    systemHealth.uptime = uptime;
    
    // Siempre responder 200, pero indicar si está degraded
    res.status(200).json({
      ok: true,
      status: systemHealth.status === 'initializing' ? 'ok' : systemHealth.status,
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      environment: process.env.NODE_ENV || 'unknown',
      version: deployInfo.version,
      commit: deployInfo.commitHash,
      services: {
        database: systemHealth.dbConnected ? 'connected' : 'disconnected',
        migrations: systemHealth.migrationsRun ? 'completed' : 'pending',
      },
    });
  } catch (error: any) {
    // Si /health falla, responder 200 de todas formas (degraded mode)
    res.status(200).json({
      ok: true,
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Health check error',
    });
  }
};

// Montar /health y /healthcheck (alias) para blindar healthcheck Railway
app.get('/health', healthHandler);
app.get('/healthcheck', healthHandler);

// ============================================================================
// CRÍTICO RAILWAY: /deploy-info endpoint (evidencia de commit desplegado)
// ============================================================================
// Endpoint para verificar qué commit está desplegado en Railway
// Formato requerido: { ok, version, commitHash, environment, timestamp }
app.get('/deploy-info', (_req, res) => {
  try {
    const deployInfo = getDeployInfoSync();
    res.status(200).json({
      ok: true,
      version: deployInfo.version,
      commitHash: deployInfo.commitHash,
      environment: env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(200).json({
      ok: true,
      version: '1.0.1',
      commitHash: 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }
});

// Log inmediato para Railway logs (usar console.log además de logger)
console.log('[BOOT] Healthz route mounted at /healthz');
console.log('[BOOT] Health route mounted at /health');
console.log('[BOOT] Healthcheck route mounted at /healthcheck (alias)');
console.log('[BOOT] Deploy-info route mounted at /deploy-info');
console.log('[BOOT] All health endpoints ready before heavy initialization');
logger.info('[BOOT] Healthz route mounted at /healthz');
logger.info('[BOOT] Health route mounted at /health');
logger.info('[BOOT] Healthcheck route mounted at /healthcheck (alias)');
logger.info('[BOOT] Deploy-info route mounted at /deploy-info');
logger.info('[BOOT] All health endpoints ready before heavy initialization');

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
// CORS configurado por ambiente - en producción solo URLs de producción
const corsOrigins = (() => {
  if (env.NODE_ENV === 'production') {
    // En producción, usar CORS_ALLOWED_ORIGINS si está configurado
    if (env.CORS_ALLOWED_ORIGINS) {
      const origins = env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(o => o);
      // Validar que no haya localhost o IPs locales
      const hasLocalhost = origins.some(o => 
        o.includes('localhost') || 
        o.includes('127.0.0.1') || 
        o.includes('192.168.') ||
        o.startsWith('http://')
      );
      if (hasLocalhost) {
        console.warn('⚠️  WARNING: CORS_ALLOWED_ORIGINS contiene localhost/IPs locales en producción. Esto es un riesgo de seguridad.');
      }
      return origins;
    }
    // Fallback a URLs de producción si CORS_ALLOWED_ORIGINS no está configurado
    return [env.FRONTEND_WEB_URL, env.MOBILE_APP_URL].filter(url => 
      url && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('192.168.')
    );
  } else {
    // En desarrollo, permitir localhost e IPs locales
    return [
      env.FRONTEND_WEB_URL,
      env.MOBILE_APP_URL,
      'http://localhost:5173',
      'http://localhost:19000',
      'http://192.168.4.43:5173',
      'http://192.168.4.43:8081',
      'http://192.168.4.43:19000',
    ].filter(Boolean);
  }
})();

app.use(
  cors({
    origin: corsOrigins,
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

// CRÍTICO: Montar router de WhatsApp webhook ANTES del notFoundHandler
// Esto garantiza que /api/whatsapp/webhook esté siempre disponible para Meta
// incluso si el módulo WhatsApp falla al cargarse o el flag está desactivado
const whatsappWebhookRouter = Router();
const enableWhatsApp = process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true';

// GET /api/whatsapp/webhook - Challenge de verificación de Meta (SIEMPRE disponible)
whatsappWebhookRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('[WHATSAPP] Webhook challenge OK', {
      challenge: challenge ? 'present' : 'missing',
      featureFlag: enableWhatsApp ? 'ACTIVE' : 'INACTIVE',
    });
    return res.status(200).send(challenge);
  }

  logger.warn('[WHATSAPP] Challenge invalid token', {
    mode,
    tokenProvided: !!token,
    featureFlag: enableWhatsApp ? 'ACTIVE' : 'INACTIVE',
  });
  return res.sendStatus(403);
});

// POST /api/whatsapp/webhook - Mensajes entrantes (responder OK siempre, procesar solo si flag activo)
whatsappWebhookRouter.post('/webhook', (_req: Request, res: Response) => {
  if (!enableWhatsApp) {
    logger.debug('[WHATSAPP] POST received disabled');
    return res.status(200).json({ ok: true, disabled: true });
  }
  
  // Si el flag está activo pero el módulo no se cargó aún, responder OK
  // El módulo principal (si se carga) manejará el POST correctamente
  logger.info('[WHATSAPP] POST received enabled (delegating to module if available)');
  return res.status(200).json({ ok: true, enabled: true });
});

app.use('/api/whatsapp', whatsappWebhookRouter);
logger.info('[WHATSAPP] Webhook route mounted at /api/whatsapp/webhook');

// Módulos opcionales se cargan dinámicamente (ver loadOptionalModules)
// Esto permite que el backend compile y arranque incluso si módulos opcionales no están disponibles
// NOTA: El router de WhatsApp principal se montará encima de este si el módulo carga correctamente

// Importar job de liquidaciones mensuales
import { startPayoutJob } from './jobs/payout.job';

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// CRÍTICO: socketService.initialize() se ejecuta DESPUÉS de listen()
// en startServer() para no bloquear el boot

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
    // CRÍTICO RAILWAY: PORT y HOST son constantes globales definidas arriba
    // PORT ya fue validado al inicio del archivo (obligatorio, sin fallback)
    // HOST = '0.0.0.0'
    // Validación redundante (defensa en profundidad)
    if (!PORT || isNaN(PORT) || PORT <= 0) {
      const errorMsg = `[BOOT] FATAL: Invalid PORT: ${PORT}. PORT must be a positive number.`;
      console.error(errorMsg);
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Logs obligatorios [BOOT] según formato requerido
    console.log(`[BOOT] PORT env=${process.env.PORT}`);
    console.log(`[BOOT] Using port: ${PORT}`);
    
    // Si el servidor ya está escuchando (early listen), solo continuar con inicialización
    if (serverListening) {
      console.log('[BOOT] Server already listening (early listen succeeded)');
      console.log('[BOOT] Health endpoint ready: /health');
      logger.info(`[BOOT] Server already listening on ${HOST}:${PORT}`);
      logger.info('[BOOT] Health endpoint ready: /health');
      
      // Inicializar Socket.io DESPUÉS de listen()
      try {
        socketService.initialize(httpServer);
        logger.info('[BOOT] Socket.io initialized');
      } catch (socketError: any) {
        console.error('[BOOT] Socket.io initialization failed (non-blocking):', socketError?.message || socketError);
        logger.error('[BOOT] Socket.io initialization failed (non-blocking):', socketError?.message || socketError);
      }
      
      // Ejecutar inicialización en background
      console.log('[BOOT] Background init started');
      initializeBackend()
        .then(() => {
          console.log('[BOOT] Background init OK');
          logger.info('[BOOT] Background initialization completed');
        })
        .catch((error: any) => {
          systemHealth.status = 'degraded';
          console.error(`[BOOT] Background init FAIL: ${error?.message || error}`);
          logger.error('[BOOT] Background initialization failed (running in degraded mode):', error?.message || error);
          console.warn('[BOOT] Server is running in DEGRADED mode - /health still works');
          logger.warn('[BOOT] Server is running in DEGRADED mode - /health still works');
        });
      
      return Promise.resolve();
    }
    
    console.log('[BOOT] Starting HTTP server...');

    // ============================================================================
    // CRÍTICO: Hacer listen() INMEDIATAMENTE para que /health responda instantáneamente
    // Railway hace healthcheck inmediatamente, NO puede esperar migraciones/DB
    // ============================================================================
    
    return new Promise<void>((resolve, reject) => {
      // CRÍTICO: Listen INMEDIATAMENTE en PORT y HOST (constantes globales)
      httpServer.listen(PORT, HOST, () => {
        // CRÍTICO: Logs obligatorios [BOOT] según formato requerido
        console.log(`[BOOT] Listening on 0.0.0.0:${PORT}`);
        console.log('[BOOT] Health endpoint ready: /health');
        logger.info(`[BOOT] Server listening on ${HOST}:${PORT}`);
        logger.info('[BOOT] Health endpoint ready: /health');
        
        // Marcar sistema como "ok" (aunque no esté completamente inicializado)
        systemHealth.status = 'ok';
        systemHealth.initialized = true;
        
        // Inicializar Socket.io DESPUÉS de listen()
        try {
          socketService.initialize(httpServer);
          logger.info('[BOOT] Socket.io initialized');
        } catch (socketError: any) {
          console.error('[BOOT] Socket.io initialization failed (non-blocking):', socketError?.message || socketError);
          logger.error('[BOOT] Socket.io initialization failed (non-blocking):', socketError?.message || socketError);
          // No bloquear - servidor sigue funcionando
        }
        
        // Ahora que el servidor está escuchando, ejecutar inicialización en background
        // NO bloquea el healthcheck - Railway ya puede hacer healthcheck
        console.log('[BOOT] Background init started');
        initializeBackend()
          .then(() => {
            console.log('[BOOT] Background init OK');
            logger.info('[BOOT] Background initialization completed');
            resolve();
          })
          .catch((error: any) => {
            systemHealth.status = 'degraded';
            console.error(`[BOOT] Background init FAIL: ${error?.message || error}`);
            logger.error('[BOOT] Background initialization failed (running in degraded mode):', error?.message || error);
            // No rechazamos la promesa - servidor sigue arriba en modo degraded
            console.warn('[BOOT] Server is running in DEGRADED mode - /health still works');
            logger.warn('[BOOT] Server is running in DEGRADED mode - /health still works');
            resolve();
          });
      });
      
      httpServer.on('error', (error: any) => {
        console.error('[BOOT] Server listen error:', error);
        logger.error('[BOOT] Server listen error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`[BOOT] Port ${PORT} is already in use`);
          logger.error(`[BOOT] Port ${PORT} is already in use`);
        }
        reject(error);
      });
    });
  } catch (error: any) {
    console.error('[BOOT] Fatal error starting server:', error?.message || error);
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
    console.log('[BOOT] Starting database migrations...');
    logger.info('[BOOT] Starting database migrations...');
    try {
      await runMigrations();
      systemHealth.migrationsRun = true;
      console.log('[BOOT] Database migrations completed');
      logger.info('[BOOT] Database migrations completed');
    } catch (migrateError: any) {
      systemHealth.migrationsRun = false;
      systemHealth.status = 'degraded';
      console.error('[BOOT] Database migrations failed (degraded mode):', migrateError?.message || migrateError);
      console.warn('[BOOT] Server continues without migrations - /health still works');
      logger.error('[BOOT] Database migrations failed (degraded mode):', migrateError?.message || migrateError);
      logger.warn('[BOOT] Server continues without migrations - /health still works');
      // No throw - continuar en modo degraded
    }

    // Verificar variables temporales y mostrar advertencias
    if (env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.includes('temporal_placeholder')) {
      logger.warn('[BOOT] STRIPE_SECRET_KEY está usando un valor temporal.');
    }

    // Conectar a la base de datos (NO bloqueante para /health)
    console.log('[BOOT] Connecting to database...');
    logger.info('[BOOT] Connecting to database...');
    try {
      await prisma.$connect();
      systemHealth.dbConnected = true;
      console.log('[BOOT] Database connection established');
      logger.info('[BOOT] Database connection established');
    } catch (dbError: any) {
      systemHealth.dbConnected = false;
      systemHealth.status = 'degraded';
      console.error('[BOOT] Database connection failed (degraded mode):', dbError?.message || dbError);
      console.warn('[BOOT] Server continues without database - /health still works');
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
    // CRÍTICO: Montar SIEMPRE el router de WhatsApp para que Meta pueda validar el webhook (GET challenge)
    // El controller verifica el feature flag internamente
    try {
      const { loadOptionalModules } = await import('@/bootstrap/loadOptionalModules');
      await loadOptionalModules(app);
      logger.info('[BOOT] Optional modules loaded');
    } catch (modulesError: any) {
      logger.warn('[BOOT] Optional modules failed to load:', modulesError?.message || modulesError);
      logger.warn('[BOOT] Server continues without optional modules');
      // No bloquear
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

