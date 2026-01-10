/**
 * WhatsApp Module - Routes
 * 
 * Rutas para el módulo de WhatsApp.
 * 
 * FASE 2: Rutas implementadas con autenticación y feature flags.
 */

import { Router } from 'express';
import { featureFlags } from '@/config/featureFlags';
import { authenticate, requireRole } from '@/middlewares/auth.middleware';
import whatsappController from './whatsapp.controller';

const router = Router();

/**
 * Webhook público de WhatsApp Cloud API
 * 
 * POST /api/whatsapp/webhook (para recibir mensajes)
 * GET /api/whatsapp/webhook (para verificación de Meta)
 * 
 * Este endpoint NO requiere autenticación (Meta valida con signature).
 * Solo está activo si el feature flag está habilitado.
 */
router.all('/webhook', whatsappController.webhook.bind(whatsappController));

/**
 * Listar intentos de WhatsApp no convertidos
 * 
 * GET /api/whatsapp/attempts/pending
 * 
 * Requiere autenticación DOCTOR
 * Solo está activo si el feature flag está habilitado.
 */
if (featureFlags.WHATSAPP_AUTO_RESPONSE) {
  router.get(
    '/attempts/pending',
    authenticate,
    requireRole('DOCTOR'),
    whatsappController.getPendingAttempts.bind(whatsappController)
  );

  /**
   * Obtener estadísticas de WhatsApp
   * 
   * GET /api/whatsapp/stats
   * 
   * Requiere autenticación DOCTOR
   */
  router.get(
    '/stats',
    authenticate,
    requireRole('DOCTOR'),
    whatsappController.getStats.bind(whatsappController)
  );

  /**
   * Reenviar link a paciente
   * 
   * POST /api/whatsapp/attempts/:id/resend-link
   * 
   * Requiere autenticación DOCTOR
   */
  router.post(
    '/attempts/:id/resend-link',
    authenticate,
    requireRole('DOCTOR'),
    whatsappController.resendLink.bind(whatsappController)
  );
} else {
  // Endpoints deshabilitados (retornan 404)
  router.get('/attempts/pending', (_req, res) => {
    res.status(404).json({ error: 'Feature not enabled' });
  });
  router.get('/stats', (_req, res) => {
    res.status(404).json({ error: 'Feature not enabled' });
  });
  router.post('/attempts/:id/resend-link', (_req, res) => {
    res.status(404).json({ error: 'Feature not enabled' });
  });
}

export default router;

