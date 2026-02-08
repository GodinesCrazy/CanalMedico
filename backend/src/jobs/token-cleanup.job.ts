import cron from 'node-cron';
import prisma from '@/database/prisma';
import logger from '@/config/logger';

/**
 * Job para limpiar tokens expirados de la blacklist
 * Se ejecuta diariamente a las 02:00 (después del job de payouts)
 * 
 * Elimina tokens que ya expiraron (expiresAt < now)
 * Esto mantiene la tabla de blacklist limpia y evita crecimiento infinito
 */
export function startTokenCleanupJob() {
  // Ejecutar diariamente a las 02:00
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Iniciando limpieza de tokens expirados de blacklist...');
      
      const now = new Date();
      const result = await prisma.tokenBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: now, // expiresAt < now
          },
        },
      });
      
      logger.info(`Limpieza de tokens completada. ${result.count} tokens expirados eliminados.`);
    } catch (error) {
      logger.error('Error en limpieza de tokens expirados:', error);
    }
  });

  logger.info('Job de limpieza de tokens iniciado (ejecuta diariamente a las 02:00)');
}

/**
 * Limpiar tokens expirados manualmente (para testing o ejecución manual)
 */
export async function cleanupExpiredTokensManually() {
  try {
    logger.info('Limpiando tokens expirados manualmente...');
    
    const now = new Date();
    const result = await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    
    logger.info(`Tokens expirados eliminados manualmente: ${result.count}`);
    return result.count;
  } catch (error) {
    logger.error('Error al limpiar tokens expirados manualmente:', error);
    throw error;
  }
}

