/**
 * Bootstrap Admin User - ADMIN DE PRUEBAS
 * 
 * Verifica y crea un usuario ADMIN al iniciar el servidor.
 * SOLO se ejecuta si ENABLE_TEST_ADMIN=true.
 * 
 * LÓGICA DE BÚSQUEDA:
 * - Busca AMBOS emails: admin@canalmedico.test y admin@canalmedico.com
 * - Si existe cualquiera: NO crear duplicados, usar el existente
 * - Si no existe ninguno: Crear admin@canalmedico.com (email de producción)
 * - Nunca crear dos admins
 * 
 * Esta función es 100% idempotente: si el usuario ya existe, no hace nada.
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
 * Verifica y crea el usuario ADMIN si no existe
 * 
 * Lógica:
 * IF ENABLE_TEST_ADMIN === true
 *   Buscar admin@canalmedico.test
 *   Buscar admin@canalmedico.com
 *   IF existe cualquiera:
 *     Verificar rol ADMIN, actualizar si es necesario
 *     NO crear duplicados
 *   ELSE (no existe ninguno):
 *     Crear admin@canalmedico.com con password Admin123!
 * END
 * 
 * GARANTÍAS:
 * - Busca AMBOS emails (test y prod)
 * - Si existe cualquiera, lo usa (no crea duplicados)
 * - Si no existe ninguno, crea admin@canalmedico.com
 * - Usa hashPassword() (mismo método que login/registro)
 * - Compatible con comparePassword() usado en login
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
  logger.info('[BOOTSTRAP] ========================================');

  try {
    // Buscar AMBOS emails (test y prod)
    logger.info(`[BOOTSTRAP] Buscando admin@canalmedico.test...`);
    const adminTest = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL_TEST },
    });

    logger.info(`[BOOTSTRAP] Buscando admin@canalmedico.com...`);
    const adminProd = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL_PROD },
    });

    // Determinar qué usuario usar (prioridad: test > prod)
    const existingAdmin = adminTest || adminProd;
    const existingEmail = adminTest ? ADMIN_EMAIL_TEST : (adminProd ? ADMIN_EMAIL_PROD : null);

    if (existingAdmin) {
      // Usuario ADMIN existe, verificar rol
      logger.info(`[BOOTSTRAP] Usuario ADMIN existente encontrado: ${existingEmail}`);
      
      if (existingAdmin.role !== 'ADMIN') {
        logger.warn(`[BOOTSTRAP] Usuario ${existingEmail} existe pero no es ADMIN, actualizando rol...`);
        await prisma.user.update({
          where: { email: existingEmail! },
          data: { role: 'ADMIN' },
        });
        logger.info(`[BOOTSTRAP] Rol actualizado a ADMIN para ${existingEmail}`);
      } else {
        logger.info(`[BOOTSTRAP] Usuario ADMIN ya existe con rol correcto: ${existingEmail}`);
      }
      
      // Log de credenciales para referencia
      logger.info(`[BOOTSTRAP] Email: ${existingEmail}`);
      logger.info(`[BOOTSTRAP] Password: ${ADMIN_PASSWORD} (si necesita resetear, use este valor)`);
      logger.info('[BOOTSTRAP] ✅ Admin bootstrap completado');
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
    logger.info('[BOOTSTRAP] ✅ Admin bootstrap completado');

  } catch (error: any) {
    // No bloquear el inicio del servidor si falla el bootstrap
    logger.error('[BOOTSTRAP] ❌ Error al crear/verificar admin:', error.message || error);
    logger.warn('[BOOTSTRAP] ⚠️ El servidor continuará iniciando sin admin de pruebas');
  }
}

