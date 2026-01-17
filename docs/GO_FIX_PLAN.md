# Plan de Corrección GO-LIVE - CanalMedico

**Fecha:** 2025-01-26  
**Rama:** `fix/auditoria-go`  
**Objetivo:** Convertir CanalMedico de NO-GO a GO, corrigiendo todos los bloqueos críticos (P0) y pre-GO (P1)

---

## ? FASE 1: DIAGNÓSTICO OPERATIVO

### Archivos Clave Identificados

#### Entrypoint Backend
- **Archivo:** `backend/src/server.ts`
- **Función:** Punto de entrada principal del servidor Express
- **Puerto:** `process.env.PORT` (Railway asigna dinámicamente)

#### Middleware Auth
- **Archivo:** `backend/src/middlewares/auth.middleware.ts`
- **Función:** Autenticación JWT y verificación de blacklist
- **Problema P0-001:** Usa `prisma.tokenBlacklist` pero el modelo no existe

#### Config ENV
- **Archivo:** `backend/src/config/env.ts`
- **Función:** Validación de variables de entorno
- **Problema P0-002:** Algunas variables críticas son opcionales en producción

#### Feature Flags
- **Archivo:** `backend/src/config/featureFlags.ts`
- **Función:** Control de funcionalidades opcionales
- **Problema P0-005:** WhatsApp deshabilitado por defecto

#### Prisma Schema
- **Archivo:** `backend/prisma/schema.prisma`
- **Problema P0-001:** Falta modelo `TokenBlacklist`

#### Ownership Middleware
- **Archivo:** `backend/src/middlewares/ownership.middleware.ts`
- **Función:** Prevención IDOR (Insecure Direct Object Reference)
- **Uso:** Aplicado en consultas, mensajes, pagos, recetas

#### CORS Config
- **Archivo:** `backend/src/server.ts` (líneas 314-329)
- **Problema P1-001:** URLs de desarrollo hardcodeadas incluidas en producción

---

## ?? CHECKLIST P0/P1

### P0 - CRÍTICOS (Bloquean GO)

- [ ] **P0-001:** Token Blacklist funcional (logout invalida JWT)
  - [ ] Crear modelo `TokenBlacklist` en Prisma schema
  - [ ] Migración `add_token_blacklist`
  - [ ] Verificar middleware `auth.middleware.ts` usa blacklist
  - [ ] Verificar `auth.service.ts` logout almacena token
  - [ ] Tests: login ? logout ? mismo token ? 401

- [ ] **P0-002:** Validación estricta de ENV en producción
  - [ ] Validar variables críticas en `env.ts` si `NODE_ENV=production`
  - [ ] Variables requeridas: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `CORS_ALLOWED_ORIGINS`
  - [ ] Test: Si `NODE_ENV=production` y falta 1 var ? falla

- [ ] **P0-003:** RBAC + Ownership 100% verificado (anti-IDOR)
  - [ ] Crear `docs/RBAC_VERIFIED.md` con tabla de endpoints
  - [ ] Verificar todos los endpoints tienen protección adecuada
  - [ ] Aplicar `auth.middleware.ts`, `requireRole`, `ownership.middleware.ts` donde falte
  - [ ] Tests: Paciente no accede consulta ajena ? 403, Doctor no accede consulta ajena ? 403, sin token ? 401

- [ ] **P0-004:** Tests críticos mínimos (subir confianza)
  - [ ] Test: Login
  - [ ] Test: Crear consulta
  - [ ] Test: Enviar mensaje en consulta
  - [ ] Test: Crear sesión MercadoPago (mock/sandbox)
  - [ ] Test: Webhook MercadoPago válido/inválido
  - [ ] Test: IDOR (paciente/doctor consulta ajena)

- [ ] **P0-005:** WhatsApp feature flag funcional con ENV
  - [ ] Verificar `ENABLE_WHATSAPP_AUTO_RESPONSE=true` habilita endpoints
  - [ ] Si deshabilitado, endpoints responden 404 o 503
  - [ ] Smoke test: flag on ? endpoint OK, flag off ? 404/disabled
  - [ ] Documentación: variables de WhatsApp necesarias

### P1 - IMPORTANTES (Pre-GO)

- [ ] **P1-001:** CORS seguro por ambiente (no localhost en prod)
  - [ ] Implementar `CORS_ALLOWED_ORIGINS` comma-separated en `env.ts`
  - [ ] Parsear en `server.ts` y usar en CORS config
  - [ ] En producción: bloquear localhost / 127.0.0.1
  - [ ] Eliminar hardcode dev URLs del config prod

---

## ??? MAPA DE ENDPOINTS PARA RBAC

### Endpoints Públicos (sin auth)
- `POST /api/auth/register` - Registro usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /health` - Health check
- `GET /healthz` - Health check (Railway)
- `GET /api-docs` - Documentación Swagger

### Endpoints Autenticados (requieren auth)
- `POST /api/auth/logout` - Logout (requiere token)
- `GET /api/users/me` - Perfil usuario autenticado
- `PUT /api/users/me` - Actualizar perfil

### Endpoints por Rol

#### DOCTOR
- `GET /api/doctor/profile` - Perfil médico autenticado
- `PUT /api/doctor/profile` - Actualizar perfil médico
- `GET /api/consultations` - Listar consultas del doctor
- `PUT /api/consultations/:id/activate` - Activar consulta
- `PUT /api/consultations/:id/complete` - Completar consulta
- `GET /api/payouts` - Listar liquidaciones del doctor

#### PATIENT
- `GET /api/consultations` - Listar consultas del paciente
- `POST /api/consultations` - Crear consulta
- `GET /api/payments/consultation/:consultationId` - Estado de pago

#### DOCTOR o PATIENT (ownership required)
- `GET /api/consultations/:id` - Detalle consulta (ownership)
- `GET /api/messages/consultation/:consultationId` - Mensajes consulta (ownership)
- `POST /api/messages` - Enviar mensaje (ownership)

#### ADMIN
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/doctors` - Listar médicos
- `GET /api/admin/signup-requests` - Solicitudes registro

---

## ?? RUTAS EXACTAS DE ARCHIVOS

### Backend Core
- Entrypoint: `backend/src/server.ts`
- Auth middleware: `backend/src/middlewares/auth.middleware.ts`
- Ownership middleware: `backend/src/middlewares/ownership.middleware.ts`
- ENV config: `backend/src/config/env.ts`
- Feature flags: `backend/src/config/featureFlags.ts`
- Prisma schema: `backend/prisma/schema.prisma`

### Auth Module
- Routes: `backend/src/modules/auth/auth.routes.ts`
- Controller: `backend/src/modules/auth/auth.controller.ts`
- Service: `backend/src/modules/auth/auth.service.ts`

### Tests
- Location: `backend/tests/integration/`
- Auth tests: `backend/tests/integration/auth.test.ts`
- Consultations tests: `backend/tests/integration/consultations.test.ts`
- Messages tests: `backend/tests/integration/messages.test.ts`
- Payments tests: `backend/tests/integration/payments.test.ts`

---

## ?? ORDEN DE IMPLEMENTACIÓN

1. **P0-001:** Token Blacklist (modelo + migración + tests)
2. **P0-002:** ENV validation estricta (validación + tests)
3. **P0-003:** RBAC verification (documento + fixes + tests)
4. **P0-004:** Tests críticos mínimos (6 tests nuevos)
5. **P0-005:** WhatsApp feature flag (verificación + smoke tests)
6. **P1-001:** CORS seguro por ambiente
7. **Validación final:** Build + tests + GO_LIVE_CHECKLIST.md

---

## ? CRITERIOS DE ÉXITO

Al terminar:
- ? Todo compila (`npm run build`)
- ? Tests pasan (`npm test`)
- ? Los 5 bloqueos P0 quedan cerrados con evidencia
- ? CORS prod seguro
- ? WhatsApp feature flag funcional con ENV
- ? Documentación GO-LIVE y RBAC verificada

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26
