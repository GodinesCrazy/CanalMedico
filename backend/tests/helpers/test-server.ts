/**
 * Test Server Setup
 * Configura el servidor Express para tests
 * 
 * NOTA: No importamos directamente el servidor porque ejecutaría startServer()
 * En su lugar, configuramos el app sin inicializar el servidor HTTP
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import request, { SuperTest, Test } from 'supertest';

// Importar rutas directamente (sin el servidor completo)
import authRoutes from '@/modules/auth/auth.routes';
import usersRoutes from '@/modules/users/users.routes';
import consultationsRoutes from '@/modules/consultations/consultations.routes';
import messagesRoutes from '@/modules/messages/messages.routes';
import paymentsRoutes from '@/modules/payments/payments.routes';
import snreRoutes from '@/modules/snre/snre.routes';

// Importar middlewares
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';

// Crear app de test (sin inicializar servidor HTTP ni Socket.io)
let testApp: Application | null = null;

function createTestApp(): Application {
  const app = express();
  
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/consultations', consultationsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/prescriptions', snreRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Obtener instancia de la app para tests
 */
export function getTestApp(): SuperTest<Test> {
  if (!testApp) {
    testApp = createTestApp();
  }
  return request(testApp);
}

/**
 * Helper para hacer requests autenticados
 */
export function authenticatedRequest(token: string): SuperTest<Test> {
  return getTestApp().set('Authorization', `Bearer ${token}`);
}

/**
 * Helper para hacer requests sin autenticación
 */
export function unauthenticatedRequest(): SuperTest<Test> {
  return getTestApp();
}

