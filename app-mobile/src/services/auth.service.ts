import api from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '@/types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al iniciar sesión');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al registrarse');
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al refrescar token');
  }

  /**
   * Enviar código OTP por WhatsApp o SMS
   * 
   * FASE 3: Login invisible
   */
  async sendOTP(data: {
    phoneNumber: string;
    attemptId?: string;
    method?: 'WHATSAPP' | 'SMS';
  }): Promise<{ success: boolean; expiresIn: number }> {
    const response = await api.post<{ success: boolean; expiresIn: number }>('/auth/send-otp', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Error al enviar código OTP');
  }

  /**
   * Verificar código OTP y crear/iniciar sesión automáticamente
   * 
   * FASE 3: Login invisible
   */
  async verifyOTP(data: {
    phoneNumber: string;
    otp: string;
    attemptId?: string;
  }): Promise<AuthResponse & { isNewUser: boolean; consultationId?: string }> {
    const response = await api.post<AuthResponse & { isNewUser: boolean; consultationId?: string }>(
      '/auth/verify-otp',
      data
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Código OTP inválido o expirado');
  }
}

export default new AuthService();

