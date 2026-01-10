# Playbook GO Final - CanalMedico Backend

**Fecha:** 2024-11-23  
**Objetivo:** Ejecutar validación completa y obtener GO final para producción

---

## 📋 CHECKLIST PRE-EJECUCIÓN

### 1. Verificar Deploy en Railway

**1.1 Verificar que Railway está conectado a GitHub:**
- Ir a Railway Dashboard → Settings → Connect GitHub
- Confirmar que el repositorio está conectado
- Confirmar que el branch es `main`

**1.2 Verificar Root Directory:**
- Ir a Railway Dashboard → Service (Backend) → Settings → Root Directory
- Debe estar configurado como: `backend`
- Si está vacío o es `/`, cambiarlo a `backend`

**1.3 Verificar que el último commit está desplegado:**
- Verificar en Railway Dashboard → Deployments
- El último deployment debe tener el commit hash más reciente
- Si no, hacer "Redeploy" manualmente o hacer push a main (debería triggear automáticamente)

---

### 2. Ejecutar Verificación de Deploy

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
🔍 Verificando GET /api/seed/health...
  ✅ Status: 200
  📋 Message: Seed module is mounted and available
  📋 ENABLE_TEST_DATA: true
  📋 Routes: /health, /test-data
🔍 Verificando POST /api/seed/test-data...
  ✅ Status: 200

========================================
RESUMEN DE VERIFICACIÓN
========================================
✅ GET /health: ✅ Health check OK
✅ GET /api/seed/health: ✅ Seed module mounted
✅ POST /api/seed/test-data: ✅ Endpoint exists (ENABLED)
========================================
✅ DEPLOY OK - Todos los endpoints funcionan correctamente
✅ El backend está desplegado y actualizado
```

**Si falla:**
- ❌ Verificar logs de Railway
- ❌ Verificar que Root Directory = `backend`
- ❌ Verificar que el commit más reciente está desplegado
- ❌ Forzar redeploy manual en Railway

---

### 3. Verificar Logs de Railway

**En Railway Dashboard → Logs, buscar:**

**Al boot del servidor:**
```
[DEPLOY] CanalMedico Backend
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <hash>
[DEPLOY] Environment: production
[DEPLOY] API URL: https://canalmedico-production.up.railway.app
============================================================
[SEED] Seed routes mounted at /api/seed
```

**Si NO aparecen estos logs:**
- ❌ El deploy no está actualizado
- ❌ Forzar redeploy en Railway

---

### 4. Ejecutar Pruebas E2E FASE 2.2

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
FASE 2.2 - E2E Automated Validation
========================================
API URL: https://canalmedico-production.up.railway.app
ENABLE_TEST_DATA: true
========================================

[INIT] ✅ Directorio docs creado: C:\CanalMedico\backend\docs

[PASO 1] 📋 Validación Inicial
[1.1] ✅ Health check OK (200)
[1.2] ✅ Login ADMIN exitoso (200)

[PASO 2] 📋 Creando usuarios de prueba (ENABLE_TEST_DATA=true)
[2.0] ✅ Módulo seed está montado correctamente
[2.0]    ENABLE_TEST_DATA en Railway: true
[2.1] ✅ Seed test data exitoso
[2.2] ✅ Credenciales guardadas en docs/CREDENCIALES_TEST_FASE_2_2.md

[PASO 3] 📋 Ejecutando Escenarios E2E Core
[A] 📋 Escenario A: PATIENT crea consulta
[A.1] ✅ Login PATIENT exitoso
[A.2] ✅ Consulta creada: xyz123 (status: PENDING)
[B] 📋 Escenario B: DOCTOR ve consultas
[B.1] ✅ Login DOCTOR exitoso
[B.2] ✅ Consultas PENDING encontradas: 1
[C] 📋 Escenario C: DOCTOR acepta consulta
[C.1] ✅ Consulta aceptada: status=ACTIVE, startedAt=...
[D] 📋 Escenario D: DOCTOR completa consulta
[D.1] ✅ Consulta completada: status=COMPLETED, endedAt=...
[E] 📋 Escenario E: ADMIN verifica consultas globales
[E.1] ✅ Login ADMIN exitoso
[E.2] ✅ Consultas COMPLETED encontradas: 1

[PASO 4] 📋 Ejecutando Tests Negativos RBAC
[N1] ✅ RBAC protege correctamente: 403
[N2] ✅ Validación de estado funciona: 400
[N3] ✅ RBAC protege correctamente: 403
[N4] ✅ Validación funciona: 403

[PASO 5] 📋 Generando Reportes
[5.1] ✅ Reporte E2E guardado en docs/FASE_2_2_REPORTE_E2E.md
[5.2] ✅ Reporte Tests Negativos guardado en docs/FASE_2_2_TESTS_NEGATIVOS.md
[5.3] ✅ Hallazgos y Plan guardado en docs/FASE_2_2_HALLAZGOS_Y_PLAN.md
[5.4] ✅ Veredicto GO/NO-GO guardado en docs/FASE_2_2_GO_NO_GO.md

[PASO 6] 📋 Commit y Push a GitHub
[6.1] ✅ Commit y push exitosos

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

### 5. Revisar Veredicto Final

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

## ✅ CRITERIO GO FINAL

El sistema está **GO** cuando:

1. ✅ Railway logs muestran:
   ```
   [DEPLOY] CanalMedico Backend
   [DEPLOY] Commit: <hash-del-último-commit>
   [SEED] Seed routes mounted at /api/seed
   ```

2. ✅ Endpoints funcionan:
   - `GET /health` → 200 OK
   - `GET /api/seed/health` → 200 OK
   - `POST /api/seed/test-data` → 200 OK (si `ENABLE_TEST_DATA=true`)

3. ✅ Script de verificación pasa:
   ```powershell
   npm run verify:railway
   # → ✅ DEPLOY OK
   ```

4. ✅ Pruebas E2E producen GO:
   ```powershell
   npm run e2e:phase2.2
   # → ✅ GO
   # → docs/FASE_2_2_GO_NO_GO.md → VEREDICTO: ✅ GO
   ```

5. ✅ No hay errores 404/500 en flujos críticos:
   - Login funciona
   - Endpoints core funcionan
   - RBAC funciona

---

## 🚨 TROUBLESHOOTING

### Problema: Railway no despliega automáticamente

**Solución:**
1. Verificar que Railway está conectado a GitHub
2. Verificar que el branch es `main`
3. Hacer push a `main` para triggear deploy
4. Si no funciona, hacer "Redeploy" manual en Railway Dashboard

---

### Problema: Endpoints devuelven 404

**Solución:**
1. Verificar Root Directory = `backend` en Railway
2. Verificar que el último commit está desplegado
3. Verificar logs de Railway para errores de build
4. Verificar que `railway.json` y `nixpacks.toml` están en `backend/`

---

### Problema: Logs no muestran [DEPLOY] ni [SEED]

**Solución:**
1. Forzar redeploy en Railway
2. Verificar que el código más reciente está en `main`
3. Verificar que Root Directory = `backend`

---

### Problema: Script E2E falla en seed

**Solución:**
1. Verificar `ENABLE_TEST_DATA=true` en Railway
2. Usar fallback con credenciales ENV:
   ```powershell
   $env:DOCTOR_EMAIL="..."
   $env:DOCTOR_PASSWORD="..."
   $env:PATIENT_EMAIL="..."
   $env:PATIENT_PASSWORD="..."
   ```

---

## 📊 CHECKLIST FINAL

Antes de considerar el sistema **GO**:

- [ ] Railway está conectado a GitHub
- [ ] Root Directory = `backend` en Railway
- [ ] Último commit está desplegado
- [ ] Logs muestran `[DEPLOY]` con commit hash
- [ ] Logs muestran `[SEED] Seed routes mounted`
- [ ] `npm run verify:railway` pasa (✅ DEPLOY OK)
- [ ] `npm run e2e:phase2.2` produce GO
- [ ] `docs/FASE_2_2_GO_NO_GO.md` dice ✅ GO
- [ ] No hay bloqueantes en `docs/FASE_2_2_HALLAZGOS_Y_PLAN.md`
- [ ] No hay errores 404/500 en flujos críticos

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ Playbook completo  
**Próximo paso:** Ejecutar checklist y obtener GO final

