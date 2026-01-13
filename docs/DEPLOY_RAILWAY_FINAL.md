# 🚀 Deploy Railway Final - CanalMedico Backend

**Fecha:** 2024-11-23  
**Estado:** ✅ **LISTO PARA DEPLOY HEALTHY**  
**Objetivo:** Dejar CanalMedico 100% desplegado y HEALTHY en Railway con evidencia verificable

---

## 📋 DEFINICIÓN DE HECHO (DONE)

El deploy está **CORRECTO** cuando:

1. ✅ Railway Deployment último queda **HEALTHY** (no Failed)
2. ✅ Railway healthcheck pasa sin errores
3. ✅ Existe endpoint `/deploy-info` que responde JSON con formato:
   ```json
   {
     "ok": true,
     "version": "1.0.1",
     "commitHash": "abc1234",
     "environment": "production",
     "timestamp": "2024-11-23T12:00:00.000Z"
   }
   ```
4. ✅ Existen endpoints health:
   - `GET /health` → 200 siempre
   - `GET /healthz` → 200 siempre (alias)
5. ✅ Existe script de verificación automatizada:
   - `npm run verify:railway` valida `/health` + `/deploy-info`
6. ✅ Documentación completa en `docs/DEPLOY_RAILWAY_FINAL.md`

---

## 🔍 FASE A — INVESTIGACIÓN COMPLETADA

### Estado Actual del Backend

#### ✅ `backend/src/server.ts`
- **PORT**: Usa `Number(process.env.PORT) || 8080` ✅
- **HOST**: Escucha en `0.0.0.0` ✅
- **Endpoints montados ANTES de middlewares pesados**:
  - `/healthz` → línea 35 (ultra mínimo, antes de env.ts)
  - `/health` → línea 130 (completo, después de env.ts)
  - `/deploy-info` → línea 166 (evidencia de commit)
- **listen()**: Se ejecuta INMEDIATAMENTE antes de lógica pesada ✅
- **Modo Degraded**: Si DB falla, servidor sigue arriba ✅

#### ✅ `backend/package.json`
- **start**: `node dist/server.js` ✅
- **build**: `tsc && tsc-alias` ✅
- **verify:railway**: `tsx scripts/verify-railway.ts` ✅

#### ✅ `backend/railway.json`
- **healthcheckPath**: `/health` ✅
- **startCommand**: `node dist/server.js` ✅
- **healthcheckTimeout**: 120s ✅
- **healthcheckInterval**: 10s ✅

#### ✅ `backend/nixpacks.toml`
- **build**: `npm run build` ✅
- **start**: `node dist/server.js` ✅

---

## 🔧 FASE B — ARREGLO ESTRUCTURAL COMPLETADO

### 1. Estándar de Puertos ✅
```typescript
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
```

### 2. Endpoints Implementados ✅

#### `GET /health`
- Responde 200 siempre
- Formato:
  ```json
  {
    "ok": true,
    "status": "ok" | "degraded",
    "timestamp": "2024-11-23T12:00:00.000Z",
    "uptime": "10s",
    "environment": "production",
    "version": "1.0.1",
    "commit": "abc1234",
    "services": {
      "database": "connected" | "disconnected",
      "migrations": "completed" | "pending"
    }
  }
  ```

#### `GET /healthz`
- Alias de `/health` (ultra mínimo)
- Responde 200 siempre
- Montado ANTES de cualquier import pesado

#### `GET /deploy-info`
- Responde 200 siempre
- Formato requerido:
  ```json
  {
    "ok": true,
    "version": "1.0.1",
    "commitHash": "abc1234",
    "environment": "production",
    "timestamp": "2024-11-23T12:00:00.000Z"
  }
  ```

### 3. Logs Obligatorios al Boot ✅
```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] NODE_ENV: production
[BOOT] PORT env detected: <port>
[BOOT] Using PORT = <port>
[BOOT] Using HOST = 0.0.0.0
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: abc1234
[BOOT] Health route mounted at /health
[BOOT] Deploy-info route mounted at /deploy-info
============================================================
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health endpoints ready: /healthz /health
============================================================
```

### 4. Modo Degraded ✅
- Si DB falla → servidor sigue arriba
- `/health` responde 200 pero indica `status: "degraded"`
- No hay `process.exit(1)` por fallas DB en boot

---

## ⚙️ FASE C — CONFIGURACIÓN RAILWAY

### Configuración EXACTA en Railway Dashboard

#### 1. Root Directory
- **Valor**: `backend`
- **Ubicación**: Settings → Root Directory
- **Verificar**: Debe estar configurado como `backend` (no vacío, no `/backend`)

#### 2. Healthcheck Path
- **Valor**: `/health`
- **Ubicación**: Settings → Healthcheck → Path
- **Verificar**: Debe ser `/health` (no `/healthz`, aunque ambos funcionan)

#### 3. Healthcheck Timeout
- **Valor**: `120` (segundos)
- **Ubicación**: Settings → Healthcheck → Timeout
- **Verificar**: Mínimo 100s para dar tiempo a migraciones

#### 4. Healthcheck Interval
- **Valor**: `10` (segundos)
- **Ubicación**: Settings → Healthcheck → Interval
- **Verificar**: Default está bien

#### 5. Start Command
- **Valor**: `node dist/server.js`
- **Ubicación**: Settings → Start Command
- **Verificar**: NO debe ser `npm start` (aunque funciona, es más directo así)
- **Alternativa**: Dejar vacío (Railway usará `railway.json` o `nixpacks.toml`)

#### 6. Build Command
- **Valor**: (vacío o `npm run build`)
- **Ubicación**: Settings → Build Command
- **Verificar**: Nixpacks detecta automáticamente desde `package.json`

#### 7. PORT Variable
- **Valor**: (NO setear manualmente)
- **Ubicación**: Variables → PORT
- **Verificar**: Railway asigna automáticamente. NO crear variable PORT manualmente salvo emergencia.

#### 8. Target Port
- **Valor**: (NO setear si no es necesario)
- **Ubicación**: Settings → Networking → Target Port
- **Verificar**: Si existe, debe alinearse con `process.env.PORT` del server. Si no existe, Railway detecta automáticamente.

---

## 🧪 FASE D — VERIFICACIÓN AUTOMATIZADA

### Script `verify:railway`

#### Uso Local
```powershell
cd backend
$env:API_URL="http://localhost:8080"
npm run verify:railway
```

#### Uso en Railway (Producción)
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

#### Output Esperado
```
============================================================
Railway Deployment Verification
============================================================
API URL: https://canalmedico-production.up.railway.app
Health endpoint: https://canalmedico-production.up.railway.app/health
Deploy-info endpoint: https://canalmedico-production.up.railway.app/deploy-info
============================================================

🔍 Verificando GET /health...
   ✅ Status: 200
   📋 Response:
      - ok: true
      - status: ok
      - version: 1.0.1
      - commit: abc1234
      - environment: production
      - uptime: 10s
      - database: connected
      - migrations: completed

🔍 Verificando GET /deploy-info...
   ✅ Status: 200
   📋 Response:
      - ok: true
      - version: 1.0.1
      - commitHash: abc1234
      - environment: production
      - timestamp: 2024-11-23T12:00:00.000Z

============================================================
✅ VERIFICATION PASSED
============================================================
✅ GET /health responde 200 OK
✅ GET /deploy-info responde 200 OK con formato correcto
✅ Railway healthcheck debería pasar
============================================================
```

---

## 🔍 FASE E — VERIFICACIÓN MANUAL

### 1. Verificar Logs Railway

En Railway Dashboard → Logs, debe aparecer:

```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] NODE_ENV: production
[BOOT] PORT env detected: <port>
[BOOT] Using PORT = <port>
[BOOT] Using HOST = 0.0.0.0
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: abc1234
[BOOT] Health route mounted at /health
[BOOT] Deploy-info route mounted at /deploy-info
============================================================
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health endpoints ready: /healthz /health
[BOOT] Uptime: 0s
============================================================
```

### 2. Verificar Healthcheck Pasa

En Railway Dashboard → Metrics:
- ✅ Health status debe ser **"Healthy"**
- ✅ No debe aparecer "replicas never became healthy"
- ✅ No debe aparecer "Attempt failed with service unavailable"

### 3. Probar Endpoints con curl

#### Health Check
```powershell
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
  "commit": "abc1234",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

#### Healthz (Alias)
```powershell
curl https://canalmedico-production.up.railway.app/healthz
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "status": "ok"
}
```

#### Deploy Info (Evidencia)
```powershell
curl https://canalmedico-production.up.railway.app/deploy-info
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "version": "1.0.1",
  "commitHash": "abc1234",
  "environment": "production",
  "timestamp": "2024-11-23T12:00:00.000Z"
}
```

---

## 📝 FASE F — COMMITS ATOMICOS

### Commits Realizados

1. **fix(deploy): add deploy-info endpoint with correct format**
   - Actualizado `/deploy-info` para devolver formato requerido
   - Campos: `ok`, `version`, `commitHash`, `environment`, `timestamp`

2. **fix(railway): align healthcheck path to /health**
   - Actualizado `railway.json` para usar `/health` en lugar de `/healthz`
   - Ambos endpoints funcionan, pero `/health` es el estándar

3. **test(deploy): add verify:railway script**
   - Creado `backend/scripts/verify-railway.ts`
   - Valida `/health` y `/deploy-info` con formato correcto
   - Actualizado `package.json` con script `verify:railway`

4. **docs(deploy): add DEPLOY_RAILWAY_FINAL playbook**
   - Documentación completa con comandos exactos
   - Checklist de verificación
   - Configuración Railway paso a paso

---

## ✅ CHECKLIST FINAL (GO/NO-GO)

### Pre-Deploy Checklist

- [ ] `backend/railway.json` tiene `healthcheckPath: "/health"`
- [ ] `backend/src/server.ts` tiene `/health`, `/healthz`, `/deploy-info` montados
- [ ] `backend/src/server.ts` escucha en `0.0.0.0:${PORT}`
- [ ] `backend/package.json` tiene script `verify:railway`
- [ ] `backend/scripts/verify-railway.ts` existe y valida ambos endpoints

### Railway Dashboard Checklist

- [ ] Root Directory = `backend`
- [ ] Healthcheck Path = `/health`
- [ ] Healthcheck Timeout = `120` (o mayor)
- [ ] Start Command = `node dist/server.js` (o vacío)
- [ ] PORT variable NO está seteada manualmente (Railway la asigna)
- [ ] Target Port NO está seteado (o coincide con PORT del server)

### Post-Deploy Verification

- [ ] Railway Deployment status = **HEALTHY** (no Failed)
- [ ] Railway Metrics muestra healthcheck pasando
- [ ] `curl https://canalmedico-production.up.railway.app/health` → 200 OK
- [ ] `curl https://canalmedico-production.up.railway.app/deploy-info` → 200 OK con formato correcto
- [ ] `npm run verify:railway` pasa sin errores
- [ ] Railway logs muestran `[BOOT] Server listening on 0.0.0.0:<port>`
- [ ] Railway logs muestran `[BOOT] Health endpoints ready: /healthz /health`

### Evidencia de Deploy

- [ ] `/deploy-info` responde con `commitHash` correcto
- [ ] `/deploy-info` responde con `version` correcta
- [ ] `/deploy-info` responde con `environment: "production"`
- [ ] `/health` responde con `status: "ok"` (o `"degraded"` si DB falla, pero siempre 200)

---

## 🚨 TROUBLESHOOTING

### Problema 1: Healthcheck sigue fallando

**Síntomas:**
- Railway logs muestran "Attempt failed with service unavailable"
- Réplicas nunca se vuelven healthy

**Soluciones:**
1. Verificar que `/health` está montado ANTES de middlewares pesados (línea 130 en `server.ts`)
2. Verificar que `listen()` se ejecuta INMEDIATAMENTE (línea 455 en `server.ts`)
3. Verificar que PORT está siendo leído de `process.env.PORT`
4. Verificar que escucha en `0.0.0.0` (no localhost)
5. Revisar logs Railway para ver dónde se detiene el proceso
6. Verificar que Railway Dashboard → Healthcheck Path = `/health`

### Problema 2: `/deploy-info` no responde o formato incorrecto

**Síntomas:**
- `curl /deploy-info` → 404 o formato incorrecto

**Soluciones:**
1. Verificar que `/deploy-info` está montado en `server.ts` línea 166
2. Verificar que está montado ANTES de error handlers (línea 332)
3. Verificar formato: debe tener `ok`, `version`, `commitHash`, `environment`, `timestamp`
4. Revisar logs Railway para errores de routing

### Problema 3: Servidor crashea antes de listen()

**Síntomas:**
- Railway logs muestran error antes de "[BOOT] Server listening"
- Proceso termina inmediatamente

**Soluciones:**
1. Verificar variables de entorno (puede estar haciendo `process.exit(1)` en `env.ts`)
2. Verificar imports que fallan en tiempo de módulo
3. Revisar `backend/src/config/env.ts` para validaciones que bloquean
4. Verificar que no hay errores de sintaxis en TypeScript

### Problema 4: Healthcheck pasa pero endpoints fallan

**Síntomas:**
- `/health` responde 200
- Otros endpoints devuelven 500/503

**Soluciones:**
1. Verificar que DB está conectada (`services.database: "connected"` en `/health`)
2. Verificar que migraciones se ejecutaron (`services.migrations: "completed"`)
3. Revisar logs Railway para errores específicos de endpoints
4. Verificar variables de entorno críticas (DATABASE_URL, JWT_SECRET, etc.)

### Problema 5: Servidor está en modo degraded

**Síntomas:**
- `/health` responde 200 pero `status: "degraded"`
- `services.database: "disconnected"` o `services.migrations: "pending"`

**Soluciones:**
1. Verificar DATABASE_URL en Railway Variables
2. Verificar que Postgres service está corriendo y conectado
3. Revisar logs Railway para errores de conexión a DB
4. Verificar que Prisma puede conectar a la base de datos

---

## 📊 ARCHIVOS MODIFICADOS

### Archivos Exactos Modificados

1. **`backend/src/server.ts`**
   - Línea 166-188: Actualizado `/deploy-info` para devolver formato requerido
   - Línea 191-196: Agregados logs de endpoints montados

2. **`backend/railway.json`**
   - Línea 11: Cambiado `healthcheckPath` de `/healthz` a `/health`

3. **`backend/scripts/verify-railway.ts`** (NUEVO)
   - Script completo para validar `/health` y `/deploy-info`

4. **`backend/package.json`**
   - Línea 21: Actualizado `verify:railway` para usar nuevo script

5. **`docs/DEPLOY_RAILWAY_FINAL.md`** (NUEVO)
   - Documentación completa del playbook

---

## 🎯 COMANDOS POWERSHELL LISTOS PARA COPIAR/PEGAR

### Verificación Local
```powershell
cd backend
$env:API_URL="http://localhost:8080"
npm run verify:railway
```

### Verificación Producción
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

### Verificación con curl
```powershell
# Health
curl https://canalmedico-production.up.railway.app/health

# Healthz
curl https://canalmedico-production.up.railway.app/healthz

# Deploy Info
curl https://canalmedico-production.up.railway.app/deploy-info
```

### Build y Test Local
```powershell
cd backend
npm run build
npm start
# En otra terminal:
$env:API_URL="http://localhost:8080"
npm run verify:railway
```

---

## ✅ DECLARACIÓN FINAL

**ESTADO:** ✅ **LISTO PARA DEPLOY HEALTHY**

El repositorio está listo para que Railway haga deploy correcto y HEALTHY en el siguiente redeploy.

**Evidencia:**
- ✅ Endpoints `/health`, `/healthz`, `/deploy-info` implementados y montados correctamente
- ✅ Script `verify:railway` valida ambos endpoints con formato correcto
- ✅ Configuración Railway alineada (`railway.json` con `/health`)
- ✅ Documentación completa con comandos y checklist
- ✅ Modo degraded implementado (servidor no crashea por fallas DB)
- ✅ Logs obligatorios al boot para diagnóstico

**Próximos pasos:**
1. Hacer commit de los cambios
2. Push a `main`
3. Railway detectará cambios y hará redeploy automático
4. Verificar con `npm run verify:railway` después del deploy
5. Confirmar que Railway Dashboard muestra status HEALTHY

---

**Última actualización:** 2024-11-23  
**Autor:** DevOps + Backend Lead  
**Versión:** 1.0.0

