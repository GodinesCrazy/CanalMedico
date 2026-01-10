/**
 * WhatsApp Module - Types
 * 
 * Tipos TypeScript para el módulo de WhatsApp.
 * 
 * Este módulo está preparado para la Fase 2, pero actualmente
 * no contiene lógica de negocio (solo estructura).
 */

/**
 * Mensaje recibido de WhatsApp Cloud API
 */
export interface WhatsAppMessage {
  from: string; // Número de teléfono del remitente
  to: string; // Número de teléfono del destinatario (médico)
  text?: {
    body: string;
  };
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: string;
  messageId: string;
}

/**
 * Payload del webhook de WhatsApp Cloud API
 */
export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

/**
 * Template de mensaje de WhatsApp
 */
export interface WhatsAppTemplate {
  name: string;
  language: string;
  components?: Array<{
    type: 'body' | 'header' | 'button';
    parameters?: Array<{
      type: 'text';
      text: string;
    }>;
  }>;
}

/**
 * Respuesta de envío de mensaje
 */
export interface WhatsAppSendResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

