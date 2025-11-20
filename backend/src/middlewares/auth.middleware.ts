import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { AuthenticatedRequest } from '@/types';
import logger from '@/config/logger';

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

