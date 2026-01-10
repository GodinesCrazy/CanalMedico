import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.put('/users/profile', {
        email: formData.email,
      });

      if (response.success && user) {
        toast.success('Perfil actualizado correctamente');
        // Actualizar usuario en el store
        setUser({ ...user, email: formData.email });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoadingPassword(true);

    try {
      // Nota: Este endpoint debe implementarse en el backend
      // Por ahora, solo validamos en frontend
      const response = await api.put('/users/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success('Contraseña actualizada correctamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar contraseña');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Gestiona tu perfil administrativo</p>
      </div>

      {/* Información del Perfil */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Perfil</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <input
              type="text"
              value={user?.role || 'ADMIN'}
              disabled
              className="input bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              El rol no se puede modificar
            </p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Cambiar Contraseña */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="input"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="input"
              required
              minLength={8}
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isLoadingPassword} className="btn btn-primary">
              {isLoadingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

