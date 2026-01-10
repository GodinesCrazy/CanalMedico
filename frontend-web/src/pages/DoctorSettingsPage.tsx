import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Doctor } from '@/types';
import toast from 'react-hot-toast';
import { PayoutSettings } from '@/components/PayoutSettings';
import { AvailabilitySettings } from '@/components/AvailabilitySettings';
import { formatCLP } from '@/utils/currency';

export default function DoctorSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [, setDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    speciality: '',
    tarifaConsulta: 0,
    tarifaUrgencia: 0,
    estadoOnline: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get<{ profile: Doctor }>('/users/profile');
      if (response.success && response.data && response.data.profile) {
        const profile = response.data.profile;
        setDoctor(profile);
        setFormData({
          name: profile.name || '',
          speciality: profile.speciality || '',
          tarifaConsulta: Number(profile.tarifaConsulta) || 0,
          tarifaUrgencia: Number(profile.tarifaUrgencia) || 0,
          estadoOnline: profile.estadoOnline || false,
        });
      }
    } catch (error) {
      toast.error('Error al cargar perfil');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Actualizar perfil
      const profileResponse = await api.put('/users/profile', {
        name: formData.name,
        speciality: formData.speciality,
        tarifaConsulta: formData.tarifaConsulta,
        tarifaUrgencia: formData.tarifaUrgencia,
      });

      if (profileResponse.success && user) {
        toast.success('Configuración actualizada');

        // Recargar perfil completo
        const updatedProfileResponse = await api.get<{ profile: Doctor }>('/users/profile');
        if (updatedProfileResponse.success && updatedProfileResponse.data && updatedProfileResponse.data.profile) {
          const updatedProfile = updatedProfileResponse.data.profile;
          setDoctor(updatedProfile);
          setUser({ ...user, profile: updatedProfile });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Gestiona tu perfil y tarifas</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label htmlFor="tarifaConsulta" className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa Consulta Normal ($)
              </label>
              <input
                id="tarifaConsulta"
                type="number"
                step="1"
                min="0"
                value={formData.tarifaConsulta}
                onChange={(e) =>
                  setFormData({ ...formData, tarifaConsulta: parseFloat(e.target.value) || 0 })
                }
                className="input"
                required
              />
              {formData.tarifaConsulta > 0 && (
                <p className="text-xs text-gray-500 mt-1">{formatCLP(formData.tarifaConsulta)}</p>
              )}
            </div>

            <div>
              <label htmlFor="tarifaUrgencia" className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa Consulta Urgencia ($)
              </label>
              <input
                id="tarifaUrgencia"
                type="number"
                step="1"
                min="0"
                value={formData.tarifaUrgencia}
                onChange={(e) =>
                  setFormData({ ...formData, tarifaUrgencia: parseFloat(e.target.value) || 0 })
                }
                className="input"
                required
              />
              {formData.tarifaUrgencia > 0 && (
                <p className="text-xs text-gray-500 mt-1">{formatCLP(formData.tarifaUrgencia)}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Configuración de Disponibilidad */}
      <div className="mt-8">
        <AvailabilitySettings />
      </div>

      {/* Configuración de Modalidad de Pago */}
      <div className="mt-8">
        <PayoutSettings />
      </div>
    </div>
  );
}

