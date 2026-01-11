# Playbook Railway Deploy - BACKEND CanalMedico

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - GUÍA COMPLETA DE DEPLOY

---

## 🎯 OBJETIVO

Asegurar que el backend de CanalMedico se despliegue correctamente en Railway:
- ✅ Root Directory = `backend`
- ✅ Healthcheck pasa en `/health`
- ✅ Deploy incluye el último commit
- ✅ Logs visibles en Railway Dashboard

---

## 📋 PASOS OBLIGATORIOS EN RAILWAY DASHBOARD

### Paso 1: Configurar Root Directory (CRÍTICO)

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar sección **"Source"** o **"Root Directory"**
3. **Cambiar a:** `backend`
4. **Guardar cambios**

**⚠️ CRÍTICO:** Si esto NO está configurado, Railway usará la raíz del repositorio y el deploy FALLARÁ.

**Cómo verificar:**
- En Railway Dashboard → Settings → Source
- Debe mostrar: `backend` (NO `.` o `/`)

---

### Paso 2: Verificar Start Command

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Start Command"** o **"Run Command"**
3. **Debe ser:** `node dist/server.js`
4. Si está vacío, dejarlo vacío (Railway usará `backend/railway.json` automáticamente)
5. **Guardar cambios**

**Alternativa:**
- Dejar vacío y Railway usará `backend/railway.json` → `startCommand: "node dist/server.js"`

---

### Paso 3: Verificar Build Command (DEBE ESTAR VACÍO)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Build Command"**
3. **DEBE estar VACÍO** (Railway usará `backend/nixpacks.toml` automáticamente)
4. Si tiene algún comando, **eliminarlo**
5. **Guardar cambios**

**Por qué debe estar vacío:**
- Railway detecta `backend/nixpacks.toml` automáticamente
- Nixpacks ejecuta: `npm ci`, `npx prisma generate`, `npm run build`
- Si se especifica manualmente, puede entrar en conflicto

---

### Paso 4: Verificar Healthcheck Path

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Healthcheck"** o **"Health Check"**
3. **Path:** `/health`
4. **Timeout:** 100 (segundos)
5. **Interval:** 10 (segundos)
6. **Guardar cambios**

**Alternativa:**
- Dejar vacío y Railway usará `backend/railway.json` → `healthcheckPath: "/health"`

---

### Paso 5: Verificar GitHub Connection

1. Ir a **Railway Dashboard** → **Settings** → **Connect GitHub**
2. Verificar que el repositorio **`GodinesCrazy/CanalMedico`** está conectado
3. Verificar que el branch es **`main`**
4. Verificar que **Auto-deploy** está **ON**
5. Si NO está conectado, conectarlo

---

### Paso 6: Forzar Redeploy

**Después de cambiar las configuraciones:**

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Deployments**
2. Hacer clic en **"Redeploy"** o **"Redeploy Latest"**
3. Esperar a que el deploy complete (2-5 minutos)
4. Verificar logs para confirmar que está usando configuración correcta

**Alternativa:**
- Hacer un commit vacío para forzar redeploy:
  ```bash
  git commit --allow-empty -m "chore: force railway redeploy"
  git push origin main
  ```

---

## ✅ VALIDACIÓN POST-DEPLOY

### 1. Verificar Logs Railway

En **Railway Dashboard** → **Logs**, buscar estos logs al boot:

```
============================================================
[DEPLOY] CanalMedico Backend
[DEPLOY] Commit: <hash-del-último-commit>
[DEPLOY] Version: 1.0.1
[DEPLOY] Environment: production
============================================================
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health check available at http://0.0.0.0:<port>/health
============================================================
```

**Si NO aparecen estos logs:**
- ❌ Root Directory NO está configurado correctamente
- ❌ Forzar redeploy nuevamente
- ❌ Verificar que Start Command = `node dist/server.js`

---

### 2. Validar Endpoints

#### Health Check
```bash
curl https://canalmedico-production.up.railway.app/health
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "2024-11-23T12:00:00.000Z",
  "uptime": "10s",
  "environment": "production",
  "version": "1.0.1",
  "commit": "ace2100",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

#### Deploy Info
```bash
curl https://canalmedico-production.up.railway.app/api/deploy/info
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.1",
    "commitHash": "ace2100...",
    "environment": "production",
    "buildTimestamp": "...",
    "deployTimestamp": "...",
    "nodeVersion": "v18.17.0"
  }
}
```

#### Seed Health
```bash
curl https://canalmedico-production.up.railway.app/api/seed/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Seed module is mounted",
  "enableTestData": false,
  "routes": ["/api/seed/health", "/api/seed/test-data"]
}
```

---

### 3. Usar Script de Verificación

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app npm run verify:railway
```

**Salida esperada:**
```
========================================
Railway Deploy Verification
========================================
API URL: https://canalmedico-production.up.railway.app
========================================

🔍 Verificando GET /health...
  ✅ Status: 200
  📋 Version: 1.0.1
  📋 Commit: ace2100
  📋 Status: ok
  📋 Uptime: 10s
  📋 Services: DB=connected, Migrations=completed

🔍 Verificando GET /api/seed/health...
  ✅ Status: 200
  📋 Message: Seed module is mounted

🔍 Verificando GET /api/deploy/info...
  ✅ Status: 200
  📋 Version: 1.0.1
  📋 Commit: ace2100...

📋 Intentando obtener último commit de GitHub...
  📋 Commit desplegado: ace2100
  📋 Último commit en GitHub: ace2100
  ✅ Deploy está actualizado con el último commit

========================================
✅ DEPLOY OK
========================================
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: Healthcheck falla

**Síntomas:**
- Railway muestra "Attempt failed with service unavailable"
- Réplicas nunca se vuelven healthy

**Soluciones:**
1. Verificar que `/health` está montado antes de middlewares pesados
2. Verificar que `listen()` se ejecuta inmediatamente (no después de DB/migrations)
3. Verificar que PORT está siendo leído de `process.env.PORT`
4. Verificar que escucha en `0.0.0.0` (no localhost)
5. Revisar logs Railway para ver dónde se detiene el proceso

**Logs a buscar:**
```
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health check available at http://0.0.0.0:<port>/health
```

---

### Problema 2: Deploy no incluye último commit

**Síntomas:**
- `/health` responde commit hash diferente al último commit en GitHub
- `/api/deploy/info` muestra commit hash antiguo

**Soluciones:**
1. Verificar que GitHub connection está configurada correctamente
2. Verificar que branch es `main`
3. Verificar que Auto-deploy está ON
4. Forzar redeploy manualmente
5. Verificar que Root Directory = `backend` (Railway puede no estar detectando cambios)

**Cómo validar:**
```bash
# Obtener último commit local
git log -1 --format=%H

# Verificar commit en Railway
curl https://canalmedico-production.up.railway.app/health | jq .commit
```

---

### Problema 3: Root Directory incorrecto

**Síntomas:**
- Railway logs muestran errores de "package.json not found"
- Build falla o no encuentra `dist/server.js`
- Endpoints no funcionan (404)

**Soluciones:**
1. Ir a Railway Dashboard → Settings → Source
2. Cambiar Root Directory a `backend`
3. Guardar cambios
4. Forzar redeploy

**Cómo verificar:**
- En Railway Dashboard → Settings → Source
- Debe mostrar: `backend`
- NO debe mostrar: `.` o `/` o `frontend-web`

---

### Problema 4: Start Command incorrecto

**Síntomas:**
- Railway logs muestran "command not found"
- Proceso no inicia
- Healthcheck falla

**Soluciones:**
1. Verificar Start Command en Railway Dashboard
2. Debe ser: `node dist/server.js`
3. O dejarlo vacío (Railway usará `backend/railway.json`)
4. Verificar que `backend/railway.json` tiene `startCommand: "node dist/server.js"`

---

## 📊 ARCHIVOS DE CONFIGURACIÓN

### backend/railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "$comment": "Railway configuration for CanalMedico Backend. Root directory should be set to 'backend' in Railway Dashboard.",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 10
  }
}
```

### backend/nixpacks.toml
```toml
[providers]
node = "18"

[phases.setup]
nixPkgs = ["nodejs-18_x", "git"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build",
  "echo 'Build completed at' $(date -Iseconds) > .build-timestamp || echo 'Build completed at' $(date) > .build-timestamp"
]

[start]
cmd = "node dist/server.js"
```

### backend/package.json (scripts relevantes)
```json
{
  "scripts": {
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "verify:railway": "tsx scripts/verify-railway-deploy.ts",
    "verify:health": "tsx scripts/verify-health.ts"
  }
}
```

---

## ✅ CRITERIO DE ÉXITO (DONE)

El deploy está CORRECTO cuando:

1. ✅ Railway healthcheck pasa (status: Healthy)
2. ✅ Railway logs muestran:
   - `[DEPLOY] CanalMedico Backend`
   - `[DEPLOY] Commit: <hash>`
   - `[DEPLOY] Version: 1.0.1`
   - `[BOOT] Server listening on 0.0.0.0:<port>`
   - `[BOOT] Health check available at http://0.0.0.0:<port>/health`
3. ✅ `curl https://<railway-url>/health` devuelve 200 con commit/version
4. ✅ `npm run verify:railway` valida que commit coincide con GitHub
5. ✅ No más "replicas never became healthy"
6. ✅ No más "Attempt failed with service unavailable"
7. ✅ Root Directory = `backend` en Railway Dashboard

---

## 📝 COMMANDS ÚTILES

### Verificar deploy localmente
```bash
cd backend
npm run verify:railway
```

### Verificar health
```bash
cd backend
npm run verify:health
```

### Obtener último commit
```bash
git log -1 --format=%H
```

### Validar commit específico
```bash
cd backend
EXPECTED_COMMIT_HASH=<hash> npm run verify:railway
```

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ **PLAYBOOK COMPLETO Y LISTO PARA USAR**

