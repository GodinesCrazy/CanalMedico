/**
 * Proveedor de validaci�n de identidad usando Floid
 * Floid es un servicio que permite validar RUN contra Registro Civil de Chile
 */

import axios, { AxiosInstance } from 'axios';
import env from '@/config/env';
import logger from '@/config/logger';
import {
  IdentityVerificationProvider,
  IdentityVerificationRequest,
  IdentityVerificationResult,
  IdentityVerificationStatus,
} from './identity-verification.types';

export class FloidProvider implements IdentityVerificationProvider {
  private client: AxiosInstance;
  private apiKey?: string;
  private baseUrl: string;

  constructor() {
    // URL base de Floid API (ajustar seg�n documentaci�n oficial)
    this.baseUrl = env.FLOID_BASE_URL || 'https://api.floid.cl/v1';
    this.apiKey = env.FLOID_API_KEY;

    const timeout = env.RC_TIMEOUT_MS || env.FLOID_TIMEOUT_MS || 10000;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      },
    });
  }

  getName(): string {
    return 'FLOID';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Health check simple
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error: any) {
      const errorMsg = error?.message || String(error) || 'Error desconocido';
      logger.warn('Floid provider no disponible:', { message: errorMsg });
      return false;
    }
  }

  async verifyIdentity(
    request: IdentityVerificationRequest
  ): Promise<IdentityVerificationResult> {
    try {
      if (!this.apiKey) {
        throw new Error('FLOID_API_KEY no configurada');
      }

      const rutFormatted = `${request.rut}-${request.dv}`;

      logger.info('Validando identidad con Floid', {
        rut: rutFormatted,
        name: request.name,
      });

      // Llamada a API de Floid para validar RUN
      // NOTA: Ajustar endpoint y estructura seg�n documentaci�n oficial de Floid
      const response = await this.client.post('/identity/verify', {
        rut: request.rut,
        dv: request.dv,
        name: request.name,
        ...(request.birthDate && { birthDate: request.birthDate }),
      });

      const data = response.data;

      // Procesar respuesta de Floid
      if (data.valid === true && data.match === true) {
        // RUN v�lido y nombre coincide
        return {
          status: IdentityVerificationStatus.IDENTIDAD_VERIFICADA,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          nameOfficial: data.officialName || request.name,
          birthDateOfficial: data.birthDate || request.birthDate,
          idCardStatus: data.idCardStatus || 'NO_DISPONIBLE',
          matchScore: data.matchScore || 100,
          provider: 'FLOID',
          verifiedAt: new Date(),
        };
      } else if (data.valid === true && data.match === false) {
        // RUN v�lido pero nombre no coincide
        return {
          status: IdentityVerificationStatus.IDENTIDAD_NO_COINCIDE,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          nameOfficial: data.officialName,
          birthDateOfficial: data.birthDate,
          matchScore: data.matchScore || 0,
          errors: ['El nombre proporcionado no coincide con el nombre registrado en el Registro Civil'],
          provider: 'FLOID',
          verifiedAt: new Date(),
        };
      } else if (data.valid === false) {
        // RUN inv�lido
        return {
          status: IdentityVerificationStatus.RUN_INVALIDO,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['El RUN proporcionado no es v�lido o no existe en el Registro Civil'],
          provider: 'FLOID',
          verifiedAt: new Date(),
        };
      }

      // Respuesta inesperada
      throw new Error('Respuesta inesperada de Floid');
    } catch (error: any) {
      // Extraer mensaje primero para evitar circular structure
      let errorMessageForLog = error?.message || String(error) || 'Error desconocido';
      logger.error('Error al validar identidad con Floid:', { message: errorMessageForLog, rut: request.rut });

      // Si es error de red o timeout
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          status: IdentityVerificationStatus.ERROR_VALIDACION,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Error de conexi�n con el servicio de validaci�n. Intente m�s tarde.'],
          provider: 'FLOID',
        };
      }

      // Si es error de autenticaci�n
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          status: IdentityVerificationStatus.ERROR_VALIDACION,
          rut: request.rut,
          dv: request.dv,
          nameProvided: request.name,
          errors: ['Error de autenticaci�n con el servicio de validaci�n.'],
          provider: 'FLOID',
        };
      }

      // Otro error - extraer mensaje de forma segura
      let errorMessage = 'Error desconocido al validar identidad';
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
        provider: 'FLOID',
      };
    }
  }
}



