# Instrucciones Railway Dashboard - ACCIÓN INMEDIATA

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - EJECUTAR AHORA

---

## 🚨 ACCIÓN REQUERIDA EN RAILWAY DASHBOARD

### Paso 1: Configurar Root Directory (OBLIGATORIO)

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar sección **"Source"** o **"Root Directory"**
3. **Cambiar a:** `backend`
4. **Guardar cambios**

**⚠️ CRÍTICO:** Si esto NO está configurado, Railway usará la raíz del repositorio y los endpoints NO funcionarán.

---

### Paso 2: Verificar Start Command (OBLIGATORIO)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Start Command"** o **"Run Command"**
3. **Debe ser:** `node dist/server.js`
4. Si está vacío o diferente, cambiarlo a: `node dist/server.js`
5. **Guardar cambios**

**Alternativa:** Dejar vacío y Railway usará `backend/railway.json` automáticamente.

---

### Paso 3: Verificar Build Command (OPCIONAL)

1. En **Railway Dashboard** → **Service (Backend)** → **Settings**
2. Buscar **"Build Command"**
3. **DEBE estar VACÍO** (Railway usará `backend/nixpacks.toml` automáticamente)
4. Si tiene algún comando, eliminarlo
5. **Guardar cambios**

---

### Paso 4: Verificar GitHub Connection (OBLIGATORIO)

1. Ir a **Railway Dashboard** → **Settings** → **Connect GitHub**
2. Verificar que el repositorio **`GodinesCrazy/CanalMedico`** está conectado
3. Verificar que el branch es **`main`**
4. Verificar que **Auto-deploy** está **ON**
5. Si NO está conectado, conectarlo

---

### Paso 5: Forzar Redeploy (OBLIGATORIO)

Después de cambiar las configuraciones:

1. Ir a **Railway Dashboard** → **Service (Backend)** → **Deployments**
2. Hacer clic en **"Redeploy"** o **"Redeploy Latest"**
3. Esperar a que el deploy complete (2-5 minutos)
4. Verificar logs para confirmar que está usando configuración correcta

---

## ✅ VALIDACIÓN POST-CONFIGURACIÓN

### En Railway Logs (Dashboard → Logs)

**Buscar estos logs al boot:**

```
============================================================
[DEPLOY] CanalMedico Backend
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <hash-del-último-commit>
[DEPLOY] Environment: production
[DEPLOY] Node Version: v18.17.0
[DEPLOY] Build Timestamp: ...
[DEPLOY] Deploy Timestamp: ...
[DEPLOY] API URL: https://canalmedico-production.up.railway.app
============================================================
[SEED] Seed routes mounted at /api/seed
[DEPLOY] Deploy routes mounted at /api/deploy
🚀 Servidor corriendo en puerto 3000
```

**Si NO aparecen estos logs:**
- ❌ Root Directory NO está configurado correctamente
- ❌ Forzar redeploy nuevamente
- ❌ Verificar que Start Command = `node dist/server.js`

---

### Validar Endpoints (usar curl o navegador)

**1. Health Check:**
```bash
curl https://canalmedico-production.up.railway.app/health
```
**Esperado:** `{"status":"ok",...}` con 200 OK

**2. Deploy Info (NUEVO):**
```bash
curl https://canalmedico-production.up.railway.app/api/deploy/info
```
**Esperado:** `{"success":true,"data":{"version":"1.0.1","commitHash":"...",...}}` con 200 OK

**3. Seed Health:**
```bash
curl https://canalmedico-production.up.railway.app/api/seed/health
```
**Esperado:** `{"success":true,"message":"Seed module is mounted..."}` con 200 OK

---

### Ejecutar Script de Verificación Local

**En PowerShell:**
```powershell
cd c:\CanalMedico\backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

**Resultado esperado:**
```
✅ DEPLOY OK - Todos los endpoints funcionan correctamente
✅ Commit desplegado: <hash>
✅ El backend está desplegado y actualizado
```

---

## 🚨 TROUBLESHOOTING INMEDIATO

### Problema: Railway sigue usando raíz del repositorio

**Síntomas:**
- Endpoints devuelven 404
- Logs muestran errores de "module not found"
- Build falla

**Solución:**
1. **VERIFICAR Root Directory = `backend`** (más importante)
2. Guardar cambios
3. Forzar redeploy
4. Verificar logs de nuevo

---

### Problema: Railway ejecuta `npm run preview` o script incorrecto

**Síntomas:**
- Logs muestran "preview" o "dev"
- Servidor no inicia correctamente

**Solución:**
1. **VERIFICAR Start Command = `node dist/server.js`**
2. **VERIFICAR Root Directory = `backend`** (Railway usará `backend/package.json`)
3. Guardar cambios
4. Forzar redeploy

---

### Problema: Logs no muestran `[DEPLOY] Commit:`

**Síntomas:**
- Logs no muestran banner `[DEPLOY]`
- Commit hash es "unknown"

**Solución:**
1. Verificar que el último commit está desplegado (Railway → Deployments)
2. Forzar redeploy
3. Verificar que GitHub está conectado
4. Verificar que branch = `main`

---

### Problema: Endpoints devuelven 404 después de redeploy

**Síntomas:**
- `GET /api/deploy/info` → 404
- `GET /api/seed/health` → 404

**Solución:**
1. **VERIFICAR Root Directory = `backend`** (CRÍTICO)
2. Verificar que el código más reciente está en `main`
3. Verificar logs de Railway para errores de build
4. Forzar redeploy completo (no incremental)

---

## 📋 CHECKLIST FINAL

Antes de considerar el sistema "LISTO", verificar:

- [ ] Railway Dashboard: Root Directory = `backend` ✅
- [ ] Railway Dashboard: Start Command = `node dist/server.js` (o vacío) ✅
- [ ] Railway Dashboard: Build Command = (vacío) ✅
- [ ] Railway Dashboard: GitHub conectado, branch = `main` ✅
- [ ] Railway Dashboard: Auto-deploy = ON ✅
- [ ] Railway Logs: Aparecen `[DEPLOY] Commit: <hash>` ✅
- [ ] Railway Logs: Aparece `[SEED] Seed routes mounted` ✅
- [ ] Railway Logs: Aparece `[DEPLOY] Deploy routes mounted` ✅
- [ ] Endpoint `/health` → 200 OK ✅
- [ ] Endpoint `/api/deploy/info` → 200 OK ✅
- [ ] Endpoint `/api/seed/health` → 200 OK ✅
- [ ] Script `npm run verify:railway` → ✅ DEPLOY OK ✅

---

## ✅ DEFINICIÓN DE HECHO

**El sistema está LISTO cuando:**

1. ✅ Railway Dashboard tiene Root Directory = `backend`
2. ✅ Railway Dashboard tiene Start Command = `node dist/server.js`
3. ✅ Railway Logs muestran `[DEPLOY] Commit: <hash>`
4. ✅ Endpoints `/health`, `/api/deploy/info`, `/api/seed/health` devuelven 200 OK
5. ✅ Script `npm run verify:railway` retorna "DEPLOY OK"

---

**Última actualización:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO  
**Acción requerida:** Configurar Railway Dashboard AHORA

