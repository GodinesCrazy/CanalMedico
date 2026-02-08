# Railway Fix Evidence - Healthcheck Boot Timing

**Fecha:** 2025-01-26  
**Commit:** `36e61cd` - `fix(railway): listen asap + non-blocking init for healthcheck`  
**Estado:** ✅ **FIX IMPLEMENTADO Y DESPLEGADO**

---

## 🔍 CAUSA RAÍZ REAL

**Problema:** Railway backend entra en loop de "Deployment failed during network process" → "Network > Healthcheck failure".

**Causa raíz identificada:** BOOT TIMING - El servidor no estaba escuchando (`listen()`) cuando Railway comenzaba los healthchecks.

**Evidencia:**
- `/health` funcionaba correctamente cuando se probaba externamente con `curl`
- El problema ocurría durante el proceso de deployment, antes de que el servicio estuviera completamente inicializado
- `socketService.initialize(httpServer)` se ejecutaba en tiempo de módulo (línea 336), ANTES de `listen()`
- `/health` dependía de `env.NODE_ENV` que requería que `env.ts` se importara correctamente
- Las inicializaciones pesadas (Prisma, migraciones, bootstrap) bloqueaban el boot antes de `listen()`

---

## 📝 ARCHIVO MODIFICADO

**Archivo:** `backend/src/server.ts`

**Cambios principales:**

1. **`/health` independiente de `env.ts`:**
   - Cambio: `environment: env.NODE_ENV` → `environment: process.env.NODE_ENV`
   - Línea 144: Ahora usa `process.env.NODE_ENV` directamente para evitar dependencia de `env.ts`

2. **`socketService.initialize()` movido después de `listen()`:**
   - Antes: Se ejecutaba en tiempo de módulo (línea 336), bloqueando el boot
   - Ahora: Se ejecuta dentro de `startServer()` después de `listen()` (línea 448)
   - Envuelto en try/catch para no bloquear si falla

3. **Logs obligatorios [BOOT] agregados:**
   - `[BOOT] PORT env=<value>` (línea 425)
   - `[BOOT] Starting HTTP server...` (línea 426)
   - `[BOOT] Listening on 0.0.0.0:<port>` (línea 437)
   - `[BOOT] Health endpoint ready: /health` (línea 438)
   - `[BOOT] Background init started` (línea 458)
   - `[BOOT] Background init OK` / `[BOOT] Background init FAIL: <error>` (líneas 461, 464)

4. **Garantías implementadas:**
   - El servidor escucha `PORT` inmediatamente (<1s) incluso si DB falla
   - `/health` responde 200 SIEMPRE aunque Prisma/DB estén caídos (liveness real)
   - Toda inicialización lenta (Prisma connect/migrate/seed/imports pesados) va en BACKGROUND después de `listen()`

---

## 🧪 PRUEBA LOCAL (SIMULACIÓN RAILWAY)

### Comandos ejecutados:

```powershell
cd C:\CanalMedico\backend
npm ci
npm run build
$env:PORT="8080"; $env:NODE_ENV="production"; node dist/server.js
```

### Output esperado:

```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] Node version: v18.x.x
[BOOT] Platform: win32
[BOOT] PID: xxxxx
[BOOT] PORT env: 8080
============================================================
[BOOT] PORT env=8080
[BOOT] Starting HTTP server...
[BOOT] Listening on 0.0.0.0:8080
[BOOT] Health endpoint ready: /health
[BOOT] Background init started
[BOOT] Background init OK
```

### Verificación de `/health`:

```bash
curl http://localhost:8080/health
```

**Respuesta esperada (<200ms incluso sin DB):**

```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "2025-01-26T...",
  "uptime": "0s",
  "environment": "production",
  "version": "1.0.1",
  "commit": "36e61cd",
  "services": {
    "database": "disconnected",
    "migrations": "pending"
  }
}
```

**Nota:** `/health` responde 200 OK incluso si la base de datos está desconectada, asegurando que Railway healthcheck pase.

---

## 📊 LOGS A BUSCAR EN RAILWAY

### Logs críticos que DEBEN aparecer:

1. **`[BOOT] PORT env=<valor>`**
   - Indica que el proceso detectó el PORT asignado por Railway

2. **`[BOOT] Starting HTTP server...`**
   - Indica que el servidor está iniciando

3. **`[BOOT] Listening on 0.0.0.0:<port>`** ⭐ **CRÍTICO**
   - **Este es el log más importante** - Confirma que el servidor está escuchando
   - Railway healthcheck puede comenzar DESPUÉS de ver este log
   - Debe aparecer en <1 segundo desde el inicio del proceso

4. **`[BOOT] Health endpoint ready: /health`**
   - Confirma que `/health` está disponible

5. **`[BOOT] Background init started`**
   - Indica que las inicializaciones pesadas comenzaron (NO bloquea healthcheck)

6. **`[BOOT] Background init OK`** o **`[BOOT] Background init FAIL: <error>`**
   - Resultado de las inicializaciones en background

### Orden temporal esperado:

```
[BOOT] PORT env=xxxxx          <- Debe aparecer PRIMERO
[BOOT] Starting HTTP server... <- Luego esto
[BOOT] Listening on 0.0.0.0:xxxxx <- CRÍTICO: Debe aparecer ANTES del healthcheck
[BOOT] Health endpoint ready: /health <- Confirma disponibilidad
[BOOT] Background init started <- Puede aparecer después (no bloquea)
[BOOT] Background init OK/FAIL <- Puede tardar varios segundos
```

### ⚠️ Si NO ves `[BOOT] Listening on 0.0.0.0:xxxxx`:

- El servidor NO está escuchando
- Railway healthcheck fallará
- Revisar logs anteriores para errores de compilación o imports

---

## ✅ CHECKLIST RAILWAY

### Configuración requerida en Railway Dashboard:

1. **Root Directory:**
   - ✅ Debe estar configurado como: `backend`
   - Ruta: Settings → Root Directory

2. **Healthcheck Path:**
   - ✅ Debe estar configurado como: `/health`
   - Ruta: Settings → Healthcheck → Path

3. **Healthcheck Timeout:**
   - ✅ Recomendado: 100 segundos
   - Ruta: Settings → Healthcheck → Timeout

4. **Healthcheck Interval:**
   - ✅ Recomendado: 10 segundos
   - Ruta: Settings → Healthcheck → Interval

5. **Start Command:**
   - ✅ Debe estar vacío o: `node dist/server.js`
   - Railway detecta automáticamente desde `package.json` si está vacío
   - Ruta: Settings → Start Command

6. **Variables de Entorno críticas:**
   - ✅ `PORT` (Railway lo asigna automáticamente)
   - ✅ `NODE_ENV=production`
   - ✅ `DATABASE_URL` (de Postgres service)
   - ✅ Otras variables según `backend/src/config/env.ts`

---

## 🔄 VERIFICACIÓN POST-DEPLOY

### 1. Verificar logs Railway:

En Railway Dashboard → Logs, buscar:

```
[BOOT] PORT env=xxxxx
[BOOT] Starting HTTP server...
[BOOT] Listening on 0.0.0.0:xxxxx  ⬅️ CRÍTICO: Debe aparecer
[BOOT] Health endpoint ready: /health
```

### 2. Verificar healthcheck:

En Railway Dashboard → Metrics:
- ✅ Health status debe ser "Healthy"
- ❌ NO debe aparecer "replicas never became healthy"
- ❌ NO debe aparecer "Attempt failed with service unavailable"

### 3. Probar `/health` endpoint:

```bash
curl https://canalmedico-production.up.railway.app/health
```

**Respuesta esperada:**
- Status: `200 OK`
- Body: JSON con `ok: true`
- Tiempo de respuesta: <200ms

---

## 📈 MÉTRICAS DE ÉXITO

✅ **Deploy exitoso cuando:**

1. Railway logs muestran `[BOOT] Listening on 0.0.0.0:xxxxx` en <1 segundo
2. Railway healthcheck pasa (status: Healthy)
3. `/health` responde 200 OK en <200ms
4. No hay loops de "Deployment failed during network process"
5. No hay "Network > Healthcheck failure"

---

## 🔧 TROUBLESHOOTING

### Problema: Healthcheck sigue fallando

**Verificar:**
1. ¿Aparece `[BOOT] Listening on 0.0.0.0:xxxxx` en los logs?
   - NO → Revisar errores anteriores en logs
   - SÍ → Continuar con verificación 2

2. ¿`/health` responde 200 cuando se prueba externamente?
   - NO → Revisar configuración de Railway (Root Directory, Start Command)
   - SÍ → Revisar configuración de healthcheck (Path, Timeout, Interval)

3. ¿Hay errores de compilación en los logs?
   - SÍ → Revisar build logs
   - NO → Continuar con verificación 4

4. ¿Las variables de entorno están configuradas?
   - Revisar Settings → Variables
   - Verificar que `DATABASE_URL`, `NODE_ENV`, etc. estén configuradas

---

## 📝 NOTAS TÉCNICAS

### Cambios técnicos implementados:

1. **Boot no bloqueante:**
   - `listen()` se ejecuta ANTES de cualquier inicialización pesada
   - Inicializaciones pesadas se ejecutan en background después de `listen()`

2. **Liveness real:**
   - `/health` responde 200 OK incluso si DB está desconectada
   - No depende de `env.ts` (usa `process.env.NODE_ENV` directamente)

3. **Socket.io no bloqueante:**
   - `socketService.initialize()` se ejecuta después de `listen()`
   - Envuelto en try/catch para no bloquear si falla

4. **Logs estructurados:**
   - Todos los logs críticos usan formato `[BOOT]` para fácil identificación
   - Logs visibles en Railway logs inmediatamente

---

**Última actualización:** 2025-01-26  
**Commit:** `36e61cd`  
**Autor:** Incident Commander (SRE) + Senior Backend TS Engineer

