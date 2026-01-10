# Playbook Final Producción - CanalMedico Backend

**Fecha:** 2024-11-23  
**Objetivo:** Dejar el software "LISTO y TERMINADO" en Railway con validación completa

---

## 📋 PARTE 1 - DIAGNÓSTICO REAL DE RAILWAY DEPLOY (ROOT CAUSE)

### A1) Configuración Verificada

✅ **`backend/railway.json`** - Configuración Railway específica para backend
- Builder: NIXPACKS
- Start Command: `node dist/server.js` ✅ (NO `npm run preview`)
- Healthcheck: `/health`

✅ **`backend/nixpacks.toml`** - Configuración Nixpacks para build
- Install: `npm ci` ✅
- Build: `npx prisma generate && npm run build` ✅
- Start: `node dist/server.js` ✅ (NO `npm run preview`)

✅ **`backend/Dockerfile`** - Alternativa Docker
- Build: `npm ci && npx prisma generate && npm run build` ✅
- Start: `npm start` (que ejecuta `node dist/server.js`) ✅

✅ **`backend/Procfile`** - Alternativa Procfile
- Web: `node dist/server.js` ✅
- Release: `npx prisma migrate deploy || npx prisma db push --accept-data-loss` ✅

✅ **`backend/package.json`** - Scripts correctos
- `start`: `node dist/server.js` ✅
- `build`: `tsc && tsc-alias` ✅
- ❌ NO hay script `preview` en backend

⚠️ **`package.json` (root)** - Tiene scripts pero NO deberían ejecutarse
- `build`: `cd backend && npx prisma generate && npm run build` ✅
- `start`: `cd backend && node dist/server.js` ✅
- Estos solo se usan si Railway NO está configurado con Root Directory

---

### A2) Problema Identificado (ROOT CAUSE)

**PROBLEMA PRINCIPAL:** Railway puede estar usando configuración de la raíz en vez de `backend/`

**Causas posibles:**
1. ❌ Root Directory NO está configurado como `backend` en Railway Dashboard
2. ❌ Railway está usando `package.json` de la raíz en vez de `backend/package.json`
3. ❌ Railway está usando `railway.json` de la raíz (si existe) en vez de `backend/railway.json`
4. ❌ Railway está detectando automáticamente `npm run preview` desde algún lado

---

### A3) Solución Definitiva

✅ **Opción A (PREFERIDA): Backend Only Deploy**

**Configuración Railway Dashboard:**
- Root Directory: `backend` ✅ (OBLIGATORIO)
- Build Command: (automático desde `backend/nixpacks.toml`)
- Start Command: `node dist/server.js` ✅ (desde `backend/railway.json`)

**Archivos en `backend/`:**
- ✅ `railway.json` - Define start command
- ✅ `nixpacks.toml` - Define build steps
- ✅ `package.json` - Define scripts (NO tiene `preview`)
- ✅ `Dockerfile` - Alternativa Docker (opcional)

**Garantías:**
- ✅ Railway usa `backend/nixpacks.toml` para build
- ✅ Railway usa `backend/railway.json` para deploy
- ✅ Railway usa `backend/package.json` para scripts
- ✅ Start command es `node dist/server.js` (NO `npm run preview`)

---

## 📋 PARTE 2 - FIXES PARA DEPLOY AUTOMÁTICO

### B1) Configuración Definitiva

✅ **`backend/railway.json`:**
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

✅ **`backend/nixpacks.toml`:**
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

✅ **`backend/Dockerfile`:**
```dockerfile
RUN npm run build
RUN echo "Build completed at $(date -Iseconds)" > .build-timestamp
CMD ["npm", "start"]
```

**Prohibido:** ❌ `npm run preview` - NO existe en `backend/package.json`

---

### B2) Estándares Cumplidos

✅ Backend compila TS → `dist/`
✅ Start es: `node dist/server.js`
✅ Migraciones corren en boot según `runMigrations()`
✅ Build timestamp se guarda en `.build-timestamp`

---

### B3) Logs de Versión del Deploy

✅ **Implementado en `backend/src/server.ts`:**

Logs al boot:
```
============================================================
[DEPLOY] CanalMedico Backend
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <hash>
[DEPLOY] Environment: production
[DEPLOY] Node Version: v18.17.0
[DEPLOY] Build Timestamp: 2024-11-23T10:00:00Z
[DEPLOY] Deploy Timestamp: 2024-11-23T10:05:00Z
[DEPLOY] API URL: https://canalmedico-production.up.railway.app
============================================================
```

✅ **Obligatorio para confirmar deploy actualizado**

---

## 📋 PARTE 3 - VERIFICACIÓN AUTOMÁTICA POST-DEPLOY

### C1) Endpoint Deploy Info

✅ **`GET /api/deploy/info`** implementado

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "version": "1.0.1",
    "commitHash": "<hash>",
    "environment": "production",
    "buildTimestamp": "2024-11-23T10:00:00Z",
    "deployTimestamp": "2024-11-23T10:05:00Z",
    "nodeVersion": "v18.17.0"
  }
}
```

✅ **Se usa para validar que Railway está corriendo el commit correcto**

---

### C2) Script de Verificación Mejorado

✅ **`backend/scripts/verify-railway-deploy.ts`** mejorado con:

**Validaciones:**
1. ✅ `GET /health` → Debe retornar 200
2. ✅ `GET /api/deploy/info` → Debe retornar 200 con commit hash
3. ✅ Validación de commit hash contra GitHub (o EXPECTED_COMMIT_HASH)
4. ✅ `GET /api/seed/health` → Debe retornar 200
5. ✅ `POST /api/seed/test-data` → Debe retornar 200 o 403 (NO 404)

**Si falla:**
- ❌ Imprime causa exacta
- ❌ Imprime acción recomendada

**Uso:**
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

---

## 📋 PARTE 4 - EJECUCIÓN FASE 2.2 GO FINAL

### D1) Script E2E Verificado

✅ **`backend/scripts/e2e-phase-2-2.ts`** está perfecto:
- ✅ Crea `docs/` automáticamente
- ✅ No aborta sin generar reportes
- ✅ Fallback robusto si seed falla
- ✅ Genera reportes siempre
- ✅ Commit final si GO

---

### D2) Instrucciones Actualizadas

✅ **`docs/PLAYBOOK_FINAL_PRODUCCION.md`** creado con:
- Checklist pre-ejecución completo
- Instrucciones paso a paso
- Comandos PowerShell listos para usar
- Troubleshooting completo
- Criterio GO final

---

## 📋 PARTE 5 - CHECKLIST PRE-EJECUCIÓN

### 1. Verificar Root Directory en Railway

**Acción REQUERIDA:**
1. Ir a Railway Dashboard → Service (Backend) → Settings
2. Buscar "Root Directory" o "Source"
3. **DEBE estar configurado como:** `backend`
4. Si está vacío o es `/`, cambiarlo a `backend`
5. Guardar cambios

**Si NO está configurado:**
- ❌ Railway usará `package.json` de la raíz
- ❌ Railway puede ejecutar scripts incorrectos
- ❌ Railway puede usar `railway.json` de la raíz

---

### 2. Verificar GitHub Connection

**Acción REQUERIDA:**
1. Ir a Railway Dashboard → Settings → Connect GitHub
2. Confirmar que repositorio está conectado
3. Confirmar que branch es `main`
4. Si no está conectado, conectarlo

**Si NO está conectado:**
- ❌ Railway no despliega automáticamente con nuevos commits
- ❌ Necesitas hacer deploy manual

---

### 3. Verificar Start Command en Railway

**Acción REQUERIDA:**
1. Ir a Railway Dashboard → Service (Backend) → Settings
2. Buscar "Start Command" o "Run Command"
3. **DEBE ser:** `node dist/server.js`
4. Si es `npm run preview` o `npm run dev`, cambiarlo a `node dist/server.js`
5. Guardar cambios

**Si NO está configurado:**
- ❌ Railway puede usar script por defecto
- ❌ Railway puede ejecutar `npm run preview` si existe

---

### 4. Forzar Redeploy

**Acción REQUERIDA:**
1. Ir a Railway Dashboard → Service (Backend) → Deployments
2. Verificar que el último deployment tiene commit hash más reciente
3. Si NO, hacer "Redeploy" manualmente
4. O hacer push a `main` para triggear deploy automático

**Comando para triggear deploy:**
```powershell
cd c:\CanalMedico
git push
```

---

## 📋 PARTE 6 - EJECUCIÓN PASO A PASO

### Paso 1: Verificar Configuración Railway

**En Railway Dashboard:**

1. **Service Settings:**
   - Root Directory: `backend` ✅
   - Start Command: `node dist/server.js` ✅ (o vacío, usa `railway.json`)
   - Build Command: (vacío, usa `nixpacks.toml`)

2. **GitHub Settings:**
   - Repository: `GodinesCrazy/CanalMedico` ✅
   - Branch: `main` ✅
   - Auto-deploy: `ON` ✅

3. **Variables de Entorno:**
   - `ENABLE_TEST_DATA=true` ✅
   - `DATABASE_URL=...` ✅
   - `JWT_SECRET=...` ✅
   - etc.

---

### Paso 2: Ejecutar Verificación de Deploy

**Comando:**
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
npm run verify:railway
```

**Resultado esperado:**
```
========================================
Railway Deploy Verification
========================================
API URL: https://canalmedico-production.up.railway.app
========================================

🔍 Verificando GET /health...
  ✅ Status: 200

🔍 Verificando GET /api/deploy/info...
  ✅ Status: 200
  📋 Version: 1.0.1
  📋 Commit: <hash>
  📋 Environment: production
  📋 Node Version: v18.17.0
  📋 Build Timestamp: 2024-11-23T10:00:00Z

🔍 Verificando commit hash...
  📋 Commit desplegado: <hash>
  📋 Último commit en GitHub: <hash>
  ✅ Deploy está actualizado con el último commit

🔍 Verificando GET /api/seed/health...
  ✅ Status: 200
  📋 Message: Seed module is mounted and available
  📋 ENABLE_TEST_DATA: true

🔍 Verificando POST /api/seed/test-data...
  ✅ Status: 200

========================================
RESUMEN DE VERIFICACIÓN
========================================
✅ GET /health: ✅ Health check OK
✅ GET /api/deploy/info: ✅ Deploy info retrieved
✅ Commit Hash Validation: ✅ Deploy está actualizado
✅ GET /api/seed/health: ✅ Seed module mounted
✅ POST /api/seed/test-data: ✅ Endpoint exists (ENABLED)
========================================
✅ DEPLOY OK - Todos los endpoints funcionan correctamente
✅ Commit desplegado: <hash>
✅ El backend está desplegado y actualizado
```

**Si falla:**
- ❌ Verificar Root Directory = `backend`
- ❌ Verificar Start Command = `node dist/server.js`
- ❌ Forzar redeploy en Railway
- ❌ Verificar logs de Railway para errores

---

### Paso 3: Verificar Logs de Railway

**En Railway Dashboard → Logs, buscar:**

**Al boot:**
```
============================================================
[DEPLOY] CanalMedico Backend
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <hash-del-último-commit>
[DEPLOY] Environment: production
[DEPLOY] Node Version: v18.17.0
[DEPLOY] Build Timestamp: 2024-11-23T10:00:00Z
[DEPLOY] Deploy Timestamp: 2024-11-23T10:05:00Z
[DEPLOY] API URL: https://canalmedico-production.up.railway.app
============================================================
[SEED] Seed routes mounted at /api/seed
[DEPLOY] Deploy routes mounted at /api/deploy
```

**Si NO aparecen estos logs:**
- ❌ El deploy NO está actualizado
- ❌ Forzar redeploy en Railway
- ❌ Verificar que el código más reciente está en `main`

---

### Paso 4: Ejecutar Pruebas E2E

**Comando:**
```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
$env:ENABLE_TEST_DATA="true"
$env:DOCTOR_EMAIL="doctor.test@canalmedico.com"
$env:DOCTOR_PASSWORD="DoctorTest123!"
$env:PATIENT_EMAIL="patient.test@canalmedico.com"
$env:PATIENT_PASSWORD="PatientTest123!"
npm run e2e:phase2.2
```

**Resultado esperado:**
```
========================================
   ✅ GO
========================================
Escenarios E2E: 5/5 pasaron
Tests Negativos: 4/4 pasaron
Errores 500: No
Bloqueantes: 0
========================================
```

---

### Paso 5: Revisar Veredicto Final

**Archivo:** `backend/docs/FASE_2_2_GO_NO_GO.md`

**Debe contener:**
```markdown
## 📋 VEREDICTO EJECUTIVO

### ✅ GO

**Justificación:**
- Todos los escenarios core pasaron
- Todos los tests negativos RBAC pasaron
- No hay errores 500
- No hay bloqueantes
```

**Si dice NO-GO:**
- Revisar `backend/docs/FASE_2_2_HALLAZGOS_Y_PLAN.md` para bloqueantes
- Resolver bloqueantes
- Re-ejecutar pruebas

---

## 📋 PARTE 7 - TROUBLESHOOTING

### Problema: Railway no despliega automáticamente

**Síntomas:**
- Nuevos commits en `main` no triggean deploy
- Railway muestra deployment viejo

**Causa:** GitHub connection desconectado o branch incorrecto

**Solución:**
1. Railway Dashboard → Settings → Connect GitHub
2. Verificar repositorio conectado
3. Verificar branch = `main`
4. Hacer push a `main` para triggear deploy
5. O forzar redeploy manual en Railway Dashboard

---

### Problema: Endpoints devuelven 404

**Síntomas:**
- `GET /api/seed/health` → 404
- `GET /api/deploy/info` → 404
- `POST /api/seed/test-data` → 404

**Causa:** Root Directory NO está configurado como `backend`

**Solución:**
1. Railway Dashboard → Service (Backend) → Settings
2. Buscar "Root Directory"
3. Cambiar a `backend`
4. Guardar cambios
5. Forzar redeploy

---

### Problema: Railway ejecuta `npm run preview`

**Síntomas:**
- Logs muestran "preview" o "dev"
- Build falla o servidor no inicia correctamente

**Causa:** Railway está usando `package.json` de la raíz o Start Command incorrecto

**Solución:**
1. Verificar Root Directory = `backend`
2. Verificar Start Command = `node dist/server.js`
3. Verificar que `backend/railway.json` tiene `startCommand: "node dist/server.js"`
4. Forzar redeploy

---

### Problema: Logs no muestran [DEPLOY] ni commit hash

**Síntomas:**
- Logs no muestran banner `[DEPLOY]`
- Commit hash es "unknown"

**Causa:** Deploy no está actualizado o Railway no está pasando commit hash

**Solución:**
1. Verificar que el último commit está desplegado
2. Forzar redeploy en Railway
3. Verificar que Railway está conectado a GitHub
4. Verificar que el código más reciente está en `main`

---

### Problema: Script verify:railway falla en commit hash

**Síntomas:**
- Script dice "Deploy desactualizado"
- Commit hash no coincide con GitHub

**Causa:** Railway no ha desplegado el último commit

**Solución:**
1. Verificar último commit en GitHub: `git log -1 --oneline`
2. Verificar commit hash en Railway logs: buscar `[DEPLOY] Commit:`
3. Si no coincide, forzar redeploy
4. O esperar a que Railway despliegue automáticamente (puede tardar 1-2 min)

---

## 📋 PARTE 8 - CRITERIO GO FINAL

### ✅ El sistema está GO cuando:

1. ✅ **Railway logs muestran:**
   ```
   [DEPLOY] Commit: <hash-del-último-commit>
   [SEED] Seed routes mounted at /api/seed
   [DEPLOY] Deploy routes mounted at /api/deploy
   ```

2. ✅ **Endpoints funcionan:**
   ```bash
   curl https://canalmedico-production.up.railway.app/health
   # → 200 OK
   
   curl https://canalmedico-production.up.railway.app/api/deploy/info
   # → 200 OK {"success": true, "data": {"commitHash": "...", ...}}
   
   curl https://canalmedico-production.up.railway.app/api/seed/health
   # → 200 OK {"success": true, "message": "Seed module is mounted..."}
   ```

3. ✅ **Script verify:railway retorna:**
   ```
   ✅ DEPLOY OK - Todos los endpoints funcionan correctamente
   ✅ Commit desplegado: <hash>
   ```

4. ✅ **Script E2E produce GO:**
   ```
   ✅ GO
   Escenarios E2E: 5/5 pasaron
   Tests Negativos: 4/4 pasaron
   ```

5. ✅ **No hay errores 404/500 en flujos críticos:**
   - ✅ Login funciona
   - ✅ Endpoints core funcionan
   - ✅ RBAC funciona

---

## 📋 PARTE 9 - FIRMAR GO FINAL

### Checklist Final

Antes de firmar GO, verificar:

- [ ] Railway Dashboard: Root Directory = `backend`
- [ ] Railway Dashboard: Start Command = `node dist/server.js` (o vacío)
- [ ] Railway Dashboard: GitHub conectado, branch = `main`
- [ ] Railway logs: Aparecen `[DEPLOY] Commit: <hash>`
- [ ] Railway logs: Aparece `[SEED] Seed routes mounted`
- [ ] Railway logs: Aparece `[DEPLOY] Deploy routes mounted`
- [ ] `npm run verify:railway` → ✅ DEPLOY OK
- [ ] `npm run e2e:phase2.2` → ✅ GO
- [ ] `docs/FASE_2_2_GO_NO_GO.md` → ✅ GO
- [ ] No hay errores 404/500 en flujos críticos

---

### Firma GO Final

**Ejecutado por:** [Tu nombre]  
**Fecha:** [Fecha]  
**Veredicto:** ✅ **GO**

**Evidencia:**
- Commit hash desplegado: `<hash>`
- Version: `1.0.1`
- Endpoints verificados: ✅
- Pruebas E2E: ✅ GO
- Documentación: ✅ Completa

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ Playbook completo  
**Próximo paso:** Ejecutar checklist y obtener GO final

