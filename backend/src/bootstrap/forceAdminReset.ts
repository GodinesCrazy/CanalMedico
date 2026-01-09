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
      logger.info('[FORCE-ADMIN] Usuario encontrado → reseteando password...');
      logger.info(`[FORCE-ADMIN] Usuario ID: ${existingAdmin.id}`);
      logger.info(`[FORCE-ADMIN] Email: ${existingAdmin.email}`);
      logger.info(`[FORCE-ADMIN] Rol actual: ${existingAdmin.role}`);

      logger.info('[FORCE-ADMIN] Hasheando nueva contraseña...');
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      logger.info('[FORCE-ADMIN] Contraseña hasheada correctamente');

      logger.info('[FORCE-ADMIN] Ejecutando prisma.user.update()...');
      try {
        const updatedUser = await prisma.user.update({
          where: { email: ADMIN_EMAIL },
          data: {
            password: hashedPassword,
            role: 'ADMIN',
            // NO incluir phoneNumber ni ningún otro campo que no existe
          },
          select: {
            id: true,
            email: true,
            role: true,
            // Solo campos esenciales para confirmar
          },
        });

        logger.info('[FORCE-ADMIN] ✅ prisma.user.update() completado exitosamente');
        logger.info(`[FORCE-ADMIN] Usuario actualizado - ID: ${updatedUser.id}, Email: ${updatedUser.email}, Rol: ${updatedUser.role}`);
        logger.info('[FORCE-ADMIN] Password reseteado correctamente');
        logger.info('[FORCE-ADMIN] Rol ADMIN confirmado');
      } catch (updateError: any) {
        logger.error('[FORCE-ADMIN] ❌ ERROR en prisma.user.update():', updateError.message || updateError);
        logger.error('[FORCE-ADMIN] Código de error:', updateError.code || 'DESCONOCIDO');
        logger.error('[FORCE-ADMIN] Stack completo:', updateError.stack || 'No disponible');
        throw updateError; // Re-lanzar para que se capture en el catch externo
      }
    } else {
      // Usuario NO existe → CREAR
      logger.info('[FORCE-ADMIN] Usuario no existía → creando...');

      logger.info('[FORCE-ADMIN] Hasheando contraseña...');
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      logger.info('[FORCE-ADMIN] Contraseña hasheada correctamente');

      logger.info('[FORCE-ADMIN] Ejecutando prisma.user.create()...');
      try {
        const createdUser = await prisma.user.create({
          data: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'ADMIN',
            // NO incluir phoneNumber ni ningún otro campo que no existe
          },
          select: {
            id: true,
            email: true,
            role: true,
            // Solo campos esenciales para confirmar
          },
        });

        logger.info('[FORCE-ADMIN] ✅ prisma.user.create() completado exitosamente');
        logger.info(`[FORCE-ADMIN] Usuario creado - ID: ${createdUser.id}, Email: ${createdUser.email}, Rol: ${createdUser.role}`);
        logger.info('[FORCE-ADMIN] Usuario ADMIN creado correctamente');
      } catch (createError: any) {
        logger.error('[FORCE-ADMIN] ❌ ERROR en prisma.user.create():', createError.message || createError);
        logger.error('[FORCE-ADMIN] Código de error:', createError.code || 'DESCONOCIDO');
        logger.error('[FORCE-ADMIN] Stack completo:', createError.stack || 'No disponible');
        throw createError; // Re-lanzar para que se capture en el catch externo
      }
    }

    logger.info(`[FORCE-ADMIN] Email: ${ADMIN_EMAIL}`);
    logger.info(`[FORCE-ADMIN] Password: ${ADMIN_PASSWORD}`);
    logger.info('[FORCE-ADMIN] Proceso completado');
    logger.info('[FORCE-ADMIN] ✅ Reset forzado completado correctamente');

  } catch (error: any) {
    logger.error('[FORCE-ADMIN] ========================================');
    logger.error('[FORCE-ADMIN] ❌ ERROR CRÍTICO en reset forzado');
    logger.error('[FORCE-ADMIN] ========================================');
    logger.error('[FORCE-ADMIN] Mensaje:', error.message || 'Error desconocido');
    logger.error('[FORCE-ADMIN] Código:', error.code || 'DESCONOCIDO');
    logger.error('[FORCE-ADMIN] Nombre:', error.name || 'Error');
    
    // Log detallado del error Prisma si existe
    if (error.code === 'P2022') {
      logger.error('[FORCE-ADMIN] ERROR PRISMA P2022: Columna no existe en la base de datos');
      logger.error('[FORCE-ADMIN] Esto significa que Prisma intentó acceder a una columna que no existe');
      logger.error('[FORCE-ADMIN] Verificar schema.prisma vs base de datos real');
    }
    
    if (error.meta) {
      logger.error('[FORCE-ADMIN] Metadata del error:', JSON.stringify(error.meta, null, 2));
    }
    
    logger.error('[FORCE-ADMIN] Stack trace:', error.stack || 'No disponible');
    logger.error('[FORCE-ADMIN] ========================================');
    logger.warn('[FORCE-ADMIN] ⚠️ El servidor continuará iniciando sin reset forzado');
    // No bloquear el arranque si falla
  }
}

