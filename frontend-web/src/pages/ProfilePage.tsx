import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { validateRut, formatRutInput } from '@/utils/rut';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    name: '',
    speciality: '',
    rut: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get<{ profile: { name?: string; speciality?: string; rut?: string } | null }>('/users/profile');
      if (response.success && response.data) {
        // ADMIN tiene profile: null, DOCTOR tiene profile con datos
        if (response.data.profile) {
          const profile = response.data.profile;
          setFormData({
            name: profile.name || '',
            speciality: profile.speciality || '',
            rut: profile.rut || '',
          });
        } else {
          // ADMIN - solo mostrar email y rol
          setFormData({
            name: user?.email || '',
            speciality: '',
            rut: '',
          });
        }
      }
    } catch (error) {
      toast.error('Error al cargar perfil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ADMIN no puede actualizar profile médico
      if (user?.role === 'ADMIN') {
        toast.error('Los administradores deben usar la página de Configuración para actualizar su perfil');
        setIsLoading(false);
        return;
      }

      const response = await api.put<{ profile: any }>('/users/profile', formData);
      if (response.success) {
        toast.success('Perfil actualizado');
        if (response.data && user && response.data.profile) {
          setUser({ ...user, profile: response.data.profile });
        }
      }
    } catch (error) {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
      </div>

      <div className="card">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 text-2xl font-bold">
                {(user?.profile as any)?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {(user?.profile as any)?.name || user?.email || 'Usuario'}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              {user?.role && (
                <p className="text-sm text-gray-500">Rol: {user.role}</p>
              )}
              {(user?.profile as any)?.speciality && (
                <p className="text-sm text-gray-500">{(user?.profile as any)?.speciality}</p>
              )}
            </div>
          </div>
        </div>

        {user?.role === 'ADMIN' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              Los administradores deben usar la página de <strong>Configuración</strong> para actualizar su perfil.
            </p>
            <a href="/settings" className="text-blue-600 hover:text-blue-700 underline mt-2 inline-block">
              Ir a Configuración
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-2">
                Especialidad
              </label>
              <input
                id="speciality"
                type="text"
                value={formData.speciality}
                onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                RUT
              </label>
              <input
                id="rut"
                type="text"
                value={formData.rut}
                onChange={(e) => {
                  const formatted = formatRutInput(e.target.value);
                  setFormData({ ...formData, rut: formatted });
                }}
                onBlur={() => {
                  if (formData.rut && !validateRut(formData.rut)) {
                    toast.error('El RUT ingresado no es válido');
                  }
                }}
                className="input"
                placeholder="12.345.678-9"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 12.345.678-9</p>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

