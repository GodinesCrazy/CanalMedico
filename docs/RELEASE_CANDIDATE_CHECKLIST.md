# Release Candidate Checklist - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Rama:** `release/go-final`  
**Objetivo:** Verificar que el sistema está listo para producción

---

## ? Pre-Deploy Checklist

### Variables de Entorno en Producción

#### Críticas (Bloquean inicio)
- [ ] `DATABASE_URL` - Railway asigna: `${{Postgres.DATABASE_URL}}`
- [ ] `JWT_SECRET` - Generado: `openssl rand -base64 32` (mínimo 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` - Generado: `openssl rand -base64 32` (mínimo 32 caracteres)
- [ ] `ENCRYPTION_KEY` - Generado: `openssl rand -base64 32` (mínimo 32 caracteres)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Token real de MercadoPago (no placeholder)
- [ ] `AWS_ACCESS_KEY_ID` - Access Key de AWS IAM (formato AKIA...)
- [ ] `AWS_SECRET_ACCESS_KEY` - Secret Key de AWS IAM (mínimo 32 caracteres)
- [ ] `AWS_S3_BUCKET` - Nombre del bucket S3 (no contiene "temp" o "test")
- [ ] `CORS_ALLOWED_ORIGINS` - URLs separadas por coma (solo HTTPS, sin localhost)

#### Recomendadas
- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE` - `true` si WhatsApp está habilitado
- [ ] `API_URL` - URL del backend (ej: `https://api.canalmedico.cl`)
- [ ] `FRONTEND_WEB_URL` - URL del frontend web
- [ ] `MOBILE_APP_URL` - URL del app móvil
- [ ] `NODE_ENV` - `production`

---

## ? Migraciones de Base de Datos

### Verificación Pre-Deploy
- [ ] Migración `add_token_blacklist` existe en `prisma/migrations/`
- [ ] Modelo `TokenBlacklist` está en `prisma/schema.prisma`

### Ejecución en Producción
```bash
# En Railway, se ejecuta automáticamente con:
npm run start:migrate
# O manualmente:
npx prisma migrate deploy
```

**Evidencia:** Logs de Railway muestran "Migration applied" o "No pending migrations"

---

## ? Health Checks

### Endpoints de Health
- [ ] `GET /health` - Responde 200 OK
- [ ] `GET /healthz` - Responde 200 OK (usado por Railway)

**Verificación:**
```bash
curl https://api.canalmedico.cl/health
curl https://api.canalmedico.cl/healthz
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "2025-01-26T...",
  "uptime": "60s",
  "environment": "production",
  "version": "1.0.1"
}
```

---

## ? Smoke Tests (Post-Deploy)

### 1. Autenticación
```bash
# Login
curl -X POST https://api.canalmedico.cl/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Respuesta esperada: 200 OK con accessToken y refreshToken
```

### 2. Health Check
```bash
curl https://api.canalmedico.cl/health

# Respuesta esperada: 200 OK con status "ok"
```

### 3. Endpoint Protegido (Requiere Token)
```bash
# GET /api/users/me (requiere token)
curl https://api.canalmedico.cl/api/users/me \
  -H "Authorization: Bearer <access_token>"

# Respuesta esperada: 200 OK con datos del usuario
# Sin token: 401 Unauthorized
```

### 4. Logout (Token Blacklist)
```bash
# Logout
curl -X POST https://api.canalmedico.cl/api/auth/logout \
  -H "Authorization: Bearer <access_token>"

# Respuesta esperada: 200 OK
# Luego, usar el mismo token debe fallar con 401
```

### 5. CORS
```bash
# Verificar CORS headers
curl -H "Origin: https://app.canalmedico.cl" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS https://api.canalmedico.cl/api/auth/login

# Respuesta esperada: 200 OK con headers CORS correctos
```

---

## ? Rollback Plan

### Condiciones para Rollback
- Error crítico que afecta funcionalidad core
- Vulnerabilidad de seguridad detectada
- Health checks fallando (>5 minutos)
- Error rate > 10%

### Proceso de Rollback
1. **Identificar versión anterior estable:**
   ```bash
   git log --oneline -10
   ```

2. **Revertir en Railway:**
   - Railway Dashboard ? Service ? Deployments
   - Seleccionar deployment anterior
   - Click "Redeploy"

3. **Verificar Rollback:**
   ```bash
   curl https://api.canalmedico.cl/health
   # Debe responder 200 OK
   ```

4. **Tiempo estimado:** 5-10 minutos

---

## ? Validación Final

### Checklist Completo
- [ ] Todas las variables críticas configuradas
- [ ] Migraciones aplicadas
- [ ] Health checks respondiendo 200 OK
- [ ] Smoke tests pasando
- [ ] CORS configurado correctamente
- [ ] Token blacklist funcional (logout ? token invalidado)
- [ ] RBAC verificado (endpoints protegidos)
- [ ] CI/CD pipeline pasando (GitHub Actions)

### Comandos de Verificación
```bash
# 1. Build local (opcional, para verificar)
cd backend
npm install
npm run build

# 2. Tests locales (requiere DB de test)
./scripts/test-db.sh test

# 3. Verificar Railway logs
# Railway Dashboard ? Service ? Logs
# Buscar: "Migration applied", "Server listening", "Health check OK"
```

---

## ?? Documentación de Referencia

- `docs/GO_LIVE_SUMMARY.md` - Resumen de correcciones GO-LIVE
- `docs/RBAC_VERIFIED.md` - Verificación de RBAC y ownership
- `docs/AUDITORIA_COMPLETA_2025.md` - Auditoría completa del sistema
- `docs/WHATSAPP_QA_RUNBOOK.md` - Runbook de QA para WhatsApp

---

## ? Firmas de Aprobación

- [ ] **CTO:** _____________________ Fecha: _______
- [ ] **QA Lead:** _____________________ Fecha: _______
- [ ] **DevOps:** _____________________ Fecha: _______

---

**Generado:** 2025-01-26  
**Estado:** ? **LISTO PARA GO-LIVE** (tras completar checklist)
