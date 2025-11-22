import cron from 'node-cron';
import payoutService from '@/modules/payouts/payout.service';
import logger from '@/config/logger';

/**
 * Job para procesar liquidaciones mensuales automáticamente
 * Se ejecuta diariamente a las 00:00 (medianoche)
 */
export function startPayoutJob() {
    // Ejecutar diariamente a las 00:00
    cron.schedule('0 0 * * *', async () => {
        try {
            logger.info('Iniciando proceso automático de liquidaciones mensuales...');
            const results = await payoutService.processMonthlyPayouts();
            logger.info(`Proceso de liquidaciones completado. ${results.length} liquidaciones procesadas.`);
        } catch (error) {
            logger.error('Error en el proceso automático de liquidaciones:', error);
        }
    });

    logger.info('Job de liquidaciones mensuales iniciado (ejecuta diariamente a las 00:00)');
}

/**
 * Procesar liquidaciones manualmente (para testing o ejecución manual)
 */
export async function processPayoutsManually() {
    try {
        logger.info('Procesando liquidaciones manualmente...');
        const results = await payoutService.processMonthlyPayouts();
        logger.info(`Liquidaciones procesadas manualmente: ${results.length}`);
        return results;
    } catch (error) {
        logger.error('Error al procesar liquidaciones manualmente:', error);
        throw error;
    }
}
