import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Consultation, ConsultationStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare, FiCheck, FiFilter, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatCLP } from '@/utils/currency';

export default function ConsultationsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadConsultations();
  }, [page, statusFilter]);

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      
      // DOCTOR usa /api/doctor/consultations
      if (user?.role === 'DOCTOR') {
        const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
        const response = await api.get(
          `/doctor/consultations?page=${page}&limit=10${statusParam}`
        );
        if (response.success && response.data) {
          setConsultations(Array.isArray(response.data) ? response.data : []);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        }
      }
      // ADMIN usa /api/admin/consultations
      else if (user?.role === 'ADMIN') {
        const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
        const response = await api.get(
          `/admin/consultations?page=${page}&limit=10${statusParam}`
        );
        if (response.success && response.data) {
          setConsultations(Array.isArray(response.data) ? response.data : []);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        }
      }
    } catch (error: any) {
      console.error('Error al cargar consultas:', error);
      toast.error(error.message || 'Error al cargar consultas');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptConsultation = async (consultationId: string) => {
    if (!confirm('¿Aceptar esta consulta? Una vez aceptada, estará activa.')) return;

    try {
      const response = await api.patch(`/consultations/${consultationId}/accept`);
      if (response.success) {
        toast.success('Consulta aceptada exitosamente');
        loadConsultations(); // Recargar lista
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al aceptar consulta');
    }
  };

  const completeConsultation = async (consultationId: string) => {
    if (!confirm('¿Completar esta consulta? Esto marcará la consulta como finalizada.')) return;

    try {
      const response = await api.patch(`/consultations/${consultationId}/complete`);
      if (response.success) {
        toast.success('Consulta completada exitosamente');
        loadConsultations(); // Recargar lista
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al completar consulta');
    }
  };

  const openChat = (consultationId: string) => {
    navigate(`/chat/${consultationId}`);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'ADMIN' ? 'Todas las Consultas' : 'Mis Consultas'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'ADMIN' ? 'Gestiona todas las consultas de la plataforma' : 'Gestiona tus consultas médicas'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <FiFilter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ConsultationStatus | 'ALL');
              setPage(1); // Reset a primera página al cambiar filtro
            }}
            className="input w-auto"
          >
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="ACTIVE">Activas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando consultas...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay consultas disponibles</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {user?.role === 'ADMIN' && (
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Doctor</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Precio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    {user?.role === 'DOCTOR' && (
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {user?.role === 'ADMIN' && (
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                            {consultation.doctor?.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4">{consultation.patient?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${consultation.type === 'URGENCIA' ? 'badge-danger' : 'badge-info'}`}>
                          {consultation.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {formatCLP(consultation.price || 0)}
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
                      {user?.role === 'DOCTOR' && (
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {consultation.status === 'PENDING' && (
                              <button
                                onClick={() => acceptConsultation(consultation.id)}
                                className="btn btn-success text-sm flex items-center"
                              >
                                <FiCheck className="mr-2 h-4 w-4" />
                                Aceptar
                              </button>
                            )}
                            {consultation.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => openChat(consultation.id)}
                                  className="btn btn-primary text-sm flex items-center"
                                >
                                  <FiMessageSquare className="mr-2 h-4 w-4" />
                                  Chat
                                </button>
                                <button
                                  onClick={() => completeConsultation(consultation.id)}
                                  className="btn btn-secondary text-sm flex items-center"
                                >
                                  <FiCheck className="mr-2 h-4 w-4" />
                                  Finalizar
                                </button>
                              </>
                            )}
                            {consultation.status === 'COMPLETED' && (
                              <span className="text-xs text-gray-500">Completada</span>
                            )}
                            {consultation.status === 'CANCELLED' && (
                              <span className="text-xs text-gray-500">Cancelada</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

