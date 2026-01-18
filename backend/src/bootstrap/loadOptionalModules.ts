/**
 * Load Optional Modules
 * 
 * Carga módulos opcionales del sistema usando require() dinámico.
 * TypeScript NO analiza require() con strings literales durante la compilación.
 * 
 * Este loader permite que el backend compile y arranque incluso si
 * módulos opcionales (como WhatsApp) no están disponibles o tienen errores.
 */

import { Application } from 'express';
import logger from '@/config/logger';

/**
 * Carga módulos opcionales del sistema
 * 
 * Módulos cargados:
 * - WhatsApp: SIEMPRE se monta (para que Meta pueda validar webhook GET challenge)
 *            El controller verifica el feature flag internamente
 * 
 * @param app - Instancia de Express Application
 */
export async function loadOptionalModules(app: Application): Promise<void> {
  logger.info('[BOOT] Inicializando módulos opcionales');

  // CRÍTICO: Montar SIEMPRE el router de WhatsApp para que Meta pueda validar el webhook
  // El controller verifica el feature flag internamente y devuelve 404 si está desactivado
  // Pero el endpoint DEBE existir para que Meta pueda hacer GET /api/whatsapp/webhook (challenge)
  const enableWhatsApp = process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true';
  
  try {
    // Usar require() dinámico con string literal
    // TypeScript NO analiza require() con strings literales durante la compilación
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whatsappModule = require('../modules/whatsapp/runtime');
    
    if (whatsappModule && typeof whatsappModule.register === 'function') {
      whatsappModule.register(app);
      if (enableWhatsApp) {
        logger.info('[BOOT] WhatsApp router montado (feature flag ACTIVO)');
      } else {
        logger.info('[BOOT] WhatsApp router montado (feature flag DESACTIVADO - webhook disponible para validación Meta)');
      }
    } else {
      throw new Error('Módulo WhatsApp no exporta función register');
    }
  } catch (error: any) {
    logger.warn('[BOOT] WhatsApp no disponible, continuando sin él');
    logger.warn(`[BOOT] Razón: ${error?.message || 'Error desconocido'}`);
    // No bloquear el inicio del servidor si WhatsApp no está disponible
  }

  logger.info('[BOOT] Módulos opcionales inicializados');
}

