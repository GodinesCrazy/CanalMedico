/**
 * WhatsApp Module - Templates
 * 
 * Templates de mensajes de WhatsApp aprobados por Meta.
 * 
 * Estos templates deben ser aprobados en Meta Business Manager
 * antes de poder usarse en producción.
 * 
 * Este módulo está preparado para la Fase 2, pero actualmente
 * no contiene lógica de negocio (solo estructura).
 */

import { WhatsAppTemplate } from './whatsapp.types';

/**
 * Template: Redirección a CanalMedico
 * 
 * Template que se envía automáticamente cuando un paciente
 * escribe por WhatsApp al médico.
 * 
 * IMPORTANTE: Este template debe estar aprobado en Meta Business Manager
 * antes de poder usarse en producción.
 * 
 * Contenido del template (ejemplo):
 * "Hola 👋 Gracias por contactar a {{1}}.
 * 
 * Para atender tu consulta médica de forma profesional, por favor ingresa aquí:
 * {{2}}
 * 
 * ✅ Respuesta garantizada en 24 horas
 * ✅ Recetas electrónicas válidas
 * ✅ Historial médico completo
 * 
 * CanalMedico - Tu salud, nuestra prioridad"
 * 
 * Parámetros:
 * - {{1}}: Nombre del médico
 * - {{2}}: Deep link a CanalMedico
 */
export const CONSULTATION_REDIRECT_TEMPLATE: WhatsAppTemplate = {
  name: 'consultation_redirect',
  language: 'es',
  components: [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: '{{1}}', // Nombre del médico
        },
        {
          type: 'text',
          text: '{{2}}', // Deep link
        },
      ],
    },
  ],
};

/**
 * Template: Envío de OTP
 * 
 * Template que se envía cuando se solicita un OTP para login.
 * 
 * Parámetros:
 * - {{1}}: Código OTP de 6 dígitos
 */
export const OTP_TEMPLATE: WhatsAppTemplate = {
  name: 'otp_verification',
  language: 'es',
  components: [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: '{{1}}', // Código OTP
        },
      ],
    },
  ],
};

/**
 * Obtener template por nombre
 * 
 * @param templateName - Nombre del template
 * @returns Template o null si no existe
 */
export function getTemplate(templateName: string): WhatsAppTemplate | null {
  const templates: Record<string, WhatsAppTemplate> = {
    consultation_redirect: CONSULTATION_REDIRECT_TEMPLATE,
    otp_verification: OTP_TEMPLATE,
  };

  return templates[templateName] || null;
}

