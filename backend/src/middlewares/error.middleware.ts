import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '@/config/logger';
import env from '@/config/env';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Error de validación Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Error de validación',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Error operacional conocido
  if ('isOperational' in err && err.isOperational && err.statusCode) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Error desconocido
  logger.error('Error no manejado:', {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  });
};

export const createError = (message: string, statusCode: number = 400): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

