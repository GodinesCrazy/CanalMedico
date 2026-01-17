# Variables de Entorno para Tests

Copia este contenido a `.env.test` para configurar tests locales:

```env
# Variables de entorno para tests

# Base de datos de test (Docker Compose)
DATABASE_URL=postgresql://canalmedico_test:canalmedico_test_123@localhost:5433/canalmedico_test

# JWT Secrets (mínimo 32 caracteres para tests)
JWT_SECRET=test_jwt_secret_minimo_32_caracteres_para_pruebas_12345
JWT_REFRESH_SECRET=test_refresh_secret_minimo_32_caracteres_para_pruebas_12345

# API URLs (para tests)
API_URL=http://localhost:3000
FRONTEND_WEB_URL=http://localhost:5173
MOBILE_APP_URL=http://localhost:8081

# Encriptación (mínimo 32 caracteres para tests)
ENCRYPTION_KEY=test_encryption_key_minimo_32_caracteres_12345

# Feature Flags
ENABLE_WHATSAPP_AUTO_RESPONSE=false
ENABLE_PHONE_LOGIN=false

# CORS (para tests locales)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081

# MercadoPago (sandbox para tests - opcional)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx-xxxxx-xxxxx

# AWS (no requerido para tests - opcional)
AWS_ACCESS_KEY_ID=TEST_AWS_KEY
AWS_SECRET_ACCESS_KEY=TEST_AWS_SECRET
AWS_S3_BUCKET=test-bucket

# NODE_ENV
NODE_ENV=test
```

## Uso

```bash
# 1. Levantar DB de test y correr tests
./scripts/test-db.sh test

# 2. Solo apagar DB de test
./scripts/test-db.sh down
```
