# 🎯 GO LIVE MASTER PLAN - CanalMedico

**Equipo Premium Go-Live**  
**Fecha:** 2025-01-XX  
**Baseline:** `9c69035b60208e5bad8850640f4c9786921e9d97`  
**Estado:** 🟡 **EN PROGRESO**

---

## 📋 OBJETIVO

Llevar el sistema "CanalMedico" a estado GO (producción) bajo estándares enterprise/healthcare. El NORTE ABSOLUTO es cumplir el requerimiento clínico documentado (`docs/REQUIREMENTS_CLINICAL_NORTH.md`), con seguridad OWASP, calidad, auditoría y operación segura.

---

## 🗺️ MAPA: CLINICAL NORTH → ENDPOINTS → DATOS → SEGURIDAD → QA

### Requerimiento Clínico Principal
> **"A distintas horas del día me llegan mensajes por WhatsApp con consultas médicas. No puedo cobrar por esa atención, me interrumpen constantemente y no tengo un flujo ordenado."**

### Flujos Críticos Mapeados

#### Flujo 1: Intercepción WhatsApp
- **Endpoint:** `POST /api/whatsapp/webhook` (público, validado por Meta signature)
- **Datos:** ConsultationAttempt, Patient (phoneNumber)
- **Seguridad:** Webhook signature validation, rate limiting
- **QA:** Test webhook reception + auto-response

#### Flujo 2: Login Invisible
- **Endpoints:** 
  - `POST /api/auth/send-otp` (público, rate limited)
  - `POST /api/auth/verify-otp` (público, rate limited)
- **Datos:** User, Patient, Consultation (auto-created)
- **Seguridad:** Rate limiting estricto, OTP expiration
- **QA:** Test OTP flow + auto-account creation

#### Flujo 3: Consulta y Pago
- **Endpoints:**
  - `POST /api/consultations` (PATIENT, authenticated)
  - `POST /api/payments/session` (PATIENT, authenticated, ownership)
  - `POST /api/payments/webhook` (público, signature validation)
- **Datos:** Consultation, Payment, Patient, Doctor
- **Seguridad:** Ownership validation, payment webhook signature
- **QA:** Test payment flow + consultation activation

#### Flujo 4: Chat Asíncrono
- **Endpoints:**
  - `POST /api/messages` (authenticated, ownership)
  - `GET /api/messages/consultation/:id` (authenticated, ownership)
  - `GET /api/consultations/:id` (authenticated, ownership)
- **Datos:** Message, Consultation (con ownership)
- **Seguridad:** Ownership middleware en todos los endpoints
- **QA:** Test message flow + ownership enforcement

#### Flujo 5: Recetas SNRE
- **Endpoints:**
  - `POST /api/prescriptions` (DOCTOR, authenticated, ownership)
  - `GET /api/prescriptions/:id` (authenticated, ownership)
- **Datos:** Prescription, Consultation (con ownership)
- **Seguridad:** Doctor role + consultation ownership
- **QA:** Test SNRE creation + FHIR bundle validation

---

## 🚪 GO LIVE GATES (P0/P1)

### P0 (BLOQUEA GO LIVE) - Estado

| ID | Descripción | Estado | Evidencia |
|---|---|---|---|
| SEC-P0-001 | Vulnerabilidades npm audit | ✅ CERRADO | `npm audit` = 0 |
| SEC-P0-002 | JWT Sin Blacklist | ✅ CERRADO | TokenBlacklist implementado |
| SEC-P0-003 | CORS con Dominios Dev | ✅ CERRADO | CORS filtrado por NODE_ENV |
| SEC-P0-004 | Logs Sin Sanitización | ✅ CERRADO | sanitizeForLogging() implementado |
| SEC-P0-005 | Stack Traces Expuestos | ✅ CERRADO | Stack solo en dev |
| **SEC-P0-006** | **Auditoría RBAC Completa** | **⏳ PENDIENTE** | **En progreso** |

**P0 Progreso:** 5/6 (83%)

### P1 (PRE GO LIVE) - Estado

| ID | Descripción | Estado | Evidencia |
|---|---|---|---|
| SEC-P1-001 | Helmet Configuración Completa | ⏳ PENDIENTE | - |
| SEC-P1-002 | Rate Limiting Endpoints Sensibles | ⏳ PENDIENTE | - |
| SEC-P1-003 | Validación Inputs Robusta | ⏳ PENDIENTE | - |
| SEC-P1-004 | Auditoría de Logs | ⏳ PENDIENTE | - |

**P1 Progreso:** 0/4 (0%)

---

## 📊 CHECKLIST RESUMIDA

### FASE 0: Setup y Baseline ✅
- [x] Baseline congelado identificado
- [x] Documentación leída y comprendida
- [x] Plan maestro creado

### FASE 1: Cerrar Bloqueo P0 ⏳
- [ ] Auditoría RBAC completa (SEC-P0-006)
- [ ] Matriz RBAC documentada
- [ ] Fixes aplicados donde falte
- [ ] Tests de RBAC implementados
- [ ] Evidencias documentadas

### FASE 2: Seguridad Premium ⏳
- [ ] Helmet headers verificados
- [ ] Rate limiting por endpoint
- [ ] Validación inputs robusta
- [ ] Auditoría de logs completa

### FASE 3: Base de Datos ⏳
- [ ] Soft delete implementado
- [ ] Índices optimizados
- [ ] Integridad referencial
- [ ] Migraciones seguras

### FASE 4: Calidad y Testing ⏳
- [ ] Lint + Typecheck + Build gates
- [ ] Tests mínimos GO-LIVE
- [ ] Smoke tests críticos
- [ ] RBAC denial tests

### FASE 5: Observabilidad ⏳
- [ ] Correlation IDs
- [ ] Healthchecks (/health, /ready)
- [ ] Alertas básicas documentadas

### FASE 6: CI/CD ⏳
- [ ] GitHub workflows
- [ ] Railway deployment checks
- [ ] Pipeline obligatorio

### FASE 7: GO LIVE Final ⏳
- [ ] GO_LIVE_DECISION.md
- [ ] RUNBOOK_PRODUCTION.md actualizado
- [ ] GO_LIVE_CHECKLIST_FINAL.md
- [ ] EXEC_SUMMARY_GO_LIVE.md

---

## 🎯 CRITERIOS DE ÉXITO

### Seguridad
- ✅ 0 vulnerabilidades críticas (OWASP Top 10)
- ✅ RBAC verificado en 100% de endpoints
- ✅ Logs sin datos sensibles
- ✅ Ownership enforcement en datos clínicos

### Calidad
- ✅ Tests mínimos críticos pasando
- ✅ Lint/Typecheck sin errores
- ✅ Build exitoso

### Observabilidad
- ✅ Healthchecks funcionando
- ✅ Logs estructurados
- ✅ Correlation IDs

### Operación
- ✅ Railway deploy exitoso
- ✅ Migraciones aplicadas
- ✅ Runbook completo

---

## 📝 PRÓXIMOS PASOS INMEDIATOS

1. **FASE 1 - SEC-P0-006:** Completar auditoría RBAC
   - Revisar todos los `routes.ts`
   - Crear matriz RBAC completa
   - Aplicar fixes donde falte
   - Implementar tests de RBAC
   - Documentar evidencias

2. **FASE 2:** Seguridad Premium
   - Verificar Helmet
   - Reforzar rate limiting
   - Validación inputs
   - Auditoría logs

3. **FASE 3-7:** Continuar con fases restantes

---

## 📚 DOCUMENTOS DE REFERENCIA

- `docs/REQUIREMENTS_CLINICAL_NORTH.md` - **NORTE ABSOLUTO**
- `docs/SECURITY_REMEDIATION_PLAN.md` - Plan de remediación
- `docs/PRODUCTION_READINESS_REPORT.md` - Estado de preparación
- `docs/QA_CLINICAL_NORTH_TESTPLAN.md` - Plan de pruebas
- `docs/GO_LIVE_CHECKLIST.md` - Checklist general
- `docs/RUNBOOK_PRODUCTION.md` - Runbook operacional

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo Premium Go-Live

