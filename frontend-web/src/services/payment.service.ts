import api from './api';

export interface CreatePaymentPreferenceDto {
    consultationId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface PaymentPreference {
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
}

/**
 * Crea una preferencia de pago en MercadoPago
 */
export async function createPaymentPreference(
    data: CreatePaymentPreferenceDto
): Promise<PaymentPreference> {
    const response = await api.post<PaymentPreference>('/payments/create-session', data);

    if (!response.success || !response.data) {
        throw new Error('Error al crear preferencia de pago');
    }

    return response.data;
}

/**
 * Obtiene información de un pago por consulta
 */
export async function getPaymentByConsultation(consultationId: string) {
    const response = await api.get(`/payments/consultation/${consultationId}`);
    return response.data;
}
