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
 * - WhatsApp: Solo si ENABLE_WHATSAPP_AUTO_RESPONSE=true
 * 
 * @param app - Instancia de Express Application
 */
export async function loadOptionalModules(app: Application): Promise<void> {
  logger.info('[BOOT] Inicializando módulos opcionales');

  // Cargar módulo WhatsApp si está habilitado
  // Usar process.env directamente para evitar problemas de tipos en TypeScript
  const enableWhatsApp = process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true';
  
  if (enableWhatsApp) {
    try {
      // Usar require() dinámico con string literal
      // TypeScript NO analiza require() con strings literales durante la compilación
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const whatsappModule = require('../modules/whatsapp/runtime');
      
      if (whatsappModule && typeof whatsappModule.register === 'function') {
        whatsappModule.register(app);
        logger.info('[BOOT] WhatsApp cargado correctamente');
      } else {
        throw new Error('Módulo WhatsApp no exporta función register');
      }
    } catch (error: any) {
      logger.warn('[BOOT] WhatsApp no disponible, continuando sin él');
      logger.warn(`[BOOT] Razón: ${error?.message || 'Error desconocido'}`);
      // No bloquear el inicio del servidor si WhatsApp no está disponible
    }
  } else {
    logger.debug('[BOOT] WhatsApp deshabilitado (ENABLE_WHATSAPP_AUTO_RESPONSE=false)');
  }

  logger.info('[BOOT] Módulos opcionales inicializados');
}

