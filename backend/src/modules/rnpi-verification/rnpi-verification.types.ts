/**
 * Tipos para validaci�n profesional contra RNPI (Registro Nacional de Prestadores Individuales)
 * Superintendencia de Salud de Chile
 */

export enum RnpiVerificationStatus {
  RNPI_OK = 'RNPI_OK',
  RNPI_NO_EXISTE = 'RNPI_NO_EXISTE',
  RNPI_NO_HABILITADO = 'RNPI_NO_HABILITADO',
  RNPI_PROFESION_INVALIDA = 'RNPI_PROFESION_INVALIDA',
  RNPI_INCONSISTENCIA_NOMBRE = 'RNPI_INCONSISTENCIA_NOMBRE',
  RNPI_API_ERROR = 'RNPI_API_ERROR',
  // Mantener compatibilidad con estados anteriores
  MEDICO_VERIFICADO = 'MEDICO_VERIFICADO',
  NO_MEDICO = 'NO_MEDICO',
  SUSPENDIDO = 'SUSPENDIDO',
  INCONSISTENCIA = 'INCONSISTENCIA',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
  PENDING = 'PENDING',
}

export interface RnpiVerificationRequest {
  rut: string; // RUN sin puntos ni gui�n
  dv: string; // D�gito verificador
  name: string; // Nombre proporcionado por el usuario
  specialty?: string; // Especialidad proporcionada (opcional)
}

export interface RnpiProfessionalData {
  rut: string;
  dv: string;
  nameOfficial: string; // Nombre seg�n RNPI
  profession: string; // Profesi�n (debe ser "M�dico Cirujano")
  status: string; // Estado (debe ser "Habilitado")
  registrationDate?: string; // Fecha de registro
  specialties?: string[]; // Especialidades registradas
  registrationNumber?: string; // N�mero de registro profesional
  institution?: string; // Instituci�n donde est� registrado
}

export interface RnpiVerificationResult {
  status: RnpiVerificationStatus;
  rut: string;
  dv: string;
  nameProvided: string;
  professionalData?: RnpiProfessionalData;
  inconsistencies?: string[]; // Lista de inconsistencias encontradas
  errors?: string[];
  verifiedAt?: Date;
}
