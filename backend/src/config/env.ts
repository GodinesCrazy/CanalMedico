import { config } from 'dotenv';
import { z } from 'zod';

config();

// Preprocesar variables de entorno: convertir strings vacíos a undefined
// Esto permite que Zod aplique los valores por defecto cuando las variables están vacías
const preprocessEnv = () => {
  const env = { ...process.env };
  Object.keys(env).forEach((key) => {
    if (env[key] === '') {
      delete env[key];
    }
  });
  return env;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // PORT es opcional porque Railway lo asigna automáticamente en runtime (process.env.PORT)
  // Si no está definido, usamos 3000 por defecto
  PORT: z.string().default('3000').transform(Number).pipe(z.number().int().positive()),
  API_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encriptación - REQUERIDA en producción
  ENCRYPTION_KEY: z.string().min(32).optional(),
  ENCRYPTION_SALT: z.string().min(8).optional(),

  // Stripe - OPCIONAL (no se usa actualmente, pero si se configura debe ser válido)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_COMMISSION_FEE: z.string().default('0.15').transform(Number).pipe(z.number().min(0).max(1)),

  // MercadoPago - REQUERIDO en producción
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),

  // AWS - REQUERIDO en producción si se usan archivos
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),

  FIREBASE_SERVER_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // URLs de frontend - Requeridas en producción
  FRONTEND_WEB_URL: z.string().url().default('http://localhost:5173'),
  MOBILE_APP_URL: z.string().url().default('http://localhost:8081'),

  BCRYPT_ROUNDS: z.string().default('10').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().int().positive()),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),

  // SNRE (Sistema Nacional de Receta Electrónica)
  SNRE_BASE_URL: z.string().url().optional(), // URL base de la API FHIR del SNRE
  SNRE_API_KEY: z.string().optional(), // API Key para autenticación con SNRE
  SNRE_CLIENT_ID: z.string().optional(), // Client ID si usa OAuth2
  SNRE_CLIENT_SECRET: z.string().optional(), // Client Secret si usa OAuth2
  SNRE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'), // Ambiente SNRE

  // Validación de Identidad (Registro Civil)
  FLOID_BASE_URL: z.string().url().optional(), // URL base de Floid API
  FLOID_API_KEY: z.string().optional(), // API Key de Floid
  FLOID_TIMEOUT_MS: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10000), // Timeout para Floid
  IDENTITY_VERIFICATION_PROVIDER: z.enum(['FLOID', 'OTRO']).default('FLOID'), // Proveedor de validación

  // Validación Profesional (RNPI - Superintendencia de Salud)
  RNPI_API_URL: z.string().url().optional(), // URL de API de Prestadores de Superintendencia de Salud
  RNPI_TIMEOUT_MS: z.string().optional().transform((val) => val ? parseInt(val, 10) : 15000), // Timeout para RNPI (default: 15000ms)

  // Aliases para compatibilidad
  RC_API_URL: z.string().url().optional(), // Alias para FLOID_BASE_URL
  RC_API_KEY: z.string().optional(), // Alias para FLOID_API_KEY
  RC_TIMEOUT_MS: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10000), // Timeout para Registro Civil (default: 10000ms)

  // Feature Flags - Por defecto: false (desactivados)
  ENABLE_WHATSAPP_AUTO_RESPONSE: z.string().default('false').transform((val) => val === 'true'),
  ENABLE_PHONE_LOGIN: z.string().default('false').transform((val) => val === 'true'),
  ENABLE_QUICK_CONSULTATION: z.string().default('false').transform((val) => val === 'true'),
  ENABLE_TEST_ADMIN: z.string().default('false').transform((val) => val === 'true'),

  // WhatsApp Cloud API - OPCIONAL (solo requerido si ENABLE_WHATSAPP_AUTO_RESPONSE=true)
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_APP_SECRET: z.string().optional(), // Para verificar signature del webhook
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

// Función helper para detectar valores placeholder
const isPlaceholderValue = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  
  const placeholderPatterns = [
    'placeholder',
    'TEMPORAL',
    'temporal',
    'PLACEHOLDER',
    'test_',
    'TEST-',
    'dummy',
    'DUMMY',
    'example',
    'EXAMPLE',
    'your_',
    'tu_',
    'xxxxx',
    'XXXXX',
    'changeme',
    'CHANGEME',
  ];
  
  const exactPlaceholders = [
    'TEST-00000000-0000-0000-0000-000000000000',
    'AKIA_TEMPORAL_PLACEHOLDER_FOR_PRODUCTION',
    'temporal_secret_key_placeholder_minimo_32_caracteres_para_produccion',
    'sk_test_temporal_placeholder_minimo_32_caracteres_para_produccion',
    'pk_test_temporal_placeholder_minimo_32_caracteres_para_produccion',
  ];
  
  const lowerValue = value.toLowerCase();
  
  // Verificar patterns
  if (placeholderPatterns.some(pattern => lowerValue.includes(pattern.toLowerCase()))) {
    return true;
  }
  
  // Verificar exactos
  if (exactPlaceholders.includes(value)) {
    return true;
  }
  
  return false;
};

// Validación estricta post-parse para producción
const validateProductionEnvironment = (parsedEnv: EnvConfig): void => {
  if (parsedEnv.NODE_ENV !== 'production') {
    return; // No validar en desarrollo/test
  }
  
  const errors: Array<{ variable: string; reason: string }> = [];
  
  // CRÍTICA 1: MERCADOPAGO_ACCESS_TOKEN
  if (!parsedEnv.MERCADOPAGO_ACCESS_TOKEN) {
    errors.push({
      variable: 'MERCADOPAGO_ACCESS_TOKEN',
      reason: 'Requerida en producción para procesar pagos. Sistema NO puede funcionar sin esta variable.',
    });
  } else if (parsedEnv.MERCADOPAGO_ACCESS_TOKEN.trim() === '') {
    errors.push({
      variable: 'MERCADOPAGO_ACCESS_TOKEN',
      reason: 'No puede estar vacía en producción.',
    });
  } else if (isPlaceholderValue(parsedEnv.MERCADOPAGO_ACCESS_TOKEN)) {
    errors.push({
      variable: 'MERCADOPAGO_ACCESS_TOKEN',
      reason: 'Contiene valor placeholder. Debe ser un token real de MercadoPago obtenido del Dashboard.',
    });
  } else if (parsedEnv.MERCADOPAGO_ACCESS_TOKEN.length < 10) {
    errors.push({
      variable: 'MERCADOPAGO_ACCESS_TOKEN',
      reason: `Longitud inválida (${parsedEnv.MERCADOPAGO_ACCESS_TOKEN.length} caracteres). Token de MercadoPago debe tener al menos 10 caracteres.`,
    });
  }
  
  // CRÍTICA 2: AWS_ACCESS_KEY_ID
  if (!parsedEnv.AWS_ACCESS_KEY_ID) {
    errors.push({
      variable: 'AWS_ACCESS_KEY_ID',
      reason: 'Requerida en producción para almacenar archivos médicos. Sistema NO puede funcionar sin esta variable.',
    });
  } else if (parsedEnv.AWS_ACCESS_KEY_ID.trim() === '') {
    errors.push({
      variable: 'AWS_ACCESS_KEY_ID',
      reason: 'No puede estar vacía en producción.',
    });
  } else if (isPlaceholderValue(parsedEnv.AWS_ACCESS_KEY_ID)) {
    errors.push({
      variable: 'AWS_ACCESS_KEY_ID',
      reason: 'Contiene valor placeholder. Debe ser una Access Key real de AWS IAM.',
    });
  } else if (!parsedEnv.AWS_ACCESS_KEY_ID.startsWith('AKIA') && parsedEnv.AWS_ACCESS_KEY_ID.length < 16) {
    errors.push({
      variable: 'AWS_ACCESS_KEY_ID',
      reason: 'Formato inválido. Access Key de AWS debe empezar con "AKIA" y tener al menos 16 caracteres.',
    });
  }
  
  // CRÍTICA 3: AWS_SECRET_ACCESS_KEY
  if (!parsedEnv.AWS_SECRET_ACCESS_KEY) {
    errors.push({
      variable: 'AWS_SECRET_ACCESS_KEY',
      reason: 'Requerida en producción para almacenar archivos médicos. Sistema NO puede funcionar sin esta variable.',
    });
  } else if (parsedEnv.AWS_SECRET_ACCESS_KEY.trim() === '') {
    errors.push({
      variable: 'AWS_SECRET_ACCESS_KEY',
      reason: 'No puede estar vacía en producción.',
    });
  } else if (isPlaceholderValue(parsedEnv.AWS_SECRET_ACCESS_KEY)) {
    errors.push({
      variable: 'AWS_SECRET_ACCESS_KEY',
      reason: 'Contiene valor placeholder. Debe ser una Secret Key real de AWS IAM.',
    });
  } else if (parsedEnv.AWS_SECRET_ACCESS_KEY.length < 32) {
    errors.push({
      variable: 'AWS_SECRET_ACCESS_KEY',
      reason: `Longitud inválida (${parsedEnv.AWS_SECRET_ACCESS_KEY.length} caracteres). Secret Key de AWS debe tener al menos 32 caracteres.`,
    });
  }
  
  // CRÍTICA 4: AWS_S3_BUCKET
  if (!parsedEnv.AWS_S3_BUCKET) {
    errors.push({
      variable: 'AWS_S3_BUCKET',
      reason: 'Requerida en producción. Debe ser el nombre del bucket S3 donde se almacenan archivos médicos.',
    });
  } else if (parsedEnv.AWS_S3_BUCKET.trim() === '') {
    errors.push({
      variable: 'AWS_S3_BUCKET',
      reason: 'No puede estar vacía en producción.',
    });
  } else if (parsedEnv.AWS_S3_BUCKET.includes('temp') || parsedEnv.AWS_S3_BUCKET.includes('test')) {
    errors.push({
      variable: 'AWS_S3_BUCKET',
      reason: `Nombre de bucket contiene "temp" o "test" (${parsedEnv.AWS_S3_BUCKET}). Debe ser un bucket de producción válido.`,
    });
  }
  
  // CRÍTICA 5: ENCRYPTION_KEY
  if (!parsedEnv.ENCRYPTION_KEY) {
    errors.push({
      variable: 'ENCRYPTION_KEY',
      reason: 'Requerida en producción para encriptar datos médicos sensibles. Sistema NO puede funcionar sin esta variable.',
    });
  } else if (parsedEnv.ENCRYPTION_KEY.trim() === '') {
    errors.push({
      variable: 'ENCRYPTION_KEY',
      reason: 'No puede estar vacía en producción.',
    });
  } else if (isPlaceholderValue(parsedEnv.ENCRYPTION_KEY)) {
    errors.push({
      variable: 'ENCRYPTION_KEY',
      reason: 'Contiene valor placeholder. Debe ser una clave generada aleatoriamente (mínimo 32 caracteres).',
    });
  } else if (parsedEnv.ENCRYPTION_KEY.length < 32) {
    errors.push({
      variable: 'ENCRYPTION_KEY',
      reason: `Longitud insuficiente (${parsedEnv.ENCRYPTION_KEY.length} caracteres). Mínimo requerido: 32 caracteres. Genera con: openssl rand -base64 32`,
    });
  }
  
  // Si hay errores, reportar y abortar
  if (errors.length > 0) {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║                    🚨 BLOQUEADO POR SEGURIDAD 🚨              ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('❌ DESPLIEGUE EN PRODUCCIÓN RECHAZADO');
    console.error('');
    console.error(`   Ambiente: ${parsedEnv.NODE_ENV.toUpperCase()}`);
    console.error(`   Errores encontrados: ${errors.length}`);
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('');
    
    errors.forEach((error, index) => {
      console.error(`   ${index + 1}. ${error.variable}`);
      console.error(`      └─ ${error.reason}`);
      console.error('');
    });
    
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('');
    console.error('📋 VARIABLES CRÍTICAS REQUERIDAS EN PRODUCCIÓN:');
    console.error('');
    console.error('   1. MERCADOPAGO_ACCESS_TOKEN');
    console.error('      → Obtener de: https://www.mercadopago.cl/developers/panel/credentials');
    console.error('');
    console.error('   2. AWS_ACCESS_KEY_ID');
    console.error('      → Crear en: AWS IAM → Users → Access Keys');
    console.error('');
    console.error('   3. AWS_SECRET_ACCESS_KEY');
    console.error('      → Se obtiene al crear Access Key (solo se muestra una vez)');
    console.error('');
    console.error('   4. AWS_S3_BUCKET');
    console.error('      → Nombre del bucket S3 creado en AWS Console');
    console.error('');
    console.error('   5. ENCRYPTION_KEY');
    console.error('      → Generar con: openssl rand -base64 32');
    console.error('      → Guardar de forma segura (no se puede recuperar si se pierde)');
    console.error('');
    console.error('🔒 ACCIÓN REQUERIDA:');
    console.error('');
    console.error('   1. Configura todas las variables en Railway Dashboard');
    console.error('   2. Verifica que NO contengan valores placeholder');
    console.error('   3. Asegúrate de usar valores REALES de producción');
    console.error('   4. Reinicia el servicio después de configurar');
    console.error('');
    console.error('⚠️  El servidor NO iniciará hasta que TODAS las variables estén configuradas correctamente.');
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║              Sistema bloqueado por seguridad                  ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    
    // CRÍTICO RAILWAY: No hacer process.exit(1) inmediatamente
    // Si el servidor ya está escuchando (early listen), dar tiempo para que responda a healthchecks
    // Usar setTimeout para permitir que el servidor responda antes de cerrar
    // Esto permite que Railway haga healthcheck incluso si hay errores de configuración
    const serverMayBeListening = (global as any).__SERVER_LISTENING__ === true;
    if (serverMayBeListening) {
      console.error('⚠️  Servidor está escuchando - dando 5 segundos para healthcheck antes de cerrar');
      setTimeout(() => {
        console.error('❌ Cerrando servidor por errores de configuración');
        process.exit(1);
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

// CARGA Y VALIDACIÓN DE VARIABLES DE ENTORNO
try {
  // Preprocesar variables (convertir strings vacíos a undefined)
  const preprocessedEnv = preprocessEnv();
  
  // Parseo seguro con safeParse (NO usar parse directamente)
  const parseResult = envSchema.safeParse(preprocessedEnv);
  
  if (!parseResult.success) {
    // Error en validación de schema (variables básicas faltantes)
    const isProduction = preprocessedEnv.NODE_ENV === 'production';
    
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║          ❌ ERROR DE CONFIGURACIÓN DE VARIABLES               ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`   Ambiente: ${preprocessedEnv.NODE_ENV || 'development'}`);
    console.error(`   Errores de validación: ${parseResult.error.errors.length}`);
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('');
    
    parseResult.error.errors.forEach((err, index) => {
      const path = err.path.join('.');
      console.error(`   ${index + 1}. Variable: ${path}`);
      console.error(`      Error: ${err.message}`);
      console.error('');
    });
    
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('');
    
    if (isProduction) {
      console.error('🚨 PRODUCCIÓN DETECTADA - Variables críticas faltantes:');
      console.error('');
      console.error('   Variables OBLIGATORIAS que DEBEN estar configuradas:');
      console.error('   1. DATABASE_URL → ${{Postgres.DATABASE_URL}}');
      console.error('   2. API_URL → URL del backend (ej: https://api.canalmedico.cl)');
      console.error('   3. JWT_SECRET → openssl rand -base64 32');
      console.error('   4. JWT_REFRESH_SECRET → openssl rand -base64 32');
      console.error('   5. NODE_ENV → production');
      console.error('');
    } else {
      console.error('ℹ️  Variables requeridas para desarrollo:');
      console.error('');
      console.error('   1. DATABASE_URL → postgresql://usuario:password@localhost:5432/canalmedico');
      console.error('   2. API_URL → http://localhost:3000');
      console.error('   3. JWT_SECRET → openssl rand -base64 32');
      console.error('   4. JWT_REFRESH_SECRET → openssl rand -base64 32');
      console.error('');
    }
    
    console.error('📍 Configuración:');
    console.error('   Railway → Servicio Backend → Variables → Agregar variable');
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║              Servidor bloqueado por configuración             ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('');
    
    process.exit(1);
  }
  
  // Parseo exitoso, asignar valores
  env = parseResult.data;
  
  // Validación estricta post-parse SOLO en producción
  if (env.NODE_ENV === 'production') {
    validateProductionEnvironment(env);
    
    // Si llegamos aquí, todas las validaciones pasaron
    console.log('');
    console.log('✅ Validación de variables de entorno: PASADA');
    console.log(`   Ambiente: ${env.NODE_ENV.toUpperCase()}`);
    console.log('   Todas las variables críticas configuradas correctamente');
    console.log('');
  }
  
} catch (error) {
  // Error inesperado (no debería llegar aquí con safeParse)
  console.error('');
  console.error('╔════════════════════════════════════════════════════════════════╗');
  console.error('║          ❌ ERROR FATAL AL CARGAR VARIABLES                   ║');
  console.error('╚════════════════════════════════════════════════════════════════╝');
  console.error('');
  console.error('Error inesperado al validar variables de entorno:');
  console.error(error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
  }
  console.error('');
  console.error('⚠️  Contacta al equipo de desarrollo.');
  console.error('');
  
  process.exit(1);
}

export default env;
