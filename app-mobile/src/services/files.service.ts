import api from './api';
import { API_URL } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import * as FileSystem from 'expo-file-system';

export class FilesService {
  async uploadFile(uri: string, folder: string = 'consultations'): Promise<string> {
    try {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No autenticado');
      }

      // Crear FormData para subir archivo
      const filename = uri.split('/').pop() || 'file';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
      formData.append('folder', folder);

      // Hacer request directo con fetch porque axios tiene problemas con FormData en React Native
      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        return result.data.url;
      }

      throw new Error(result.error || 'Error al subir archivo');
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  }

  async uploadDocument(uri: string, filename: string, folder: string = 'consultations'): Promise<string> {
    try {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No autenticado');
      }

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'application/pdf',
      } as any);
      formData.append('folder', folder);

      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        return result.data.url;
      }

      throw new Error(result.error || 'Error al subir archivo');
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  }

  async uploadAudio(uri: string, folder: string = 'consultations'): Promise<string> {
    try {
      const token = useAuthStore.getState().accessToken;
      if (!token) {
        throw new Error('No autenticado');
      }

      const filename = uri.split('/').pop() || 'audio.m4a';
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: 'audio/m4a',
      } as any);
      formData.append('folder', folder);

      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        return result.data.url;
      }

      throw new Error(result.error || 'Error al subir archivo');
    } catch (error: any) {
      console.error('Error al subir audio:', error);
      throw error;
    }
  }
}

export default new FilesService();

