import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Payment, Doctor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import { formatCLP } from '@/utils/currency';

type PayoutStats = {
  totalEarnings: number;
  pendingAmount: number;
  paidOutAmount: number;
};

type PayoutBatch = {
  id: string;
  period: string;
  totalAmount: number;
  paymentCount: number;
  processedAt: string;
};

export default function EarningsPage() {
  const user = useAuthStore((state) => state.user);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalEarnings: 0,
    pendingAmount: 0,
    paidOutAmount: 0,
  });
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setIsLoading(true);
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      // Cargar perfil del médico para saber su modalidad de pago
      const profileResponse = await api.get(`/doctors/${doctorId}`);
      if (profileResponse.success && profileResponse.data) {
        setDoctor(profileResponse.data as any);
      }

      // Cargar estadísticas de pagos
      const statsResponse = await api.get('/payouts/my-stats');
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as any);
      }

      // Cargar pagos
      const paymentsResponse = await api.get<Payment[]>(`/payments/doctor/${doctorId}`);
      if (paymentsResponse.success && paymentsResponse.data) {
        const payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
        setPayments(payments);
      }

      // Cargar liquidaciones (si es modo mensual)
      const payoutsResponse = await api.get<{ data: PayoutBatch[] }>('/payouts/my-payouts');
      if (payoutsResponse.success && payoutsResponse.data) {
        setPayoutBatches(payoutsResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPayoutStatusBadge = (payment: any) => {
    const status = payment.payoutStatus || 'PENDING';

    if (status === 'PAID_OUT') {
      return <span className="badge badge-success">Liquidado</span>;
    } else if (status === 'SCHEDULED') {
      return <span className="badge badge-warning">Programado</span>;
    } else {
      return <span className="badge badge-secondary">Pendiente</span>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ingresos</h1>
        <p className="text-gray-600 mt-2">Revisa tus ingresos y pagos</p>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Earnings */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCLP(stats.totalEarnings)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FiDollarSign className="text-blue-600 h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo Pendiente</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCLP(stats.pendingAmount)}</p>
              {doctor?.payoutMode === 'MONTHLY' && (
                <p className="text-xs text-gray-500 mt-1">
                  Se liquidará el día {doctor.payoutDay}
                </p>
              )}
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <FiClock className="text-yellow-600 h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Paid Out Amount */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ya Liquidado</p>
              <p className="text-2xl font-bold text-green-600">{formatCLP(stats.paidOutAmount)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <FiCheckCircle className="text-green-600 h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="card mb-6">
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado Pago</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado Liquidación</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{formatCLP(Number(payment.amount))}</td>
                    <td className="py-3 px-4 text-red-600">-{formatCLP(Number(payment.fee))}</td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {formatCLP(Number(payment.netAmount))}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${payment.status === 'PAID' ? 'badge-success' : 'badge-warning'
                          }`}
                      >
                        {payment.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getPayoutStatusBadge(payment)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Liquidaciones (solo para modo mensual) */}
      {doctor?.payoutMode === 'MONTHLY' && payoutBatches.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Liquidaciones Mensuales</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Consultas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Monto Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha Liquidación</th>
                </tr>
              </thead>
              <tbody>
                {payoutBatches.map((batch) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{batch.period}</td>
                    <td className="py-3 px-4 text-gray-600">{batch.paymentCount}</td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {formatCLP(Number(batch.totalAmount))}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {batch.processedAt
                        ? new Date(batch.processedAt).toLocaleDateString()
                        : 'Pendiente'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
