/**
 * Jest Setup File
 * 
 * Ejecuta antes de cada test suite.
 * Configura variables de entorno y valida que DATABASE_URL esté configurado.
 */

// Validar que DATABASE_URL esté configurado para tests
if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_TEST) {
  console.warn('??  WARNING: DATABASE_URL no configurado para tests.');
  console.warn('   Usando DB de test por defecto (docker-compose.test.yml).');
  console.warn('   Ejecuta: ./scripts/test-db.sh test');
  
  // Para CI/CD, usar DATABASE_URL_TEST si está disponible
  if (process.env.DATABASE_URL_TEST) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  } else {
    // Fallback a DB de test local (Docker Compose)
    process.env.DATABASE_URL = 'postgresql://canalmedico_test:canalmedico_test_123@localhost:5433/canalmedico_test';
  }
}

// Asegurar que NODE_ENV es 'test'
process.env.NODE_ENV = 'test';

// Configurar JWT secrets mínimos para tests (si no están configurados)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_minimo_32_caracteres_para_pruebas_12345';
}

if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimo_32_caracteres_para_pruebas_12345';
}

// Configurar ENCRYPTION_KEY para tests (si no está configurado)
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'test_encryption_key_minimo_32_caracteres_12345';
}

console.log('? Jest setup completado');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
