import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';
import { Message, Consultation } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/config/env';
import { FiSend, FiX, FiFileText, FiFile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import FileUpload from '@/components/FileUpload';
import PrescriptionModal from '@/components/PrescriptionModal';
import { Prescription } from '@/types';

export default function ChatPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'audio' | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadConsultation();
    initializeSocket();
    loadPrescriptions();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [consultationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConsultation = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Consultation>(`/consultations/${consultationId}`);
      if (response.success && response.data) {
        setConsultation(response.data);

        // Cargar mensajes por separado
        const messagesResponse = await api.get<Message[]>(
          `/messages/consultation/${consultationId}`
        );
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data);
        }
      }
    } catch (error) {
      toast.error('Error al cargar consulta');
      navigate('/consultations');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSocket = () => {
    if (!accessToken || !consultationId) return;

    const newSocket = io(API_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-consultation', consultationId);
    });

    newSocket.on('message-received', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message-error', (error: any) => {
      toast.error(error.error || 'Error al enviar mensaje');
    });

    setSocket(newSocket);
  };

  const handleFileSelect = (file: File, type: 'image' | 'pdf' | 'audio') => {
    setSelectedFile(file);
    setFileType(type);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'consultations');

      const response = await api.post<{ key: string; url: string }>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      toast.error('Error al subir archivo');
      return null;
    } finally {
      setIsUploadingFile(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !consultationId || !user) return;

    try {
      let fileUrl: string | undefined;
      let audioUrl: string | undefined;
      let pdfUrl: string | undefined;

      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) {
          toast.error('Error al subir archivo');
          return;
        }

        // Asignar la URL al campo correspondiente según el tipo
        if (fileType === 'image') {
          fileUrl = uploadedUrl;
        } else if (fileType === 'audio') {
          audioUrl = uploadedUrl;
        } else if (fileType === 'pdf') {
          pdfUrl = uploadedUrl;
        }
      }

      // Crear el mensaje
      const messageData: any = {
        consultationId,
        senderId: user.id,
      };

      if (newMessage.trim()) {
        messageData.text = newMessage.trim();
      }

      if (fileUrl) messageData.fileUrl = fileUrl;
      if (audioUrl) messageData.audioUrl = audioUrl;
      if (pdfUrl) messageData.pdfUrl = pdfUrl;

      // Si hay socket, usar socket.io, sino usar API REST
      if (socket && consultation?.status === 'ACTIVE') {
        socket.emit('new-message', messageData);
      } else {
        // Fallback a API REST
        const response = await api.post<Message>('/messages', messageData);
        if (response.success && response.data) {
          setMessages((prev) => [...prev, response.data!]);
        }
      }

      // Limpiar formulario
      setNewMessage('');
      setSelectedFile(null);
      setFileType(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje');
    }
  };

  const closeConsultation = async () => {
    if (!consultationId) return;

    try {
      const response = await api.patch(`/consultations/${consultationId}/close`);
      if (response.success) {
        toast.success('Consulta cerrada exitosamente');
        loadConsultation(); // Recargar para actualizar estado
      }
    } catch (error) {
      toast.error('Error al cerrar consulta');
    }
  };

  const loadPrescriptions = async () => {
    if (!consultationId) return;

    try {
      const response = await api.get(`/consultations/${consultationId}/prescriptions`);
      if (response.success && response.data) {
        setPrescriptions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      // Silenciar error si no hay recetas aún
      console.error('Error al cargar recetas:', error);
    }
  };

  const handlePrescriptionSuccess = () => {
    loadPrescriptions();
    loadConsultation();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando chat...</p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Consulta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Chat con {consultation.patient?.name || 'Paciente'}
            </h2>
            <p className="text-sm text-gray-600">
              {consultation.type === 'URGENCIA' ? 'Consulta de Urgencia' : 'Consulta Normal'}
            </p>
          </div>
          {consultation.status === 'ACTIVE' && user?.role === 'DOCTOR' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="btn btn-primary flex items-center"
              >
                <FiFile className="mr-2 h-4 w-4" />
                Emitir Receta SNRE
              </button>
              <button
                onClick={closeConsultation}
                className="btn btn-danger flex items-center"
              >
                <FiX className="mr-2 h-4 w-4" />
                Cerrar Consulta
              </button>
            </div>
          )}
          {consultation.status === 'ACTIVE' && user?.role === 'PATIENT' && (
            <button
              onClick={closeConsultation}
              className="btn btn-danger flex items-center"
            >
              <FiX className="mr-2 h-4 w-4" />
              Cerrar Consulta
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
                  {message.fileUrl && (
                    <div className="mt-2">
                      <img
                        src={message.fileUrl}
                        alt="Imagen adjunta"
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  {message.pdfUrl && (
                    <div className="mt-2">
                      <a
                        href={message.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline flex items-center"
                      >
                        <FiFileText className="mr-1 h-4 w-4" />
                        Ver PDF adjunto
                      </a>
                    </div>
                  )}
                  {message.audioUrl && (
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={message.audioUrl} type="audio/mpeg" />
                        Tu navegador no soporta audio HTML5.
                      </audio>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                    {format(new Date(message.createdAt), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {consultation.status === 'ACTIVE' && (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
          <FileUpload onFileSelect={handleFileSelect} disabled={isUploadingFile} />

          <div className="flex items-end space-x-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Escribe un mensaje... (Presiona Enter para enviar, Shift+Enter para nueva línea)"
              className="input flex-1 min-h-[60px] resize-none"
              rows={2}
            />
            <button
              onClick={sendMessage}
              className="btn btn-primary flex items-center mb-0"
              disabled={(!newMessage.trim() && !selectedFile) || isUploadingFile}
            >
              {isUploadingFile ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Subiendo...
                </>
              ) : (
                <>
                  <FiSend className="mr-2 h-5 w-5" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {(consultation.status === 'COMPLETED' || consultation.status === 'CANCELLED') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Esta consulta ha sido {consultation.status === 'COMPLETED' ? 'completada' : 'cancelada'}. No se pueden enviar más mensajes.
          </p>
        </div>
      )}

      {/* Recetas Electrónicas */}
      {prescriptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Recetas Electrónicas SNRE
          </h3>
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      Receta #{prescription.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(prescription.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'ENVIADA_SNRE'
                        ? 'bg-green-100 text-green-800'
                        : prescription.status === 'ERROR_SNRE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {prescription.status === 'ENVIADA_SNRE'
                      ? 'Enviada'
                      : prescription.status === 'ERROR_SNRE'
                      ? 'Error'
                      : 'Pendiente'}
                  </span>
                </div>
                {prescription.snreCode && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Código SNRE:</p>
                    <p className="text-lg font-bold text-primary-700 font-mono mb-2">
                      {prescription.snreCode}
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      Muestra este código en la farmacia para dispensar tus medicamentos
                    </p>
                  </div>
                )}
                {prescription.prescriptionItems && prescription.prescriptionItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Medicamentos:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {prescription.prescriptionItems.map((item: any, idx: number) => (
                        <li key={idx}>
                          <strong>{item.medicationName}</strong> - {item.dosage} {item.frequency}
                          {item.duration && ` por ${item.duration}`}
                          {item.instructions && (
                            <span className="text-gray-500 italic"> ({item.instructions})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prescription.errorMessage && (
                  <p className="text-sm text-red-600 mt-2">
                    <strong>Error:</strong> {prescription.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Receta */}
      {consultationId && (
        <PrescriptionModal
          consultationId={consultationId}
          isOpen={isPrescriptionModalOpen}
          onClose={() => setIsPrescriptionModalOpen(false)}
          onSuccess={handlePrescriptionSuccess}
        />
      )}
    </div>
  );
}




