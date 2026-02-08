import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import prisma from '@/database/prisma';
import logger from '@/config/logger';
import { createError } from './error.middleware';

/**
 * Valida que el usuario es el propietario de una consulta (como doctor, paciente o admin)
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

  if (userId && userId !== req.user.id) {
    res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    return;
  }

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

export const requireDoctorOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const doctorId = req.params.doctorId;

  if (!doctorId) {
    res.status(400).json({ error: 'ID de doctor requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role !== 'DOCTOR') {
    res.status(403).json({ error: 'Solo los médicos pueden acceder a este recurso' });
    return;
  }

  validateDoctorOwnership(req.user.id, doctorId)
    .then(() => next())
    .catch((error) => {
      if (error.status === 403 || error.status === 404) {
        res.status(error.status).json({ error: error.message });
      } else {
        logger.error('Error al validar propiedad de doctor:', error);
        res.status(500).json({ error: 'Error al validar permisos' });
      }
    });
};

export const requirePatientIdOwnership = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const patientId = req.params.patientId;

  if (!patientId) {
    res.status(400).json({ error: 'ID de paciente requerido' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role !== 'PATIENT') {
    res.status(403).json({ error: 'Solo los pacientes pueden acceder a este recurso' });
    return;
  }

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
};

async function validateConsultationOwnership(
  userId: string,
  userRole: string,
  consultationId: string
): Promise<void> {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: { doctorId: true, patientId: true },
  });

  if (!consultation) {
    throw createError('Consulta no encontrada', 404);
  }

  // Admin puede leer cualquier consulta (GET /api/consultations/:id)
  if (userRole === 'ADMIN') {
    return;
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

async function validateMessageOwnership(
  userId: string,
  userRole: string,
  messageId: string
): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { consultationId: true },
  });

  if (!message) {
    throw createError('Mensaje no encontrado', 404);
  }

  await validateConsultationOwnership(userId, userRole, message.consultationId);
}

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

  if (patient.userId !== userId && userRole !== 'ADMIN') {
    throw createError('No tienes permiso para acceder a este paciente', 403);
  }
}

async function validateDoctorOwnership(userId: string, doctorId: string): Promise<void> {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!doctor) {
    throw createError('Doctor no encontrado', 404);
  }

  if (doctor.id !== doctorId) {
    throw createError('No tienes permiso para acceder a este recurso', 403);
  }
}

async function validatePrescriptionOwnership(
  userId: string,
  userRole: string,
  prescriptionId: string
): Promise<void> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: { consultationId: true },
  });

  if (!prescription) {
    throw createError('Receta no encontrada', 404);
  }

  await validateConsultationOwnership(userId, userRole, prescription.consultationId);
}

async function validatePayoutOwnership(userId: string, batchId: string): Promise<void> {
  const payout = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    include: { doctor: { select: { userId: true } } },
  });

  if (!payout) {
    throw createError('Liquidación no encontrada', 404);
  }

  if (payout.doctor.userId !== userId) {
    throw createError('No tienes permiso para acceder a esta liquidación', 403);
  }
}

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
