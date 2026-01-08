/**
 * Bootstrap Admin User
 * 
 * Crea automáticamente un usuario ADMIN de pruebas al iniciar el servidor.
 * SOLO se ejecuta si ENABLE_TEST_ADMIN=true.
 * 
 * Esta función es idempotente: si el usuario ya existe, no hace nada.
 * 
 * SEGURIDAD: Solo se ejecuta si ENABLE_TEST_ADMIN=true está configurado.
 */

import prisma from '@/database/prisma';
import { hashPassword } from '@/utils/hash';
import logger from '@/config/logger';
import env from '@/config/env';

const TEST_ADMIN_EMAIL = 'admin@canalmedico.test';
const TEST_ADMIN_PASSWORD = 'Admin123!';

/**
 * Verifica y crea el usuario ADMIN de pruebas si no existe
 * 
 * Lógica:
 * IF ENABLE_TEST_ADMIN === true
 *   IF no existe usuario con email admin@canalmedico.test
 *     crear usuario: email, password hasheado, role ADMIN
 *   ELSE
 *     verificar que rol sea ADMIN, si no, actualizar
 * END
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
    logger.info('[BOOTSTRAP] Verificando usuario ADMIN de pruebas...');

    // Verificar si el usuario ya existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: TEST_ADMIN_EMAIL },
    });

    if (existingAdmin) {
      // Verificar que el rol sea ADMIN (por si acaso fue cambiado)
      if (existingAdmin.role !== 'ADMIN') {
        logger.warn(`[BOOTSTRAP] Usuario ${TEST_ADMIN_EMAIL} existe pero no es ADMIN, actualizando...`);
        await prisma.user.update({
          where: { email: TEST_ADMIN_EMAIL },
          data: { role: 'ADMIN' },
        });
        logger.info('[BOOTSTRAP] Rol actualizado a ADMIN');
      } else {
        logger.info('[BOOTSTRAP] Usuario ADMIN ya existe');
      }
      return;
    }

    // El usuario NO existe, crearlo
    logger.info('[BOOTSTRAP] Creando usuario ADMIN de pruebas...');

    // Hashear contraseña usando el MISMO método que el login (hashPassword)
    const hashedPassword = await hashPassword(TEST_ADMIN_PASSWORD);

    // Crear usuario ADMIN
    const adminUser = await prisma.user.create({
      data: {
        email: TEST_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    logger.info('[BOOTSTRAP] Usuario ADMIN creado correctamente');
    logger.info(`[BOOTSTRAP] Email: ${TEST_ADMIN_EMAIL}`);
    logger.info(`[BOOTSTRAP] ID: ${adminUser.id}`);
    logger.info('[BOOTSTRAP] ✅ Admin de pruebas listo para uso');

  } catch (error: any) {
    // No bloquear el inicio del servidor si falla el bootstrap
    logger.error('[BOOTSTRAP] ❌ Error al crear admin de pruebas:', error.message || error);
    logger.warn('[BOOTSTRAP] ⚠️ El servidor continuará iniciando sin admin de pruebas');
  }
}

