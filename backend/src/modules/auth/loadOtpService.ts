/**
 * Load OTP Service
 * 
 * Carga el servicio OTP de forma dinámica usando require().
 * TypeScript NO analiza require() con strings literales durante la compilación.
 * 
 * Este loader permite que el backend compile y arranque incluso si
 * el módulo OTP no está disponible o tiene errores.
 */

import logger from '@/config/logger';

let otpServiceInstance: any = null;
let otpServiceLoaded = false;

/**
 * Carga el servicio OTP dinámicamente
 * 
 * @returns Instancia del servicio OTP o null si no está disponible
 */
export function loadOtpService(): any {
  // Si ya se intentó cargar, retornar el resultado cacheado
  if (otpServiceLoaded) {
    return otpServiceInstance;
  }

  otpServiceLoaded = true;

  // Verificar feature flag
  const enablePhoneLogin = process.env.ENABLE_PHONE_LOGIN === 'true';

  if (!enablePhoneLogin) {
    logger.debug('[OTP] Servicio OTP deshabilitado (ENABLE_PHONE_LOGIN=false)');
    return null;
  }

  try {
    // Usar require() dinámico con string literal
    // TypeScript NO analiza require() con strings literales durante la compilación
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const otpModule = require('./otp.service');

    if (otpModule && otpModule.default) {
      otpServiceInstance = otpModule.default;
      logger.info('[OTP] Servicio OTP cargado correctamente');
      return otpServiceInstance;
    } else {
      throw new Error('Módulo OTP no exporta default');
    }
  } catch (error: any) {
    logger.warn('[OTP] Servicio OTP no disponible, continuando sin él');
    logger.warn(`[OTP] Razón: ${error?.message || 'Error desconocido'}`);
    otpServiceInstance = null;
    return null;
  }
}

