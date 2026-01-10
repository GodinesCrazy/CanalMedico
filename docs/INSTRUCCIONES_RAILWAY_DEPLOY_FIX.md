# Instrucciones Railway Deploy Fix - Healthcheck

**Fecha:** 2024-11-23  
**Problema:** Railway healthcheck falla con "service unavailable"  
**Solución:** Servidor escucha inmediatamente antes de lógica pesada

---

## 🔍 PROBLEMA IDENTIFICADO

Railway build pasa, pero deployment falla porque:
- Healthcheck `/health` siempre responde "service unavailable"
- El contenedor nunca se vuelve healthy
- Build termina bien, pero réplicas nunca se vuelven healthy

**Causa raíz:** El servidor ejecutaba lógica pesada (migraciones, DB connection) ANTES de hacer `listen()`, por lo que Railway hacía healthcheck antes de que el servidor estuviera escuchando.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. `/health` montado ANTES de middlewares pesados
- Endpoint `/health` está al inicio del archivo (línea 93-113)
- Responde inmediatamente, incluso si DB está caída
- Incluye información completa: status, uptime, version, commit, services

### 2. `listen()` se ejecuta INMEDIATAMENTE
- El servidor hace `listen()` ANTES de cualquier lógica pesada
- Escucha en `0.0.0.0:${PORT}` (Railway asigna PORT dinámicamente)
- Lógica pesada (migraciones, DB) se ejecuta DESPUÉS en background

### 3. Modo Degraded
- Si DB falla → servidor sigue arriba en modo "degraded"
- `/health` responde 200 pero indica `status: "degraded"`
- Sistema sigue funcionando para diagnóstico

### 4. Logs obligatorios [BOOT]
- Todos los logs importantes usan `console.log` para Railway logs
- Logs visibles inmediatamente al iniciar:
  - `[BOOT] Starting CanalMedico backend...`
  - `[BOOT] PORT env detected: <value>`
  - `[BOOT] Server listening on 0.0.0.0:<port>`
  - `[BOOT] Health check available at http://0.0.0.0:<port>/health`

---

## 📋 CONFIGURACIÓN RAILWAY DASHBOARD

### Paso 1: Verificar Root Directory
1. Ir a Railway Dashboard → Servicio Backend
2. Settings → Root Directory
3. Debe estar configurado como: `backend`
4. Si no, cambiarlo y hacer redeploy

### Paso 2: Verificar Variables de Entorno
1. Settings → Variables
2. Variables críticas requeridas:
   - `PORT` (Railway lo asigna automáticamente, pero puede verificarse)
   - `DATABASE_URL` (de Postgres service)
   - `API_URL` (URL del backend)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV=production`

### Paso 3: Verificar Healthcheck Path
1. Settings → Healthcheck
2. Path: `/health`
3. Timeout: 100 (segundos)
4. Interval: 10 (segundos)

### Paso 4: Verificar Build Command
1. Settings → Build Command
2. Debe estar vacío o: `npm run build`
3. Nixpacks detecta automáticamente desde `package.json`

### Paso 5: Verificar Start Command
1. Settings → Start Command
2. Debe estar vacío o: `node dist/server.js`
3. O: `npm start` (que ejecuta `node dist/server.js`)

---

## 🔄 DEPLOY FORZADO

Si Railway no detecta cambios automáticamente:

1. **Opción 1: Forzar Redeploy desde Dashboard**
   - Ir a Deployments
   - Click en "Redeploy" del último commit
   - O hacer "Manual Deploy" desde GitHub

2. **Opción 2: Push vacío para forzar**
   ```bash
   git commit --allow-empty -m "chore: force railway redeploy"
   git push origin main
   ```

3. **Opción 3: Cambiar Start Command temporalmente**
   - Cambiar Start Command a algo diferente
   - Guardar
   - Volver a cambiarlo a `node dist/server.js`
   - Guardar (esto fuerza redeploy)

---

## 🔍 VERIFICACIÓN POST-DEPLOY

### 1. Verificar Logs Railway
En Railway Dashboard → Logs, debe aparecer:
```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] NODE_ENV: production
[BOOT] PORT env detected: <port>
[BOOT] Using port: <port>
[BOOT] Version: 1.0.1
[BOOT] Commit: <hash>
[BOOT] Health route mounted at /health
============================================================
============================================================
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health check available at http://0.0.0.0:<port>/health
[BOOT] Uptime: 0s
============================================================
```

### 2. Verificar Healthcheck pasa
En Railway Dashboard → Metrics:
- Health status debe ser "Healthy"
- No debe aparecer "replicas never became healthy"
- No debe aparecer "Attempt failed with service unavailable"

### 3. Probar /health endpoint
```bash
curl https://<railway-url>/health
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
  "commit": "e9d08f8",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

### 4. Probar /health con DB desconectada (modo degraded)
Si DB falla, debe responder:
```json
{
  "ok": true,
  "status": "degraded",
  "services": {
    "database": "disconnected",
    "migrations": "pending"
  }
}
```
**Importante:** Siempre responde 200, pero indica `status: "degraded"`

---

## 🧪 VERIFICACIÓN LOCAL (SIMULACIÓN RAILWAY)

### Script verify-health.ts
```bash
cd backend
PORT=8080 npm start
# En otra terminal:
API_URL=http://localhost:8080 npm run verify:health
```

**Respuesta esperada:**
```
============================================================
Health Check Verification
============================================================
API URL: http://localhost:8080
Health endpoint: http://localhost:8080/health
Max retries: 10
Retry delay: 1000ms
============================================================

[Attempt 1/10] Checking /health...
  ✅ Health check OK (Status: 200)
  📋 Response: {
    "ok": true,
    "status": "ok",
    ...
  }

============================================================
✅ HEALTH CHECK PASSED
============================================================
```

---

## 📊 ARCHIVOS DE CONFIGURACIÓN

### backend/railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
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

### backend/Dockerfile
```dockerfile
FROM node:18-alpine
# ... build steps ...
CMD ["npm", "start"]
```

---

## 🚨 TROUBLESHOOTING

### Problema 1: Healthcheck sigue fallando
**Síntomas:**
- Railway logs muestran "Attempt failed with service unavailable"
- Réplicas nunca se vuelven healthy

**Soluciones:**
1. Verificar que `/health` está montado antes de middlewares pesados
2. Verificar que `listen()` se ejecuta inmediatamente (no después de DB/migrations)
3. Verificar que PORT está siendo leído de `process.env.PORT`
4. Verificar que escucha en `0.0.0.0` (no localhost)
5. Revisar logs Railway para ver dónde se detiene el proceso

### Problema 2: Servidor crashea antes de listen()
**Síntomas:**
- Railway logs muestran error antes de "[BOOT] Server listening"
- Proceso termina inmediatamente

**Soluciones:**
1. Verificar variables de entorno (puede estar haciendo `process.exit(1)` en `env.ts`)
2. Verificar imports que fallan en tiempo de módulo
3. Revisar `backend/src/config/env.ts` para validaciones que bloquean
4. Verificar que no hay errores de sintaxis en TypeScript

### Problema 3: Healthcheck pasa pero endpoints fallan
**Síntomas:**
- `/health` responde 200
- Otros endpoints devuelven 500/503

**Soluciones:**
1. Verificar que DB está conectada (`services.database: "connected"` en `/health`)
2. Verificar que migraciones se ejecutaron (`services.migrations: "completed"`)
3. Revisar logs Railway para errores específicos de endpoints
4. Verificar variables de entorno críticas (DATABASE_URL, JWT_SECRET, etc.)

### Problema 4: Servidor está en modo degraded
**Síntomas:**
- `/health` responde 200 pero `status: "degraded"`
- `services.database: "disconnected"` o `services.migrations: "pending"`

**Soluciones:**
1. Verificar DATABASE_URL en Railway Variables
2. Verificar que Postgres service está corriendo y conectado
3. Revisar logs Railway para errores de conexión a DB
4. Verificar que Prisma puede conectar a la base de datos

---

## ✅ CRITERIO DE ÉXITO (DONE)

El deploy está CORRECTO cuando:

1. ✅ Railway healthcheck pasa (status: Healthy)
2. ✅ Railway logs muestran:
   - `[BOOT] Server listening on 0.0.0.0:<port>`
   - `[BOOT] Health check available at http://0.0.0.0:<port>/health`
3. ✅ `curl https://<railway-url>/health` devuelve 200
4. ✅ `/health` responde con:
   - `ok: true`
   - `status: "ok"` (o `"degraded"` si DB falla, pero siempre 200)
   - `version`, `commit`, `uptime`, `services`
5. ✅ No más "replicas never became healthy"
6. ✅ No más "Attempt failed with service unavailable"

---

## 📝 COMMITS REALIZADOS

1. `06f7c29` - `fix(railway): listen on process.env.PORT and 0.0.0.0 before heavy initialization`
2. `e9d08f8` - `fix(health): mount /health before db/migrations and never crash`
3. `<pending>` - `fix(railway): ensure server listens immediately and /health responds with full status`

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ **FIX IMPLEMENTADO Y LISTO PARA DEPLOY**

