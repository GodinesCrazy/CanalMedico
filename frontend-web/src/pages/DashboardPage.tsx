import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Consultation, Doctor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare, FiUsers, FiDollarSign, FiActivity, FiPower } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [statistics, setStatistics] = useState({
    totalConsultations: 0,
    activeConsultations: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
  });
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      // Obtener estadísticas
      const statsResponse = await api.get(`/doctors/${doctorId}/statistics`);
      if (statsResponse.success && statsResponse.data) {
        setStatistics(statsResponse.data);
      }

      // Obtener consultas recientes
      const consultationsResponse = await api.get(`/consultations/doctor/${doctorId}?limit=5`);
      if (consultationsResponse.success && consultationsResponse.data) {
        setRecentConsultations(consultationsResponse.data || []);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const doctorId = (user?.profile as Doctor)?.id;
      if (!doctorId) return;

      const currentStatus = (user?.profile as Doctor)?.estadoOnline || false;
      const response = await api.put(`/doctors/${doctorId}/online-status`, {
        estadoOnline: !currentStatus,
      });

      if (response.success && response.data) {
        toast.success(
          `Estado ${!currentStatus ? 'activado' : 'desactivado'} correctamente`
        );
        // Recargar perfil para actualizar estado
        const profileResponse = await api.get('/users/profile');
        if (profileResponse.success && profileResponse.data) {
          const updatedUser = { ...user, profile: profileResponse.data };
          useAuthStore.getState().setUser(updatedUser);
        }
        loadDashboardData(); // Recargar dashboard
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado');
    }
  };

  const stats = [
    {
      name: 'Consultas Totales',
      value: statistics.totalConsultations,
      icon: FiMessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Consultas Activas',
      value: statistics.activeConsultations,
      icon: FiActivity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Ingresos Totales',
      value: `$${statistics.totalEarnings.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Ingresos del Mes',
      value: `$${statistics.monthlyEarnings.toFixed(2)}`,
      icon: FiDollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido, {(user?.profile as Doctor)?.name || 'Doctor'}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
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

      {/* Recent Consultations */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Consultas Recientes</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : recentConsultations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay consultas recientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Paciente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentConsultations.map((consultation) => (
                  <tr key={consultation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{consultation.patient?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${consultation.type === 'URGENCIA' ? 'badge-danger' : 'badge-info'}`}>
                        {consultation.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          consultation.status === 'ACTIVE'
                            ? 'badge-success'
                            : consultation.status === 'CLOSED'
                            ? 'badge-secondary'
                            : 'badge-warning'
                        }`}
                      >
                        {consultation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(consultation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {consultation.status === 'ACTIVE' && (
                        <button
                          onClick={() => navigate(`/chat/${consultation.id}`)}
                          className="btn btn-primary text-sm flex items-center"
                        >
                          <FiMessageSquare className="mr-2 h-4 w-4" />
                          Abrir Chat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Status Toggle */}
      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Estado de Disponibilidad</h2>
            <p className="text-sm text-gray-600">
              {((user?.profile as Doctor)?.estadoOnline ? 'Disponible' : 'No disponible') +
                ' para consultas'}
            </p>
          </div>
          <button
            onClick={toggleOnlineStatus}
            className={`btn flex items-center ${
              (user?.profile as Doctor)?.estadoOnline
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            <FiPower className="mr-2 h-5 w-5" />
            {((user?.profile as Doctor)?.estadoOnline ? 'Desactivar' : 'Activar') + ' Disponibilidad'}
          </button>
        </div>
      </div>
    </div>
  );
}

