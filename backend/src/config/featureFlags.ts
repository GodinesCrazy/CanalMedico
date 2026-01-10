/**
 * Feature Flags Configuration
 * 
 * Sistema simple de feature flags para activar/desactivar funcionalidades
 * sin necesidad de redeploy.
 * 
 * Por defecto, todas las funcionalidades nuevas están DESACTIVADAS
 * para no afectar el sistema en producción.
 * 
 * Para activar una funcionalidad, configurar la variable de entorno
 * correspondiente en `true` (string "true").
 */

import env from './env';

/**
 * Feature flags disponibles
 * 
 * Cada flag se lee de variables de entorno y por defecto es `false`.
 * Esto garantiza que las funcionalidades nuevas no se activen accidentalmente.
 */
export const featureFlags = {
  /**
   * WhatsApp Auto-Response
   * 
   * Activa la funcionalidad de auto-respuesta de WhatsApp Cloud API.
   * Cuando está activo, el sistema intercepta mensajes de WhatsApp y
   * envía auto-respuestas con links a CanalMedico.
   * 
   * Variable de entorno: ENABLE_WHATSAPP_AUTO_RESPONSE
   * Por defecto: false
   */
  WHATSAPP_AUTO_RESPONSE: process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true',

  /**
   * Phone Login (OTP)
   * 
   * Activa la funcionalidad de login/registro con número de teléfono
   * usando OTP (One-Time Password) por WhatsApp o SMS.
   * 
   * Variable de entorno: ENABLE_PHONE_LOGIN
   * Por defecto: false
   */
  PHONE_LOGIN: process.env.ENABLE_PHONE_LOGIN === 'true',

  /**
   * Quick Consultation
   * 
   * Activa la funcionalidad de creación rápida de consultas desde
   * deep links de WhatsApp, con flujo simplificado (OTP → Auto-login → Auto-crea consulta).
   * 
   * Variable de entorno: ENABLE_QUICK_CONSULTATION
   * Por defecto: false
   */
  QUICK_CONSULTATION: process.env.ENABLE_QUICK_CONSULTATION === 'true',
} as const;

/**
 * Tipo de feature flags (para TypeScript)
 */
export type FeatureFlag = keyof typeof featureFlags;

/**
 * Verificar si un feature flag está activo
 * 
 * @param flag - Nombre del feature flag
 * @returns true si está activo, false si no
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}

/**
 * Obtener todos los feature flags activos
 * 
 * @returns Array con los nombres de los feature flags activos
 */
export function getActiveFeatures(): FeatureFlag[] {
  return Object.keys(featureFlags).filter(
    (flag) => featureFlags[flag as FeatureFlag]
  ) as FeatureFlag[];
}

/**
 * Log de feature flags activos (solo en desarrollo)
 */
if (env.NODE_ENV === 'development') {
  const activeFeatures = getActiveFeatures();
  if (activeFeatures.length > 0) {
    console.log('🔧 Feature flags activos:', activeFeatures.join(', '));
  } else {
    console.log('🔧 Todos los feature flags están desactivados (comportamiento por defecto)');
  }
}

