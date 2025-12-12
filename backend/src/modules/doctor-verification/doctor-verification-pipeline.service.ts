/**
 * Pipeline unificado de verificaci�n de m�dicos
 * Orquesta validaci�n de identidad (RC) + validaci�n profesional (RNPI)
 */

import logger from '@/config/logger';
import identityVerificationService from '../identity-verification/identity-verification.service';
import rnpiVerificationService from '../rnpi-verification/rnpi-verification.service';
import {
  DoctorVerificationRequest,
  DoctorVerificationResult,
  VerificationFinalStatus,
  IdentityVerificationStatus,
  RnpiVerificationStatus,
} from './doctor-verification.types';

export class DoctorVerificationPipelineService {
  /**
   * Ejecuta la verificaci�n completa de un m�dico
   */
  async verifyDoctor(
    request: DoctorVerificationRequest
  ): Promise<DoctorVerificationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info('Iniciando verificaci�n completa de m�dico', {
      rut: `${request.rut}-${request.dv}`,
      name: request.name,
    });

    try {
      // PASO 1: Validaci�n de Identidad (Registro Civil)
      const identityResult = await this.verifyIdentity(request);

      // Si la identidad falla, rechazar inmediatamente
      if (
        identityResult.status === IdentityVerificationStatus.RUN_INVALIDO ||
        identityResult.status === IdentityVerificationStatus.IDENTIDAD_NO_COINCIDE
      ) {
        logger.warn('Verificaci�n rechazada en validaci�n de identidad', {
          rut: `${request.rut}-${request.dv}`,
          status: identityResult.status,
        });

        return {
          finalStatus: VerificationFinalStatus.RECHAZADO_EN_IDENTIDAD,
          identityResult,
          errors: identityResult.errors || [],
          warnings: [],
          requiresManualReview: false,
          verifiedAt: new Date(),
        };
      }

      // Si Registro Civil no responde, marcar para revisi�n manual
      if (identityResult.status === IdentityVerificationStatus.RC_NO_RESPONDE) {
        warnings.push('Registro Civil no respondi�. Requiere verificaci�n manual.');
        
        return {
          finalStatus: VerificationFinalStatus.REVISION_MANUAL,
          identityResult,
          errors: [],
          warnings,
          requiresManualReview: true,
          verifiedAt: new Date(),
        };
      }

      // Si hay error en validaci�n de identidad, marcar para revisi�n
      if (identityResult.status === IdentityVerificationStatus.ERROR_VALIDACION) {
        errors.push(...(identityResult.errors || []));
        warnings.push('Error en validaci�n de identidad. Requiere revisi�n manual.');

        return {
          finalStatus: VerificationFinalStatus.REVISION_MANUAL,
          identityResult,
          errors,
          warnings,
          requiresManualReview: true,
          verifiedAt: new Date(),
        };
      }

      // PASO 2: Validaci�n Profesional (RNPI) - Solo si identidad OK
      if (identityResult.status === IdentityVerificationStatus.IDENTIDAD_VERIFICADA) {
        const rnpiResult = await this.verifyRnpi(request);

        // Evaluar resultado RNPI
        if (rnpiResult.status === RnpiVerificationStatus.RNPI_OK) {
          // Todo correcto
          logger.info('M�dico verificado exitosamente', {
            rut: `${request.rut}-${request.dv}`,
          });

          return {
            finalStatus: VerificationFinalStatus.VERIFICADO,
            identityResult,
            rnpiResult,
            errors: [],
            warnings: [],
            requiresManualReview: false,
            verifiedAt: new Date(),
          };
        }

        if (
          rnpiResult.status === RnpiVerificationStatus.RNPI_NO_EXISTE ||
          rnpiResult.status === RnpiVerificationStatus.RNPI_PROFESION_INVALIDA ||
          rnpiResult.status === RnpiVerificationStatus.RNPI_NO_HABILITADO
        ) {
          // Rechazar autom�ticamente
          errors.push(...(rnpiResult.errors || []));

          return {
            finalStatus: VerificationFinalStatus.RECHAZADO_EN_RNPI,
            identityResult,
            rnpiResult,
            errors,
            warnings: [],
            requiresManualReview: false,
            verifiedAt: new Date(),
          };
        }

        if (
          rnpiResult.status === RnpiVerificationStatus.RNPI_INCONSISTENCIA_NOMBRE ||
          rnpiResult.status === RnpiVerificationStatus.RNPI_API_ERROR
        ) {
          // Inconsistencias menores o errores ? revisi�n manual
          warnings.push(...(rnpiResult.inconsistencies || []));
          if (rnpiResult.errors) {
            errors.push(...rnpiResult.errors);
          }

          return {
            finalStatus: VerificationFinalStatus.REVISION_MANUAL,
            identityResult,
            rnpiResult,
            errors,
            warnings,
            requiresManualReview: true,
            verifiedAt: new Date(),
          };
        }
      }

      // Estado por defecto: pendiente
      return {
        finalStatus: VerificationFinalStatus.PENDIENTE,
        identityResult,
        errors,
        warnings,
        requiresManualReview: true,
        verifiedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Error en pipeline de verificaci�n:', error);
      
      errors.push(`Error inesperado: ${error.message}`);

      return {
        finalStatus: VerificationFinalStatus.REVISION_MANUAL,
        identityResult: {
          status: IdentityVerificationStatus.ERROR_VALIDACION,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: [error.message],
        },
        errors,
        warnings,
        requiresManualReview: true,
        verifiedAt: new Date(),
      };
    } finally {
      const duration = Date.now() - startTime;
      logger.info('Verificaci�n completada', {
        rut: `${request.rut}-${request.dv}`,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Verifica identidad contra Registro Civil
   */
  private async verifyIdentity(
    request: DoctorVerificationRequest
  ): Promise<any> {
    try {
      return await identityVerificationService.verifyIdentity({
        rut: request.rut,
        dv: request.dv,
        name: request.name,
        birthDate: request.birthDate,
      });
    } catch (error: any) {
      logger.error('Error en verificaci�n de identidad:', error);
      
      // Si es timeout o error de red, retornar RC_NO_RESPONDE
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          status: IdentityVerificationStatus.RC_NO_RESPONDE,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Timeout o error de conexi�n con Registro Civil'],
        };
      }

      return {
        status: IdentityVerificationStatus.ERROR_VALIDACION,
        rut: request.rut,
        dv: request.dv,
        nameProvided: request.name,
        errors: [error.message || 'Error al verificar identidad'],
      };
    }
  }

  /**
   * Verifica habilitaci�n profesional contra RNPI
   */
  private async verifyRnpi(
    request: DoctorVerificationRequest
  ): Promise<any> {
    try {
      return await rnpiVerificationService.verifyProfessional({
        rut: request.rut,
        dv: request.dv,
        name: request.name,
        specialty: request.specialty,
      });
    } catch (error: any) {
      logger.error('Error en verificaci�n RNPI:', error);
      
      // Si es timeout o error de red, retornar RNPI_API_ERROR
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          status: RnpiVerificationStatus.RNPI_API_ERROR,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Timeout o error de conexi�n con RNPI'],
        };
      }

      return {
        status: RnpiVerificationStatus.RNPI_API_ERROR,
        rut: request.rut,
        dv: request.dv,
        nameProvided: request.name,
        errors: [error.message || 'Error al verificar RNPI'],
      };
    }
  }
}

export default new DoctorVerificationPipelineService();
