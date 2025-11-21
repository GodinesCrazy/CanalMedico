import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Consultation, Doctor, ConsultationStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare, FiX, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';

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
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const response = await api.get(
        `/consultations/doctor/${doctorId}?page=${page}&limit=10${statusParam}`
      );
      if (response.success && response.data) {
        setConsultations(Array.isArray(response.data) ? response.data : []);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error al cargar consultas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = (consultationId: string) => {
    navigate(`/chat/${consultationId}`);
  };

  const closeConsultation = async (consultationId: string) => {
    if (!confirm('¿Estás seguro de que deseas cerrar esta consulta?')) return;

    try {
      const response = await api.patch(`/consultations/${consultationId}/close`);
      if (response.success) {
        toast.success('Consulta cerrada exitosamente');
        loadConsultations(); // Recargar lista
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar consulta');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consultas</h1>
          <p className="text-gray-600 mt-2">Gestiona tus consultas médicas</p>
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
            <option value="PAID">Pagadas</option>
            <option value="ACTIVE">Activas</option>
            <option value="CLOSED">Cerradas</option>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((consultation) => (
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
                        <div className="flex items-center space-x-2">
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
                                onClick={() => closeConsultation(consultation.id)}
                                className="btn btn-danger text-sm flex items-center"
                              >
                                <FiX className="mr-2 h-4 w-4" />
                                Cerrar
                              </button>
                            </>
                          )}
                          {consultation.status === 'PENDING' && (
                            <span className="text-xs text-gray-500">Esperando pago</span>
                          )}
                          {consultation.status === 'CLOSED' && (
                            <span className="text-xs text-gray-500">Cerrada</span>
                          )}
                        </div>
                      </td>
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

