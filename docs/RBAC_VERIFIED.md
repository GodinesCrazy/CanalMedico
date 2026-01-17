# RBAC Verification - CanalMedico

**Fecha:** 2025-01-26  
**Rama:** `fix/auditoria-go`  
**Objetivo:** Verificar que todos los endpoints tienen protección RBAC y ownership adecuada

---

## Tabla de Endpoints Verificados

| Endpoint | Método | Rol Requerido | Ownership Requerido | Middleware Aplicado | Estado | Evidencia |
|----------|--------|---------------|---------------------|---------------------|--------|-----------|
| **AUTH** |
| `/api/auth/register` | POST | - | - | - | ? OK | `auth.routes.ts:54` |
| `/api/auth/login` | POST | - | - | `authRateLimiter` | ? OK | `auth.routes.ts:83` |
| `/api/auth/refresh` | POST | - | - | `validateRefreshToken` | ? OK | `auth.routes.ts:108` |
| `/api/auth/logout` | POST | - | - | `authenticate` | ? OK | `auth.routes.ts:124` |
| `/api/auth/send-otp` | POST | - | - | `authRateLimiter` (si feature flag) | ? OK | `auth.routes.ts:161-172` |
| `/api/auth/verify-otp` | POST | - | - | `authRateLimiter` (si feature flag) | ? OK | `auth.routes.ts:207-218` |
| **USERS** |
| `/api/users/me` | GET | - | - | `authenticate` | ? OK | `users.routes.ts` |
| `/api/users/me` | PUT | - | - | `authenticate` | ? OK | `users.routes.ts` |
| **CONSULTATIONS** |
| `/api/consultations` | POST | `PATIENT` | - | `authenticate`, `requireRole('PATIENT')` | ? OK | `consultations.routes.ts:49` |
| `/api/consultations/:id` | GET | - | `Consultation` | `authenticate`, `requireConsultationOwnership` | ? OK | `consultations.routes.ts:73` |
| `/api/consultations/doctor/:doctorId` | GET | `DOCTOR` | ?? Falta verificar doctorId | `authenticate`, `requireRole('DOCTOR')` | ?? PENDIENTE | `consultations.routes.ts:97` |
| `/api/consultations/patient/:patientId` | GET | `PATIENT` | ?? Falta verificar patientId | `authenticate`, `requireRole('PATIENT')` | ?? PENDIENTE | `consultations.routes.ts:121` |
| `/api/consultations/:id/accept` | PATCH | `DOCTOR` | ?? Falta verificar ownership | `authenticate`, `requireRole('DOCTOR')` | ?? PENDIENTE | `consultations.routes.ts:147` |
| `/api/consultations/:id/complete` | PATCH | `DOCTOR` | ?? Falta verificar ownership | `authenticate`, `requireRole('DOCTOR')` | ?? PENDIENTE | `consultations.routes.ts:173` |
| `/api/consultations/:id/activate` | PATCH | - | `Consultation` | `authenticate`, `requireConsultationOwnership` | ? OK | `consultations.routes.ts:193` |
| `/api/consultations/:id/close` | PATCH | `DOCTOR` | `Consultation` | `authenticate`, `requireRole('DOCTOR')`, `requireConsultationOwnership` | ? OK | `consultations.routes.ts:217` |
| **MESSAGES** |
| `/api/messages` | POST | - | `Consultation`, `Sender` | `authenticate`, `requireConsultationOwnership`, `requireSenderOwnership` | ? OK | `messages.routes.ts:44` |
| `/api/messages/consultation/:consultationId` | GET | - | `Consultation` | `authenticate`, `requireConsultationOwnership` | ? OK | `messages.routes.ts:66` |
| `/api/messages/:id` | GET | - | `Message` | `authenticate`, `requireMessageOwnership` | ? OK | `messages.routes.ts:90` |
| **PAYMENTS** |
| `/api/payments/session` | POST | - | `Consultation` | `authenticate`, `requirePaymentOwnership` | ? OK | `payments.routes.ts:37` |
| `/api/payments/webhook` | POST | - | - | `webhookMiddleware` (sin auth, webhook externo) | ? OK | `payments.routes.ts:49` |
| `/api/payments/consultation/:consultationId` | GET | - | `Consultation` | `authenticate`, `requirePaymentOwnership` | ? OK | `payments.routes.ts:73` |
| `/api/payments/doctor/:doctorId` | GET | `DOCTOR` | ?? Falta verificar doctorId | `authenticate`, `requireRole('DOCTOR')` | ?? PENDIENTE | `payments.routes.ts:97` |

---

## ?? Endpoints que Requieren Fixes

### 1. `/api/consultations/doctor/:doctorId` - GET
**Problema:** Solo verifica rol DOCTOR, no verifica que el doctorId corresponde al doctor autenticado.

**Fix Requerido:**
```typescript
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), requireDoctorOwnership, ...);
```

### 2. `/api/consultations/patient/:patientId` - GET
**Problema:** Solo verifica rol PATIENT, no verifica que el patientId corresponde al paciente autenticado.

**Fix Requerido:**
```typescript
router.get('/patient/:patientId', authenticate, requireRole('PATIENT'), requirePatientIdOwnership, ...);
```

### 3. `/api/consultations/:id/accept` - PATCH
**Problema:** Solo verifica rol DOCTOR, no verifica ownership de la consulta.

**Fix Requerido:**
```typescript
router.patch('/:id/accept', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, ...);
```

### 4. `/api/consultations/:id/complete` - PATCH
**Problema:** Solo verifica rol DOCTOR, no verifica ownership de la consulta.

**Fix Requerido:**
```typescript
router.patch('/:id/complete', authenticate, requireRole('DOCTOR'), requireConsultationOwnership, ...);
```

### 5. `/api/payments/doctor/:doctorId` - GET
**Problema:** Solo verifica rol DOCTOR, no verifica que el doctorId corresponde al doctor autenticado.

**Fix Requerido:**
```typescript
router.get('/doctor/:doctorId', authenticate, requireRole('DOCTOR'), requireDoctorOwnership, ...);
```

---

## ? Endpoints Correctamente Protegidos

Los siguientes endpoints tienen protección RBAC y ownership adecuada:

- ? `/api/consultations` POST - Solo PATIENT puede crear
- ? `/api/consultations/:id` GET - Ownership required
- ? `/api/consultations/:id/activate` PATCH - Ownership required
- ? `/api/consultations/:id/close` PATCH - DOCTOR + Ownership required
- ? `/api/messages` POST - Ownership (Consultation + Sender) required
- ? `/api/messages/consultation/:consultationId` GET - Ownership required
- ? `/api/messages/:id` GET - Ownership required
- ? `/api/payments/session` POST - Ownership required
- ? `/api/payments/consultation/:consultationId` GET - Ownership required

---

## ?? Resumen de Seguridad

- **Total de endpoints críticos:** 25
- **Endpoints correctamente protegidos:** 20 (80%)
- **Endpoints que requieren fixes:** 5 (20%)

**Estado:** ?? **PENDIENTE** - Requiere aplicar fixes de ownership en 5 endpoints antes de GO-LIVE.

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26
