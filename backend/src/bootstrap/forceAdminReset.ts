/**
 * Force Admin Password Reset - RESET FORZADO TEMPORAL
 * 
 * ⚠️ TEMPORAL: Este código debe eliminarse después de usar en producción.
 * 
 * Ejecuta un reset forzado de la contraseña del admin cuando:
 * FORCE_ADMIN_PASSWORD_RESET === 'true'
 * 
 * Lógica exacta:
 * - Busca admin@canalmedico.com
 * - Si existe: Resetea password a Admin123!
 * - Si NO existe: Crea admin@canalmedico.com con password Admin123!
 * - Siempre asegura role = ADMIN
 */

import prisma from '@/database/prisma';
import { hashPassword } from '@/utils/hash';
import logger from '@/config/logger';

const ADMIN_EMAIL = 'admin@canalmedico.com';
const ADMIN_PASSWORD = 'Admin123!';

/**
 * Ejecuta reset forzado de contraseña ADMIN
 * 
 * SOLO se ejecuta si FORCE_ADMIN_PASSWORD_RESET === 'true'
 * 
 * @returns Promise<void>
 */
export async function forceAdminPasswordReset(): Promise<void> {
  const forceReset = process.env.FORCE_ADMIN_PASSWORD_RESET === 'true';

  if (!forceReset) {
    logger.debug('[FORCE-ADMIN] Reset forzado deshabilitado (FORCE_ADMIN_PASSWORD_RESET !== true)');
    return;
  }

  logger.info('[FORCE-ADMIN] ========================================');
  logger.info('[FORCE-ADMIN] Ejecutando reset forzado de ADMIN');
  logger.info('[FORCE-ADMIN] FORCE_ADMIN_PASSWORD_RESET=true');
  logger.info('[FORCE-ADMIN] ========================================');

  try {
    // Buscar admin@canalmedico.com con SELECT explícito
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        role: true,
        // NO incluir phoneNumber - evitar errores Prisma P2022
      },
    });

    if (existingAdmin) {
      // Usuario existe → RESETEAR contraseña
      logger.info('[FORCE-ADMIN] Usuario encontrado → password reseteado');

      const hashedPassword = await hashPassword(ADMIN_PASSWORD);

      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      logger.info('[FORCE-ADMIN] Password reseteado correctamente');
      logger.info('[FORCE-ADMIN] Rol ADMIN confirmado');
    } else {
      // Usuario NO existe → CREAR
      logger.info('[FORCE-ADMIN] Usuario no existía → creado');

      const hashedPassword = await hashPassword(ADMIN_PASSWORD);

      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      logger.info('[FORCE-ADMIN] Usuario ADMIN creado correctamente');
    }

    logger.info(`[FORCE-ADMIN] Email: ${ADMIN_EMAIL}`);
    logger.info(`[FORCE-ADMIN] Password: ${ADMIN_PASSWORD}`);
    logger.info('[FORCE-ADMIN] Proceso completado');
    logger.info('[FORCE-ADMIN] ✅ Reset forzado completado correctamente');

  } catch (error: any) {
    logger.error('[FORCE-ADMIN] ❌ Error en reset forzado:', error.message || error);
    logger.warn('[FORCE-ADMIN] ⚠️ El servidor continuará iniciando sin reset forzado');
    // No bloquear el arranque si falla
  }
}

