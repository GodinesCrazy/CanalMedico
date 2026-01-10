# FASE 2.2 - Tests Negativos (RBAC y Validaciones)

**Fecha:** 2024-11-23  
**Responsable:** QA Lead Senior + Product Owner + Auditor Técnico  
**Objetivo:** Validar que el sistema rechaza correctamente intentos ilegítimos (RBAC y validaciones)

---

## 📋 RESUMEN EJECUTIVO

### Estado General: ⏳ PENDIENTE DE EJECUCIÓN

Este documento registra las pruebas negativas para validar que el sistema:
- Rechaza correctamente intentos de acceso no autorizado (RBAC)
- Valida correctamente las transiciones de estado
- Protege los endpoints según el rol del usuario

**Pruebas Planificadas:** 5 Tests Negativos  
**Pruebas Ejecutadas:** 0/5 ⏳  

---

## 🚫 TESTS NEGATIVOS

### TEST NEGATIVO 1 — PACIENTE Intenta Aceptar Consulta

**Objetivo:** Validar que un PACIENTE no puede aceptar consultas (solo DOCTOR).

**Setup:**
- Login como PATIENT (`patient.test@canalmedico.com` / `PatientTest123!`)
- Obtener `consultationId` de una consulta PENDING

**Acción:**
```bash
PATCH /api/consultations/{consultationId}/accept
Authorization: Bearer {PATIENT_TOKEN}
```

**Resultado Esperado:**
- Status Code: `403 Forbidden`
- Response: `{ "success": false, "error": "Acceso denegado. Solo doctores pueden aceptar consultas." }`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta)

---

### TEST NEGATIVO 2 — DOCTOR Intenta Aceptar Consulta Ajena

**Objetivo:** Validar que un DOCTOR no puede aceptar consultas de otros doctores.

**Setup:**
- Login como DOCTOR A (`doctor.test@canalmedico.com`)
- Crear consulta con otro DOCTOR B (requiere otro doctor en BD)
- Intentar aceptar consulta de DOCTOR B usando token de DOCTOR A

**Acción:**
```bash
PATCH /api/consultations/{consultationIdOfOtherDoctor}/accept
Authorization: Bearer {DOCTOR_A_TOKEN}
```

**Resultado Esperado:**
- Status Code: `403 Forbidden`
- Response: `{ "success": false, "error": "No tienes permiso para aceptar esta consulta" }`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Nota:** Requiere crear consulta con otro doctor primero. Si solo hay un doctor, este test puede ser omitido o marcado como "NO APLICABLE".  
**Evidencia:** (capturar respuesta)

---

### TEST NEGATIVO 3 — DOCTOR Intenta Completar Consulta PENDING

**Objetivo:** Validar que un DOCTOR no puede completar una consulta que está PENDING (solo ACTIVE).

**Setup:**
- Login como DOCTOR
- Obtener `consultationId` de una consulta con `status=PENDING`

**Acción:**
```bash
PATCH /api/consultations/{consultationIdPENDING}/complete
Authorization: Bearer {DOCTOR_TOKEN}
```

**Resultado Esperado:**
- Status Code: `400 Bad Request` o `409 Conflict`
- Response: `{ "success": false, "error": "Solo se pueden completar consultas con estado ACTIVE" }`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta)

---

### TEST NEGATIVO 4 — ADMIN Intenta Aceptar Consulta

**Objetivo:** Validar que un ADMIN no puede aceptar consultas (solo DOCTOR puede aceptar).

**Setup:**
- Login como ADMIN (`admin@canalmedico.com` / `Admin123!`)
- Obtener `consultationId` de una consulta PENDING

**Acción:**
```bash
PATCH /api/consultations/{consultationId}/accept
Authorization: Bearer {ADMIN_TOKEN}
```

**Resultado Esperado:**
- Status Code: `403 Forbidden`
- Response: `{ "success": false, "error": "Acceso denegado. Solo doctores pueden aceptar consultas." }`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta)

---

### TEST NEGATIVO 5 — Chat No Disponible si Consulta No Está ACTIVE

**Objetivo:** Validar que no se pueden enviar mensajes en consultas que no están ACTIVE o COMPLETED.

**Setup:**
- Login como PATIENT
- Obtener `consultationId` de una consulta con `status=PENDING`

**Acción:**
```bash
POST /api/messages
Authorization: Bearer {PATIENT_TOKEN}
{
  "consultationId": "{consultationIdPENDING}",
  "text": "Mensaje de prueba"
}
```

**Resultado Esperado:**
- Status Code: `400 Bad Request`
- Response: `{ "success": false, "error": "La consulta no está activa o completada" }`

**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Evidencia:** (capturar respuesta)

**Nota:** Según el código en `messages.service.ts`, el mensaje solo puede enviarse si `status === ACTIVE || status === COMPLETED`. Consultas PENDING no deberían permitir mensajes.

---

## 📊 RESULTADOS POR TEST NEGATIVO

| Test | Estado | Status Code Esperado | Status Code Real | Observaciones |
|------|--------|----------------------|------------------|---------------|
| 1 - PACIENTE acepta consulta | ⏳ | 403 | - | Pendiente de ejecución |
| 2 - DOCTOR acepta consulta ajena | ⏳ | 403 | - | Pendiente de ejecución |
| 3 - DOCTOR completa PENDING | ⏳ | 400/409 | - | Pendiente de ejecución |
| 4 - ADMIN acepta consulta | ⏳ | 403 | - | Pendiente de ejecución |
| 5 - Chat en PENDING | ⏳ | 400 | - | Pendiente de ejecución |

---

## 🔍 VALIDACIONES ADICIONALES

### RBAC - Endpoints por Rol

**Endpoints SOLO para DOCTOR:**
- `PATCH /api/consultations/:id/accept` → Solo DOCTOR
- `PATCH /api/consultations/:id/complete` → Solo DOCTOR
- `GET /api/doctor/consultations` → Solo DOCTOR

**Endpoints SOLO para PATIENT:**
- `POST /api/consultations` → Solo PATIENT

**Endpoints SOLO para ADMIN:**
- `GET /api/admin/consultations` → Solo ADMIN
- `GET /api/admin/dashboard-metrics` → Solo ADMIN
- `GET /api/admin/doctors` → Solo ADMIN

**Validaciones:**
- [ ] DOCTOR no puede crear consultas (`POST /api/consultations` → 403)
- [ ] PATIENT no puede aceptar consultas (`PATCH /api/consultations/:id/accept` → 403)
- [ ] PATIENT no puede completar consultas (`PATCH /api/consultations/:id/complete` → 403)
- [ ] DOCTOR no puede ver consultas globales (`GET /api/admin/consultations` → 403)

---

### Validaciones de Estado

**Transiciones Válidas:**
- `PENDING` → `ACTIVE` (solo con `accept`)
- `ACTIVE` → `COMPLETED` (solo con `complete`)
- `ACTIVE` → `CANCELLED` (solo con `close`)
- `PENDING` → `CANCELLED` (solo con `close`)

**Transiciones Inválidas:**
- [ ] `PENDING` → `COMPLETED` (debe fallar → 400)
- [ ] `COMPLETED` → `ACTIVE` (no permitido)
- [ ] `COMPLETED` → `PENDING` (no permitido)

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

1. **Usuarios de Prueba:** Deben existir antes de ejecutar tests negativos
   - Ver `docs/CREDENCIALES_TEST_FASE_2_2.md`

2. **Consultas de Prueba:** Se necesitan consultas en diferentes estados:
   - Al menos una consulta `PENDING`
   - Al menos una consulta `ACTIVE` (crear y aceptar)
   - Al menos una consulta `COMPLETED` (crear, aceptar y completar)

3. **Backend Operativo:** Verificar que el backend está funcionando
   - Endpoint `/health` debe responder `200 OK`

---

## 🔄 PRÓXIMOS PASOS

1. **Ejecutar Tests Negativos:**
   - Ejecutar cada test manualmente o con script
   - Documentar resultados reales vs esperados

2. **Validar RBAC:**
   - Probar cada endpoint con cada rol
   - Asegurar que solo el rol correcto puede acceder

3. **Documentar Hallazgos:**
   - Registrar cualquier comportamiento inesperado
   - Clasificar por severidad (P0, P1, P2)

4. **Actualizar Veredicto:**
   - Incluir resultados de tests negativos en `docs/FASE_2_2_GO_NO_GO.md`

---

**Última actualización:** 2024-11-23  
**Estado:** ⏳ PENDIENTE DE EJECUCIÓN  
**Próxima acción:** Ejecutar tests negativos en Railway

