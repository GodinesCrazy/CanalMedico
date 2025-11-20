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
}

export default new AuthService();

