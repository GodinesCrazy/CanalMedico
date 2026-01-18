/**
 * Load Optional Modules
 * 
 * Carga m?dulos opcionales del sistema usando require() din?mico.
 * TypeScript NO analiza require() con strings literales durante la compilaci?n.
 * 
 * Este loader permite que el backend compile y arranque incluso si
 * m?dulos opcionales (como WhatsApp) no est?n disponibles o tienen errores.
 */

import { Application, Router, Request, Response } from 'express';
import logger from '@/config/logger';
import env from '@/config/env';

/**
 * Carga m?dulos opcionales del sistema
 * 
 * M?dulos cargados:
 * - WhatsApp: SIEMPRE se monta (para que Meta pueda validar webhook GET challenge)
 *            El controller verifica el feature flag internamente
 * 
 * @param app - Instancia de Express Application
 */
export async function loadOptionalModules(app: Application): Promise<void> {
  logger.info('[BOOT] Inicializando m?dulos opcionales');

  // CR?TICO: Montar SIEMPRE el router de WhatsApp para que Meta pueda validar el webhook
  // El controller verifica el feature flag internamente y devuelve 404 si est? desactivado
  // Pero el endpoint DEBE existir para que Meta pueda hacer GET /api/whatsapp/webhook (challenge)
  const enableWhatsApp = process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true';
  
  let whatsappRouterMounted = false;
  
  try {
    // Usar require() din?mico con string literal
    // TypeScript NO analiza require() con strings literales durante la compilaci?n
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whatsappModule = require('../modules/whatsapp/runtime');
    
    if (whatsappModule && typeof whatsappModule.register === 'function') {
      whatsappModule.register(app);
      whatsappRouterMounted = true;
      if (enableWhatsApp) {
        logger.info('[BOOT] WhatsApp router montado (feature flag ACTIVO)');
      } else {
        logger.info('[BOOT] WhatsApp router montado (feature flag DESACTIVADO - webhook disponible para validaci?n Meta)');
      }
    } else {
      throw new Error('M?dulo WhatsApp no exporta funci?n register');
    }
  } catch (error: any) {
    logger.warn('[BOOT] WhatsApp module failed to load, mounting fallback webhook handler');
    logger.warn(`[BOOT] Raz?n: ${error?.message || 'Error desconocido'}`);
    
    // CR?TICO: Montar router m?nimo de fallback para que Meta pueda validar el webhook
    // Este router maneja SOLO el GET challenge, que es lo m?nimo necesario para Meta
    const fallbackRouter = Router();
    
    // GET /api/whatsapp/webhook - Challenge de verificaci?n de Meta
    fallbackRouter.get('/webhook', (req: Request, res: Response) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('[WHATSAPP] Webhook verified by Meta (GET challenge - fallback handler)', {
          challenge: challenge ? 'present' : 'missing',
          featureFlag: enableWhatsApp ? 'ACTIVE' : 'INACTIVE',
        });
        return res.status(200).send(challenge);
      }
      
      logger.warn('[WHATSAPP] Webhook verification failed (GET challenge - fallback handler)', {
        mode,
        tokenProvided: !!token,
        featureFlag: enableWhatsApp ? 'ACTIVE' : 'INACTIVE',
      });
      return res.status(403).send('Forbidden');
    });
    
    // POST /api/whatsapp/webhook - Responder OK pero no procesar si el flag est? desactivado
    fallbackRouter.post('/webhook', (_req: Request, res: Response) => {
      if (!enableWhatsApp) {
        logger.debug('[WHATSAPP] POST webhook recibido pero feature flag desactivado (fallback handler)');
        return res.status(200).json({ status: 'ok', message: 'Feature not enabled' });
      }
      
      // Si el flag est? activo pero el m?dulo fall?, responder OK para evitar reintentos
      logger.warn('[WHATSAPP] POST webhook recibido pero m?dulo no disponible (fallback handler)');
      return res.status(200).json({ status: 'ok', message: 'Module not available' });
    });
    
    app.use('/api/whatsapp', fallbackRouter);
    logger.info('[BOOT] WhatsApp fallback router montado (webhook challenge disponible)');
    whatsappRouterMounted = true;
  }
  
  if (!whatsappRouterMounted) {
    logger.error('[BOOT] CR?TICO: No se pudo montar el router de WhatsApp (ni principal ni fallback)');
  }

  logger.info('[BOOT] M?dulos opcionales inicializados');
}
