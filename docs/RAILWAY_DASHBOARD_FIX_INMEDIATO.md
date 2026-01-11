# Railway Dashboard - FIX INMEDIATO (3 minutos)

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - EJECUTAR AHORA

---

## ⚡ ACCIÓN REQUERIDA (3 MINUTOS)

### Paso 1: Root Directory (CRÍTICO - 30 segundos)

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Source"** o **"Root Directory"**
3. **CAMBIAR A:** `backend`
4. **Guardar cambios**

**⚠️ CRÍTICO:** Si esto NO está configurado, Railway usará la raíz del repo y el deploy FALLARÁ.

---

### Paso 2: Healthcheck Path (CRÍTICO - 30 segundos)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Healthcheck"** o **"Health Check"**
3. **Path:** `/healthz` (o `/health` si prefieres)
4. **Timeout:** 120 (segundos)
5. **Interval:** 10 (segundos)
6. **Guardar cambios**

**Nota:** `/healthz` es ultra mínimo y responde siempre. `/health` incluye más información.

---

### Paso 3: Start Command (CRÍTICO - 30 segundos)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Start Command"** o **"Run Command"**
3. **DEBE SER:** `node dist/server.js`
4. **O DEJAR VACÍO** (Railway usará `backend/railway.json` automáticamente)
5. **Guardar cambios**

---

### Paso 4: Build Command (OPCIONAL - 30 segundos)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Build Command"**
3. **DEBE ESTAR VACÍO** (Railway usará `backend/nixpacks.toml` automáticamente)
4. Si tiene algún comando, **eliminarlo**
5. **Guardar cambios**

---

### Paso 5: Forzar Redeploy (CRÍTICO - 60 segundos)

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Deployments**
2. Hacer clic en **"Redeploy"** o **"Redeploy Latest"**
3. Esperar a que el deploy complete (2-5 minutos)
4. Verificar logs para confirmar que está usando configuración correcta

---

## ✅ VALIDACIÓN POST-CONFIGURACIÓN

### Verificar Logs Railway

En **Railway Dashboard** → **Logs**, buscar estos logs al boot:

```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] Node version: v18.17.0
[BOOT] Platform: linux
[BOOT] PID: 1
============================================================
[BOOT] Healthz route mounted at /healthz
[BOOT] Health route mounted at /health
[BOOT] startServer() called
[BOOT] PORT env: 8080
[BOOT] Server listening on 0.0.0.0:8080
[BOOT] Health check available at http://0.0.0.0:8080/healthz
```

**Si NO aparecen estos logs:**
- ❌ Root Directory NO está configurado correctamente
- ❌ Forzar redeploy nuevamente
- ❌ Verificar que Start Command = `node dist/server.js`

---

### Validar Endpoints

#### Healthz (ultra mínimo)
```bash
curl https://canalmedico-production.up.railway.app/healthz
```

**Respuesta esperada:**
```json
{"ok": true, "status": "ok"}
```

#### Health (completo)
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
  "commit": "27381f1",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

---

## 📋 CHECKLIST FINAL

Antes de considerar el sistema "LISTO", verificar:

- [ ] Railway Dashboard: Root Directory = `backend` ✅
- [ ] Railway Dashboard: Start Command = `node dist/server.js` (o vacío) ✅
- [ ] Railway Dashboard: Build Command = (vacío) ✅
- [ ] Railway Dashboard: Healthcheck Path = `/healthz` (o `/health`) ✅
- [ ] Railway Dashboard: Healthcheck Timeout = 120 ✅
- [ ] Railway Logs: Aparecen `[BOOT] Starting CanalMedico backend...` ✅
- [ ] Railway Logs: Aparece `[BOOT] Server listening on 0.0.0.0:<port>` ✅
- [ ] Endpoint `/healthz` → 200 OK ✅
- [ ] Endpoint `/health` → 200 OK ✅
- [ ] Railway healthcheck pasa (status: Healthy) ✅

---

## 🚨 TROUBLESHOOTING

### Problema: Healthcheck sigue fallando

**Solución:**
1. Verificar Root Directory = `backend`
2. Verificar Start Command = `node dist/server.js`
3. Verificar Healthcheck Path = `/healthz`
4. Forzar redeploy completo
5. Revisar logs Railway para ver dónde se detiene el proceso

### Problema: "replicas never became healthy"

**Solución:**
1. Verificar que `/healthz` responde 200 OK
2. Verificar logs Railway para `[BOOT] Server listening`
3. Verificar que PORT está siendo leído correctamente
4. Aumentar Healthcheck Timeout a 120 segundos
5. Usar `/healthz` en lugar de `/health` (más simple)

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ **LISTO PARA CONFIGURAR EN RAILWAY DASHBOARD**

