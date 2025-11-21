import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';
import { Message, Consultation } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/config/env';
import { FiSend, FiX, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import FileUpload from '@/components/FileUpload';

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

  useEffect(() => {
    loadConsultation();
    initializeSocket();

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
          {consultation.status === 'ACTIVE' && (
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

      {consultation.status === 'CLOSED' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Esta consulta ha sido cerrada. No se pueden enviar más mensajes.
          </p>
        </div>
      )}
    </div>
  );
}

