import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '@/services/api';
import { Message, Consultation, UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/config/env';
import { FiSend, FiPaperclip } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ChatPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
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
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      toast.error('Error al cargar consulta');
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

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !consultationId || !user) return;

    socket.emit('new-message', {
      consultationId,
      senderId: user.id,
      text: newMessage.trim(),
    });

    setNewMessage('');
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
        <h2 className="text-xl font-bold text-gray-900">
          Chat con {consultation.patient?.name || 'Paciente'}
        </h2>
        <p className="text-sm text-gray-600">
          {consultation.type === 'URGENCIA' ? 'Consulta de Urgencia' : 'Consulta Normal'}
        </p>
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
                  {message.text && <p className="text-sm">{message.text}</p>}
                  {(message.fileUrl || message.audioUrl || message.pdfUrl) && (
                    <div className="mt-2">
                      <a
                        href={message.fileUrl || message.audioUrl || message.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                      >
                        Ver archivo adjunto
                      </a>
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="Escribe un mensaje..."
              className="input flex-1"
            />
            <button
              onClick={sendMessage}
              className="btn btn-primary flex items-center"
              disabled={!newMessage.trim()}
            >
              <FiSend className="mr-2 h-5 w-5" />
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

