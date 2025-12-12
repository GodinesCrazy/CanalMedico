import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Doctor } from '@/types';
import toast from 'react-hot-toast';

interface DaySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilitySchedule {
  days: DaySchedule[];
}

const DAYS = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' },
];

export function AvailabilitySettings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const doctor = (user?.profile as Doctor) || null;
  const doctorId = doctor?.id;

  const [modoDisponibilidad, setModoDisponibilidad] = useState<'MANUAL' | 'AUTOMATICO'>('MANUAL');
  const [estadoOnline, setEstadoOnline] = useState(false);
  const [schedule, setSchedule] = useState<AvailabilitySchedule>({
    days: DAYS.map((d) => ({
      day: d.value,
      enabled: false,
      startTime: '09:00',
      endTime: '18:00',
    })),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState<{
    isAvailable: boolean;
    modoDisponibilidad: string;
  } | null>(null);

  useEffect(() => {
    if (doctorId) {
      loadAvailabilitySettings();
      loadCurrentAvailability();
    }
  }, [doctorId]);

  const loadAvailabilitySettings = async () => {
    try {
      const response = await api.get<{ profile: Doctor }>('/users/profile');
      if (response.success && response.data?.profile) {
        const profile = response.data.profile;
        const modo = (profile as any).modoDisponibilidad || 'MANUAL';
        const horariosAutomaticos = (profile as any).horariosAutomaticos;

        setModoDisponibilidad(modo);
        setEstadoOnline(profile.estadoOnline || false);

        if (horariosAutomaticos) {
          try {
            const parsed = JSON.parse(horariosAutomaticos);
            if (parsed.days && Array.isArray(parsed.days)) {
              // Merge con días por defecto
              const mergedDays = DAYS.map((d) => {
                const existing = parsed.days.find((day: DaySchedule) => day.day === d.value);
                return existing || { day: d.value, enabled: false, startTime: '09:00', endTime: '18:00' };
              });
              setSchedule({ days: mergedDays });
            }
          } catch (e) {
            console.error('Error parsing horariosAutomaticos:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading availability settings:', error);
    }
  };

  const loadCurrentAvailability = async () => {
    if (!doctorId) return;
    try {
      const response = await api.get<{ isAvailable: boolean; modoDisponibilidad: string }>(
        `/doctors/${doctorId}/availability`
      );
      if (response.success && response.data) {
        setCurrentAvailability(response.data);
      }
    } catch (error) {
      console.error('Error loading current availability:', error);
    }
  };

  const handleSave = async () => {
    if (!doctorId) return;

    setIsLoading(true);
    try {
      const horariosAutomaticos = modoDisponibilidad === 'AUTOMATICO' ? JSON.stringify(schedule) : null;

      const response = await api.patch(`/doctors/${doctorId}/availability-settings`, {
        modoDisponibilidad,
        horariosAutomaticos,
        estadoOnline: modoDisponibilidad === 'MANUAL' ? estadoOnline : undefined,
      });

      if (response.success) {
        toast.success('Configuración de disponibilidad actualizada');
        loadAvailabilitySettings();
        loadCurrentAvailability();
        // Recargar perfil
        const profileResponse = await api.get<{ profile: Doctor }>('/users/profile');
        if (profileResponse.success && profileResponse.data?.profile && user) {
          setUser({ ...user, profile: profileResponse.data.profile });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar configuración de disponibilidad');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDaySchedule = (dayValue: string, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      days: prev.days.map((day) => (day.day === dayValue ? { ...day, ...updates } : day)),
    }));
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Configuración de Disponibilidad</h2>

      {/* Estado actual */}
      {currentAvailability && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Estado actual:</p>
          <p className="text-lg font-bold text-gray-900">
            {currentAvailability.isAvailable ? (
              <span className="text-green-600">✅ Disponible</span>
            ) : (
              <span className="text-red-600">❌ No Disponible</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Modo: {currentAvailability.modoDisponibilidad === 'MANUAL' ? 'Manual' : 'Automático'}
          </p>
        </div>
      )}

      {/* Selector de modo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Modo de Disponibilidad
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="modoDisponibilidad"
              value="MANUAL"
              checked={modoDisponibilidad === 'MANUAL'}
              onChange={(e) => setModoDisponibilidad(e.target.value as 'MANUAL' | 'AUTOMATICO')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Modo Manual (yo activo/desactivo manualmente)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="modoDisponibilidad"
              value="AUTOMATICO"
              checked={modoDisponibilidad === 'AUTOMATICO'}
              onChange={(e) => setModoDisponibilidad(e.target.value as 'MANUAL' | 'AUTOMATICO')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Modo Automático (según horarios configurados)
            </span>
          </label>
        </div>
      </div>

      {/* Modo Manual */}
      {modoDisponibilidad === 'MANUAL' && (
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="estadoOnlineManual"
              type="checkbox"
              checked={estadoOnline}
              onChange={(e) => setEstadoOnline(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="estadoOnlineManual" className="ml-2 block text-sm text-gray-700">
              Disponible para consultas
            </label>
          </div>
        </div>
      )}

      {/* Modo Automático */}
      {modoDisponibilidad === 'AUTOMATICO' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Horarios de Atención
          </label>
          <div className="space-y-4">
            {schedule.days.map((day) => {
              const dayLabel = DAYS.find((d) => d.value === day.day)?.label || day.day;
              return (
                <div key={day.day} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) => updateDaySchedule(day.day, { enabled: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">{dayLabel}</label>
                  </div>
                  {day.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hora de inicio</label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDaySchedule(day.day, { startTime: e.target.value })}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hora de fin</label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDaySchedule(day.day, { endTime: e.target.value })}
                          className="input text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}

