import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Consultation, Doctor } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { FiMessageSquare } from 'react-icons/fi';

export default function ConsultationsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadConsultations();
  }, [page]);

  const loadConsultations = async () => {
    try {
      setIsLoading(true);
      const doctorId = (user?.profile as Doctor)?.id;

      if (!doctorId) return;

      const response = await api.get(`/consultations/doctor/${doctorId}?page=${page}&limit=10`);
      if (response.success) {
        setConsultations(response.data || []);
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consultas</h1>
        <p className="text-gray-600 mt-2">Gestiona tus consultas médicas</p>
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
                        {consultation.status === 'ACTIVE' && (
                          <button
                            onClick={() => openChat(consultation.id)}
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

