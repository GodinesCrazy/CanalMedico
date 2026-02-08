# GO-LIVE Runbook - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Guía paso a paso para despliegue en producción (Railway)

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.14)

---

## Pre-Requisitos (Variables ENV)

### Variables Críticas (Bloquean inicio si faltan)

**REQUERIDAS:**

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=[generar con: openssl rand -base64 32]
JWT_REFRESH_SECRET=[generar con: openssl rand -base64 32]
CORS_ALLOWED_ORIGINS=https://app.canalmedico.cl,https://canalmedico.cl
MERCADOPAGO_ACCESS_TOKEN=[token real de MercadoPago]
AWS_ACCESS_KEY_ID=[AWS IAM access key]
AWS_SECRET_ACCESS_KEY=[AWS IAM secret key]
AWS_S3_BUCKET=canalmedico-production
ENCRYPTION_KEY=[generar con: openssl rand -base64 32]
```

**Generación de Secrets:**
```bash
# JWT Secrets (mínimo 32 caracteres)
openssl rand -base64 32

# Encryption Key (mínimo 32 caracteres)
openssl rand -base64 32
```

**Validación:** `backend/src/config/env.ts` ? `validateProductionEnvironment()`

### Variables Recomendadas

```bash
NODE_ENV=production
API_URL=https://api.canalmedico.cl
FRONTEND_WEB_URL=https://app.canalmedico.cl
ENABLE_WHATSAPP_AUTO_RESPONSE=true  # Si WhatsApp está habilitado
WHATSAPP_ACCESS_TOKEN=[si WhatsApp habilitado]
WHATSAPP_PHONE_NUMBER_ID=[si WhatsApp habilitado]
WHATSAPP_WEBHOOK_VERIFY_TOKEN=[si WhatsApp habilitado]
```

---

## Pasos Deploy Railway

### 1. Verificar Código

```bash
# Verificar rama
git branch
# Debe estar en: release/go-final o main

# Verificar últimos commits
git log --oneline -5

# Verificar que no hay cambios sin commitear
git status
```

### 2. Configurar Variables ENV en Railway

**Método 1: Railway Dashboard**
1. Abrir Railway Dashboard: https://railway.app
2. Seleccionar proyecto "CanalMedico"
3. Seleccionar servicio "backend"
4. Ir a pestaña "Variables"
5. Agregar cada variable crítica (ver Pre-Requisitos)

**Método 2: Railway CLI**
```bash
# Instalar Railway CLI (si no está instalado)
npm i -g @railway/cli

# Login
railway login

# Agregar variables
railway variables set DATABASE_URL="${{Postgres.DATABASE_URL}}"
railway variables set JWT_SECRET="[generado]"
railway variables set JWT_REFRESH_SECRET="[generado]"
# ... etc
```

### 3. Conectar Base de Datos PostgreSQL

**Si ya existe:**
- Railway Dashboard ? Service "Postgres" ? Copy `DATABASE_URL`
- Usar como variable `DATABASE_URL`

**Si no existe:**
1. Railway Dashboard ? New Service ? Database ? PostgreSQL
2. Copiar `DATABASE_URL` generado
3. Agregar como variable `DATABASE_URL` en servicio "backend"

### 4. Push a Railway

**Método 1: Deploy automático (GitHub connected)**
```bash
# Push a rama monitoreada por Railway
git push origin release/go-final

# Railway detecta push y despliega automáticamente
# Verificar en Railway Dashboard ? Deployments
```

**Método 2: Deploy manual (Railway CLI)**
```bash
# Desde directorio backend/
cd backend

# Deploy
railway up

# O si tienes railway.json configurado
railway deploy
```

### 5. Monitorear Deploy

**Railway Dashboard:**
1. Service ? Deployments ? Ver último deployment
2. Verificar status: "Active" (verde)
3. Ver logs en tiempo real

**Comandos CLI:**
```bash
# Ver logs
railway logs

# O desde Railway Dashboard ? Service ? Logs
```

**Logs Esperados:**
```
[INFO] Starting server...
[INFO] Running migrations...
[INFO] Migration applied: [migration_name]
[INFO] Server listening on port 3000
[INFO] Health check endpoint: /healthz
```

---

## Migraciones

### Verificación Pre-Deploy

```bash
# Verificar migraciones pendientes
cd backend
npx prisma migrate status

# Verificar que schema está sincronizado
npx prisma validate
```

### Ejecución Automática (Recomendado)

**Railway ejecuta automáticamente:**
```bash
# En backend/src/server.ts hay código que ejecuta:
await runMigrations()
```

**Logs Esperados:**
```
[INFO] Running migrations...
[INFO] Migration applied: add_token_blacklist
[INFO] No pending migrations
```

### Ejecución Manual (Si es necesario)

**Railway CLI:**
```bash
# Ejecutar migraciones manualmente
railway run npx prisma migrate deploy
```

**O desde Railway Dashboard:**
1. Service ? Settings ? Run Command
2. Comando: `npx prisma migrate deploy`
3. Click "Run"

---

## Smoke Tests Post-Deploy

### 1. Health Check ?

```bash
curl https://api.canalmedico.cl/health

# Respuesta esperada:
{
  "ok": true,
  "status": "ok",
  "timestamp": "2025-01-26T...",
  "uptime": "60s",
  "environment": "production"
}
```

**También verificar Railway health check:**
```bash
curl https://api.canalmedico.cl/healthz
```

---

### 2. Login (Autenticación) ?

```bash
curl -X POST https://api.canalmedico.cl/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@canalmedico.com",
    "password": "[password]"
  }'

# Respuesta esperada: 200 OK con accessToken y refreshToken
```

---

### 3. Endpoint Protegido (RBAC) ?

```bash
# Primero obtener token (del paso 2)
TOKEN="[accessToken]"

# Llamar endpoint protegido
curl https://api.canalmedico.cl/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada: 200 OK con datos del usuario
# Sin token: 401 Unauthorized
```

---

### 4. Logout (Token Blacklist) ?

```bash
# Logout
curl -X POST https://api.canalmedico.cl/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada: 200 OK

# Intentar usar token después de logout
curl https://api.canalmedico.cl/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada: 401 Unauthorized (token en blacklist)
```

---

### 5. CORS ?

```bash
curl -H "Origin: https://app.canalmedico.cl" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS https://api.canalmedico.cl/api/auth/login

# Respuesta esperada: 200 OK con headers CORS:
# Access-Control-Allow-Origin: https://app.canalmedico.cl
# Access-Control-Allow-Methods: POST, GET, PUT, DELETE
# Access-Control-Allow-Headers: Authorization, Content-Type
```

---

### 6. Base de Datos (Query Prisma) ?

**Desde Railway Dashboard:**
1. Service "Postgres" ? Connect ? Copy connection string
2. Conectar con cliente PostgreSQL
3. Ejecutar query:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM doctors;
SELECT COUNT(*) FROM consultations;
```

**O desde backend logs:**
```bash
# Verificar que Prisma Client se conecta correctamente
# Logs deben mostrar: "Prisma Client initialized"
```

---

## Rollback Realista

### Condiciones para Rollback

- ? Health checks fallando > 5 minutos
- ? Error rate > 10%
- ? Funcionalidad core no funciona (login, pagos)
- ? Vulnerabilidad de seguridad detectada
- ? Migración causa pérdida de datos

---

### Proceso de Rollback (Railway Dashboard)

**Paso 1: Identificar versión anterior estable**
```bash
# Ver historial de deployments
git log --oneline -10

# O desde Railway Dashboard:
# Service ? Deployments ? Ver lista de deployments anteriores
```

**Paso 2: Rollback en Railway**
1. Railway Dashboard ? Service "backend"
2. Ir a pestaña "Deployments"
3. Buscar deployment anterior estable (estado: "Active" antes del problema)
4. Click en tres puntos (...) del deployment
5. Click "Redeploy"
6. Confirmar redeploy

**Paso 3: Verificar Rollback**
```bash
# Health check debe responder OK
curl https://api.canalmedico.cl/health

# Debe responder 200 OK

# Verificar logs
railway logs

# Debe mostrar deployment anterior (commit hash)
```

**Tiempo Estimado:** 5-10 minutos

---

### Proceso de Rollback (Railway CLI)

```bash
# Ver deployments
railway deployments list

# Rollback a deployment específico
railway deployments rollback [deployment-id]

# O rollback al anterior
railway deployments rollback --previous
```

---

### Rollback Manual (Git Revert)

**Si necesitas revertir código:**

```bash
# Identificar commit problemático
git log --oneline -10

# Revertir commit (crea nuevo commit)
git revert [commit-hash]

# Push
git push origin release/go-final

# Railway detecta y despliega automáticamente
```

---

## Post-Deploy Checklist

### Funcionalidad Core
- [ ] Health check responde 200 OK
- [ ] Login funciona (admin/doctor/patient)
- [ ] Endpoints protegidos funcionan (RBAC)
- [ ] Logout funciona (token blacklist)
- [ ] CORS configurado correctamente

### Base de Datos
- [ ] Migraciones aplicadas sin errores
- [ ] Prisma Client conecta correctamente
- [ ] Queries básicas funcionan

### Infraestructura
- [ ] Railway service está "Active"
- [ ] Logs no muestran errores críticos
- [ ] Variables ENV configuradas correctamente

### Monitoreo
- [ ] Logs estructurados visibles en Railway
- [ ] Error rate < 1%
- [ ] Response time < 500ms (promedio)

---

## Comandos Útiles

### Ver Logs en Tiempo Real
```bash
railway logs --follow
```

### Ver Variables ENV
```bash
railway variables
```

### Reiniciar Servicio
```bash
railway service restart
```

### Ver Estado de Deploy
```bash
railway status
```

---

## Referencias

- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.14)
- `docs/RELEASE_CANDIDATE_CHECKLIST.md`
- Railway Docs: https://docs.railway.app

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA GO-LIVE**
