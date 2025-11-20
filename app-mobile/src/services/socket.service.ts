import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config/env';
import { Message } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private accessToken: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.accessToken = token;

    this.socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión socket:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConsultation(consultationId: string) {
    if (this.socket) {
      this.socket.emit('join-consultation', consultationId);
    }
  }

  leaveConsultation(consultationId: string) {
    if (this.socket) {
      this.socket.emit('leave-consultation', consultationId);
    }
  }

  sendMessage(data: {
    consultationId: string;
    senderId: string;
    text?: string;
    fileUrl?: string;
    audioUrl?: string;
    pdfUrl?: string;
  }) {
    if (this.socket) {
      this.socket.emit('new-message', data);
    }
  }

  onMessageReceived(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message-received', callback);
    }
  }

  onMessageError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('message-error', callback);
    }
  }

  offMessageReceived(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.off('message-received', callback);
    }
  }

  offMessageError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.off('message-error', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();

