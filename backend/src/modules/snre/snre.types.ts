/**
 * Tipos TypeScript para la integraci�n con SNRE (Sistema Nacional de Receta Electr�nica)
 * Basado en HL7 FHIR R4 y la Gu�a de Implementaci�n del MINSAL
 */

// Estados de la receta en CanalMedico
export enum PrescriptionStatus {
  PENDIENTE_ENVIO_SNRE = 'PENDIENTE_ENVIO_SNRE',
  ENVIADA_SNRE = 'ENVIADA_SNRE',
  ERROR_SNRE = 'ERROR_SNRE',
  ANULADA_SNRE = 'ANULADA_SNRE',
}

// Tipos de receta seg�n SNRE
export enum RecetaType {
  SIMPLE = 'simple', // Receta simple
  RETENIDA = 'retenida', // Receta retenida
}

// Interfaz para un medicamento en la receta
export interface PrescriptionMedication {
  medicationName: string; // Nombre del medicamento
  tfcCode?: string; // C�digo TFC (Terminolog�a Farmac�utica Chilena)
  snomedCode?: string; // C�digo SNOMED-CT
  presentation?: string; // Presentaci�n (ej: "Tabletas 500mg")
  pharmaceuticalForm?: string; // Forma farmac�utica
  dosage: string; // Dosis (ej: "1 tableta")
  frequency: string; // Frecuencia (ej: "cada 8 horas")
  duration?: string; // Duraci�n (ej: "7 d�as")
  quantity?: string; // Cantidad total a dispensar
  instructions?: string; // Instrucciones adicionales
}

// DTO para crear una receta
export interface CreatePrescriptionDto {
  consultationId: string;
  medications: PrescriptionMedication[];
  recetaType?: RecetaType;
  notes?: string; // Notas adicionales de la receta
}

// Respuesta del SNRE
export interface SnreResponse {
  success: boolean;
  snreId?: string; // ID de la receta en SNRE
  snreCode?: string; // C�digo �nico para el paciente
  bundleId?: string; // ID del Bundle FHIR
  message?: string;
  errors?: SnreError[];
}

// Error del SNRE
export interface SnreError {
  code: string;
  severity: 'error' | 'warning' | 'information';
  message: string;
  details?: any;
}

// Datos del paciente para FHIR
export interface PatientFhirData {
  rut: string;
  name: string;
  birthDate?: string; // ISO 8601
  gender?: 'male' | 'female' | 'other' | 'unknown';
  address?: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

// Datos del m�dico/prescriptor para FHIR
export interface PractitionerFhirData {
  rut: string;
  name: string;
  registrationNumber?: string; // N�mero de registro profesional
  speciality: string;
  organizationCode?: string; // C�digo del establecimiento si aplica
}

// Bundle FHIR para receta (estructura simplificada)
export interface FhirRecetaBundle {
  resourceType: 'Bundle';
  type: 'document';
  timestamp: string; // ISO 8601
  entry: FhirResource[];
}

// Recurso FHIR gen�rico
export interface FhirResource {
  fullUrl?: string;
  resource: any; // Resource FHIR (Patient, Practitioner, MedicationRequest, etc.)
}
