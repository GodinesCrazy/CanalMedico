/**
 * Servicio de validaci�n profesional contra RNPI
 * Consulta el Registro Nacional de Prestadores Individuales de la Superintendencia de Salud
 */

import axios, { AxiosInstance } from 'axios';
import env from '@/config/env';
import logger from '@/config/logger';
import {
  RnpiVerificationRequest,
  RnpiVerificationResult,
  RnpiVerificationStatus,
  RnpiProfessionalData,
} from './rnpi-verification.types';

export class RnpiVerificationService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // URL de la API de Prestadores de la Superintendencia de Salud
    // NOTA: Verificar URL oficial en https://www.supersalud.gob.cl
    this.baseUrl = env.RNPI_API_URL || 'https://api.supersalud.gob.cl/prestadores';

    const timeout = env.RNPI_TIMEOUT_MS || 15000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Verifica un profesional contra RNPI
   */
  async verifyProfessional(
    request: RnpiVerificationRequest
  ): Promise<RnpiVerificationResult> {
    try {
      const rutFormatted = `${request.rut}-${request.dv}`;

      logger.info('Validando profesional en RNPI', {
        rut: rutFormatted,
        name: request.name,
      });

      // Consultar API de RNPI
      // NOTA: Ajustar endpoint seg�n documentaci�n oficial de Superintendencia de Salud
      const response = await this.client.get(`/individual/${request.rut}`, {
        params: {
          dv: request.dv,
        },
      });

      const data = response.data;

      // Si no se encuentra el profesional
      if (!data || !data.rut) {
        return {
          status: RnpiVerificationStatus.RNPI_NO_EXISTE,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Profesional no encontrado en el Registro Nacional de Prestadores Individuales'],
        };
      }

      // Extraer datos oficiales
      const professionalData: RnpiProfessionalData = {
        rut: data.rut || request.rut,
        dv: data.dv || request.dv,
        nameOfficial: data.nombre || data.name || '',
        profession: data.profesion || data.profession || '',
        status: data.estado || data.status || '',
        registrationDate: data.fechaRegistro || data.registrationDate,
        specialties: data.especialidades || data.specialties || [],
        registrationNumber: data.numeroRegistro || data.registrationNumber,
        institution: data.institucion || data.institution,
      };

      // Validar que sea m�dico
      const isMedico = this.isMedicoProfession(professionalData.profession);
      if (!isMedico) {
        return {
          status: RnpiVerificationStatus.NO_MEDICO,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          professionalData,
          errors: [`Profesi�n registrada: "${professionalData.profession}". Debe ser "M�dico Cirujano"`],
        };
      }

      // Validar estado
      const isHabilitado = this.isHabilitadoStatus(professionalData.status);
      if (!isHabilitado) {
        return {
          status: RnpiVerificationStatus.SUSPENDIDO,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          professionalData,
          errors: [`Estado en RNPI: "${professionalData.status}". Debe estar "Habilitado"`],
        };
      }

      // Comparar nombre
      const nameMatch = this.compareNames(request.name, professionalData.nameOfficial);
      const inconsistencies: string[] = [];

      if (nameMatch < 80) {
        inconsistencies.push(
          `Nombre proporcionado ("${request.name}") no coincide exactamente con nombre oficial ("${professionalData.nameOfficial}")`
        );
      }

      // Comparar especialidad si se proporcion�
      if (request.specialty && professionalData.specialties) {
        const specialtyMatch = professionalData.specialties.some((spec) =>
          this.normalizeString(spec).includes(this.normalizeString(request.specialty || ''))
        );

        if (!specialtyMatch) {
          inconsistencies.push(
            `Especialidad proporcionada ("${request.specialty}") no coincide con especialidades registradas en RNPI`
          );
        }
      }

      // Si hay inconsistencias menores, marcar para revisi�n manual
      if (inconsistencies.length > 0) {
        return {
          status: RnpiVerificationStatus.INCONSISTENCIA,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          professionalData,
          inconsistencies,
          verifiedAt: new Date(),
        };
      }

      // Todo correcto
      return {
        status: RnpiVerificationStatus.MEDICO_VERIFICADO,
        rut: request.rut,
        dv: request.dv,
        nameProvided: request.name,
        professionalData,
        verifiedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Error al validar profesional en RNPI:', error);

      // Si no se encuentra (404)
      if (error.response?.status === 404) {
        return {
          status: RnpiVerificationStatus.NO_MEDICO,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Profesional no encontrado en RNPI'],
        };
      }

      // Error de red o timeout
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          status: RnpiVerificationStatus.ERROR_VALIDACION,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Error de conexi�n con RNPI. Intente m�s tarde.'],
        };
      }

      // Otro error
      return {
        status: RnpiVerificationStatus.ERROR_VALIDACION,
        rut: request.rut,
        dv: request.dv,
        nameProvided: request.name,
        errors: [error.message || 'Error desconocido al consultar RNPI'],
      };
    }
  }

  /**
   * Verifica si la profesi�n es "M�dico Cirujano" o equivalente
   */
  private isMedicoProfession(profession: string): boolean {
    const normalized = this.normalizeString(profession);
    const medicoKeywords = ['medico', 'm�dico', 'cirujano', 'doctor', 'doctora'];
    
    return medicoKeywords.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Verifica si el estado es "Habilitado" o equivalente
   */
  private isHabilitadoStatus(status: string): boolean {
    const normalized = this.normalizeString(status);
    const habilitadoKeywords = ['habilitado', 'activo', 'vigente', 'valido'];
    
    return habilitadoKeywords.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Compara dos nombres y retorna un score (0-100)
   */
  private compareNames(name1: string, name2: string): number {
    const normalized1 = this.normalizeString(name1);
    const normalized2 = this.normalizeString(name2);

    if (normalized1 === normalized2) {
      return 100;
    }

    // Comparaci�n por palabras
    const words1 = normalized1.split(' ').filter((w) => w.length > 2);
    const words2 = normalized2.split(' ').filter((w) => w.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    let matches = 0;
    for (const word1 of words1) {
      if (words2.some((word2) => word1 === word2 || word1.includes(word2) || word2.includes(word1))) {
        matches++;
      }
    }

    return Math.round((matches / Math.max(words1.length, words2.length)) * 100);
  }

  /**
   * Normaliza string para comparaci�n
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default new RnpiVerificationService();
