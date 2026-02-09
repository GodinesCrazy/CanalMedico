import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import env from '@/config/env';
import logger from '@/config/logger';

// Inicializar cliente de MercadoPago
const client = new MercadoPagoConfig({ accessToken: env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000' });

export class MercadoPagoService {
    private preference: Preference;
    private payment: Payment;

    constructor() {
        this.preference = new Preference(client);
        this.payment = new Payment(client);
    }

    /**
     * Crea una preferencia de pago para una consulta
     */
    async createPreference(consultationId: string, title: string, price: number, payerEmail: string, successUrl?: string, cancelUrl?: string) {
        // PROD-SAFE: payer.email nunca null/undefined
        const safeEmail = typeof payerEmail === 'string' && payerEmail.trim() ? payerEmail.trim() : 'paciente@canalmedico.cl';
        // Precio seguro: nunca NaN ni <= 0
        const safePrice = Number.isFinite(price) && price > 0 ? price : 0;

        try {
            const backUrls = {
                success: successUrl || `${env.FRONTEND_WEB_URL || env.API_URL}/consultations/${consultationId}?status=success`,
                failure: cancelUrl || `${env.FRONTEND_WEB_URL || env.API_URL}/consultations/${consultationId}?status=failure`,
                pending: `${env.FRONTEND_WEB_URL || env.API_URL}/consultations/${consultationId}?status=pending`,
            };

            const result = await this.preference.create({
                body: {
                    items: [{ id: consultationId, title, quantity: 1, unit_price: safePrice, currency_id: 'CLP' }],
                    payer: { email: safeEmail },
                    back_urls: backUrls,
                    auto_return: 'approved',
                    notification_url: `${env.API_URL}/api/payments/webhook`,
                    external_reference: consultationId,
                },
            });

            // Log quirúrgico: response sin tokens
            logger.info('MercadoPago createPreference response', {
                hasResult: !!result,
                id: result?.id,
                hasInitPoint: !!result?.init_point,
                hasSandboxInitPoint: !!result?.sandbox_init_point,
            });

            return {
                id: result?.id,
                init_point: result?.init_point,
                sandbox_init_point: result?.sandbox_init_point,
            };
        } catch (error: unknown) {
            const err = error as {
                message?: string;
                response?: { status?: number; data?: unknown };
                cause?: Array<{ description?: string; code?: string }>;
                api_response?: { status?: number; body?: unknown };
            };
            // Log quirúrgico: sin tokens, útil para Railway
            logger.error('MercadoPago createPreference error', {
                message: err?.message,
                statusCode: err?.response?.status ?? err?.api_response?.status,
                cause: err?.cause?.slice(0, 2)?.map((c) => ({ code: c?.code, desc: c?.description })),
            });
            throw error;
        }
    }

    /**
     * Obtiene información de un pago por ID
     */
    async getPaymentInfo(paymentId: string) {
        try {
            return await this.payment.get({ id: paymentId });
        } catch (error) {
            logger.error(`Error obteniendo pago ${paymentId}:`, error);
            throw error;
        }
    }
}

export default new MercadoPagoService();
