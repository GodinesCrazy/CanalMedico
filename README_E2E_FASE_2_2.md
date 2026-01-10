# Script E2E Automatizado - FASE 2.2

**Fecha:** 2024-11-23  
**Responsable:** QA Automation Lead + Tech Lead Backend  
**Propósito:** Script automatizado para ejecutar pruebas End-to-End contra Railway y generar reportes GO/NO-GO

---

## 🚀 USO RÁPIDO

### Ejecutar con Seed Automático (Recomendado)

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
ENABLE_TEST_DATA=true \
npm run e2e:phase2.2
```

### Ejecutar con Credenciales Manuales

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
ENABLE_TEST_DATA=false \
DOCTOR_EMAIL=doctor.test@canalmedico.com \
DOCTOR_PASSWORD=DoctorTest123! \
DOCTOR_ID=doctor-id-here \
PATIENT_EMAIL=patient.test@canalmedico.com \
PATIENT_PASSWORD=PatientTest123! \
PATIENT_ID=patient-id-here \
npm run e2e:phase2.2
```

---

## 📋 VARIABLES DE ENTORNO

### Requeridas

- `API_URL`: URL del backend en Railway (ej: `https://canalmedico-production.up.railway.app`)

### Opcionales (valores por defecto)

- `ENABLE_TEST_DATA`: `true` o `false` (default: `false`)
  - Si `true`: Ejecuta `POST /api/seed/test-data` para crear usuarios de prueba
  - Si `false`: Usa credenciales de variables de entorno (requiere `DOCTOR_EMAIL`, etc.)

- `ADMIN_EMAIL`: Email del admin (default: `admin@canalmedico.com`)
- `ADMIN_PASSWORD`: Password del admin (default: `Admin123!`)

### Requeridas si `ENABLE_TEST_DATA=false`

- `DOCTOR_EMAIL`: Email del doctor de prueba
- `DOCTOR_PASSWORD`: Password del doctor de prueba
- `DOCTOR_ID`: ID del doctor (opcional, se obtiene del perfil si no se proporciona)
- `PATIENT_EMAIL`: Email del paciente de prueba
- `PATIENT_PASSWORD`: Password del paciente de prueba
- `PATIENT_ID`: ID del paciente (opcional, se obtiene del perfil si no se proporciona)

---

## 🔍 QUÉ HACE EL SCRIPT

### PASO 1 — Validación Inicial

1. `GET /health` → Debe retornar `200 OK`
2. `POST /api/auth/login` (ADMIN) → Debe retornar `200 OK` con `accessToken`

**Si falla:** ❌ NO-GO inmediato

---

### PASO 2 — Seed Test Data (Condicional)

Si `ENABLE_TEST_DATA=true`:
- Ejecuta `POST /api/seed/test-data`
- Lee credenciales del response:
  - `doctorEmail`, `doctorPassword`, `doctorId`
  - `patientEmail`, `patientPassword`, `patientId`
- Guarda credenciales (redactadas) en `docs/CREDENCIALES_TEST_FASE_2_2.md`

Si `ENABLE_TEST_DATA=false`:
- Usa credenciales de variables de entorno
- Valida que existan `DOCTOR_EMAIL`, `DOCTOR_PASSWORD`, `PATIENT_EMAIL`, `PATIENT_PASSWORD`

**Si falla:** ❌ NO-GO inmediato

---

### PASO 3 — E2E Core (5 Escenarios)

**Escenario A:** PATIENT crea consulta
- Login como PATIENT
- `POST /api/consultations` con `doctorId`, `patientId`, `type: "NORMAL"`, `price: 15000`
- Validar: `status = "PENDING"`, `price = 15000`

**Escenario B:** DOCTOR ve consultas
- Login como DOCTOR
- `GET /api/doctor/consultations?status=PENDING`
- Validar: Consulta creada aparece en lista

**Escenario C:** DOCTOR acepta consulta
- `PATCH /api/consultations/:id/accept`
- Validar: `status = "ACTIVE"`, `startedAt` definido

**Escenario D:** DOCTOR completa consulta
- `PATCH /api/consultations/:id/complete`
- Validar: `status = "COMPLETED"`, `endedAt` definido

**Escenario E:** ADMIN verifica global
- Login como ADMIN
- `GET /api/admin/consultations?status=COMPLETED`
- Validar: Consulta completada aparece en lista global

**Si falla cualquier escenario:** ❌ NO-GO

---

### PASO 4 — Tests Negativos RBAC (4 Tests)

**Test N1:** PACIENTE intenta accept → Debe ser `403 Forbidden`

**Test N2:** DOCTOR intenta complete consulta PENDING → Debe ser `400/409 Bad Request`

**Test N3:** ADMIN intenta accept → Debe ser `403 Forbidden`

**Test N4:** DOCTOR intenta accept consulta ajena (ID inválido) → Debe ser `403/404`

**Si falla cualquier test:** ❌ NO-GO

---

### PASO 5 — Generar Reportes Automáticos

Genera los siguientes archivos en `docs/`:

1. **`FASE_2_2_REPORTE_E2E.md`**
   - Resultados de escenarios A-E
   - Status codes, respuestas, errores
   - Timestamps

2. **`FASE_2_2_TESTS_NEGATIVOS.md`**
   - Resultados de tests negativos RBAC
   - Validaciones de seguridad
   - Timestamps

3. **`FASE_2_2_HALLAZGOS_Y_PLAN.md`**
   - Errores detectados
   - Bloqueantes (si los hay)
   - Plan de fijos propuesto

4. **`FASE_2_2_GO_NO_GO.md`**
   - Veredicto ejecutivo (GO/NO-GO)
   - Scorecard (6/6 criterios)
   - Justificación
   - Próximos pasos

**Cálculo de Veredicto:**
- ✅ **GO** si:
  - Todos los escenarios core pasaron
  - Todos los tests negativos RBAC pasaron
  - No hay errores 500
  - No hay bloqueantes
- ❌ **NO-GO** si:
  - Cualquier escenario core falló
  - Cualquier test negativo RBAC falló
  - Hay errores 500
  - Hay bloqueantes

---

### PASO 6 — Commit y Push Automático

Si `GO`:
```bash
git add docs/*.md
git commit -m "test: automate fase 2.2 e2e and go/no-go report"
git push
```

Si `NO-GO`:
```bash
git add docs/*.md
git commit -m "test: add fase 2.2 e2e automation (no-go)"
git push
```

**Si falla commit/push:** ⚠️ Warning (no bloqueante, el script continúa)

---

## 📊 OUTPUT ESPERADO

### Output en Consola

```
========================================
FASE 2.2 - E2E Automated Validation
========================================
API URL: https://canalmedico-production.up.railway.app
ENABLE_TEST_DATA: true
========================================

[PASO 1] 📋 Validación Inicial
[1.1] ✅ Health check OK (200)
[1.2] ✅ Login ADMIN exitoso (200)

[PASO 2] 📋 Creando usuarios de prueba...
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

## ✅ CRITERIOS PARA GO

| Criterio | Estado | Observaciones |
|----------|--------|---------------|
| Checklist Inicial | ✅ | OK |
| Seed Data | ✅ | OK |
| Escenarios E2E (A-E) | ✅ | 5/5 pasaron |
| Tests Negativos RBAC | ✅ | 4/4 pasaron |
| Sin Errores 500 | ✅ | OK |
| Sin Bloqueantes | ✅ | 0 bloqueantes |

**Score:** 6/6 ✅

---

## ❌ CRITERIOS PARA NO-GO

El script emite **NO-GO** si:

1. ❌ Validación inicial falla (health o login)
2. ❌ Seed test data falla (si `ENABLE_TEST_DATA=true`)
3. ❌ Cualquier escenario E2E falla (A-E)
4. ❌ Cualquier test negativo RBAC falla
5. ❌ Se detectan errores 500
6. ❌ Hay bloqueantes registrados

---

## 🔧 TROUBLESHOOTING

### Error: "Health check falló"

**Causa:** Backend no está disponible en `API_URL`

**Solución:**
1. Verificar que el backend esté desplegado en Railway
2. Verificar que `API_URL` sea correcta
3. Verificar logs de Railway para errores de startup

---

### Error: "Login ADMIN falló"

**Causa:** Credenciales incorrectas o usuario ADMIN no existe

**Solución:**
1. Verificar que `ENABLE_TEST_ADMIN=true` en Railway (para crear admin automáticamente)
2. Verificar credenciales: `admin@canalmedico.com` / `Admin123!`
3. Verificar logs de Railway para errores de autenticación

---

### Error: "Seed test data falló"

**Causa:** `ENABLE_TEST_DATA=true` pero el endpoint `/api/seed/test-data` no está disponible o falla

**Solución:**
1. Verificar que `ENABLE_TEST_DATA=true` en Railway
2. Verificar que el endpoint `/api/seed/test-data` existe y funciona
3. Usar credenciales manuales (`ENABLE_TEST_DATA=false`) y proporcionar `DOCTOR_EMAIL`, etc.

---

### Error: "Consulta no encontrada en lista"

**Causa:** El doctor no ve la consulta creada (problema de RBAC o filtros)

**Solución:**
1. Verificar que el `doctorId` usado para crear la consulta corresponda al doctor autenticado
2. Verificar que el endpoint `GET /api/doctor/consultations` funciona correctamente
3. Verificar logs de Railway para errores en el endpoint

---

### Error: "Status incorrecto después de aceptar/completar"

**Causa:** La migración FASE 2.1 no se aplicó correctamente o los campos `startedAt`/`endedAt` no se setean

**Solución:**
1. Verificar que la migración se aplicó: buscar `✅ Schema sincronizado correctamente con db push` en logs de Railway
2. Verificar que los campos `startedAt` y `endedAt` existen en la tabla `consultations`
3. Verificar código de `consultations.service.ts` métodos `accept()` y `complete()`

---

## 📝 NOTAS IMPORTANTES

1. **Tokens NO se guardan en docs:** Los tokens se usan solo en memoria durante la ejecución
2. **Passwords redactadas:** En `docs/CREDENCIALES_TEST_FASE_2_2.md`, las passwords se muestran parcialmente (ej: `Ad******!`)
3. **Consultas creadas:** El script crea consultas reales en la BD. Si se ejecuta múltiples veces, puede haber múltiples consultas.
4. **Idempotente:** El script puede ejecutarse múltiples veces sin problemas (pero creará múltiples consultas)

---

## 🔒 SEGURIDAD

- ⚠️ **No ejecutar en producción real** a menos que `ENABLE_TEST_DATA=true` esté temporalmente activado
- ⚠️ **No hardcodear tokens** o passwords en el código
- ⚠️ **No exponer passwords completas** en logs o reportes
- ✅ **Usar variables de entorno** para todas las credenciales
- ✅ **Credenciales redactadas** en documentación generada

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ Script completo y listo para usar  
**Próxima acción:** Ejecutar script contra Railway para validar FASE 2.2

