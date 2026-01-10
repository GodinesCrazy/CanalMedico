import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import prisma from '@/database/prisma';
import logger from '@/config/logger';
import { createError } from './error.middleware';

/**
 * Middleware centralizado de validación de propiedad (IDOR Prevention)
 * 
 * Valida que el usuario autenticado tenga permiso para acceder al recurso solicitado.
 * Diseñado para prevenir acceso a datos médicos ajenos.
 */

/**
 * Valida que el usuario es el propietario de una consulta (como doctor o paciente)
 */
export const requireConsultationOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const consultationId = req.params.id || req.params.consultationId || req.body.consultationId;
  
  if (!consultationId) {
    res.status(400).json({ error: 'ID de consulta requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  validateConsultationOwnership(req.user.id, req.user.role, consultationId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de consulta:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

/**
 * Valida que el usuario es el propietario de un mensaje (parte de la consulta)
 */
export const requireMessageOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const messageId = req.params.id || req.params.messageId;
  
  if (!messageId) {
    res.status(400).json({ error: 'ID de mensaje requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  validateMessageOwnership(req.user.id, req.user.role, messageId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de mensaje:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

/**
 * Valida que el usuario es el propietario de un pago (parte de la consulta)
 */
export const requirePaymentOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const consultationId = req.params.consultationId || req.body.consultationId;
  
  if (!consultationId) {
    res.status(400).json({ error: 'ID de consulta requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  validateConsultationOwnership(req.user.id, req.user.role, consultationId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de pago:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

/**
 * Valida que el usuario es el propietario de un paciente
 */
export const requirePatientOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const patientId = req.params.id || req.params.patientId || req.body.patientId;
  const userId = req.params.userId || req.body.userId;
  
  if (!patientId && !userId) {
    res.status(400).json({ error: 'ID de paciente o usuario requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  // Si se pasa userId, validar que sea el usuario autenticado
  if (userId && userId !== req.user.id) {
    res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    return;
  }

  // Si se pasa patientId, validar que pertenezca al usuario
  if (patientId) {
    validatePatientOwnership(req.user.id, req.user.role, patientId)
      .then(() => next())
      .catch((error) => {
        if (error.status === 403 || error.status === 404) {
          res.status(error.status).json({ error: error.message });
        } else {
          logger.error('Error al validar propiedad de paciente:', error);
          res.status(500).json({ error: 'Error al validar permisos' });
        }
      });
  } else {
    next();
  }
};

/**
 * Valida que el usuario es el propietario de una receta (doctor o paciente de la consulta)
 */
export const requirePrescriptionOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const prescriptionId = req.params.id || req.params.prescriptionId;
  const consultationId = req.params.consultationId || req.body.consultationId;
  
  if (!prescriptionId && !consultationId) {
    res.status(400).json({ error: 'ID de receta o consulta requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (prescriptionId) {
    validatePrescriptionOwnership(req.user.id, req.user.role, prescriptionId)
      .then(() => next())
      .catch((error) => {
        if (error.status === 403 || error.status === 404) {
          res.status(error.status).json({ error: error.message });
        } else {
          logger.error('Error al validar propiedad de receta:', error);
          res.status(500).json({ error: 'Error al validar permisos' });
        }
      });
  } else if (consultationId) {
    validateConsultationOwnership(req.user.id, req.user.role, consultationId)
      .then(() => next())
      .catch((error) => {
        if (error.status === 403 || error.status === 404) {
          res.status(error.status).json({ error: error.message });
        } else {
          logger.error('Error al validar propiedad de receta:', error);
          res.status(500).json({ error: 'Error al validar permisos' });
        }
      });
  }
};

/**
 * Valida que el usuario es el propietario de un payout (doctor)
 */
export const requirePayoutOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const batchId = req.params.batchId || req.params.id;
  
  if (!batchId) {
    res.status(400).json({ error: 'ID de liquidación requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role !== 'DOCTOR') {
    res.status(403).json({ error: 'Solo los médicos pueden acceder a sus liquidaciones' });
    return;
  }

  validatePayoutOwnership(req.user.id, batchId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de liquidación:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

/**
 * Valida que el senderId en el body corresponde al usuario autenticado
 */
export const requireSenderOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const senderId = req.body.senderId;
  
  if (!senderId) {
    res.status(400).json({ error: 'ID de remitente requerido' });
    return;
  }

  // Para mensajes, el senderId debe ser el doctorId o patientId del usuario autenticado
  validateSenderOwnership(req.user.id, req.user.role, senderId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de remitente:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

// ============================================================================
// FUNCIONES DE VALIDACIÓN INTERNAS
// ============================================================================

/**
 * Valida que el usuario tiene acceso a una consulta
 */
async function validateConsultationOwnership(
  userId: string,
  userRole: string,
  consultationId: string
): Promise<void> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      doctor: { select: { userId: true } },
      patient: { select: { userId: true } },
    },
  });

  if (!consultation) {
    throw createError('Consulta no encontrada', 404);
  }

  if (userRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!doctor || consultation.doctorId !== doctor.id) {
      throw createError('No tienes permiso para acceder a esta consulta', 403);
    }
  } else if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient || consultation.patientId !== patient.id) {
      throw createError('No tienes permiso para acceder a esta consulta', 403);
    }
  } else {
    throw createError('Rol no autorizado para acceder a consultas', 403);
  }
}

/**
 * Valida que el usuario tiene acceso a un mensaje
 */
async function validateMessageOwnership(
  userId: string,
  userRole: string,
  messageId: string
): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      consultation: {
        include: {
          doctor: { select: { userId: true } },
          patient: { select: { userId: true } },
        },
      },
    },
  });

  if (!message) {
    throw createError('Mensaje no encontrado', 404);
  }

  await validateConsultationOwnership(userId, userRole, message.consultationId);
}

/**
 * Valida que el usuario es propietario de un paciente
 */
async function validatePatientOwnership(
  userId: string,
  userRole: string,
  patientId: string
): Promise<void> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true },
  });

  if (!patient) {
    throw createError('Paciente no encontrado', 404);
  }

  // Solo el paciente mismo o un admin puede ver su información
  if (patient.userId !== userId && userRole !== 'ADMIN') {
    throw createError('No tienes permiso para acceder a este paciente', 403);
  }
}

/**
 * Valida que el usuario tiene acceso a una receta
 */
async function validatePrescriptionOwnership(
  userId: string,
  userRole: string,
  prescriptionId: string
): Promise<void> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      consultation: {
        include: {
          doctor: { select: { userId: true, id: true } },
          patient: { select: { userId: true, id: true } },
        },
      },
    },
  });

  if (!prescription) {
    throw createError('Receta no encontrada', 404);
  }

  await validateConsultationOwnership(userId, userRole, prescription.consultationId);
}

/**
 * Valida que el usuario es propietario de un payout
 */
async function validatePayoutOwnership(
  userId: string,
  batchId: string
): Promise<void> {
  const payout = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: {
      doctor: { select: { userId: true } },
    },
  });

  if (!payout) {
    throw createError('Liquidación no encontrada', 404);
  }

  if (payout.doctor.userId !== userId) {
    throw createError('No tienes permiso para acceder a esta liquidación', 403);
  }
}

/**
 * Valida que el senderId corresponde al usuario autenticado
 */
async function validateSenderOwnership(
  userId: string,
  userRole: string,
  senderId: string
): Promise<void> {
  if (userRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!doctor || doctor.id !== senderId) {
      throw createError('No puedes enviar mensajes como otro usuario', 403);
    }
  } else if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!patient || patient.id !== senderId) {
      throw createError('No puedes enviar mensajes como otro usuario', 403);
    }
  } else {
    throw createError('Rol no autorizado para enviar mensajes', 403);
  }
}

