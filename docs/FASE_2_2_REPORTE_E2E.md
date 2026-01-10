# FASE 2.2 - Reporte de Pruebas E2E

**Fecha:** 2024-11-23  
**Responsable:** QA Lead Senior + Product Owner + Auditor Técnico  
**Objetivo:** Validar End-to-End el flujo completo de consultas médicas monetizables

---

## 📋 RESUMEN EJECUTIVO

### Estado General: ⏳ PENDIENTE DE EJECUCIÓN

Este reporte documenta la ejecución de las pruebas End-to-End (E2E) para validar que el flujo completo de consultas médicas funciona correctamente en producción (Railway).

**Pruebas Planificadas:** 5 Escenarios (A-E)  
**Pruebas Ejecutadas:** 0/5 ⏳  
**Tests Negativos:** 0/5 ⏳  

---

## 🔍 ESCENARIOS DE PRUEBA

### ESCENARIO A — PACIENTE Crea Consulta ✅ PLANIFICADO

**Objetivo:** Validar que un PACIENTE puede crear una consulta con precio.

**Pasos:**
1. Login como PATIENT (`patient.test@canalmedico.com` / `PatientTest123!`)
2. Obtener `patientId` del perfil
3. Obtener `doctorId` de un doctor disponible
4. Crear consulta: `POST /api/consultations`
   ```json
   {
     "doctorId": "...",
     "patientId": "...",
     "type": "NORMAL",
     "price": 15000
   }
   ```

**Validaciones:**
- [ ] Status Code: `201 Created`
- [ ] Response: `{ "success": true, "data": { "id": "...", "status": "PENDING", "price": 15000 } }`
- [ ] Campo `status` = `"PENDING"`
- [ ] Campo `price` = `15000`
- [ ] Campo `createdAt` existe
- [ ] Campo `startedAt` = `null`
- [ ] Campo `endedAt` = `null`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta JSON y timestamp)

---

### ESCENARIO B — DOCTOR Ve Consultas PENDING ✅ PLANIFICADO

**Objetivo:** Validar que un DOCTOR puede ver sus consultas pendientes.

**Pasos:**
1. Login como DOCTOR (`doctor.test@canalmedico.com` / `DoctorTest123!`)
2. Listar consultas: `GET /api/doctor/consultations?status=PENDING`

**Validaciones:**
- [ ] Status Code: `200 OK`
- [ ] Response contiene la consulta creada en Escenario A
- [ ] Filtro por `status=PENDING` funciona
- [ ] Paginación funciona (si hay múltiples consultas)

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta JSON con lista de consultas)

---

### ESCENARIO C — DOCTOR Acepta Consulta ✅ PLANIFICADO

**Objetivo:** Validar que un DOCTOR puede aceptar una consulta PENDING y que cambia a ACTIVE.

**Pasos:**
1. Usar `consultationId` de Escenario A
2. Aceptar consulta: `PATCH /api/consultations/{id}/accept`

**Validaciones:**
- [ ] Status Code: `200 OK`
- [ ] Response: `{ "success": true, "data": { "status": "ACTIVE", "startedAt": "2024-..." } }`
- [ ] Campo `status` = `"ACTIVE"` (antes era `"PENDING"`)
- [ ] Campo `startedAt` existe y es timestamp válido
- [ ] Campo `endedAt` = `null`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta JSON antes y después)

---

### ESCENARIO D — DOCTOR Completa Consulta ✅ PLANIFICADO

**Objetivo:** Validar que un DOCTOR puede completar una consulta ACTIVE y que cambia a COMPLETED.

**Pasos:**
1. Usar `consultationId` de Escenario A (debe estar en estado ACTIVE)
2. Completar consulta: `PATCH /api/consultations/{id}/complete`

**Validaciones:**
- [ ] Status Code: `200 OK`
- [ ] Response: `{ "success": true, "data": { "status": "COMPLETED", "endedAt": "2024-..." } }`
- [ ] Campo `status` = `"COMPLETED"` (antes era `"ACTIVE"`)
- [ ] Campo `endedAt` existe y es timestamp válido
- [ ] Campo `startedAt` sigue existiendo (no se borró)

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta JSON antes y después)

---

### ESCENARIO E — ADMIN Verifica Global ✅ PLANIFICADO

**Objetivo:** Validar que un ADMIN puede ver todas las consultas globalmente y filtrarlas por status.

**Pasos:**
1. Login como ADMIN (`admin@canalmedico.com` / `Admin123!`)
2. Listar todas las consultas: `GET /api/admin/consultations?status=COMPLETED`

**Validaciones:**
- [ ] Status Code: `200 OK`
- [ ] Response contiene la consulta completada de Escenario D
- [ ] Filtro por `status=COMPLETED` funciona
- [ ] Paginación funciona
- [ ] Campos `price`, `startedAt`, `endedAt` están presentes

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta JSON con lista de consultas)

---

## 📊 RESULTADOS POR ESCENARIO

| Escenario | Estado | Status Code | Observaciones |
|-----------|--------|-------------|---------------|
| A - PACIENTE crea consulta | ⏳ | - | Pendiente de ejecución |
| B - DOCTOR ve consultas | ⏳ | - | Pendiente de ejecución |
| C - DOCTOR acepta consulta | ⏳ | - | Pendiente de ejecución |
| D - DOCTOR completa consulta | ⏳ | - | Pendiente de ejecución |
| E - ADMIN verifica global | ⏳ | - | Pendiente de ejecución |

---

## 🔍 VALIDACIONES ADICIONALES

### Campos de Migración Verificados

- [ ] `price` existe en respuesta
- [ ] `startedAt` se setea al aceptar (PENDING → ACTIVE)
- [ ] `endedAt` se setea al completar (ACTIVE → COMPLETED)
- [ ] Valores por defecto correctos (`price=0` si no se especifica, `startedAt=null`, `endedAt=null`)

### Validaciones de Estado

- [ ] Transición correcta: `PENDING` → `ACTIVE` → `COMPLETED`
- [ ] No se puede aceptar consulta que no está `PENDING`
- [ ] No se puede completar consulta que no está `ACTIVE`
- [ ] `startedAt` solo se setea al aceptar
- [ ] `endedAt` solo se setea al completar

---

## 🚨 ERRORES DETECTADOS

### Errores Críticos (P0)

Ninguno detectado hasta ahora.

### Errores de Alto Impacto (P1)

Ninguno detectado hasta ahora.

### Errores Menores (P2)

Ninguno detectado hasta ahora.

---

## 📝 OBSERVACIONES

### Pre-requisitos

1. **Usuarios de Prueba:** Deben crearse antes de ejecutar las pruebas
   - Usar endpoint: `POST /api/seed/test-data` (requiere `ENABLE_TEST_DATA=true`)
   - O usar credenciales existentes (ver `docs/CREDENCIALES_TEST_FASE_2_2.md`)

2. **Migración Aplicada:** Verificar que la migración FASE 2.1 fue aplicada correctamente
   - Campos `price`, `startedAt`, `endedAt` deben existir en tabla `consultations`
   - Verificar logs de Railway: `✅ Schema sincronizado correctamente con db push`

3. **Backend Operativo:** Verificar que el backend está funcionando
   - Endpoint `/health` debe responder `200 OK`
   - Endpoint `/api/auth/login` debe funcionar

---

## 🔄 PRÓXIMOS PASOS

1. **Ejecutar Pruebas:**
   - Opción A: Ejecutar script `scripts/test-e2e-fase2.sh`
   - Opción B: Ejecutar pruebas manualmente usando Postman/curl
   - Opción C: Ejecutar pruebas desde frontend web

2. **Documentar Evidencia:**
   - Capturar respuestas JSON de cada endpoint
   - Capturar timestamps de ejecución
   - Capturar screenshots (si se usa UI)

3. **Ejecutar Tests Negativos:**
   - Ver `docs/FASE_2_2_TESTS_NEGATIVOS.md`

4. **Generar Veredicto:**
   - Crear `docs/FASE_2_2_GO_NO_GO.md`

---

**Última actualización:** 2024-11-23  
**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Próxima acción:** Ejecutar pruebas E2E en Railway

