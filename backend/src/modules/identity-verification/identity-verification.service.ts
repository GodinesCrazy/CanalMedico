/**
 * Servicio de validaci�n de identidad
 * Orquesta la validaci�n usando el proveedor configurado
 */

import logger from '@/config/logger';
import {
  IdentityVerificationProvider,
  IdentityVerificationRequest,
  IdentityVerificationResult,
  IdentityVerificationStatus,
} from './identity-verification.types';
import { FloidProvider } from './floid-provider';
import env from '@/config/env';

export class IdentityVerificationService {
  private provider: IdentityVerificationProvider;

  constructor() {
    // Por defecto usar Floid, pero se puede cambiar f�cilmente
    const providerName = env.IDENTITY_VERIFICATION_PROVIDER || 'FLOID';
    
    if (providerName === 'FLOID') {
      this.provider = new FloidProvider();
    } else {
      // Por defecto usar Floid si no se especifica otro
      this.provider = new FloidProvider();
    }

    logger.info(`Proveedor de validaci�n de identidad: ${this.provider.getName()}`);
  }

  /**
   * Verifica la identidad de una persona contra Registro Civil
   */
  async verifyIdentity(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult> {
    try {
      // Validar formato de RUN
      if (!this.isValidRutFormat(request.rut, request.dv)) {
        return {
          status: IdentityVerificationStatus.RUN_INVALIDO,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Formato de RUN inv�lido'],
        };
      }

      // Verificar que el proveedor est� disponible
      const isAvailable = await this.provider.isAvailable();
      if (!isAvailable) {
        logger.warn('Proveedor de validaci�n no disponible, usando validaci�n local de RUN');
        
        // Fallback: solo validar formato y d�gito verificador
        const isValidDv = this.validateRutDv(request.rut, request.dv);
        if (!isValidDv) {
          return {
            status: IdentityVerificationStatus.RUN_INVALIDO,
            rut: request.rut,
            dv: request.dv,
            nameProvided: request.name,
            errors: ['D�gito verificador del RUN inv�lido'],
          };
        }

        // Si el proveedor no est� disponible, retornar PENDING para revisi�n manual
        return {
          status: IdentityVerificationStatus.PENDING,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Servicio de validaci�n no disponible. Requiere revisi�n manual.'],
        };
      }

      // Llamar al proveedor
      const result = await this.provider.verifyIdentity(request);

      logger.info('Validaci�n de identidad completada', {
        rut: `${request.rut}-${request.dv}`,
        status: result.status,
        provider: result.provider,
      });

      return result;
    } catch (error: any) {
      logger.error('Error en servicio de validaciÃ³n de identidad:', error);
      
      // Extraer mensaje de error de forma segura (evitar referencias circulares)
      let errorMessage = 'Error al validar identidad';
      try {
        if (error?.message) {
          errorMessage = String(error.message);
        } else if (error?.response?.data?.message) {
          errorMessage = String(error.response.data.message);
        } else if (error?.response?.statusText) {
          errorMessage = `Error HTTP ${error.response.status}: ${error.response.statusText}`;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
      } catch (e) {
        errorMessage = 'Error al validar identidad (error de serializaciÃ³n)';
      }
      
      return {
        status: IdentityVerificationStatus.ERROR_VALIDACION,
        rut: request.rut,
        dv: request.dv,
        nameProvided: request.name,
        errors: [errorMessage],
      };
    };
    }
  }

  /**
   * Valida formato b�sico de RUN (solo n�meros)
   */
  private isValidRutFormat(rut: string, dv: string): boolean {
    // RUN debe ser solo n�meros, entre 7 y 9 d�gitos
    if (!/^\d{7,9}$/.test(rut)) {
      return false;
    }

    // DV debe ser un d�gito o 'K'
    if (!/^[\dKk]$/.test(dv)) {
      return false;
    }

    return true;
  }

  /**
   * Valida el d�gito verificador del RUN usando algoritmo chileno
   */
  private validateRutDv(rut: string, dv: string): boolean {
    let sum = 0;
    let multiplier = 2;

    // Calcular desde el final del RUN
    for (let i = rut.length - 1; i >= 0; i--) {
      sum += parseInt(rut[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    let calculatedDv: string;

    if (remainder === 0) {
      calculatedDv = '0';
    } else if (remainder === 1) {
      calculatedDv = 'K';
    } else {
      calculatedDv = String(11 - remainder);
    }

    return calculatedDv.toUpperCase() === dv.toUpperCase();
  }

  /**
   * Normaliza nombre para comparaci�n (elimina acentos, may�sculas, espacios extra)
   */
  normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Compara dos nombres y retorna un score de coincidencia (0-100)
   */
  compareNames(name1: string, name2: string): number {
    const normalized1 = this.normalizeName(name1);
    const normalized2 = this.normalizeName(name2);

    if (normalized1 === normalized2) {
      return 100;
    }

    // Comparaci�n por palabras
    const words1 = normalized1.split(' ');
    const words2 = normalized2.split(' ');

    let matches = 0;
    const totalWords = Math.max(words1.length, words2.length);

    for (const word1 of words1) {
      if (words2.some((word2) => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        matches++;
      }
    }

    return Math.round((matches / totalWords) * 100);
  }
}

export default new IdentityVerificationService();

