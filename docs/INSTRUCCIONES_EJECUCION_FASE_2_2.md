# Instrucciones de Ejecución - FASE 2.2 E2E

**Fecha:** 2024-11-23  
**Última actualización:** Commit `fix(seed): ensure seed routes mounted and logged`

---

## 🚀 EJECUCIÓN RÁPIDA (PowerShell)

### Opción 1: Con Seed Automático (Recomendado)

```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
$env:ENABLE_TEST_DATA="true"
npm run e2e:phase2.2
```

**Requisitos:**
- `ENABLE_TEST_DATA=true` configurado en Railway
- Endpoint `/api/seed/test-data` disponible

---

### Opción 2: Con Fallback a Credenciales Manuales

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

**Comportamiento:**
- Intenta seed automático primero
- Si seed falla (404, 500), usa credenciales ENV automáticamente
- Continúa con pruebas E2E

---

### Opción 3: Solo Credenciales Manuales (Sin Seed)

```powershell
cd backend
$env:API_URL="https://canalmedico-production.up.railway.app"
$env:ENABLE_TEST_DATA="false"
$env:DOCTOR_EMAIL="doctor.test@canalmedico.com"
$env:DOCTOR_PASSWORD="DoctorTest123!"
$env:DOCTOR_ID="doctor-id-here"
$env:PATIENT_EMAIL="patient.test@canalmedico.com"
$env:PATIENT_PASSWORD="PatientTest123!"
$env:PATIENT_ID="patient-id-here"
npm run e2e:phase2.2
```

---

## 🔍 VALIDACIÓN PREVIA

### Antes de Ejecutar el Script

**1. Verificar que el módulo seed está montado:**

```powershell
curl -X GET https://canalmedico-production.up.railway.app/api/seed/health
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Seed module is mounted and available",
  "endpoint": "/api/seed",
  "routes": ["/health", "/test-data"],
  "enableTestData": true
}
```

**Si devuelve 404:** ❌ Módulo seed NO está montado → Verificar deploy en Railway

---

**2. Verificar logs en Railway:**

En Railway Dashboard → Logs, buscar al boot:
```
[SEED] Seed routes mounted at /api/seed
```

**Si aparece:** ✅ Módulo seed está montado  
**Si NO aparece:** ❌ Problema de deploy

---

**3. Verificar variable de entorno en Railway:**

- Ir a Railway Dashboard → Variables de Entorno
- Buscar `ENABLE_TEST_DATA`
- Debe estar configurado como `true`

---

## 📊 OUTPUT ESPERADO DEL SCRIPT

### Si Todo Funciona:

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
...

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

### Si Seed Falla pero Hay Fallback:

```
[PASO 2] 📋 Creando usuarios de prueba (ENABLE_TEST_DATA=true)
[2.0] ⚠️ Módulo seed NO está montado en Railway (404)
[2.1] ⚠️ Seed test data falló: 404
[2.2] ⚠️ Intentando fallback a modo manual (ENV)...
[2.2] ✅ Fallback exitoso: Credenciales cargadas desde ENV
```

**El script continúa normalmente con credenciales de ENV.**

---

### Si Seed Falla y No Hay Fallback:

```
[PASO 2] 📋 Creando usuarios de prueba (ENABLE_TEST_DATA=true)
[2.0] ⚠️ Módulo seed NO está montado en Railway (404)
[2.1] ⚠️ Seed test data falló: 404
[2.2] ❌ No hay credenciales de ENV disponibles
[PASO 2] ❌ Seed falló y no hay credenciales de fallback disponibles

[PASO 5] 📋 Generando Reportes
[5.1] ✅ Reporte E2E guardado...
...

========================================
   ❌ NO-GO
========================================
Bloqueantes: 1
```

**El script genera reportes igual, marcando NO-GO con bloqueante.**

---

## 📁 ARCHIVOS GENERADOS

Después de ejecutar el script, se generan en `backend/docs/`:

1. **`CREDENCIALES_TEST_FASE_2_2.md`** - Credenciales de prueba (redactadas)
2. **`FASE_2_2_REPORTE_E2E.md`** - Resultados de escenarios A-E
3. **`FASE_2_2_TESTS_NEGATIVOS.md`** - Resultados de tests RBAC
4. **`FASE_2_2_HALLAZGOS_Y_PLAN.md`** - Errores y plan de fijos
5. **`FASE_2_2_GO_NO_GO.md`** - Veredicto ejecutivo

---

## 🔧 TROUBLESHOOTING

### Error: "Módulo seed NO está montado en Railway (404)"

**Solución:**
1. Verificar que Railway está apuntando a `main` branch
2. Verificar que `root_dir = backend` en Railway
3. Verificar logs de Railway para `[SEED] Seed routes mounted`
4. Forzar redeploy en Railway

---

### Error: "Seed test data falló: 403"

**Solución:**
1. Configurar `ENABLE_TEST_DATA=true` en Railway
2. Reiniciar servicio en Railway

---

### Error: "ENOENT: no such file or directory 'docs/...'"

**Solución:**
- ✅ Ya corregido: El script crea `docs/` automáticamente
- Si persiste, verificar que `ensureDocsDir()` se ejecuta al inicio

---

### Error: "No hay credenciales de ENV disponibles"

**Solución:**
1. Proporcionar credenciales en variables de entorno:
   ```powershell
   $env:DOCTOR_EMAIL="..."
   $env:DOCTOR_PASSWORD="..."
   $env:PATIENT_EMAIL="..."
   $env:PATIENT_PASSWORD="..."
   ```
2. O configurar `ENABLE_TEST_DATA=true` en Railway para usar seed automático

---

## ✅ CHECKLIST PRE-EJECUCIÓN

- [ ] Railway está apuntando a `main` branch
- [ ] `root_dir = backend` en Railway
- [ ] Variable `ENABLE_TEST_DATA=true` configurada en Railway
- [ ] Endpoint `/api/seed/health` devuelve 200 OK
- [ ] Logs `[SEED] Seed routes mounted` aparecen en Railway
- [ ] Script E2E tiene `ensureDocsDir()` (ya corregido)
- [ ] Credenciales ENV disponibles (si se usa fallback)

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ Script listo para ejecutar  
**Próximo paso:** Ejecutar script y verificar resultados

