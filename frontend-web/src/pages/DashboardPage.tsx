import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Consultation, Doctor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare, FiDollarSign, FiActivity, FiPower, FiCheckCircle, FiAlertCircle, FiClock, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatCLP } from '@/utils/currency';

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
  const [currentAvailability, setCurrentAvailability] = useState<{
    isAvailable: boolean;
    modoDisponibilidad: string;
  } | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<{
    estadoFinal: string;
    identidadValidada: boolean;
    profesionValidada: boolean;
    ultimaVerificacion: string | null;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadCurrentAvailability();
    loadVerificationStatus();
  }, []);

  const loadCurrentAvailability = async () => {
    try {
      const doctorId = (user?.profile as Doctor)?.id;
      if (!doctorId) return;

      const response = await api.get<{ isAvailable: boolean; modoDisponibilidad: string }>(
        `/doctors/${doctorId}/availability`
      );
      if (response.success && response.data) {
        setCurrentAvailability(response.data);
      }
    } catch (error) {
      console.error('Error loading current availability:', error);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const doctorId = (user?.profile as Doctor)?.id;
      if (!doctorId) return;

      const response = await api.get<{
        estadoFinal: string;
        identidadValidada: boolean;
        profesionValidada: boolean;
        ultimaVerificacion: string | null;
      }>(`/medicos/${doctorId}/estado-validacion`);
      if (response.success && response.data) {
        setVerificationStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const getVerificationStatusBadge = () => {
    if (!verificationStatus) return null;

    const status = verificationStatus.estadoFinal;
    const statusConfig: Record<string, { icon: any; color: string; bgColor: string; text: string }> = {
      VERIFICADO: {
        icon: FiCheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'Verificado',
      },
      PENDIENTE: {
        icon: FiClock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        text: 'Pendiente',
      },
      REVISION_MANUAL: {
        icon: FiAlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        text: 'En Revision Manual',
      },
      RECHAZADO_EN_IDENTIDAD: {
        icon: FiXCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Rechazado (Identidad)',
      },
      RECHAZADO_EN_RNPI: {
        icon: FiXCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Rechazado (RNPI)',
      },
    };

    const config = statusConfig[status] || statusConfig.PENDIENTE;
    const Icon = config.icon;

    return (
      <div className={`${config.bgColor} p-3 rounded-lg`}>
        <Icon className={`${config.color} h-6 w-6`} />
      </div>
    );
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      const statsResponse = await api.get<{
        totalConsultations: number;
        activeConsultations: number;
        totalEarnings: number;
        monthlyEarnings: number;
      }>(`/doctors/${doctorId}/statistics`);
      if (statsResponse.success && statsResponse.data) {
        setStatistics({
          totalConsultations: statsResponse.data.totalConsultations || 0,
          activeConsultations: statsResponse.data.activeConsultations || 0,
          totalEarnings: statsResponse.data.totalEarnings || 0,
          monthlyEarnings: statsResponse.data.monthlyEarnings || 0,
        });
      }

      const consultationsResponse = await api.get<Consultation[]>(`/consultations/doctor/${doctorId}?limit=5`);
      if (consultationsResponse.success && consultationsResponse.data) {
        setRecentConsultations(Array.isArray(consultationsResponse.data) ? consultationsResponse.data : []);
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

      const currentStatus = currentAvailability?.isAvailable || false;
      const response = await api.put(`/doctors/${doctorId}/online-status`, {
        estadoOnline: !currentStatus,
      });

      if (response.success && response.data) {
        toast.success(
          `Estado ${!currentStatus ? 'activado' : 'desactivado'} correctamente`
        );
        const profileResponse = await api.get<{ profile: Doctor }>('/users/profile');
        if (profileResponse.success && profileResponse.data && user) {
          const updatedUser = { ...user, profile: profileResponse.data.profile };
          useAuthStore.getState().setUser(updatedUser);
        }
        loadCurrentAvailability();
        loadDashboardData();
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
      value: formatCLP(Number(statistics.totalEarnings)),
      icon: FiDollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Ingresos del Mes',
      value: formatCLP(Number(statistics.monthlyEarnings)),
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
                            : consultation.status === 'COMPLETED'
                            ? 'badge-secondary'
                            : consultation.status === 'CANCELLED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {consultation.status === 'PENDING' && 'Pendiente'}
                        {consultation.status === 'ACTIVE' && 'Activa'}
                        {consultation.status === 'COMPLETED' && 'Completada'}
                        {consultation.status === 'CANCELLED' && 'Cancelada'}
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

      {currentAvailability && currentAvailability.modoDisponibilidad === 'MANUAL' && (
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Estado de Disponibilidad</h2>
              <p className="text-sm text-gray-600">
                {currentAvailability.isAvailable ? 'Disponible' : 'No disponible'} para consultas
              </p>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`btn flex items-center ${
                currentAvailability.isAvailable ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              <FiPower className="mr-2 h-5 w-5" />
              {(currentAvailability.isAvailable ? 'Desactivar' : 'Activar') + ' Disponibilidad'}
            </button>
          </div>
        </div>
      )}

      {currentAvailability && currentAvailability.modoDisponibilidad === 'AUTOMATICO' && (
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Estado de Disponibilidad</h2>
              <p className="text-sm text-gray-600">
                {currentAvailability.isAvailable ? (
                  <span className="text-green-600 font-medium">Disponible</span>
                ) : (
                  <span className="text-red-600 font-medium">No Disponible</span>
                )}
                {' (Modo Automatico segun horarios configurados)'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Configura tus horarios en{' '}
                <button
                  onClick={() => navigate('/settings')}
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Configuracion
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {verificationStatus && (
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getVerificationStatusBadge()}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Estado de Verificacion</h2>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">
                    {verificationStatus.estadoFinal === 'VERIFICADO' && 'Verificado'}
                    {verificationStatus.estadoFinal === 'PENDIENTE' && 'Pendiente'}
                    {verificationStatus.estadoFinal === 'REVISION_MANUAL' && 'En Revision Manual'}
                    {verificationStatus.estadoFinal === 'RECHAZADO_EN_IDENTIDAD' && 'Rechazado (Identidad)'}
                    {verificationStatus.estadoFinal === 'RECHAZADO_EN_RNPI' && 'Rechazado (RNPI)'}
                  </span>
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Identidad: {verificationStatus.identidadValidada ? 'Verificada' : 'No verificada'}</p>
                  <p>Profesion: {verificationStatus.profesionValidada ? 'Verificada' : 'No verificada'}</p>
                  {verificationStatus.ultimaVerificacion && (
                    <p className="mt-1">
                      Ultima verificacion: {new Date(verificationStatus.ultimaVerificacion).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
