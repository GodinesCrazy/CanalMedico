/**
 * Tipos para el sistema de verificaci�n completa de m�dicos
 */

export enum IdentityVerificationStatus {
  IDENTIDAD_VERIFICADA = 'IDENTIDAD_VERIFICADA',
  IDENTIDAD_NO_COINCIDE = 'IDENTIDAD_NO_COINCIDE',
  RUN_INVALIDO = 'RUN_INVALIDO',
  RC_NO_RESPONDE = 'RC_NO_RESPONDE',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
  PENDING = 'PENDING',
}

export enum RnpiVerificationStatus {
  RNPI_OK = 'RNPI_OK',
  RNPI_NO_EXISTE = 'RNPI_NO_EXISTE',
  RNPI_NO_HABILITADO = 'RNPI_NO_HABILITADO',
  RNPI_PROFESION_INVALIDA = 'RNPI_PROFESION_INVALIDA',
  RNPI_INCONSISTENCIA_NOMBRE = 'RNPI_INCONSISTENCIA_NOMBRE',
  RNPI_API_ERROR = 'RNPI_API_ERROR',
  PENDING = 'PENDING',
}

export enum VerificationFinalStatus {
  PENDIENTE = 'PENDIENTE',
  VERIFICADO = 'VERIFICADO',
  RECHAZADO_EN_IDENTIDAD = 'RECHAZADO_EN_IDENTIDAD',
  RECHAZADO_EN_RNPI = 'RECHAZADO_EN_RNPI',
  REVISION_MANUAL = 'REVISION_MANUAL',
}

export interface IdentityVerificationRequest {
  rut: string;
  dv: string;
  name: string;
  birthDate?: string;
}

export interface IdentityVerificationResult {
  status: IdentityVerificationStatus;
  rut: string;
  dv: string;
  nameProvided: string;
  nameOfficial?: string;
  birthDateOfficial?: string;
  idCardStatus?: 'VIGENTE' | 'VENCIDA' | 'NO_DISPONIBLE';
  matchScore?: number;
  errors?: string[];
  provider?: string;
  verifiedAt?: Date;
  rawData?: any; // Datos crudos para encriptar y guardar
}

export interface RnpiVerificationRequest {
  rut: string;
  dv: string;
  name: string;
  specialty?: string;
}

export interface RnpiVerificationResult {
  status: RnpiVerificationStatus;
  rut: string;
  dv: string;
  nameProvided: string;
  professionalData?: {
    nameOfficial: string;
    profession: string;
    status: string;
    registrationDate?: string;
    specialties?: string[];
    registrationNumber?: string;
    institution?: string;
  };
  inconsistencies?: string[];
  errors?: string[];
  verifiedAt?: Date;
  rawData?: any; // Datos crudos para encriptar y guardar
}

export interface DoctorVerificationRequest {
  rut: string;
  dv: string;
  name: string;
  birthDate?: string;
  specialty?: string;
  email?: string;
}

export interface DoctorVerificationResult {
  finalStatus: VerificationFinalStatus;
  identityResult: IdentityVerificationResult;
  rnpiResult?: RnpiVerificationResult;
  errors: string[];
  warnings: string[];
  requiresManualReview: boolean;
  verifiedAt: Date;
}
