/**
 * Cliente para interactuar con la API FHIR del SNRE
 * Maneja autenticaci�n, env�o de recetas y consulta de estados
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import env from '@/config/env';
import logger from '@/config/logger';
import { SnreResponse, SnreError } from './snre.types';
import { createError } from '@/middlewares/error.middleware';

export class SnreClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    // URL base del SNRE (sandbox o producci�n)
    this.baseUrl = env.SNRE_BASE_URL || 'https://snre-sandbox.minsal.cl/fhir'; // URL de ejemplo
    this.apiKey = env.SNRE_API_KEY;

    // Crear instancia de axios con configuraci�n base
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    // Interceptor para logging de requests
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`SNRE Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('SNRE Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`SNRE Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        logger.error('SNRE Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Crea una receta en el SNRE enviando un Bundle FHIR
   */
  async createReceta(fhirBundle: any): Promise<SnreResponse> {
    try {
      if (!this.baseUrl) {
        throw createError('SNRE_BASE_URL no configurada', 500);
      }

      logger.info('Enviando receta al SNRE', {
        bundleType: fhirBundle.type,
        timestamp: fhirBundle.timestamp,
      });

      // Enviar Bundle al endpoint de recetas del SNRE
      // Seg�n la gu�a del MINSAL, el endpoint t�pico es: POST /Bundle
      const response = await this.client.post('/Bundle', fhirBundle);

      // Procesar respuesta del SNRE
      if (response.status === 201 || response.status === 200) {
        const bundleResponse = response.data;

        // Extraer identificadores de la respuesta
        const snreId = bundleResponse.id;
        const snreCode = this.extractRecetaCode(bundleResponse);
        const bundleId = bundleResponse.id;

        logger.info('Receta creada exitosamente en SNRE', {
          snreId,
          snreCode,
          bundleId,
        });

        return {
          success: true,
          snreId,
          snreCode,
          bundleId,
          message: 'Receta registrada exitosamente en SNRE',
        };
      }

      throw createError('Respuesta inesperada del SNRE', 500);
    } catch (error: any) {
      logger.error('Error al crear receta en SNRE:', error);

      // Manejar errores espec�ficos
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        // Error de autenticaci�n
        if (status === 401 || status === 403) {
          return {
            success: false,
            errors: [{
              code: 'AUTH_ERROR',
              severity: 'error',
              message: 'Error de autenticaci�n con SNRE. Verifique las credenciales.',
            }],
          };
        }

        // Error de validaci�n (400)
        if (status === 400) {
          const validationErrors = this.parseValidationErrors(errorData);
          return {
            success: false,
            errors: validationErrors,
          };
        }

        // Error del servidor SNRE (500+)
        if (status >= 500) {
          return {
            success: false,
            errors: [{
              code: 'SNRE_SERVER_ERROR',
              severity: 'error',
              message: 'Error en el servidor SNRE. Intente m�s tarde.',
              details: errorData,
            }],
          };
        }

        // Otros errores
        return {
          success: false,
          errors: [{
            code: 'UNKNOWN_ERROR',
            severity: 'error',
            message: errorData?.issue?.[0]?.details?.text || 'Error desconocido al comunicarse con SNRE',
            details: errorData,
          }],
        };
      }

      // Error de red o timeout
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          errors: [{
            code: 'TIMEOUT',
            severity: 'error',
            message: 'Timeout al comunicarse con SNRE. Verifique su conexi�n.',
          }],
        };
      }

      // Error desconocido
      return {
        success: false,
        errors: [{
          code: 'UNKNOWN_ERROR',
          severity: 'error',
          message: error.message || 'Error desconocido',
        }],
      };
    }
  }

  /**
   * Consulta una receta en el SNRE por su ID
   */
  async getReceta(snreId: string): Promise<any> {
    try {
      const response = await this.client.get(`/Bundle/${snreId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Error al consultar receta ${snreId} en SNRE:`, error);
      throw createError('Error al consultar receta en SNRE', 500);
    }
  }

  /**
   * Extrae el c�digo de la receta de la respuesta del SNRE
   * El c�digo puede estar en diferentes lugares seg�n la implementaci�n del SNRE
   */
  private extractRecetaCode(bundleResponse: any): string | undefined {
    // Buscar en identifier del Bundle
    if (bundleResponse.identifier) {
      const identifier = bundleResponse.identifier.find((id: any) => 
        id.system?.includes('snre') || id.type?.coding?.[0]?.code === 'RECETA-CODE'
      );
      if (identifier?.value) {
        return identifier.value;
      }
    }

    // Buscar en Composition (si est� en el Bundle)
    if (bundleResponse.entry) {
      const composition = bundleResponse.entry.find((entry: any) => 
        entry.resource?.resourceType === 'Composition'
      );
      if (composition?.resource?.identifier?.[0]?.value) {
        return composition.resource.identifier[0].value;
      }
    }

    return undefined;
  }

  /**
   * Parsea errores de validaci�n del SNRE
   */
  private parseValidationErrors(errorData: any): SnreError[] {
    const errors: SnreError[] = [];

    // Formato est�ndar de error FHIR (OperationOutcome)
    if (errorData.resourceType === 'OperationOutcome' && errorData.issue) {
      errorData.issue.forEach((issue: any) => {
        errors.push({
          code: issue.code || 'VALIDATION_ERROR',
          severity: issue.severity || 'error',
          message: issue.details?.text || issue.diagnostics || 'Error de validaci�n',
          details: issue,
        });
      });
    } else if (errorData.errors) {
      // Formato alternativo
      errorData.errors.forEach((err: any) => {
        errors.push({
          code: err.code || 'VALIDATION_ERROR',
          severity: 'error',
          message: err.message || 'Error de validaci�n',
          details: err,
        });
      });
    } else {
      // Error gen�rico
      errors.push({
        code: 'VALIDATION_ERROR',
        severity: 'error',
        message: errorData.message || 'Error de validaci�n en SNRE',
        details: errorData,
      });
    }

    return errors;
  }

  /**
   * Verifica la conectividad con el SNRE
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Intentar hacer un GET al endpoint de capabilities (CapabilityStatement)
      const response = await this.client.get('/metadata', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.warn('SNRE health check fall�:', error);
      return false;
    }
  }
}

export default new SnreClient();
