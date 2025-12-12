import { useState, useEffect } from 'react';
import api from '@/services/api';
import { DoctorSignupRequest } from '@/types';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiShield, FiUserCheck } from 'react-icons/fi';

export default function AdminSignupRequestsPage() {
  const [requests, setRequests] = useState<DoctorSignupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<DoctorSignupRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const response = await api.get<{ data: DoctorSignupRequest[]; pagination?: any }>(
        `/signup-requests?page=${page}&limit=10${statusParam}`
      );
      if (response.success && response.data) {
        // Manejar respuesta paginada o directa
        if (response.pagination && response.data && Array.isArray(response.data)) {
          setRequests(response.data);
          setTotalPages(response.pagination.totalPages || 1);
        } else if (Array.isArray(response.data)) {
          setRequests(response.data);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const response = await api.patch(`/signup-requests/${requestId}/status`, { status });

      if (response.success) {
        toast.success(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'} exitosamente`);
        loadRequests();
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado de la solicitud');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning">Pendiente</span>;
      case 'REVIEWED':
        return <span className="badge badge-info">Revisada</span>;
      case 'APPROVED':
        return <span className="badge badge-success">Aprobada</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rechazada</span>;
      case 'AUTO_APPROVED':
        return <span className="badge badge-success">Aprobada Automáticamente</span>;
      case 'AUTO_REJECTED':
        return <span className="badge badge-danger">Rechazada Automáticamente</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const reRunVerifications = async (requestId: string) => {
    try {
      const response = await api.post(`/signup-requests/${requestId}/re-verify`);
      if (response.success) {
        toast.success('Validaciones re-ejecutadas. Los resultados se actualizarán en breve.');
        setTimeout(() => {
          loadRequests();
          if (selectedRequest?.id === requestId) {
            // Recargar solicitud seleccionada
            api.get(`/signup-requests/${requestId}`).then((res) => {
              if (res.success && res.data) {
                setSelectedRequest(res.data as DoctorSignupRequest);
              }
            });
          }
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al re-ejecutar validaciones');
    }
  };

  const getVerificationStatusBadge = (status?: string) => {
    if (!status) return <span className="text-gray-500 text-sm">No verificado</span>;
    
    switch (status) {
      case 'IDENTIDAD_VERIFICADA':
        return <span className="badge badge-success">Identidad Verificada</span>;
      case 'IDENTIDAD_NO_COINCIDE':
        return <span className="badge badge-danger">Nombre No Coincide</span>;
      case 'RUN_INVALIDO':
        return <span className="badge badge-danger">RUN Inválido</span>;
      case 'ERROR_VALIDACION':
        return <span className="badge badge-warning">Error en Validación</span>;
      case 'MEDICO_VERIFICADO':
        return <span className="badge badge-success">Médico Verificado</span>;
      case 'NO_MEDICO':
        return <span className="badge badge-danger">No es Médico</span>;
      case 'SUSPENDIDO':
        return <span className="badge badge-danger">Suspendido</span>;
      case 'INCONSISTENCIA':
        return <span className="badge badge-warning">Inconsistencias</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Registro Médico</h1>
        <p className="text-gray-600 mt-2">Gestiona las solicitudes de registro de nuevos médicos</p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendientes</option>
            <option value="REVIEWED">Revisadas</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="AUTO_APPROVED">Aprobadas Automáticamente</option>
            <option value="REJECTED">Rechazadas</option>
            <option value="AUTO_REJECTED">Rechazadas Automáticamente</option>
          </select>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay solicitudes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Especialidad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <td className="py-3 px-4">{request.name}</td>
                      <td className="py-3 px-4">{request.email}</td>
                      <td className="py-3 px-4">{request.specialty}</td>
                      <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                          className="btn btn-primary text-sm"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles de la Solicitud</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <p className="text-gray-900">{selectedRequest.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <p className="text-gray-900">{selectedRequest.rut || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                    <p className="text-gray-900">{selectedRequest.specialty}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedRequest.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <p className="text-gray-900">{selectedRequest.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Registro</label>
                    <p className="text-gray-900">{selectedRequest.registrationNumber || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clínica / Centro</label>
                  <p className="text-gray-900">{selectedRequest.clinicOrCenter || 'No especificado'}</p>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.notes}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                {/* Validaciones Automáticas */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FiShield className="mr-2 h-5 w-5" />
                    Validaciones Automáticas
                  </h3>

                  {/* Validación de Identidad */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <FiUserCheck className="mr-2 h-4 w-4" />
                        Validación de Identidad (Registro Civil)
                      </label>
                      {getVerificationStatusBadge(selectedRequest.identityVerificationStatus)}
                    </div>
                    {selectedRequest.identityVerificationResult && (
                      <div className="mt-2 text-xs text-gray-600">
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Ver detalles de validación
                          </summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                            {JSON.stringify(JSON.parse(selectedRequest.identityVerificationResult), null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    {selectedRequest.identityVerifiedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verificado: {new Date(selectedRequest.identityVerifiedAt).toLocaleString('es-CL')}
                      </p>
                    )}
                  </div>

                  {/* Validación RNPI */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 flex items-center">
                        <FiShield className="mr-2 h-4 w-4" />
                        Validación Profesional (RNPI - Superintendencia de Salud)
                      </label>
                      {getVerificationStatusBadge(selectedRequest.rnpiVerificationStatus)}
                    </div>
                    {selectedRequest.rnpiVerificationResult && (
                      <div className="mt-2 text-xs text-gray-600">
                        <details>
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            Ver detalles de validación RNPI
                          </summary>
                          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                            {JSON.stringify(JSON.parse(selectedRequest.rnpiVerificationResult), null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    {selectedRequest.rnpiVerifiedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verificado: {new Date(selectedRequest.rnpiVerifiedAt).toLocaleString('es-CL')}
                      </p>
                    )}
                  </div>

                  {/* Errores de Validación Automática */}
                  {selectedRequest.autoVerificationErrors && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Errores de Validación Automática
                      </label>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {JSON.parse(selectedRequest.autoVerificationErrors).map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                  <p className="text-gray-900">
                    {new Date(selectedRequest.createdAt).toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => {
                    reRunVerifications(selectedRequest.id);
                  }}
                  className="btn btn-secondary flex items-center"
                  title="Re-ejecutar validaciones automáticas"
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Re-ejecutar Validaciones
                </button>

                {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'REVIEWED') && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, 'REJECTED');
                      }}
                      className="btn btn-danger"
                    >
                      <FiXCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        updateRequestStatus(selectedRequest.id, 'APPROVED');
                      }}
                      className="btn btn-success"
                    >
                      <FiCheckCircle className="mr-2 h-4 w-4" />
                      Aprobar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


