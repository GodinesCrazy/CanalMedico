# Production Environment Checklist - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Checklist completo de variables de entorno para producción en Railway

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.14) y `backend/src/config/env.ts`

---

## Variables Críticas (Bloquean inicio si faltan)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **DATABASE_URL** | Backend CanalMedico | `${{Postgres.DATABASE_URL}}` | Railway asigna automáticamente al crear servicio Postgres | ? |
| **JWT_SECRET** | Backend CanalMedico | `<GENERATE_OPENSSL_32>` | Generar con: `openssl rand -base64 32` (mínimo 32 caracteres) | ? |
| **JWT_REFRESH_SECRET** | Backend CanalMedico | `<GENERATE_OPENSSL_32>` | Generar con: `openssl rand -base64 32` (mínimo 32 caracteres) | ? |
| **CORS_ALLOWED_ORIGINS** | Backend CanalMedico | `https://canalmedico-web-production.up.railway.app` | Lista comma-separated de URLs permitidas (solo HTTPS) | ? |
| **MERCADOPAGO_ACCESS_TOKEN** | Backend CanalMedico | `<MP_TOKEN>` | Dashboard MercadoPago ? Credentials ? Production ? Access Token | ? |
| **AWS_ACCESS_KEY_ID** | Backend CanalMedico | `<AWS_ACCESS_KEY>` | AWS IAM ? Users ? Create Access Key ? Access Key ID (formato: AKIA...) | ? |
| **AWS_SECRET_ACCESS_KEY** | Backend CanalMedico | `<AWS_SECRET_KEY>` | AWS IAM ? Create Access Key ? Secret Access Key (solo se muestra una vez) | ? |
| **AWS_S3_BUCKET** | Backend CanalMedico | `canalmedico-production` | Nombre del bucket S3 creado en AWS Console (NO debe contener "temp" o "test") | ? |
| **ENCRYPTION_KEY** | Backend CanalMedico | `<GENERATE_OPENSSL_32>` | Generar con: `openssl rand -base64 32` (mínimo 32 caracteres) | ? |

---

## Variables Requeridas (Básicas del sistema)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **NODE_ENV** | Backend CanalMedico | `production` | Fijo: siempre `production` en producción | ? |
| **API_URL** | Backend CanalMedico | `https://canalmedico-production.up.railway.app` | URL del backend Railway (verificado) | ? |
| **FRONTEND_WEB_URL** | Backend CanalMedico | `https://canalmedico-web-production.up.railway.app` | URL del frontend Railway (verificado) | ? |
| **MOBILE_APP_URL** | Backend CanalMedico | `https://canalmedico-web-production.up.railway.app` | URL del app móvil (mismo que frontend por ahora) | ? |
| **PORT** | Backend CanalMedico | `${{PORT}}` | Railway asigna automáticamente (NO configurar manualmente) | ? |

---

## Variables WhatsApp (Opcionales - Requeridas si ENABLE_WHATSAPP_AUTO_RESPONSE=true)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **ENABLE_WHATSAPP_AUTO_RESPONSE** | Backend CanalMedico | `true` o `false` | Feature flag: `true` para habilitar auto-respuesta WhatsApp | ? |
| **WHATSAPP_ACCESS_TOKEN** | Backend CanalMedico | `<META_TOKEN>` | Meta Developers ? App ? WhatsApp ? API Setup ? Access Token (permanente recomendado) | ? |
| **WHATSAPP_PHONE_NUMBER_ID** | Backend CanalMedico | `<PHONE_NUMBER_ID>` | Meta Developers ? App ? WhatsApp ? API Setup ? Phone number ID | ? |
| **WHATSAPP_BUSINESS_ACCOUNT_ID** | Backend CanalMedico | `<BUSINESS_ACCOUNT_ID>` | Meta Developers ? Business Settings ? WhatsApp Business Account ID | ? |
| **WHATSAPP_WEBHOOK_VERIFY_TOKEN** | Backend CanalMedico | `canalmedico_verify_2026` | Token personalizado para verificar webhook de Meta (recomendado: `canalmedico_verify_2026`) | ? |
| **WHATSAPP_APP_SECRET** | Backend CanalMedico | `<APP_SECRET>` (opcional) | Meta Developers ? App ? Settings ? Basic ? App Secret (para verificar signature) | ? |

**Guía completa:** Ver `docs/META_WHATSAPP_SETUP_STEPS.md`

---

## Variables MercadoPago (Opcionales - Requeridas si se usan pagos)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **MERCADOPAGO_WEBHOOK_SECRET** | Backend CanalMedico | `<MP_WEBHOOK_SECRET>` (opcional) | MercadoPago Dashboard ? Webhooks ? Secret (para verificar signature) | ? |

**Guía completa:** Ver `docs/MERCADOPAGO_SETUP_STEPS.md`

---

## Variables Opcionales (Funcionalidades adicionales)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **ENABLE_PHONE_LOGIN** | Backend CanalMedico | `false` | Feature flag para login con OTP por teléfono | ? |
| **ENABLE_QUICK_CONSULTATION** | Backend CanalMedico | `false` | Feature flag para consultas rápidas desde deep links | ? |
| **STRIPE_COMMISSION_FEE** | Backend CanalMedico | `0.15` | Comisión de plataforma (15% por defecto) | ? |
| **AWS_REGION** | Backend CanalMedico | `us-east-1` | Región de AWS S3 (por defecto: `us-east-1`) | ? |

---

## Variables SNRE (Recetas Electrónicas - Opcionales)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **SNRE_BASE_URL** | Backend CanalMedico | `<SNRE_API_URL>` | URL base de la API FHIR del SNRE | ? |
| **SNRE_API_KEY** | Backend CanalMedico | `<SNRE_API_KEY>` | API Key para autenticación con SNRE | ? |
| **SNRE_ENVIRONMENT** | Backend CanalMedico | `production` | Ambiente SNRE: `sandbox` o `production` | ? |

---

## Variables Floid/RNPI (Validación Médicos - Opcionales)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **FLOID_BASE_URL** | Backend CanalMedico | `<FLOID_API_URL>` | URL base de Floid API (Registro Civil) | ? |
| **FLOID_API_KEY** | Backend CanalMedico | `<FLOID_API_KEY>` | API Key de Floid | ? |
| **RNPI_API_URL** | Backend CanalMedico | `<RNPI_API_URL>` | URL de API de Prestadores de Superintendencia de Salud | ? |

---

## Variables Firebase (Notificaciones Push - Opcionales)

| Variable | Servicio | Valor Exacto | Cómo Obtenerlo | ? Configurado |
|----------|----------|--------------|----------------|----------------|
| **FIREBASE_SERVER_KEY** | Backend CanalMedico | `<FIREBASE_KEY>` | Firebase Console ? Project Settings ? Cloud Messaging ? Server Key | ? |
| **FIREBASE_PROJECT_ID** | Backend CanalMedico | `<FIREBASE_PROJECT_ID>` | Firebase Console ? Project Settings ? General ? Project ID | ? |

---

## Validación Post-Configuración

### Comandos de Verificación

```bash
# 1. Health check (debe responder 200 OK)
curl https://canalmedico-production.up.railway.app/health

# 2. Verificar variables críticas (desde logs de Railway)
# Railway Dashboard ? Service ? Logs ? Buscar: "? Validación de variables de entorno: PASADA"

# 3. Verificar CORS (debe permitir frontend)
curl -H "Origin: https://canalmedico-web-production.up.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://canalmedico-production.up.railway.app/api/auth/login
```

### Endpoint de Verificación (Opcional - Solo si existe /debug/env-status)

```bash
# Verificar flags y presencia de variables (NO valores secretos)
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  https://canalmedico-production.up.railway.app/debug/env-status
```

---

## Notas Importantes

### ?? Seguridad

1. **NUNCA** incluir valores reales de secretos en este checklist (usar `<PLACEHOLDER>`)
2. **NUNCA** incluir `localhost`, `127.0.0.1` o IPs locales en `CORS_ALLOWED_ORIGINS` en producción
3. **NUNCA** usar valores placeholder como `test_`, `dummy`, `placeholder` en producción
4. Todos los secretos deben generarse con `openssl rand -base64 32` o herramientas seguras

### ?? Validación Automática

El backend valida automáticamente en `backend/src/config/env.ts`:
- Todas las variables críticas están presentes
- Valores NO son placeholders
- `CORS_ALLOWED_ORIGINS` NO contiene localhost en producción
- Longitudes mínimas de secrets (JWT: 32 caracteres, ENCRYPTION_KEY: 32 caracteres)

**Si falta alguna variable crítica, el servidor NO iniciará.**

---

## Referencias

- `backend/src/config/env.ts` - Validación de variables
- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.14)
- `docs/META_WHATSAPP_SETUP_STEPS.md`
- `docs/MERCADOPAGO_SETUP_STEPS.md`

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA CONFIGURAR**
