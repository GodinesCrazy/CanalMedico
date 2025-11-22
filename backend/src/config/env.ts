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

  // Stripe - Opcional temporalmente para permitir que el servidor inicie
  STRIPE_SECRET_KEY: z.string().default('sk_test_temporal_placeholder_minimo_32_caracteres_para_produccion'),
  STRIPE_PUBLISHABLE_KEY: z.string().default('pk_test_temporal_placeholder_minimo_32_caracteres_para_produccion'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_COMMISSION_FEE: z.string().default('0.15').transform(Number).pipe(z.number().min(0).max(1)),

  // MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),

  // AWS - Opcional temporalmente para permitir que el servidor inicie
  AWS_ACCESS_KEY_ID: z.string().default('AKIA_TEMPORAL_PLACEHOLDER_FOR_PRODUCTION'),
  AWS_SECRET_ACCESS_KEY: z.string().default('temporal_secret_key_placeholder_minimo_32_caracteres_para_produccion'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().default('canalmedico-files-temp'),

  FIREBASE_SERVER_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // URLs de frontend - Valores por defecto temporales
  FRONTEND_WEB_URL: z.string().url().default('http://localhost:5173'),
  MOBILE_APP_URL: z.string().url().default('http://localhost:8081'),

  BCRYPT_ROUNDS: z.string().default('10').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().int().positive()),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let env: EnvConfig;

try {
  // Usar variables preprocesadas (strings vacíos convertidos a undefined)
  const preprocessedEnv = preprocessEnv();
  env = envSchema.parse(preprocessedEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Error de configuración de variables de entorno:');
    console.error('');
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      const message = err.message;
      console.error(`  - ${path}: ${message}`);
    });
    console.error('');
    console.error('📋 Variables requeridas que deben configurarse en Railway:');
    console.error('  1. DATABASE_URL → ${{Postgres.DATABASE_URL}}');
    console.error('  2. API_URL → URL del backend (ej: https://canalmedico-production.up.railway.app)');
    console.error('  3. JWT_SECRET → Mínimo 32 caracteres (genera con: openssl rand -base64 32)');
    console.error('  4. JWT_REFRESH_SECRET → Mínimo 32 caracteres (genera con: openssl rand -base64 32)');
    console.error('');
    console.error('Ve a Railway → Servicio CanalMedico → Variables y configura estas variables.');
    process.exit(1);
  }
  throw error;
}

export default env;

