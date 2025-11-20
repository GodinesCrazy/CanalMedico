import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Payment, Doctor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiDollarSign } from 'react-icons/fi';

export default function EarningsPage() {
  const user = useAuthStore((state) => state.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setIsLoading(true);
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      const response = await api.get(`/payments/doctor/${doctorId}`);
      if (response.success) {
        setPayments(response.data || []);
        const total = (response.data || []).reduce(
          (sum: number, payment: Payment) => sum + Number(payment.netAmount),
          0
        );
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ingresos</h1>
        <p className="text-gray-600 mt-2">Revisa tus ingresos y pagos</p>
      </div>

      {/* Total Earnings */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
            <p className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <FiDollarSign className="text-yellow-600 h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Pagos</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Monto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Comisión</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Neto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">${Number(payment.amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-red-600">-${Number(payment.fee).toFixed(2)}</td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      ${Number(payment.netAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          payment.status === 'PAID' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

