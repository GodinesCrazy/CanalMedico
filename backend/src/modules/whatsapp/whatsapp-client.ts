/**
 * WhatsApp Cloud API Client
 * 
 * Cliente para interactuar con WhatsApp Cloud API de Meta.
 * 
 * Documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import axios, { AxiosInstance } from 'axios';
import env from '@/config/env';
import logger from '@/config/logger';
import { WhatsAppSendResponse } from './whatsapp.types';

export class WhatsAppClient {
  private api: AxiosInstance;
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = env.WHATSAPP_API_VERSION || 'v21.0';

    this.api = axios.create({
      baseURL: `https://graph.facebook.com/${this.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos
    });
  }

  /**
   * Verificar si el cliente está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  /**
   * Enviar template de mensaje por WhatsApp
   * 
   * @param to - Número de teléfono destinatario (formato: 56912345678)
   * @param templateName - Nombre del template aprobado
   * @param languageCode - Código de idioma (ej: 'es')
   * @param parameters - Parámetros del template
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'es',
    parameters: string[] = []
  ): Promise<WhatsAppSendResponse> {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp Cloud API no está configurado. Verifica las variables de entorno.');
    }

    try {
      // Normalizar número de teléfono (remover +, espacios, guiones)
      const normalizedPhone = this.normalizePhoneNumber(to);

      // Construir componentes del template
      const components: any[] = [];

      if (parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          ...(components.length > 0 && { components }),
        },
      };

      logger.info('Enviando template de WhatsApp', {
        to: normalizedPhone,
        templateName,
        phoneNumberId: this.phoneNumberId,
      });

      const response = await this.api.post<WhatsAppSendResponse>(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      logger.info('Template de WhatsApp enviado exitosamente', {
        messageId: response.data.messages[0]?.id,
        to: normalizedPhone,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error al enviar template de WhatsApp', {
        error: error.message,
        response: error.response?.data,
        to,
        templateName,
      });
      throw new Error(`Error al enviar mensaje de WhatsApp: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Normalizar número de teléfono
   * 
   * WhatsApp requiere números en formato internacional sin + ni espacios
   * Ejemplo: +56 9 1234 5678 -> 56912345678
   */
  private normalizePhoneNumber(phone: string): string {
    // Remover todos los caracteres no numéricos excepto el primer + si existe
    return phone.replace(/\D/g, '');
  }

  /**
   * Verificar webhook signature de Meta
   * 
   * Meta envía un header X-Hub-Signature-256 con la signature HMAC SHA256
   * del payload usando el App Secret.
   * 
   * @param payload - Payload del webhook (string)
   * @param signature - Signature del header X-Hub-Signature-256
   * @returns true si la signature es válida
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!env.WHATSAPP_APP_SECRET) {
      logger.warn('WHATSAPP_APP_SECRET no configurado, no se puede verificar signature');
      // En desarrollo, permitir sin verificación si no está configurado
      if (env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', env.WHATSAPP_APP_SECRET)
        .update(payload)
        .digest('hex');

      // Meta envía signature como "sha256=..." o directamente el hash
      const receivedSignature = signature.replace('sha256=', '');

      // Comparación segura (timing-safe)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
      );

      if (!isValid) {
        logger.warn('Signature de webhook inválida', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: receivedSignature.substring(0, 10) + '...',
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Error al verificar signature de webhook', error);
      return false;
    }
  }
}

export default new WhatsAppClient();

