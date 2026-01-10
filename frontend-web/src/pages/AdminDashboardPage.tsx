import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare, FiDollarSign, FiActivity, FiUsers, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatCLP } from '@/utils/currency';

type AdminMetrics = {
  totalConsultations: number;
  activeConsultations: number;
  consultationsThisMonth: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalCommissions: number;
  monthlyCommissions: number;
  activeDoctors: number;
  totalDoctors: number;
  pendingSignupRequests: number;
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<AdminMetrics>('/admin/dashboard-metrics');
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar métricas administrativas:', error);
      toast.error(error.message || 'Error al cargar métricas');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = metrics ? [
    {
      name: 'Total Consultas',
      value: metrics.totalConsultations,
      icon: FiMessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Consultas Activas',
      value: metrics.activeConsultations,
      icon: FiActivity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Consultas del Mes',
      value: metrics.consultationsThisMonth,
      icon: FiTrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Ingresos Totales',
      value: formatCLP(Number(metrics.totalEarnings)),
      icon: FiDollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Ingresos del Mes',
      value: formatCLP(Number(metrics.monthlyEarnings)),
      icon: FiDollarSign,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      name: 'Comisiones Totales',
      value: formatCLP(Number(metrics.totalCommissions)),
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Médicos Activos',
      value: `${metrics.activeDoctors} / ${metrics.totalDoctors}`,
      icon: FiUsers,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      name: 'Solicitudes Pendientes',
      value: metrics.pendingSignupRequests,
      icon: FiAlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/admin/signup-requests'),
    },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Bienvenido, {user?.email || 'Administrador'}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando métricas administrativas...</p>
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`card ${stat.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                  onClick={stat.onClick}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`${stat.color} h-6 w-6`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de comisiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen Financiero</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ingresos Totales:</span>
                  <span className="font-bold text-green-600">{formatCLP(Number(metrics.totalEarnings))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ingresos del Mes:</span>
                  <span className="font-bold text-blue-600">{formatCLP(Number(metrics.monthlyEarnings))}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Comisiones Totales:</span>
                  <span className="font-bold text-purple-600">{formatCLP(Number(metrics.totalCommissions))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comisiones del Mes:</span>
                  <span className="font-bold text-indigo-600">{formatCLP(Number(metrics.monthlyCommissions))}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen Operacional</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Consultas:</span>
                  <span className="font-bold">{metrics.totalConsultations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Consultas Activas:</span>
                  <span className="font-bold text-green-600">{metrics.activeConsultations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Consultas del Mes:</span>
                  <span className="font-bold text-blue-600">{metrics.consultationsThisMonth}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Médicos Activos:</span>
                  <span className="font-bold">{metrics.activeDoctors} / {metrics.totalDoctors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Solicitudes Pendientes:</span>
                  <button
                    onClick={() => navigate('/admin/signup-requests')}
                    className="font-bold text-orange-600 hover:text-orange-700 underline"
                  >
                    {metrics.pendingSignupRequests}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/admin/signup-requests')}
                className="btn btn-primary flex items-center justify-center"
              >
                <FiUsers className="mr-2 h-5 w-5" />
                Revisar Solicitudes
              </button>
              <button
                onClick={() => navigate('/commissions')}
                className="btn btn-secondary flex items-center justify-center"
              >
                <FiDollarSign className="mr-2 h-5 w-5" />
                Ver Comisiones
              </button>
              <button
                onClick={() => navigate('/consultations')}
                className="btn btn-secondary flex items-center justify-center"
              >
                <FiMessageSquare className="mr-2 h-5 w-5" />
                Ver Consultas
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No se pudieron cargar las métricas</p>
          <button
            onClick={loadDashboardData}
            className="btn btn-primary mt-4"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

