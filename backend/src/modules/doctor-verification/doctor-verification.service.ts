/**
 * Servicio de verificacion de medicos
 * Gestiona la persistencia y consulta de estados de verificacion
 */

import prisma from '@/database/prisma';
import { createError } from '@/middlewares/error.middleware';
import logger from '@/config/logger';
import doctorVerificationPipeline from './doctor-verification-pipeline.service';
import {
  DoctorVerificationRequest,
  DoctorVerificationResult,
} from './doctor-verification.types';
import { extractRutAndDv } from '@/utils/rut';
import { encrypt } from '@/utils/encryption';
import env from '@/config/env';

export class DoctorVerificationService {
  /**
   * Ejecuta verificacion completa y guarda resultados en BD
   */
  async verifyAndSave(
    doctorId: string,
    request: DoctorVerificationRequest
  ): Promise<DoctorVerificationResult> {
    try {
      // Ejecutar pipeline de verificacion
      const result = await doctorVerificationPipeline.verifyDoctor(request);

      // Guardar resultados en BD
      await this.saveVerificationResults(doctorId, result);

      logger.info('Verificacion guardada en BD', {
        doctorId,
        finalStatus: result.finalStatus,
      });

      return result;
    } catch (error: any) {
      logger.error('Error al verificar y guardar:', error);
      throw createError('Error al ejecutar verificacion', 500);
    }
  }

  /**
   * Guarda resultados de verificacion en la base de datos
   */
  private async saveVerificationResults(
    doctorId: string,
    result: DoctorVerificationResult
  ): Promise<void> {
    try {
      const updateData: any = {
        identidadValidada: result.identityResult.status === 'IDENTIDAD_VERIFICADA',
        profesionValidada: result.rnpiResult?.status === 'RNPI_OK',
        verificacionEstadoFinal: result.finalStatus,
        lastVerificationAt: result.verifiedAt,
        verificationErrors: JSON.stringify(result.errors),
        logsValidacion: JSON.stringify({
          identityResult: result.identityResult,
          rnpiResult: result.rnpiResult,
          warnings: result.warnings,
          verifiedAt: result.verifiedAt,
        }),
      };

      // Guardar datos de RNPI si estan disponibles (encriptados en produccion)
      if (result.rnpiResult?.professionalData) {
        updateData.rnpiEstado = result.rnpiResult.professionalData.status;
        updateData.rnpiProfesion = result.rnpiResult.professionalData.profession;
        updateData.rnpiFechaVerificacion = result.rnpiResult.verifiedAt || new Date();
        const rnpiDataJson = JSON.stringify(result.rnpiResult.rawData || result.rnpiResult);
        updateData.rnpiVerificationData = env.NODE_ENV === 'production' 
          ? encrypt(rnpiDataJson) 
          : rnpiDataJson;
      }

      // Guardar datos de identidad (encriptados en produccion)
      if (result.identityResult) {
        const identityDataJson = JSON.stringify(result.identityResult.rawData || result.identityResult);
        updateData.identityVerificationData = env.NODE_ENV === 'production'
          ? encrypt(identityDataJson)
          : identityDataJson;
      }

      await prisma.doctor.update({
        where: { id: doctorId },
        data: updateData,
      });
    } catch (error: any) {
      logger.error('Error al guardar resultados de verificacion:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de verificacion de un medico
   */
  async getVerificationStatus(doctorId: string) {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          name: true,
          rut: true,
          identidadValidada: true,
          profesionValidada: true,
          rnpiEstado: true,
          rnpiProfesion: true,
          rnpiFechaVerificacion: true,
          verificacionEstadoFinal: true,
          lastVerificationAt: true,
          verificationErrors: true,
          logsValidacion: true,
        },
      });

      if (!doctor) {
        throw createError('Medico no encontrado', 404);
      }

      return {
        doctorId: doctor.id,
        name: doctor.name,
        rut: doctor.rut,
        identidadValidada: doctor.identidadValidada,
        profesionValidada: doctor.profesionValidada,
        rnpiEstado: doctor.rnpiEstado,
        rnpiProfesion: doctor.rnpiProfesion,
        rnpiFechaVerificacion: doctor.rnpiFechaVerificacion,
        estadoFinal: doctor.verificacionEstadoFinal,
        ultimaVerificacion: doctor.lastVerificationAt,
        errores: doctor.verificationErrors ? JSON.parse(doctor.verificationErrors) : [],
        logs: doctor.logsValidacion ? JSON.parse(doctor.logsValidacion) : null,
      };
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Error al obtener estado de verificacion:', error);
      throw createError('Error al obtener estado de verificacion', 500);
    }
  }

  /**
   * Re-ejecuta la verificacion de un medico (solo admin)
   */
  async reVerifyDoctor(doctorId: string): Promise<DoctorVerificationResult> {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!doctor || !doctor.rut) {
        throw createError('Medico no encontrado o sin RUT', 404);
      }

      const { rut: run, dv } = extractRutAndDv(doctor.rut);
      if (!run || !dv) {
        throw createError('RUT invalido', 400);
      }

      const request: DoctorVerificationRequest = {
        rut: run,
        dv,
        name: doctor.name,
        specialty: doctor.speciality,
      };

      logger.info('Re-ejecutando verificacion de medico', {
        doctorId,
        rut: doctor.rut,
      });

      return await this.verifyAndSave(doctorId, request);
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Error al re-verificar medico:', error);
      throw createError('Error al re-verificar medico', 500);
    }
  }
}

export default new DoctorVerificationService();


