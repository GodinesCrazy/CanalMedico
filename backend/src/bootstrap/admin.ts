/**
 * Bootstrap Admin User - ADMIN DE PRUEBAS OFICIAL
 * 
 * Crea automáticamente un usuario ADMIN DE PRUEBAS al iniciar el servidor.
 * SOLO se ejecuta si ENABLE_TEST_ADMIN=true.
 * 
 * IMPORTANTE:
 * - Busca EXCLUSIVAMENTE: admin@canalmedico.test
 * - IGNORA completamente: admin@canalmedico.com u otros usuarios
 * - NO modifica usuarios existentes (solo crea si no existe)
 * - NO toca producción ni admins reales
 * 
 * Esta función es 100% idempotente: si el usuario ya existe, no hace nada.
 * 
 * SEGURIDAD: Solo se ejecuta si ENABLE_TEST_ADMIN=true está configurado.
 */

import prisma from '@/database/prisma';
import { hashPassword } from '@/utils/hash';
import logger from '@/config/logger';
import env from '@/config/env';

// ADMIN DE PRUEBAS OFICIAL - NO MODIFICAR
const TEST_ADMIN_EMAIL = 'admin@canalmedico.test';
const TEST_ADMIN_PASSWORD = 'Admin123!';

/**
 * Verifica y crea el usuario ADMIN DE PRUEBAS si no existe
 * 
 * Lógica estricta:
 * IF ENABLE_TEST_ADMIN === true
 *   Buscar EXCLUSIVAMENTE por email = admin@canalmedico.test
 *   IF no existe usuario con email admin@canalmedico.test
 *     crear usuario: email, password hasheado, role ADMIN
 *   ELSE
 *     verificar que rol sea ADMIN, si no, actualizar SOLO el rol
 * END
 * 
 * GARANTÍAS:
 * - Solo busca admin@canalmedico.test (nunca admin@canalmedico.com)
 * - No modifica otros usuarios
 * - No borra usuarios existentes
 * - Usa hashPassword() (mismo método que login/registro)
 * 
 * @returns Promise<void>
 */
export async function bootstrapTestAdmin(): Promise<void> {
  // Verificar flag de habilitación (type-safe)
  const enableTestAdmin = (env as any).ENABLE_TEST_ADMIN ?? false;
  
  if (!enableTestAdmin) {
    logger.debug('[BOOTSTRAP] Admin de pruebas deshabilitado (ENABLE_TEST_ADMIN=false)');
    return;
  }

  try {
    // Log explícito del email que se busca
    logger.info(`[BOOTSTRAP] Verificando ADMIN de pruebas (${TEST_ADMIN_EMAIL})`);

    // Buscar EXCLUSIVAMENTE por admin@canalmedico.test
    // NOTA: Esta búsqueda IGNORA completamente admin@canalmedico.com u otros usuarios
    const existingAdmin = await prisma.user.findUnique({
      where: { email: TEST_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      // El usuario admin@canalmedico.test existe
      // Verificar que el rol sea ADMIN (por si acaso fue cambiado)
      if (existingAdmin.role !== 'ADMIN') {
        logger.warn(`[BOOTSTRAP] Usuario ${TEST_ADMIN_EMAIL} existe pero no es ADMIN, actualizando rol...`);
        await prisma.user.update({
          where: { email: TEST_ADMIN_EMAIL }, // Solo actualiza admin@canalmedico.test
          data: { role: 'ADMIN' },
        });
        logger.info(`[BOOTSTRAP] Rol actualizado a ADMIN para ${TEST_ADMIN_EMAIL}`);
      } else {
        logger.info(`[BOOTSTRAP] Admin de pruebas ya existe (${TEST_ADMIN_EMAIL})`);
      }
      return;
    }

    // El usuario admin@canalmedico.test NO existe, crearlo
    logger.info(`[BOOTSTRAP] Creando usuario ADMIN de pruebas (${TEST_ADMIN_EMAIL})...`);

    // Hashear contraseña usando el MISMO método que el login/registro (hashPassword)
    // Esto garantiza compatibilidad con comparePassword() usado en AuthService.login
    const hashedPassword = await hashPassword(TEST_ADMIN_PASSWORD);

    // Crear usuario ADMIN DE PRUEBAS
    // NOTA: Este create SOLO crea admin@canalmedico.test, nunca toca otros usuarios
    const adminUser = await prisma.user.create({
      data: {
        email: TEST_ADMIN_EMAIL, // admin@canalmedico.test (oficial)
        password: hashedPassword, // Hash compatible con login
        role: 'ADMIN',
      },
    });

    logger.info(`[BOOTSTRAP] Admin de pruebas creado correctamente`);
    logger.info(`[BOOTSTRAP] Email: ${TEST_ADMIN_EMAIL}`);
    logger.info(`[BOOTSTRAP] ID: ${adminUser.id}`);
    logger.info(`[BOOTSTRAP] Password: ${TEST_ADMIN_PASSWORD} (hasheado)`);
    logger.info('[BOOTSTRAP] ✅ Admin de pruebas listo para uso');

  } catch (error: any) {
    // No bloquear el inicio del servidor si falla el bootstrap
    logger.error(`[BOOTSTRAP] ❌ Error al crear admin de pruebas (${TEST_ADMIN_EMAIL}):`, error.message || error);
    logger.warn('[BOOTSTRAP] ⚠️ El servidor continuará iniciando sin admin de pruebas');
  }
}

