# 🔒 RBAC MATRIX - CanalMedico

**Auditoría Completa de Control de Acceso**  
**Fecha:** 2025-01-XX  
**Estado:** ⏳ EN PROGRESO

---

## 📋 METODOLOGÍA

Para cada endpoint se verifica:
1. **Authenticate:** ¿Requiere autenticación?
2. **RequireRole:** ¿Requiere rol específico?
3. **Ownership:** ¿Valida propiedad del recurso?
4. **Rate Limiting:** ¿Tiene rate limiting?
5. **Validación:** ¿Tiene validación de inputs?

---

## 🔐 MATRIZ COMPLETA POR MÓDULO

### 1. AUTH (`/api/auth`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/register` | ❌ | - | - | ✅ | ✅ OK |
| POST | `/login` | ❌ | - | - | ✅ | ✅ OK |
| POST | `/refresh` | ❌ | - | - | ❌ | ⚠️ Falta rate limit |
| POST | `/logout` | ✅ | - | - | ❌ | ✅ OK |
| POST | `/send-otp` | ❌ | - | - | ✅ | ✅ OK |
| POST | `/verify-otp` | ❌ | - | - | ✅ | ✅ OK |

**Issues:**
- ⚠️ `/refresh` debería tener rate limiting

---

### 2. CONSULTATIONS (`/api/consultations`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/` | ✅ | PATIENT | - | ❌ | ✅ OK |
| GET | `/:id` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/doctor/:doctorId` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/patient/:patientId` | ✅ | PATIENT | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| PATCH | `/:id/accept` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| PATCH | `/:id/complete` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| PATCH | `/:id/activate` | ✅ | - | ✅ | ❌ | ✅ OK |
| PATCH | `/:id/close` | ✅ | DOCTOR | ✅ | ❌ | ✅ OK |

**Issues:**
- ⚠️ **CRÍTICO:** `/doctor/:doctorId` - Falta validar que el doctorId corresponde al doctor autenticado
- ⚠️ **CRÍTICO:** `/patient/:patientId` - Falta validar que el patientId corresponde al paciente autenticado
- ⚠️ **CRÍTICO:** `/:id/accept` - Falta validar ownership de la consulta
- ⚠️ **CRÍTICO:** `/:id/complete` - Falta validar ownership de la consulta

---

### 3. MESSAGES (`/api/messages`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/` | ✅ | - | ✅✅ | ❌ | ✅ OK |
| GET | `/consultation/:consultationId` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/:id` | ✅ | - | ✅ | ❌ | ✅ OK |

**Nota:** POST tiene doble ownership (consultation + sender)

**Issues:**
- ✅ Todos los endpoints tienen ownership correcto

---

### 4. PAYMENTS (`/api/payments`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/session` | ✅ | - | ✅ | ✅ | ✅ OK |
| POST | `/webhook` | ❌ | - | - | ❌ | ✅ OK (webhook signature) |
| GET | `/consultation/:consultationId` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/doctor/:doctorId` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |

**Issues:**
- ⚠️ **CRÍTICO:** `/doctor/:doctorId` - Falta validar que el doctorId corresponde al doctor autenticado

---

### 5. PATIENTS (`/api/patients`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/:id` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/user/:userId` | ✅ | - | ✅ | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints tienen ownership correcto

---

### 6. DOCTORS (`/api/doctors`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/` | ❌ | - | - | ❌ | ✅ OK (público) |
| GET | `/online` | ❌ | - | - | ❌ | ✅ OK (público) |
| GET | `/:id` | ❌ | - | - | ❌ | ✅ OK (público) |
| PUT | `/:id/online-status` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/:id/statistics` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| PATCH | `/:id/payout-settings` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/:id/availability` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| PATCH | `/:id/availability-settings` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |

**Issues:**
- ⚠️ **CRÍTICO:** Todos los endpoints con `/:id` que requieren DOCTOR deberían validar que el `id` corresponde al doctor autenticado

---

### 7. ADMIN (`/api/admin`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| * | `/*` | ✅ | ADMIN | - | ❌ | ✅ OK |

**Nota:** Todos los endpoints de admin tienen `router.use(authenticate)` y `router.use(requireRole('ADMIN'))`

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 8. SNRE/PRESCRIPTIONS (`/api/prescriptions`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/:id` | ✅ | - | ✅ | ❌ | ✅ OK |
| GET | `/consultation/:consultationId/prescriptions` | ✅ | - | ✅ | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints tienen ownership correcto

---

### 9. FILES (`/api/files`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/upload` | ✅ | - | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/signed-url/:key` | ✅ | - | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| DELETE | `/:key` | ✅ | - | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |

**Issues:**
- ⚠️ **CRÍTICO:** Falta validar que el usuario solo puede subir/ver/eliminar sus propios archivos

---

### 10. PAYOUTS (`/api/payouts`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/my-payouts` | ✅ | DOCTOR | ✅ | ❌ | ✅ OK (filtrado por usuario) |
| GET | `/my-stats` | ✅ | DOCTOR | ✅ | ❌ | ✅ OK (filtrado por usuario) |
| GET | `/:batchId` | ✅ | - | ✅ | ❌ | ✅ OK |
| POST | `/process` | ✅ | ADMIN | - | ❌ | ✅ OK |
| POST | `/create/:doctorId` | ✅ | ADMIN | - | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 11. WHATSAPP (`/api/whatsapp`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| ALL | `/webhook` | ❌ | - | - | ❌ | ✅ OK (webhook signature) |
| GET | `/attempts/pending` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/stats` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| POST | `/attempts/:id/resend-link` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |

**Issues:**
- ⚠️ **CRÍTICO:** Falta validar que el doctor solo ve sus propios intentos de WhatsApp

---

### 12. NOTIFICATIONS (`/api/notifications`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/token` | ✅ | - | - | ❌ | ✅ OK |
| POST | `/send` | ✅ | ADMIN, DOCTOR | - | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 13. COMMISSIONS (`/api/commissions`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/stats` | ✅ | ADMIN | - | ❌ | ✅ OK |
| GET | `/period` | ✅ | ADMIN | - | ❌ | ✅ OK |
| GET | `/by-doctor` | ✅ | ADMIN | - | ❌ | ✅ OK |
| GET | `/doctor/:doctorId` | ✅ | ADMIN | - | ❌ | ✅ OK |
| GET | `/monthly` | ✅ | ADMIN | - | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 14. SIGNUP-REQUESTS (`/api/signup-requests`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/` | ❌ | - | - | ❌ | ✅ OK (público) |
| GET | `/` | ✅ | ADMIN | - | ❌ | ✅ OK |
| GET | `/:id` | ✅ | ADMIN | - | ❌ | ✅ OK |
| PATCH | `/:id/status` | ✅ | ADMIN | - | ❌ | ✅ OK |
| POST | `/:id/re-verify` | ✅ | ADMIN | - | ❌ | ✅ OK |

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 15. DOCTOR-VERIFICATION (`/api/medicos`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| POST | `/validar-identidad` | ❌ | - | - | ❌ | ✅ OK (público) |
| POST | `/validar-rnpi` | ❌ | - | - | ❌ | ✅ OK (público) |
| POST | `/validacion-completa` | ✅ | DOCTOR | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| GET | `/:id/estado-validacion` | ✅ | - | ❌ | ❌ | ⚠️ **FALTA OWNERSHIP** |
| POST | `/revalidar-medico/:id` | ✅ | ADMIN | - | ❌ | ✅ OK |

**Issues:**
- ⚠️ **CRÍTICO:** `/validacion-completa` - Falta validar que el doctor solo puede validarse a sí mismo
- ⚠️ **CRÍTICO:** `/:id/estado-validacion` - Falta validar ownership (doctor solo puede ver su estado, admin puede ver todos)

---

### 16. USERS (`/api/users`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/profile` | ✅ | - | ✅ | ❌ | ✅ OK (solo su perfil) |
| PUT | `/profile` | ✅ | - | ✅ | ❌ | ✅ OK (solo su perfil) |

**Issues:**
- ✅ Todos los endpoints correctamente protegidos

---

### 17. DEPLOY (`/api/deploy`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/info` | ❌ | - | - | ❌ | ✅ OK (info no sensible) |

**Issues:**
- ✅ Endpoint público correcto (info de deploy no sensible)

---

### 18. SEED (`/api/seed`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/health` | ❌ | - | - | ❌ | ✅ OK |
| POST | `/test-data` | ❌ | - | - | ❌ | ⚠️ **PROTEGER EN PROD** |
| POST | `/` | ❌ | - | - | ❌ | ⚠️ **PROTEGER EN PROD** |
| POST | `/migrate` | ❌ | - | - | ❌ | ⚠️ **PROTEGER EN PROD** |
| POST | `/migrate-validation` | ❌ | - | - | ❌ | ⚠️ **PROTEGER EN PROD** |
| GET | `/verify-validation` | ❌ | - | - | ❌ | ✅ OK |

**Issues:**
- ⚠️ **CRÍTICO:** Endpoints de seed deberían estar protegidos en producción (solo admin o deshabilitados)

---

### 19. DOCTOR (`/api/doctor`)

| Método | Path | Auth | Role | Ownership | Rate Limit | Estado |
|--------|------|------|------|----------|------------|--------|
| GET | `/consultations` | ✅ | DOCTOR | ✅ | ❌ | ✅ OK (filtrado por usuario) |

**Issues:**
- ✅ Endpoint correctamente protegido

---

## 🚨 RESUMEN DE ISSUES CRÍTICOS

### P0 (BLOQUEA GO LIVE)

1. **CONSULTATIONS:**
   - `GET /doctor/:doctorId` - Falta ownership
   - `GET /patient/:patientId` - Falta ownership
   - `PATCH /:id/accept` - Falta ownership
   - `PATCH /:id/complete` - Falta ownership

2. **PAYMENTS:**
   - `GET /doctor/:doctorId` - Falta ownership

3. **DOCTORS:**
   - `PUT /:id/online-status` - Falta ownership
   - `GET /:id/statistics` - Falta ownership
   - `PATCH /:id/payout-settings` - Falta ownership
   - `GET /:id/availability` - Falta ownership
   - `PATCH /:id/availability-settings` - Falta ownership

4. **FILES:**
   - `POST /upload` - Falta ownership
   - `GET /signed-url/:key` - Falta ownership
   - `DELETE /:key` - Falta ownership

5. **WHATSAPP:**
   - `GET /attempts/pending` - Falta ownership
   - `GET /stats` - Falta ownership
   - `POST /attempts/:id/resend-link` - Falta ownership

6. **DOCTOR-VERIFICATION:**
   - `POST /validacion-completa` - Falta ownership
   - `GET /:id/estado-validacion` - Falta ownership

7. **SEED:**
   - Endpoints de seed deberían estar protegidos en producción

---

## ✅ ACCIONES REQUERIDAS

1. Implementar ownership middleware donde falte
2. Proteger endpoints de seed en producción
3. Agregar rate limiting a `/refresh`
4. Documentar todos los fixes
5. Crear tests de RBAC denial

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo Premium Go-Live

