/**
 * Utilidades para calcular disponibilidad automática de médicos
 */

export interface DaySchedule {
  day: string; // "LUNES", "MARTES", etc.
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface AvailabilitySchedule {
  days: DaySchedule[];
}

/**
 * Calcula si el médico está disponible según su configuración automática
 * @param modoDisponibilidad - "MANUAL" | "AUTOMATICO"
 * @param estadoOnlineManual - Estado manual actual
 * @param horariosAutomaticos - JSON string con la configuración de horarios
 * @returns true si está disponible, false si no
 */
export function calculateAvailability(
  modoDisponibilidad: string,
  estadoOnlineManual: boolean,
  horariosAutomaticos: string | null | undefined
): boolean {
  // Si está en modo manual, usar el estado manual
  if (modoDisponibilidad === 'MANUAL' || !modoDisponibilidad) {
    return estadoOnlineManual;
  }

  // Si está en modo automático pero no hay horarios configurados, no disponible
  if (!horariosAutomaticos) {
    return false;
  }

  try {
    const schedule: AvailabilitySchedule = JSON.parse(horariosAutomaticos);
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Mapeo de día de la semana a nombre en español
    const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const currentDayName = dayNames[currentDay];

    // Buscar configuración para el día actual
    const dayConfig = schedule.days?.find((d) => d.day === currentDayName);

    // Si no hay configuración para hoy o no está habilitado, no disponible
    if (!dayConfig || !dayConfig.enabled) {
      return false;
    }

    // Verificar si la hora actual está dentro del rango
    const startTime = dayConfig.startTime || '00:00';
    const endTime = dayConfig.endTime || '23:59';

    return isTimeInRange(currentTime, startTime, endTime);
  } catch (error) {
    // Si hay error parseando, retornar false
    return false;
  }
}

/**
 * Verifica si una hora está dentro de un rango
 * @param currentTime - Hora actual en formato "HH:MM"
 * @param startTime - Hora de inicio en formato "HH:MM"
 * @param endTime - Hora de fin en formato "HH:MM"
 * @returns true si está en el rango
 */
function isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
  const current = timeToMinutes(currentTime);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Si el rango cruza medianoche (ej: 22:00 - 02:00)
  if (end < start) {
    return current >= start || current <= end;
  }

  return current >= start && current <= end;
}

/**
 * Convierte una hora en formato "HH:MM" a minutos del día
 * @param time - Hora en formato "HH:MM"
 * @returns Minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Valida que la configuración de horarios sea válida
 * @param schedule - Configuración de horarios
 * @returns true si es válida
 */
export function validateSchedule(schedule: AvailabilitySchedule): boolean {
  if (!schedule || !schedule.days || !Array.isArray(schedule.days)) {
    return false;
  }

  // Validar cada día
  for (const day of schedule.days) {
    if (!day.day || typeof day.enabled !== 'boolean') {
      return false;
    }

    if (day.enabled) {
      if (!day.startTime || !day.endTime) {
        return false;
      }

      // Validar formato de hora
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(day.startTime) || !timeRegex.test(day.endTime)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Crea una configuración de horarios por defecto (todos deshabilitados)
 */
export function createDefaultSchedule(): AvailabilitySchedule {
  const days: DaySchedule[] = [
    { day: 'LUNES', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'MARTES', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'MIERCOLES', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'JUEVES', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'VIERNES', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'SABADO', enabled: false, startTime: '09:00', endTime: '18:00' },
    { day: 'DOMINGO', enabled: false, startTime: '09:00', endTime: '18:00' },
  ];

  return { days };
}

