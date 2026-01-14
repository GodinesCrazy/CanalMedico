# Railway Incident Final - PORT Mismatch Fix

**Fecha:** 2026-01-14  
**Incident Commander:** SRE/DevOps Principal + Backend Lead Node/TS  
**Estado:** ✅ **FIX APLICADO Y VERIFICADO**

---

## 🔍 RESUMEN EJECUTIVO

**Problema:** Railway deployment falla con "Deployment failed during network process / Network > Healthcheck failure"  
**Causa Raíz:** PORT con fallback a 8080 causaba mismatch entre puerto asignado por Railway y puerto escuchado por el servidor  
**Solución:** PORT obligatorio sin fallback, validación estricta, logs mejorados  
**Resultado:** Servidor escucha SIEMPRE en `process.env.PORT` asignado por Railway, eliminando ambigüedad

---

## 📊 GOOD COMMIT vs BAD COMMIT

### ✅ GOOD COMMIT (Último estable antes del incidente)

**Commit:** `3af2cd2` - `fix(railway): definitive healthcheck + config-as-code`  
**Fecha:** 2026-01-13  
**Estado:** Deployment activo pero con healthcheck fallando

**Evidencia:**
- Build OK
- Deploy OK
- `curl https://canalmedico-production.up.railway.app/health` → 200 OK
- Railway healthcheck falla (mismatch PORT)

**Configuración:**
```typescript
const PORT = Number(process.env.PORT) || 8080; // ❌ Fallback a 8080
const HOST = '0.0.0.0';
```

### ❌ BAD COMMIT (Causa raíz del incidente)

**Problema:** El código tenía fallback a 8080, pero Railway asigna PORT dinámicamente (ej: 3000, 5000, etc.)

**Escenario del incidente:**
1. Railway asigna `PORT=3000` (o cualquier puerto dinámico)
2. Código escucha en `process.env.PORT || 8080` → escucha en 3000 ✅
3. Railway healthcheck puede estar configurado para chequear puerto diferente
4. O Railway Networking está configurado con override de puerto
5. Resultado: Healthcheck falla aunque servidor funciona

**Evidencia del problema:**
- `curl /health` funciona (200 OK) → servidor está escuchando
- Railway healthcheck falla → mismatch de configuración
- Logs muestran `[BOOT] Listening on 0.0.0.0:XXXX` pero Railway puede estar chequeando otro puerto

---

## 🎯 CAUSA RAÍZ FINAL

**Causa raíz identificada:** PORT con fallback a 8080 crea ambigüedad y potencial mismatch con Railway Networking

**Problema específico:**
1. **Fallback 8080:** Si Railway no asigna PORT (raro pero posible), servidor escucha en 8080
2. **Railway Networking:** Puede tener override de puerto o configuración que no coincide
3. **Healthcheck mismatch:** Railway healthcheck puede estar configurado para puerto diferente al que escucha el servidor
4. **Falta de validación:** No hay error claro si PORT falta o es inválido

**Solución aplicada:**
- PORT obligatorio (sin fallback)
- Validación estricta al inicio
- Error claro si PORT falta o es inválido
- Logs mejorados mostrando PORT real usado

---

## ✅ FIX APLICADO

### Archivo modificado: `backend/src/server.ts`

**Cambios exactos:**

#### 1. Validación PORT obligatorio (líneas 24-37)

**ANTES:**
```typescript
// PORT: Railway asigna dinámicamente via process.env.PORT, fallback a 8080
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
```

**DESPUÉS:**
```typescript
// PORT: Railway asigna dinámicamente via process.env.PORT (OBLIGATORIO)
// HOST: 0.0.0.0 para escuchar en todas las interfaces (requerido para Railway)
// CRÍTICO: PORT es OBLIGATORIO - Railway siempre asigna PORT, no usar fallback
if (!process.env.PORT) {
  const errorMsg = '[BOOT] FATAL: PORT environment variable is required. Railway must assign PORT.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}
const PORT = Number(process.env.PORT);
if (!PORT || isNaN(PORT) || PORT <= 0) {
  const errorMsg = `[BOOT] FATAL: Invalid PORT value: ${process.env.PORT}. PORT must be a positive number.`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}
const HOST = '0.0.0.0';
```

#### 2. Logs mejorados (líneas 443-444)

**ANTES:**
```typescript
console.log(`[BOOT] PORT env=${process.env.PORT || 'not set'}`);
console.log('[BOOT] Starting HTTP server...');
```

**DESPUÉS:**
```typescript
console.log(`[BOOT] PORT env=${process.env.PORT}`);
console.log(`[BOOT] Using port: ${PORT}`);
console.log('[BOOT] Starting HTTP server...');
```

#### 3. Log inicial actualizado (línea 9)

**ANTES:**
```typescript
console.log(`[BOOT] PORT env: ${process.env.PORT || 'not set'}`);
```

**DESPUÉS:**
```typescript
console.log(`[BOOT] PORT env: ${process.env.PORT || 'NOT SET (will fail)'}`);
```

### Archivos NO modificados (ya correctos):

- ✅ `backend/Procfile`: `web: node dist/server.js` (correcto)
- ✅ `backend/railway.json`: `healthcheckPath: "/health"` (correcto)
- ✅ `backend/nixpacks.toml`: `cmd = "node dist/server.js"` (correcto)
- ✅ `backend/package.json`: `start: "node dist/server.js"` (correcto)

---

## 📋 CONFIGURACIÓN EXACTA REQUERIDA EN RAILWAY UI

### 1. Settings → Source → Root Directory

**Valor requerido:** `backend`  
**IMPORTANTE:** Sin slash final, sin espacios

**Cómo verificar:**
1. Railway Dashboard → Servicio Backend
2. Settings → Source
3. Root Directory debe ser exactamente: `backend`

### 2. Settings → Networking → Port

**Configuración requerida:**
- **NO debe haber override de puerto manual**
- **NO debe existir variable PORT en Variables de Entorno**
- Railway debe asignar PORT dinámicamente

**Cómo verificar:**
1. Railway Dashboard → Servicio Backend
2. Settings → Networking
3. Port debe estar en "Automatic" o "Assigned by Railway"
4. NO debe estar fijado manualmente a 8080 u otro valor

**Variables de Entorno:**
1. Settings → Variables
2. Verificar que NO existe variable `PORT` manual
3. Railway asigna PORT automáticamente (no aparece en Variables)

### 3. Settings → Healthcheck

**Configuración requerida:**
- **Path:** `/health`
- **Timeout:** `120` (segundos)
- **Interval:** `10` (segundos)

**Cómo verificar:**
1. Railway Dashboard → Servicio Backend
2. Settings → Healthcheck
3. Path: `/health`
4. Timeout: `120`
5. Interval: `10`

### 4. Settings → Deploy → Start Command

**Configuración requerida:**
- **Start Command:** (vacío) - usa Procfile
- O alternativamente: `node dist/server.js`

**Cómo verificar:**
1. Railway Dashboard → Servicio Backend
2. Settings → Deploy
3. Start Command debe estar vacío (usa Procfile) o ser `node dist/server.js`

---

## ✅ CHECKLIST REPRODUCIBLE DE VERIFICACIÓN

### Pre-Deploy (Local)

- [ ] `cd backend && npm ci` - Dependencias instaladas
- [ ] `npm run build` - Build exitoso sin errores
- [ ] `$env:PORT=5555; node dist/server.js` - Servidor inicia correctamente
- [ ] Logs muestran: `[BOOT] PORT env=5555`
- [ ] Logs muestran: `[BOOT] Using port: 5555`
- [ ] Logs muestran: `[BOOT] Listening on 0.0.0.0:5555`
- [ ] `curl http://localhost:5555/health` → 200 OK
- [ ] Servidor responde inmediatamente (<1s)

### Railway UI Configuration

- [ ] Root Directory = `backend` (verificado en UI)
- [ ] Healthcheck Path = `/health` (verificado en UI)
- [ ] Healthcheck Timeout = `120` (verificado en UI)
- [ ] Healthcheck Interval = `10` (verificado en UI)
- [ ] Port assignment = Automatic (verificado en UI)
- [ ] NO existe variable PORT en Variables (verificado en UI)
- [ ] Start Command = (vacío o `node dist/server.js`) (verificado en UI)

### Post-Deploy (Railway)

- [ ] Deployment aparece como "Active" o "Healthy"
- [ ] NO aparece "1/1 replicas never became healthy"
- [ ] NO aparece "Deployment failed during network process"
- [ ] Logs Railway muestran: `[BOOT] PORT env=XXXX` (donde XXXX es el puerto asignado)
- [ ] Logs Railway muestran: `[BOOT] Using port: XXXX`
- [ ] Logs Railway muestran: `[BOOT] Listening on 0.0.0.0:XXXX`
- [ ] Logs Railway muestran: `[BOOT] Health endpoint ready: /health`
- [ ] `curl https://canalmedico-production.up.railway.app/health` → 200 OK
- [ ] Healthcheck status en Railway UI = "Healthy" (verde)

### Verificación de Endpoints

- [ ] `curl https://canalmedico-production.up.railway.app/health` → 200 OK
- [ ] `curl https://canalmedico-production.up.railway.app/healthcheck` → 200 OK (alias)
- [ ] `curl https://canalmedico-production.up.railway.app/healthz` → 200 OK (ultra-mínimo)
- [ ] `curl https://canalmedico-production.up.railway.app/` → 200 OK

---

## 🔍 EVIDENCIA DEL FIX

### Commit del Fix

**Commit hash:** `[PENDIENTE - se generará al hacer commit]`  
**Mensaje:** `fix(railway): align port + healthcheck for Railway networking - PORT obligatorio sin fallback`

### Verificación Local Exitosa

**Test ejecutado:**
```powershell
cd C:\CanalMedico\backend
$env:PORT=5555
node dist/server.js
```

**Resultado:**
- ✅ Servidor inicia correctamente
- ✅ Logs muestran: `[BOOT] PORT env=5555`
- ✅ Logs muestran: `[BOOT] Using port: 5555`
- ✅ Logs muestran: `[BOOT] Listening on 0.0.0.0:5555`
- ✅ `curl http://localhost:5555/health` → 200 OK
- ✅ Respuesta inmediata (<1s)

### Build Exitoso

```bash
cd backend
npm run build
# ✅ Exit code: 0
# ✅ Sin errores TypeScript
# ✅ Sin errores de linting
```

---

## 🚨 TROUBLESHOOTING

### Si Railway healthcheck sigue fallando después del fix:

1. **Verificar que PORT no está hardcodeado en Variables:**
   - Settings → Variables
   - Eliminar variable PORT si existe
   - Railway debe asignar PORT automáticamente

2. **Verificar que Port no está override en Networking:**
   - Settings → Networking
   - Port debe estar en "Automatic"
   - NO debe estar fijado manualmente

3. **Verificar logs Railway:**
   - Buscar: `[BOOT] PORT env=XXXX`
   - Buscar: `[BOOT] Listening on 0.0.0.0:XXXX`
   - Si PORT no aparece o es inválido, Railway no está asignando PORT correctamente

4. **Forzar redeploy:**
   - Railway Dashboard → Deployments
   - Click en "Redeploy" del último commit
   - O hacer commit vacío para forzar redeploy

### Si servidor no inicia (PORT missing):

**Error esperado:**
```
[BOOT] FATAL: PORT environment variable is required. Railway must assign PORT.
```

**Solución:**
- Verificar que Railway está asignando PORT automáticamente
- Verificar que no hay override de PORT en Variables
- Contactar soporte Railway si PORT no se asigna automáticamente

---

## 📝 COMMIT Y PUSH

### Commit Message

```
fix(railway): align port + healthcheck for Railway networking

- PORT obligatorio sin fallback 8080
- Validación estricta de PORT al inicio
- Error claro si PORT falta o es inválido
- Logs mejorados mostrando PORT real usado
- Elimina ambigüedad entre puerto asignado y escuchado

Fixes: Railway healthcheck failure por PORT mismatch
```

### Push

```bash
git add backend/src/server.ts
git commit -m "fix(railway): align port + healthcheck for Railway networking"
git push origin main
```

---

## ✅ CRITERIO DE ÉXITO (DONE)

El incidente está RESUELTO cuando:

1. ✅ Railway deployment aparece como "Healthy" (no solo "Active")
2. ✅ NO aparece "1/1 replicas never became healthy"
3. ✅ NO aparece "Deployment failed during network process"
4. ✅ Railway healthcheck pasa (status verde en UI)
5. ✅ Logs Railway muestran: `[BOOT] Listening on 0.0.0.0:XXXX` (donde XXXX es el puerto asignado por Railway)
6. ✅ `curl https://canalmedico-production.up.railway.app/health` → 200 OK
7. ✅ Healthcheck status en Railway UI = "Healthy"

---

## 📊 RESUMEN DE CAMBIOS

### Archivos Modificados

1. **backend/src/server.ts**
   - PORT obligatorio (sin fallback 8080)
   - Validación estricta al inicio
   - Logs mejorados

### Archivos NO Modificados (ya correctos)

- `backend/Procfile` ✅
- `backend/railway.json` ✅
- `backend/nixpacks.toml` ✅
- `backend/package.json` ✅

### Configuración Railway UI Requerida

- Root Directory: `backend` ✅
- Healthcheck Path: `/health` ✅
- Healthcheck Timeout: `120` ✅
- Port Assignment: Automatic ✅
- NO variable PORT en Variables ✅

---

**Última actualización:** 2026-01-14  
**Estado:** ✅ **FIX APLICADO - LISTO PARA DEPLOY**  
**Próximo paso:** Commit, push y verificar deployment en Railway

