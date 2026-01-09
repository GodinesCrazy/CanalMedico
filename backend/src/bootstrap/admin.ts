/**
 * Bootstrap Admin User - ADMIN DE PRUEBAS
 * 
 * Verifica, crea o resetea un usuario ADMIN al iniciar el servidor.
 * SOLO se ejecuta si ENABLE_TEST_ADMIN=true.
 * 
 * LÓGICA:
 * - Busca AMBOS emails: admin@canalmedico.test y admin@canalmedico.com
 * - Si existe cualquiera: RESETEAR contraseña a Admin123! y asegurar rol ADMIN
 * - Si no existe ninguno: Crear admin@canalmedico.com con password Admin123!
 * - Nunca crear dos admins
 * - SIEMPRE dejar la contraseña conocida cuando el flag está activo
 * 
 * Esta función es 100% idempotente y siempre resetea la contraseña cuando está habilitada.
 * 
 * SEGURIDAD: Solo se ejecuta si ENABLE_TEST_ADMIN=true está configurado.
 */

import prisma from '@/database/prisma';
import { hashPassword } from '@/utils/hash';
import logger from '@/config/logger';
import env from '@/config/env';

// Emails a verificar (en orden de prioridad)
const ADMIN_EMAIL_TEST = 'admin@canalmedico.test';
const ADMIN_EMAIL_PROD = 'admin@canalmedico.com';
const ADMIN_PASSWORD = 'Admin123!';

/**
 * Verifica, crea o resetea el usuario ADMIN
 * 
 * Lógica exacta:
 * IF ENABLE_TEST_ADMIN === true
 *   buscar usuario con email:
 *     - admin@canalmedico.com
 *     - admin@canalmedico.test
 *   IF no existe ninguno:
 *     crear usuario admin@canalmedico.com
 *       password: Admin123!
 *       role: ADMIN
 *       password hasheado usando hashPassword()
 *   ELSE:
 *     actualizar password del usuario encontrado
 *       password: Admin123!
 *       (rehash usando hashPassword())
 *     asegurar role = ADMIN
 * END
 * 
 * GARANTÍAS:
 * - Busca AMBOS emails (test y prod)
 * - Si existe cualquiera, RESETEA la contraseña a Admin123!
 * - Si no existe ninguno, crea admin@canalmedico.com
 * - Usa hashPassword() (mismo método que login/registro)
 * - Compatible con comparePassword() usado en login
 * - Idempotente: puede ejecutarse múltiples veces
 * - No crea duplicados
 * 
 * @returns Promise<void>
 */
export async function bootstrapTestAdmin(): Promise<void> {
  // Verificar flag de habilitación (type-safe)
  // IMPORTANTE: NO se verifica NODE_ENV. Solo ENABLE_TEST_ADMIN controla la ejecución.
  const enableTestAdmin = (env as any).ENABLE_TEST_ADMIN ?? false;
  
  if (!enableTestAdmin) {
    logger.info('[BOOTSTRAP] Admin bootstrap deshabilitado (ENABLE_TEST_ADMIN=false)');
    return;
  }

  logger.info('[BOOTSTRAP] ========================================');
  logger.info('[BOOTSTRAP] Verificando usuario ADMIN');
  logger.info('[BOOTSTRAP] ENABLE_TEST_ADMIN=true');
  logger.info('[BOOTSTRAP] ========================================');

  try {
    // Buscar AMBOS emails (test y prod)
    logger.info(`[BOOTSTRAP] Buscando admin@canalmedico.test...`);
    const adminTest = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL_TEST },
      select: {
        id: true,
        email: true,
        role: true,
        // NO incluir phoneNumber - evitar errores Prisma P2022
      },
    });

    logger.info(`[BOOTSTRAP] Buscando admin@canalmedico.com...`);
    const adminProd = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL_PROD },
      select: {
        id: true,
        email: true,
        role: true,
        // NO incluir phoneNumber - evitar errores Prisma P2022
      },
    });

    // Determinar qué usuario usar (prioridad: test > prod)
    const existingAdmin = adminTest || adminProd;
    const existingEmail = adminTest ? ADMIN_EMAIL_TEST : (adminProd ? ADMIN_EMAIL_PROD : null);

    if (existingAdmin) {
      // Usuario ADMIN existe, RESETEAR contraseña y asegurar rol
      logger.info(`[BOOTSTRAP] Usuario ADMIN encontrado: ${existingEmail}`);

      // Hashear nueva contraseña usando el MISMO método que el login/registro (hashPassword)
      // Esto garantiza compatibilidad con comparePassword() usado en AuthService.login
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);

      // Actualizar contraseña y rol (siempre reseteamos cuando el flag está activo)
      const updateData: any = {
        password: hashedPassword, // Resetear contraseña a Admin123!
        role: 'ADMIN', // Asegurar rol ADMIN
      };

      await prisma.user.update({
        where: { email: existingEmail! },
        data: updateData,
      });

      logger.info(`[BOOTSTRAP] Password ADMIN reseteado correctamente`);
      logger.info(`[BOOTSTRAP] Rol ADMIN confirmado`);
      logger.info(`[BOOTSTRAP] Email: ${existingEmail}`);
      logger.info(`[BOOTSTRAP] Password: ${ADMIN_PASSWORD} (hasheado)`);
      logger.info('[BOOTSTRAP] ✅ Bootstrap ADMIN completado');
      return;
    }

    // NO existe ningún admin, crear admin@canalmedico.com
    logger.info(`[BOOTSTRAP] No se encontró usuario ADMIN. Creando ${ADMIN_EMAIL_PROD}...`);

    // Hashear contraseña usando el MISMO método que el login/registro (hashPassword)
    // Esto garantiza compatibilidad con comparePassword() usado en AuthService.login
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // Crear usuario ADMIN (usar email de producción por defecto)
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL_PROD, // admin@canalmedico.com (producción)
        password: hashedPassword, // Hash compatible con login
        role: 'ADMIN',
      },
    });

    logger.info('[BOOTSTRAP] Usuario ADMIN creado correctamente');
    logger.info(`[BOOTSTRAP] Email: ${ADMIN_EMAIL_PROD}`);
    logger.info(`[BOOTSTRAP] ID: ${adminUser.id}`);
    logger.info(`[BOOTSTRAP] Password: ${ADMIN_PASSWORD} (hasheado)`);
    logger.info('[BOOTSTRAP] ✅ Bootstrap ADMIN completado');

  } catch (error: any) {
    // No bloquear el inicio del servidor si falla el bootstrap
    logger.error('[BOOTSTRAP] ❌ Error al crear/verificar admin:', error.message || error);
    logger.warn('[BOOTSTRAP] ⚠️ El servidor continuará iniciando sin admin de pruebas');
  }
}

