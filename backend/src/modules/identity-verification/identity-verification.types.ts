/**
 * Tipos para validaci�n de identidad contra Registro Civil
 */

export enum IdentityVerificationStatus {
  IDENTIDAD_VERIFICADA = 'IDENTIDAD_VERIFICADA',
  IDENTIDAD_NO_COINCIDE = 'IDENTIDAD_NO_COINCIDE',
  RUN_INVALIDO = 'RUN_INVALIDO',
  RC_NO_RESPONDE = 'RC_NO_RESPONDE',
  ERROR_VALIDACION = 'ERROR_VALIDACION',
  PENDING = 'PENDING',
}

export interface IdentityVerificationRequest {
  rut: string; // RUN sin puntos ni gui�n (ej: "12345678")
  dv: string; // D�gito verificador (ej: "9")
  name: string; // Nombre completo
  birthDate?: string; // Fecha de nacimiento (ISO 8601) - opcional
}

export interface IdentityVerificationResult {
  status: IdentityVerificationStatus;
  rut: string;
  dv: string;
  nameProvided: string;
  nameOfficial?: string; // Nombre seg�n Registro Civil
  birthDateOfficial?: string; // Fecha de nacimiento seg�n Registro Civil
  idCardStatus?: 'VIGENTE' | 'VENCIDA' | 'NO_DISPONIBLE'; // Estado de c�dula
  matchScore?: number; // 0-100, qu� tan bien coincide el nombre
  errors?: string[];
  provider?: string; // Proveedor usado (ej: "FLOID", "OTRO")
  verifiedAt?: Date;
}

export interface IdentityVerificationProvider {
  /**
   * Verifica la identidad contra Registro Civil
   */
  verifyIdentity(request: IdentityVerificationRequest): Promise<IdentityVerificationResult>;
  
  /**
   * Verifica si el proveedor est� disponible
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Nombre del proveedor
   */
  getName(): string;
}
