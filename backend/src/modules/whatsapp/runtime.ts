/**
 * WhatsApp Module - Runtime Wrapper
 * 
 * Este archivo actúa como wrapper runtime para el módulo WhatsApp.
 * SOLO se ejecuta en runtime cuando se requiere dinámicamente.
 * 
 * TypeScript NO analiza este archivo durante la compilación si no se importa estáticamente.
 */

import { Application } from 'express';
import whatsappRoutes from './whatsapp.routes';
import logger from '@/config/logger';

/**
 * Registra las rutas de WhatsApp en la aplicación Express
 * 
 * @param app - Instancia de Express Application
 */
export function register(app: Application): void {
  try {
    app.use('/api/whatsapp', whatsappRoutes);
    logger.info('[BOOT] WhatsApp cargado correctamente');
  } catch (error: any) {
    logger.error('[BOOT] Error al registrar rutas de WhatsApp:', error.message || error);
    throw error;
  }
}

