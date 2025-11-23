import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';

type PayoutMode = 'IMMEDIATE' | 'MONTHLY';

interface PayoutSettingsData {
    payoutMode: PayoutMode;
    payoutDay: number;
    bankAccountInfo?: string;
}

export function PayoutSettings() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [payoutMode, setPayoutMode] = useState<PayoutMode>('IMMEDIATE');
    const [payoutDay, setPayoutDay] = useState(5);
    const [bankAccountInfo, setBankAccountInfo] = useState('');

    // Cargar configuración actual
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (user?.profile?.id) {
                    const response = await api.get(`/doctors/${user.profile.id}`);
                    if (response.data && response.data.data) {
                        const doctor = response.data.data;

                        if (doctor.payoutMode) setPayoutMode(doctor.payoutMode);
                        if (doctor.payoutDay) setPayoutDay(doctor.payoutDay);
                        if (doctor.bankAccountInfo) setBankAccountInfo(doctor.bankAccountInfo);
                    }
                }
            } catch (error) {
                console.error('Error al cargar configuración:', error);
            }
        };

        loadSettings();
    }, [user]);

    const handleSave = async () => {
        try {
            setLoading(true);

            if (!user?.profile?.id) {
                toast.error('No se pudo identificar al médico');
                return;
            }

            await api.patch(`/doctors/${user.profile.id}/payout-settings`, {
                payoutMode,
                payoutDay,
                bankAccountInfo: bankAccountInfo || undefined,
            });

            toast.success('Configuración de pago actualizada exitosamente');
        } catch (error: any) {
            console.error('Error al guardar configuración:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar configuración');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Modalidad de Pago</h3>

            <div className="space-y-6">
                {/* Opción Pago Inmediato */}
                <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                        type="radio"
                        value="IMMEDIATE"
                        checked={payoutMode === 'IMMEDIATE'}
                        onChange={(e) => setPayoutMode(e.target.value as PayoutMode)}
                        className="mt-1"
                    />
                    <div className="flex-1">
                        <span className="font-medium text-gray-900">Pago Inmediato</span>
                        <p className="text-sm text-gray-600 mt-1">
                            Recibe el pago por cada consulta abonada. El dinero queda disponible inmediatamente después de que el paciente pague.
                        </p>
                    </div>
                </label>

                {/* Opción Pago Mensual */}
                <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                        type="radio"
                        value="MONTHLY"
                        checked={payoutMode === 'MONTHLY'}
                        onChange={(e) => setPayoutMode(e.target.value as PayoutMode)}
                        className="mt-1"
                    />
                    <div className="flex-1">
                        <span className="font-medium text-gray-900">Pago Mensual Consolidado</span>
                        <p className="text-sm text-gray-600 mt-1">
                            Recibe todos los pagos del mes en una sola transferencia. Ideal para simplificar tu contabilidad.
                        </p>
                    </div>
                </label>

                {/* Configuración día de liquidación (solo para modo mensual) */}
                {payoutMode === 'MONTHLY' && (
                    <div className="ml-6 p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Día de liquidación mensual
                        </label>
                        <select
                            value={payoutDay}
                            onChange={(e) => setPayoutDay(Number(e.target.value))}
                            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <option key={day} value={day}>
                                    Día {day} de cada mes
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Los pagos del mes se consolidarán y transferirán el día {payoutDay} de cada mes.
                        </p>
                    </div>
                )}

                {/* Información bancaria (opcional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Información bancaria (opcional)
                    </label>
                    <textarea
                        value={bankAccountInfo}
                        onChange={(e) => setBankAccountInfo(e.target.value)}
                        placeholder="Ej: Banco Estado, Cuenta Corriente, N° 12345678"
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Esta información es solo para tu referencia. Las transferencias se coordinarán con el equipo de CanalMedico.
                    </p>
                </div>

                {/* Botón guardar */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
}
