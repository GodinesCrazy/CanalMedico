import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthenticatedRequest } from '@/types';
import logger from '@/config/logger';
import env from '@/config/env';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticación requerido' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('Error en autenticación:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ error: 'Autenticación requerida' });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }

    next();
  };
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      (req as AuthenticatedRequest).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Si falla, simplemente continúa sin autenticación
    next();
  }
};

/**
 * Middleware para validar X-Internal-Secret header
 * 
 * Se usa para proteger endpoints internos (ej: envío de WhatsApp)
 * que no deben ser accesibles públicamente.
 * 
 * Requiere header: X-Internal-Secret con valor de INTERNAL_API_KEY
 */
export const requireInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalSecret = env.INTERNAL_API_KEY;
  
  // Si no está configurado, denegar en producción
  if (!internalSecret) {
    if (env.NODE_ENV === 'production') {
      logger.warn('[AUTH] INTERNAL_API_KEY no configurado en producción - denegando acceso');
      res.status(503).json({ 
        error: 'Servicio no disponible - configuración de seguridad faltante' 
      });
      return;
    } else {
      // En desarrollo/test, permitir si no está configurado (pero advertir)
      logger.warn('[AUTH] INTERNAL_API_KEY no configurado - permitiendo en desarrollo');
      next();
      return;
    }
  }

  const providedSecret = req.headers['x-internal-secret'] as string;

  if (!providedSecret) {
    logger.warn('[AUTH] Intento de acceso sin X-Internal-Secret header', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({ error: 'X-Internal-Secret header requerido' });
    return;
  }

  // Comparación segura (timing-safe) usando crypto.timingSafeEqual
  const crypto = require('crypto');
  let isValid = false;
  
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(internalSecret),
      Buffer.from(providedSecret)
    );
  } catch (error) {
    // Si hay error en la comparación (por ejemplo, longitudes diferentes), es inválido
    isValid = false;
  }

  if (!isValid) {
    logger.warn('[AUTH] X-Internal-Secret inválido', {
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({ error: 'X-Internal-Secret inválido' });
    return;
  }

  // Secret válido, continuar
  next();
};

