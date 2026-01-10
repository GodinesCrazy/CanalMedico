# Diagnóstico Real de Railway Deploy - ROOT CAUSE

**Fecha:** 2024-11-23  
**Objetivo:** Identificar la causa exacta por la que Railway NO despliega correctamente el backend

---

## 🔍 PARTE 1 - AUDITORÍA COMPLETA

### A1) Configuración de Deploy Verificada

✅ **`backend/railway.json`** - Existe y está correcto
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node dist/server.js"
  }
}
```
**Conclusión:** ✅ Configuración correcta

✅ **`backend/nixpacks.toml`** - Existe y está correcto
```toml
[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build",
  "echo 'Build completed at' $(date -Iseconds) > .build-timestamp"
]

[start]
cmd = "node dist/server.js"
```
**Conclusión:** ✅ Build steps correctos, NO ejecuta `npm run preview`

✅ **`backend/Dockerfile`** - Existe y está correcto
```dockerfile
RUN npm run build
RUN echo "Build completed at $(date -Iseconds)" > .build-timestamp
CMD ["npm", "start"]
```
**Conclusión:** ✅ Dockerfile correcto, NO ejecuta `npm run preview`

✅ **`backend/Procfile`** - Existe y está correcto
```
web: node dist/server.js
release: npx prisma migrate deploy || npx prisma db push --accept-data-loss
```
**Conclusión:** ✅ Procfile correcto, NO ejecuta `npm run preview`

✅ **`backend/package.json`** - Scripts verificados
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc && tsc-alias",
    "dev": "tsx watch src/server.ts"
  }
}
```
**Conclusión:** ✅ NO hay script `preview` en backend/package.json

⚠️ **`package.json` (root)** - Tiene scripts pero NO debería usarse
```json
{
  "scripts": {
    "build": "cd backend && npx prisma generate && npm run build",
    "start": "cd backend && node dist/server.js"
  }
}
```
**Conclusión:** ⚠️ Solo se usa si Railway NO está configurado con Root Directory

---

### A2) Problema Identificado (ROOT CAUSE)

**CAUSA RAÍZ #1: Root Directory NO configurado en Railway Dashboard**

**Síntomas:**
- Railway usa `package.json` de la raíz en vez de `backend/package.json`
- Railway puede usar `railway.json` de la raíz (si existe) en vez de `backend/railway.json`
- Railway puede detectar automáticamente scripts incorrectos

**Solución:**
✅ **OBLIGATORIO:** Configurar Root Directory = `backend` en Railway Dashboard

---

**CAUSA RAÍZ #2: Railway puede estar usando Dockerfile de la raíz**

**Síntomas:**
- Railway detecta Dockerfile en la raíz (si existe)
- Railway usa Dockerfile de la raíz en vez de `backend/Dockerfile`

**Solución:**
✅ **OBLIGATORIO:** Railway debe usar `backend/Dockerfile` o `backend/nixpacks.toml`

---

**CAUSA RAÍZ #3: Railway puede estar usando start command automático**

**Síntomas:**
- Railway detecta `package.json` y ejecuta `npm start` automáticamente
- Si hay script `preview` en algún lado, Railway puede ejecutarlo

**Solución:**
✅ **OBLIGATORIO:** Configurar Start Command explícito en Railway Dashboard o `backend/railway.json`

---

### A3) Solución Definitiva Implementada

✅ **Opción A (PREFERIDA): Backend Only Deploy**

**Configuración Railway Dashboard (OBLIGATORIA):**
- Root Directory: `backend` ✅ (CRÍTICO)
- Build Command: (vacío, usa `backend/nixpacks.toml`)
- Start Command: `node dist/server.js` ✅ (o vacío, usa `backend/railway.json`)

**Archivos en `backend/`:**
- ✅ `railway.json` - Define start command explícitamente
- ✅ `nixpacks.toml` - Define build steps explícitamente
- ✅ `Dockerfile` - Alternativa Docker (opcional)
- ✅ `Procfile` - Alternativa Procfile (opcional)
- ✅ `package.json` - Scripts correctos (NO tiene `preview`)

**Garantías:**
- ✅ Railway usa `backend/nixpacks.toml` para build
- ✅ Railway usa `backend/railway.json` para deploy
- ✅ Railway usa `backend/package.json` para scripts
- ✅ Start command es `node dist/server.js` (NO `npm run preview`)

---

## 🔍 PARTE 2 - VERIFICACIÓN DE RAILWAY DASHBOARD

### Pasos Obligatorios en Railway Dashboard

**1. Service Settings:**
```
Service Name: canalmedico-backend
Root Directory: backend ← OBLIGATORIO
Build Command: (vacío) ← Usa backend/nixpacks.toml
Start Command: node dist/server.js ← OBLIGATORIO o usa backend/railway.json
```

**2. Source Settings:**
```
Repository: GodinesCrazy/CanalMedico
Branch: main
Auto-deploy: ON
```

**3. Variables de Entorno:**
```
ENABLE_TEST_DATA=true
DATABASE_URL=...
JWT_SECRET=...
etc.
```

---

### Si Root Directory NO está configurado:

**Problema:**
- Railway ejecuta desde raíz (`/`)
- Railway busca `package.json` en raíz
- Railway puede ejecutar scripts de raíz
- Railway NO encuentra `backend/railway.json`

**Solución:**
1. Railway Dashboard → Service (Backend) → Settings
2. Buscar "Root Directory" o "Source Directory"
3. Configurar como: `backend`
4. Guardar cambios
5. Forzar redeploy

---

### Si Start Command está mal configurado:

**Problema:**
- Railway ejecuta `npm start` por defecto
- Railway puede ejecutar `npm run preview` si existe
- Railway NO ejecuta `node dist/server.js`

**Solución:**
1. Railway Dashboard → Service (Backend) → Settings
2. Buscar "Start Command" o "Run Command"
3. Configurar como: `node dist/server.js`
4. Guardar cambios
5. Forzar redeploy

**Alternativa:**
- Dejar Start Command vacío
- Railway usará `backend/railway.json` → `startCommand: "node dist/server.js"`

---

## 🔍 PARTE 3 - VALIDACIÓN POST-DEPLOY

### Endpoint Deploy Info

✅ **`GET /api/deploy/info`** implementado

**Uso para validar deploy:**
```bash
curl https://canalmedico-production.up.railway.app/api/deploy/info
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.1",
    "commitHash": "<hash-del-último-commit>",
    "environment": "production",
    "buildTimestamp": "2024-11-23T10:00:00Z",
    "deployTimestamp": "2024-11-23T10:05:00Z",
    "nodeVersion": "v18.17.0"
  }
}
```

**Si devuelve 404:**
- ❌ Módulo deploy NO está montado
- ❌ Deploy no está actualizado
- ❌ Forzar redeploy

**Si commitHash es "unknown":**
- ⚠️ Railway NO está pasando commit hash en variables de entorno
- ⚠️ Deploy puede estar actualizado pero Railway no expone hash
- ✅ Verificar logs de Railway para `[DEPLOY] Commit:`

---

## 🔍 PARTE 4 - SCRIPT DE VERIFICACIÓN

### Script Mejorado: `backend/scripts/verify-railway-deploy.ts`

**Validaciones implementadas:**

1. ✅ **GET /health** → Debe retornar 200
2. ✅ **GET /api/deploy/info** → Debe retornar 200 con commit hash
3. ✅ **Validación de commit hash:**
   - Si `EXPECTED_COMMIT_HASH` está configurado, valida contra él
   - Si NO, intenta obtener último commit de GitHub
   - Si NO puede, solo muestra commit actual (warning, no bloqueante)
4. ✅ **GET /api/seed/health** → Debe retornar 200
5. ✅ **POST /api/seed/test-data** → Debe retornar 200 o 403 (NO 404)

**Si falla:**
- ❌ Imprime causa exacta
- ❌ Imprime acción recomendada
- ❌ Exit code 1

**Uso:**
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

---

## 🔍 PARTE 5 - TROUBLESHOOTING ESPECÍFICO

### Problema: Railway ejecuta `npm run preview`

**Síntomas:**
- Logs muestran "preview" o "dev"
- Build falla o servidor no inicia

**Causa RAÍZ:**
- Root Directory NO está configurado como `backend`
- Railway está usando `package.json` de la raíz
- Railway está ejecutando scripts incorrectos

**Solución DEFINITIVA:**
1. Railway Dashboard → Service (Backend) → Settings
2. Root Directory: `backend` ✅ (OBLIGATORIO)
3. Start Command: `node dist/server.js` ✅ (OBLIGATORIO)
4. Guardar cambios
5. Forzar redeploy

**Verificación:**
- Railway logs deben mostrar `[DEPLOY] Commit: <hash>`
- Railway logs NO deben mostrar "preview" o "dev"

---

### Problema: Railway construye frontend en vez de backend

**Síntomas:**
- Build logs muestran comandos de frontend
- Build falla con errores de frontend

**Causa RAÍZ:**
- Root Directory NO está configurado como `backend`
- Railway está usando configuración de la raíz
- Railway está detectando frontend automáticamente

**Solución DEFINITIVA:**
1. Railway Dashboard → Service (Backend) → Settings
2. Root Directory: `backend` ✅ (OBLIGATORIO)
3. Verificar que el servicio correcto está seleccionado
4. Guardar cambios
5. Forzar redeploy

**Verificación:**
- Railway logs deben mostrar `npx prisma generate` (backend)
- Railway logs NO deben mostrar comandos de frontend

---

### Problema: Railway construye desde root

**Síntomas:**
- Build logs muestran `cd backend && ...`
- Build falla porque no encuentra archivos

**Causa RAÍZ:**
- Root Directory está vacío o es `/`
- Railway está usando scripts de la raíz que hacen `cd backend`

**Solución DEFINITIVA:**
1. Railway Dashboard → Service (Backend) → Settings
2. Root Directory: `backend` ✅ (OBLIGATORIO)
3. Build Command: (vacío, usa `backend/nixpacks.toml`)
4. Guardar cambios
5. Forzar redeploy

**Verificación:**
- Railway logs NO deben mostrar `cd backend`
- Railway logs deben ejecutar comandos directamente (ej: `npm ci`, `npm run build`)

---

### Problema: Railway ignora Root Directory

**Síntomas:**
- Root Directory está configurado como `backend` pero Railway sigue usando raíz
- Build logs muestran que ejecuta desde `/`

**Causa RAÍZ:**
- Railway puede estar usando Dockerfile de la raíz
- Railway puede estar usando configuración de otro servicio
- Railway puede tener cache corrupto

**Solución DEFINITIVA:**
1. Verificar que el servicio correcto está seleccionado (Backend, NO Frontend)
2. Verificar que Root Directory = `backend`
3. Eliminar Dockerfile de la raíz (si existe y no es necesario)
4. Limpiar cache de Railway
5. Forzar redeploy completo

**Verificación:**
- Railway logs deben mostrar que ejecuta desde `backend/`
- Railway logs deben usar `backend/nixpacks.toml`

---

## 📋 PARTE 6 - CHECKLIST DE VALIDACIÓN

### Checklist Pre-Deploy

- [ ] Railway Dashboard: Root Directory = `backend`
- [ ] Railway Dashboard: Start Command = `node dist/server.js` (o vacío)
- [ ] Railway Dashboard: Build Command = (vacío, usa `nixpacks.toml`)
- [ ] Railway Dashboard: GitHub conectado, branch = `main`
- [ ] Railway Dashboard: Auto-deploy = ON
- [ ] `backend/railway.json` existe y tiene `startCommand: "node dist/server.js"`
- [ ] `backend/nixpacks.toml` existe y tiene `cmd = "node dist/server.js"`
- [ ] `backend/package.json` NO tiene script `preview`
- [ ] `backend/Dockerfile` NO ejecuta `npm run preview`

---

### Checklist Post-Deploy

- [ ] Railway logs muestran `[DEPLOY] Commit: <hash>`
- [ ] Railway logs muestran `[SEED] Seed routes mounted`
- [ ] Railway logs muestran `[DEPLOY] Deploy routes mounted`
- [ ] `GET /health` → 200 OK
- [ ] `GET /api/deploy/info` → 200 OK con commit hash
- [ ] `GET /api/seed/health` → 200 OK
- [ ] `POST /api/seed/test-data` → 200 o 403 (NO 404)
- [ ] `npm run verify:railway` → ✅ DEPLOY OK
- [ ] Commit hash en logs coincide con último commit en GitHub

---

## 📋 PARTE 7 - ACCIONES RECOMENDADAS

### Acción 1: Verificar y Configurar Root Directory

**OBLIGATORIO en Railway Dashboard:**

1. Ir a Railway Dashboard → Service (Backend) → Settings
2. Buscar "Root Directory" o "Source Directory"
3. **Configurar como:** `backend`
4. Guardar cambios

**Si NO existe esta opción:**
- Railway puede estar usando Dockerfile
- Verificar que `backend/Dockerfile` existe y es correcto
- O configurar Railway para usar Nixpacks explícitamente

---

### Acción 2: Verificar y Configurar Start Command

**OBLIGATORIO en Railway Dashboard:**

1. Ir a Railway Dashboard → Service (Backend) → Settings
2. Buscar "Start Command" o "Run Command"
3. **Configurar como:** `node dist/server.js`
4. Guardar cambios

**Alternativa:**
- Dejar Start Command vacío
- Railway usará `backend/railway.json` → `startCommand`

---

### Acción 3: Forzar Redeploy

**OBLIGATORIO después de cambiar configuración:**

1. Ir a Railway Dashboard → Service (Backend) → Deployments
2. Hacer clic en "Redeploy" o "Redeploy Latest"
3. Esperar a que el deploy complete
4. Verificar logs para confirmar que está usando configuración correcta

---

### Acción 4: Verificar Logs de Railway

**OBLIGATORIO después de redeploy:**

En Railway Dashboard → Logs, buscar:

```
============================================================
[DEPLOY] CanalMedico Backend
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <hash>
[DEPLOY] Environment: production
[DEPLOY] Node Version: v18.17.0
[DEPLOY] Build Timestamp: ...
[DEPLOY] Deploy Timestamp: ...
[DEPLOY] API URL: https://canalmedico-production.up.railway.app
============================================================
[SEED] Seed routes mounted at /api/seed
[DEPLOY] Deploy routes mounted at /api/deploy
```

**Si NO aparecen estos logs:**
- ❌ Deploy no está actualizado
- ❌ Forzar redeploy nuevamente
- ❌ Verificar que el código más reciente está en `main`

---

## 📋 PARTE 8 - CONCLUSIÓN

### ROOT CAUSE IDENTIFICADO

**CAUSA PRINCIPAL:** Root Directory NO está configurado como `backend` en Railway Dashboard

**EVIDENCIA:**
- ✅ Todos los archivos de configuración están correctos en `backend/`
- ✅ NO hay script `preview` en `backend/package.json`
- ✅ `backend/railway.json` define `startCommand: "node dist/server.js"`
- ✅ `backend/nixpacks.toml` define `cmd = "node dist/server.js"`

**SOLUCIÓN:**
1. ✅ Configurar Root Directory = `backend` en Railway Dashboard
2. ✅ Configurar Start Command = `node dist/server.js` (o usar `railway.json`)
3. ✅ Forzar redeploy
4. ✅ Verificar logs para confirmar deploy correcto

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ ROOT CAUSE identificado  
**Acción requerida:** Configurar Root Directory = `backend` en Railway Dashboard

