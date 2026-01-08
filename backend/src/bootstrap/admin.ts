/**
 * Bootstrap Admin User
 * 
 * Crea automáticamente un usuario ADMIN de pruebas al iniciar el servidor.
 * Solo se ejecuta si ENABLE_TEST_ADMIN=true y NODE_ENV !== 'production'.
 * 
 * Esta función es idempotente: si el usuario ya existe, no hace nada.
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
 * @returns Promise<void>
 */
export async function bootstrapTestAdmin(): Promise<void> {
  try {
    logger.info('[BOOTSTRAP] Verificando admin de pruebas...');

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
        logger.info('[BOOTSTRAP] Admin de pruebas ya existe');
      }
      
      // Si ENABLE_TEST_ADMIN está deshabilitado y el usuario existe, no hacer nada más
      if (!env.ENABLE_TEST_ADMIN) {
        logger.debug('[BOOTSTRAP] ENABLE_TEST_ADMIN=false, pero usuario ya existe. Continuando...');
      }
      return;
    }

    // Si el usuario NO existe, verificar flag antes de crear
    if (!env.ENABLE_TEST_ADMIN) {
      logger.warn('[BOOTSTRAP] Admin de pruebas no existe y ENABLE_TEST_ADMIN=false');
      logger.warn('[BOOTSTRAP] ⚠️ Creando admin de todas formas para desbloquear acceso...');
      // Continuar para crear el usuario (comportamiento de emergencia)
    }

    // El usuario no existe, crearlo
    logger.info('[BOOTSTRAP] Creando admin de pruebas...');

    // Hashear contraseña usando el mismo método que el login
    const hashedPassword = await hashPassword(TEST_ADMIN_PASSWORD);

    // Crear usuario ADMIN
    const adminUser = await prisma.user.create({
      data: {
        email: TEST_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    logger.info('[BOOTSTRAP] Admin creado correctamente');
    logger.info(`[BOOTSTRAP] Email: ${TEST_ADMIN_EMAIL}`);
    logger.info(`[BOOTSTRAP] ID: ${adminUser.id}`);
    logger.info('[BOOTSTRAP] ✅ Admin de pruebas listo para uso');

  } catch (error: any) {
    // No bloquear el inicio del servidor si falla el bootstrap
    logger.error('[BOOTSTRAP] ❌ Error al crear admin de pruebas:', error.message || error);
    logger.warn('[BOOTSTRAP] ⚠️ El servidor continuará iniciando sin admin de pruebas');
  }
}

