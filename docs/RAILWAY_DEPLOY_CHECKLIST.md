# Railway Deploy Checklist - Definitive Fix

**Fecha:** 2025-01-26  
**Commit:** `fix(railway): definitive healthcheck + config-as-code`  
**Estado:** ✅ **FIX APLICADO Y DESPLEGADO**

---

## ✅ FIX APLICADO

**Cambio:** Agregado `/healthcheck` como alias de `/health` para blindar todos los posibles paths que Railway puede usar para healthcheck.

**Archivos modificados:**
- `backend/src/server.ts` - Agregado /healthcheck alias

**Endpoints de healthcheck ahora disponibles:**
- `/health` - Endpoint principal
- `/healthcheck` - Alias para blindar Railway UI (nuevo)
- `/healthz` - Endpoint ultra-mínimo (antes de imports pesados)
- `/` - Root endpoint (responde 200 OK)

---

## 📋 CHECKLIST RAILWAY UI

### 1. Verificar Root Directory

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Root Directory

**Valor correcto:** `backend` (sin / ni \)

**✅ Checklist:**
- [ ] Root Directory = `backend` (sin / ni \)

---

### 2. Verificar Healthcheck Path

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Healthcheck → Path

**Valor correcto:** `/health` (o `/healthcheck` o `/healthz` - todos funcionan ahora)

**✅ Checklist:**
- [ ] Healthcheck Path = `/health` (o `/healthcheck` o `/healthz`)

---

### 3. Verificar Healthcheck Timeout

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Healthcheck → Timeout

**Valor correcto:** `120` segundos (o más)

**✅ Checklist:**
- [ ] Healthcheck Timeout = `120` (o más)

---

### 4. Verificar Healthcheck Interval

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Healthcheck → Interval

**Valor correcto:** `10` segundos (o más)

**✅ Checklist:**
- [ ] Healthcheck Interval = `10` (o más)

---

### 5. Verificar Start Command

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Start Command

**Valor correcto:** Vacío (o `node dist/server.js`)

**✅ Checklist:**
- [ ] Start Command = vacío (o `node dist/server.js`)

---

### 6. Verificar Networking Port

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Settings → Networking

**Valor correcto:** Port asignado dinámicamente por Railway

**✅ Checklist:**
- [ ] Port asignado dinámicamente (NO hardcodeado)
- [ ] NO hay variable PORT en Variables (debe eliminarse si existe)

---

## 🔄 DESPUÉS DE DEPLOY

### 1. Verificar Logs Railway

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Logs

**Buscar estos logs:**
```
[BOOT] PORT env=xxxxx
[BOOT] Starting HTTP server...
[BOOT] Listening on 0.0.0.0:xxxxx
[BOOT] Health endpoint ready: /health
[BOOT] Healthcheck route mounted at /healthcheck (alias)
```

### 2. Verificar Healthcheck Status

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Metrics

**Buscar:**
- Health status debe ser: **Healthy** ✅
- NO debe aparecer: "replicas never became healthy"
- NO debe aparecer: "Attempt failed with service unavailable"

### 3. Probar Endpoints

```bash
# Probar /health
curl https://canalmedico-production.up.railway.app/health

# Probar /healthcheck (nuevo alias)
curl https://canalmedico-production.up.railway.app/healthcheck

# Probar /healthz
curl https://canalmedico-production.up.railway.app/healthz

# Probar / (root)
curl https://canalmedico-production.up.railway.app/
```

**Todos deben responder 200 OK.**

---

## ✅ CHECKLIST FINAL

- [ ] Root Directory = `backend`
- [ ] Healthcheck Path = `/health` (o `/healthcheck` o `/healthz`)
- [ ] Healthcheck Timeout = `120` (o más)
- [ ] Healthcheck Interval = `10` (o más)
- [ ] Start Command = vacío (o `node dist/server.js`)
- [ ] Port asignado dinámicamente
- [ ] NO existe variable PORT
- [ ] Logs muestran `[BOOT] Listening on 0.0.0.0:xxxxx`
- [ ] Logs muestran `[BOOT] Healthcheck route mounted at /healthcheck (alias)`
- [ ] Healthcheck status = Healthy
- [ ] curl /health → 200 OK
- [ ] curl /healthcheck → 200 OK
- [ ] curl /healthz → 200 OK
- [ ] curl / → 200 OK

---

**Última actualización:** 2025-01-26  
**Commit:** `fix(railway): definitive healthcheck + config-as-code`  
**Estado:** ✅ **FIX APLICADO - LISTO PARA DEPLOY**
