/**
 * WhatsApp Module - Runtime Wrapper
 * 
 * Este archivo actúa como wrapper runtime para el módulo WhatsApp.
 * SOLO se ejecuta en runtime cuando se requiere dinámicamente.
 * 
 * IMPORTANTE: Usa require() dinámico para que TypeScript NO analice los imports
 * durante la compilación.
 */

import { Application } from 'express';
import logger from '@/config/logger';

/**
 * Registra las rutas de WhatsApp en la aplicación Express
 * 
 * @param app - Instancia de Express Application
 */
export function register(app: Application): void {
  try {
    // Usar require() dinámico para cargar las rutas
    // TypeScript NO analiza require() con strings literales durante la compilación
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whatsappRoutes = require('./whatsapp.routes');
    
    if (whatsappRoutes && whatsappRoutes.default) {
      app.use('/api/whatsapp', whatsappRoutes.default);
      logger.info('[BOOT] WhatsApp cargado correctamente');
    } else {
      throw new Error('Módulo WhatsApp no exporta default');
    }
  } catch (error: any) {
    logger.error('[BOOT] Error al registrar rutas de WhatsApp:', error.message || error);
    throw error;
  }
}

