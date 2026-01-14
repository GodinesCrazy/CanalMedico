import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import env from '@/config/env';

export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // CRÍTICO RAILWAY: Excluir endpoints de healthcheck del rate limiting
  // Railway hace healthchecks frecuentes y no deben ser bloqueados
  skip: (req: Request) => {
    const path = req.path;
    // Excluir todos los endpoints de healthcheck
    return path === '/health' || 
           path === '/healthcheck' || 
           path === '/healthz' || 
           path === '/deploy-info';
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos
  message: 'Demasiadas solicitudes de pago, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

