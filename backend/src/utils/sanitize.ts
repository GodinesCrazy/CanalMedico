/**
 * Utilidades para sanitizar datos sensibles antes de loguear
 * CRÍTICO: Nunca loguear datos médicos, PII o PHI
 */

/**
 * Lista de campos que contienen datos sensibles y deben ser redactados
 */
const SENSITIVE_FIELDS = [
  // Autenticación
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'authorization',
  'bearer',
  'apiKey',
  'api_key',
  'apikey',
  'secret',
  'secretKey',
  'secret_key',
  
  // Datos personales
  'email',
  'phone',
  'phoneNumber',
  'phone_number',
  'rut',
  'dni',
  'ssn',
  'socialSecurityNumber',
  
  // Datos médicos (PHI)
  'message',
  'text',
  'content',
  'description',
  'notes',
  'medicalHistory',
  'medical_history',
  'diagnosis',
  'symptoms',
  'prescription',
  'medication',
  
  // Datos financieros
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'expiry',
  'expiryDate',
  'bankAccount',
  'bank_account',
  'accountNumber',
  'account_number',
  
  // Otros
  'otp',
  'verificationCode',
  'verification_code',
];

/**
 * Patrones regex para detectar datos sensibles en strings
 */
const SENSITIVE_PATTERNS = [
  // JWT tokens
  /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  // RUT chileno (formato: 12345678-9)
  /^\d{7,8}-[\dkK]$/,
  // Email
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Teléfono (formato chileno: +56912345678 o 912345678)
  /^(\+?56)?9\d{8}$/,
  // Tarjeta de crédito (16 dígitos)
  /^\d{13,19}$/,
];

/**
 * Redacta un valor sensible
 */
function redactValue(value: any): string {
  if (value === null || value === undefined) {
    return '[null]';
  }
  
  if (typeof value === 'string') {
    if (value.length === 0) {
      return '[empty]';
    }
    // Si es muy corto, redactar completamente
    if (value.length <= 4) {
      return '[REDACTED]';
    }
    // Mostrar primeros 2 y últimos 2 caracteres
    return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
  }
  
  return '[REDACTED]';
}

/**
 * Verifica si un campo debe ser redactado por nombre
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(field => lowerField.includes(field.toLowerCase()));
}

/**
 * Verifica si un valor contiene datos sensibles por patrón
 */
function containsSensitivePattern(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Sanitiza un objeto recursivamente, redactando campos sensibles
 */
export function sanitizeForLogging(obj: any, depth: number = 0): any {
  // Prevenir recursión infinita
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }
  
  // Valores primitivos
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Si el string contiene un patrón sensible, redactarlo
    if (containsSensitivePattern(obj)) {
      return redactValue(obj);
    }
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1));
  }
  
  // Objetos
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Si el campo es sensible por nombre, redactarlo
    if (isSensitiveField(key)) {
      sanitized[key] = redactValue(value);
      continue;
    }
    
    // Si el valor contiene un patrón sensible, redactarlo
    if (containsSensitivePattern(value)) {
      sanitized[key] = redactValue(value);
      continue;
    }
    
    // Recursión para objetos anidados
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitiza headers de request, especialmente Authorization
 */
export function sanitizeHeaders(headers: any): any {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }
  
  const sanitized: any = { ...headers };
  
  // Redactar Authorization header
  if (sanitized.authorization) {
    sanitized.authorization = '[REDACTED]';
  }
  
  // Redactar otros headers sensibles
  const sensitiveHeaders = [
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ];
  
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
    // También buscar en lowercase
    const lowerHeader = header.toLowerCase();
    if (sanitized[lowerHeader]) {
      sanitized[lowerHeader] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Sanitiza el body de un request
 */
export function sanitizeBody(body: any): any {
  return sanitizeForLogging(body);
}

/**
 * Sanitiza query parameters
 */
export function sanitizeQuery(query: any): any {
  return sanitizeForLogging(query);
}

/**
 * Sanitiza un error, especialmente stack traces que pueden contener datos sensibles
 */
export function sanitizeError(error: any): any {
  if (!error) {
    return error;
  }
  
  const sanitized: any = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
  };
  
  // Solo incluir stack en desarrollo
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    sanitized.stack = error.stack;
  }
  
  // Sanitizar propiedades adicionales
  if (error.statusCode) {
    sanitized.statusCode = error.statusCode;
  }
  
  if (error.isOperational !== undefined) {
    sanitized.isOperational = error.isOperational;
  }
  
  return sanitized;
}

