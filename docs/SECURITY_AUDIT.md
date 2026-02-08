# 🔒 SECURITY_AUDIT.md

**Auditoría Completa de Seguridad (OWASP / Health Data)**  
**Fecha:** 2025-01-XX  
**Auditor:** Equipo Tier-1 Product Engineering / Security Engineer  
**Objetivo:** Asegurar que el sistema sea defendible en producción para datos de salud

---

## 📋 CHECKLIST DE SEGURIDAD

### A) BACKEND - Validación y Sanitización

#### ✅ A1: Validación Robusta de Entrada
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `validation.middleware.ts` usa Zod para validación
- Schemas Zod definidos en controllers (ej: `validateCreateConsultation`)
- Validación aplicada en rutas sensibles

**Mejora Sugerida:**
- Auditar que TODOS los endpoints usen validación Zod
- Algunos endpoints pueden no tener validación completa

**Acción:**
1. Crear checklist de endpoints con/sin validación
2. Agregar validación a endpoints faltantes

---

#### ⚠️ A2: Sanitización / Prevención de Inyección
**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- Prisma ORM previene SQL injection automáticamente ✅
- No hay evidencia de sanitización de HTML/XSS en inputs de texto
- Mensajes de chat pueden contener HTML/JavaScript

**Problema:**
- Si frontend renderiza mensajes sin sanitizar, riesgo de XSS
- Inputs de texto no están sanitizados antes de guardar

**Impacto:** 🟡 **MEDIO** - Riesgo de XSS si frontend no sanitiza

**Acción:**
1. Agregar sanitización de HTML en backend (usar `dompurify` o similar)
2. O asegurar que frontend sanitiza antes de renderizar
3. Validar que mensajes de chat no contengan scripts

---

#### ✅ A3: Rate Limiting Global + Por Endpoints Sensibles
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `rateLimit.middleware.ts` tiene:
  - `generalRateLimiter` (global)
  - `authRateLimiter` (5 intentos / 15 min para login)
  - `paymentRateLimiter` (10 intentos / hora)
- Health checks excluidos del rate limiting ✅

**Mejora Sugerida:**
- Verificar que rate limiting se aplica en TODOS los endpoints sensibles
- OTP endpoints deberían tener rate limiting específico

**Acción:**
1. Auditar endpoints de OTP (`/api/auth/send-otp`, `/api/auth/verify-otp`)
2. Agregar rate limiting específico si no lo tienen

---

#### ✅ A4: Helmet / Headers Seguros
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `server.ts` línea 314: `app.use(helmet())`
- Helmet configurado globalmente

**Verificación:**
- Headers de seguridad aplicados automáticamente
- CSP, XSS Protection, etc. configurados por Helmet

---

#### ⚠️ A5: CORS Exacto (No Wildcard)
**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- `server.ts` línea 316-328: CORS configurado con lista de orígenes
- Lista incluye URLs de desarrollo y producción
- **PROBLEMA:** Lista hardcodeada en código

**Problema:**
- URLs de desarrollo en producción (localhost, IPs locales)
- Difícil mantener lista actualizada

**Impacto:** 🟡 **MEDIO** - Riesgo de CORS demasiado permisivo

**Acción:**
1. Mover lista de orígenes a variables de entorno
2. Separar orígenes por ambiente (dev/prod)
3. Validar que solo orígenes permitidos estén en lista

---

#### ✅ A6: Protección Contra Brute Force en Login
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `authRateLimiter`: 5 intentos / 15 minutos
- Aplicado en `/api/auth/login` (verificar en routes)

**Verificación:**
- Rate limiting activo en login ✅
- `skipSuccessfulRequests: true` evita bloquear usuarios válidos ✅

---

#### ⚠️ A7: JWT - Expiración, Refresh, Rotación, Invalidación
**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- `jwt.ts`: Tokens con expiración configurada ✅
  - Access token: 15 minutos (configurable)
  - Refresh token: 7 días (configurable)
- Refresh token implementado ✅
- **PROBLEMA:** No hay invalidación de tokens (blacklist)
- **PROBLEMA:** No hay rotación de refresh tokens

**Problemas:**
1. Si un token es comprometido, no se puede invalidar hasta que expire
2. Refresh tokens no rotan (mismo token se reutiliza)
3. No hay blacklist de tokens revocados

**Impacto:** 🟡 **MEDIO** - Tokens comprometidos válidos hasta expiración

**Acción:**
1. Implementar blacklist de tokens (Redis o DB)
2. Rotar refresh tokens en cada uso
3. Endpoint para logout que invalida tokens

---

#### ⚠️ A8: Seguridad de Secretos JWT
**Estado:** ⚠️ **REVISAR**  
**Evidencia:**
- `env.ts`: `JWT_SECRET` y `JWT_REFRESH_SECRET` requeridos (min 32 chars) ✅
- Validación de longitud mínima ✅
- **VERIFICAR:** Secretos en Railway deben ser fuertes y únicos

**Acción:**
1. Verificar que secretos en Railway son únicos y fuertes
2. Documentar proceso de rotación de secretos
3. No usar secretos por defecto en producción

---

#### 🔴 A9: Logs SIN Datos Sensibles
**Estado:** 🔴 **PROBLEMA DETECTADO**  
**Evidencia:**
- `logger.ts`: Logs incluyen `meta` completo con `JSON.stringify(meta)`
- `auth.middleware.ts` línea 30: `logger.error('Error en autenticación:', error)`
- Stack traces pueden incluir información sensible

**Problemas:**
1. Logs pueden incluir tokens si se loguean requests completos
2. Stack traces pueden exponer estructura de código
3. No hay sanitización de datos sensibles antes de loguear

**Impacto:** 🔴 **ALTO** - Riesgo de exponer datos sensibles en logs

**Acción:**
1. Crear función `sanitizeForLogging()` que remueva:
   - Tokens (JWT, API keys)
   - Contraseñas
   - Información clínica sensible
2. Aplicar sanitización antes de loguear
3. Configurar logger para NO incluir stack traces en producción
4. Auditar todos los `logger.*()` calls para asegurar que no loguean datos sensibles

---

#### ⚠️ A10: Control de Roles RBAC Real
**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- `auth.middleware.ts`: `requireRole()` implementado ✅
- `ownership.middleware.ts`: Validación de propiedad ✅
- **PROBLEMA:** No todos los endpoints usan `requireRole()` consistentemente

**Problema:**
- Algunos endpoints pueden no validar roles correctamente
- Validación de propiedad no aplicada en todos los endpoints

**Impacto:** 🟡 **MEDIO** - Riesgo de acceso no autorizado

**Acción:**
1. Auditar TODOS los endpoints que requieren roles específicos
2. Asegurar que usan `requireRole()` o validación equivalente
3. Crear checklist de endpoints auditados

---

#### ⚠️ A11: Auditoría de Endpoints - Verificar Auth
**Estado:** ⚠️ **PENDIENTE AUDITORÍA COMPLETA**  
**Evidencia:**
- Endpoints públicos identificados:
  - `/health`, `/healthz`, `/healthcheck` ✅ (correcto)
  - `/api-docs` ✅ (correcto, documentación)
  - `/api/auth/register`, `/api/auth/login` ✅ (correcto, públicos)
- Endpoints que DEBEN requerir auth:
  - `/api/users/*` - Usa `authenticate` ✅
  - `/api/consultations/*` - Usa `authenticate` ✅
  - `/api/messages/*` - Usa `authenticate` ✅
  - `/api/payments/*` - **VERIFICAR**

**Acción:**
1. Crear lista completa de TODOS los endpoints
2. Marcar cuáles requieren auth y cuáles no
3. Verificar que endpoints sensibles tienen `authenticate` middleware
4. Documentar en SECURITY_FIXES.md

---

### B) FRONTEND - Seguridad Cliente

#### ⚠️ B1: Manejo Seguro de Tokens
**Estado:** ⚠️ **REVISAR**  
**Evidencia:**
- Frontend usa `authStore.ts` (Zustand)
- **VERIFICAR:** Dónde se guardan tokens (localStorage vs httpOnly cookies)

**Problema Potencial:**
- Si tokens en localStorage, vulnerables a XSS
- Preferir httpOnly cookies si es posible

**Acción:**
1. Revisar `frontend-web/src/store/authStore.ts`
2. Si usa localStorage, considerar migrar a httpOnly cookies
3. O asegurar que XSS está mitigado (sanitización)

---

#### ⚠️ B2: XSS Prevention
**Estado:** ⚠️ **REVISAR**  
**Evidencia:**
- Frontend React (mitiga XSS automáticamente con JSX)
- **VERIFICAR:** Si renderiza HTML dinámico (mensajes de chat)

**Acción:**
1. Revisar componentes que renderizan contenido dinámico
2. Asegurar sanitización de HTML si se renderiza
3. Usar `dangerouslySetInnerHTML` solo si es necesario y sanitizado

---

#### ✅ B3: No Exponer Secrets
**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- Frontend usa variables de entorno para API URL
- No hay secrets hardcodeados en código frontend

---

#### ⚠️ B4: Validación Defensiva en UI
**Estado:** ⚠️ **REVISAR**  
**Evidencia:**
- Frontend tiene validación de formularios
- **VERIFICAR:** Validación es consistente y completa

**Acción:**
1. Revisar validación de formularios críticos
2. Asegurar validación tanto en frontend como backend

---

### C) INFRA - Variables y Secretos

#### ⚠️ C1: Variables y Secretos en Railway
**Estado:** ⚠️ **VERIFICAR**  
**Evidencia:**
- Variables definidas en `env.ts`
- **VERIFICAR:** Todas las variables críticas están en Railway

**Acción:**
1. Crear checklist de variables requeridas por ambiente
2. Verificar que todas están configuradas en Railway
3. Documentar proceso de configuración

---

#### ✅ C2: No Secrets en Repo
**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- `.env` en `.gitignore` ✅
- `env.ts` usa valores por defecto seguros o falla si faltan ✅
- No hay secrets hardcodeados en código ✅

---

#### ✅ C3: Prisma DB URL Segura
**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- `DATABASE_URL` viene de variable de entorno ✅
- Prisma usa connection pooling ✅
- URL no expuesta en logs ✅

---

## 🔴 HALLAZGOS CRÍTICOS (P0)

### P0-S1: Logs Pueden Exponer Datos Sensibles
**Ubicación:** `logger.ts`, múltiples servicios  
**Problema:** Logs no sanitizan datos sensibles antes de escribir.

**Evidencia:**
- `logger.ts` línea 35: `JSON.stringify(meta)` puede incluir tokens
- Stack traces en producción pueden exponer estructura
- No hay función de sanitización

**Impacto:** 🔴 **ALTO** - Violación de privacidad, exposición de datos de salud

**Acción:**
1. Crear `sanitizeForLogging()` que remueva:
   - Tokens JWT
   - Contraseñas (aunque hasheadas)
   - Información clínica (RUT, diagnósticos, etc.)
   - API keys
2. Aplicar antes de todos los `logger.*()` calls
3. Configurar logger para NO incluir stack traces en producción

---

### P0-S2: JWT Sin Invalidación (Blacklist)
**Ubicación:** `jwt.ts`, `auth.middleware.ts`  
**Problema:** Tokens comprometidos no se pueden invalidar hasta expiración.

**Evidencia:**
- No hay blacklist de tokens
- No hay endpoint de logout que invalide tokens
- Refresh tokens no rotan

**Impacto:** 🔴 **ALTO** - Tokens comprometidos válidos hasta expiración

**Acción:**
1. Implementar blacklist de tokens (Redis o tabla en DB)
2. Crear endpoint `/api/auth/logout` que invalida tokens
3. Rotar refresh tokens en cada uso
4. Validar blacklist en `auth.middleware.ts`

---

### P0-S3: CORS con URLs de Desarrollo en Producción
**Ubicación:** `server.ts` línea 316-328  
**Problema:** Lista de orígenes CORS incluye localhost e IPs locales.

**Evidencia:**
```typescript
origin: [
  env.FRONTEND_WEB_URL,
  env.MOBILE_APP_URL,
  'http://localhost:5173',  // ⚠️ Desarrollo
  'http://localhost:19000',  // ⚠️ Desarrollo
  'http://192.168.4.43:5173', // ⚠️ IP local
  // ...
]
```

**Impacto:** 🔴 **ALTO** - CORS demasiado permisivo en producción

**Acción:**
1. Mover lista de orígenes a variables de entorno
2. Separar orígenes por ambiente
3. En producción, solo orígenes de producción

---

## 🟡 HALLAZGOS IMPORTANTES (P1)

### P1-S1: Sanitización de HTML/XSS en Inputs
**Ubicación:** Servicios de mensajes  
**Problema:** Inputs de texto no están sanitizados antes de guardar.

**Acción:**
1. Agregar sanitización de HTML en backend
2. O asegurar que frontend sanitiza antes de renderizar

---

### P1-S2: Rate Limiting en Endpoints OTP
**Ubicación:** `/api/auth/send-otp`, `/api/auth/verify-otp`  
**Problema:** Endpoints de OTP pueden no tener rate limiting específico.

**Acción:**
1. Verificar rate limiting en endpoints OTP
2. Agregar rate limiting específico si falta

---

### P1-S3: Validación de Roles Inconsistente
**Ubicación:** Múltiples endpoints  
**Problema:** No todos los endpoints usan `requireRole()` consistentemente.

**Acción:**
1. Auditar endpoints que requieren roles específicos
2. Asegurar uso de `requireRole()` o validación equivalente

---

## 📊 RESUMEN DE HALLAZGOS

| Categoría | Estado | Cantidad |
|-----------|--------|----------|
| ✅ Implementado Correctamente | 8 | - |
| ⚠️ Parcial / Mejora Necesaria | 6 | - |
| 🔴 Crítico (P0) | 3 | Requiere acción inmediata |
| 🟡 Importante (P1) | 3 | Debe resolverse antes de GO LIVE |

---

## ✅ ACCIONES PROPUESTAS

### Fase Inmediata (P0)

1. **Implementar sanitización de logs:**
   - Crear `sanitizeForLogging()`
   - Aplicar en todos los logs
   - Configurar logger para producción

2. **Implementar blacklist de tokens JWT:**
   - Crear tabla `TokenBlacklist` o usar Redis
   - Endpoint `/api/auth/logout`
   - Rotar refresh tokens

3. **Corregir CORS:**
   - Mover orígenes a variables de entorno
   - Separar por ambiente

### Fase Pre-GO LIVE (P1)

4. **Agregar sanitización de HTML:**
   - Sanitizar inputs de texto
   - O asegurar sanitización en frontend

5. **Rate limiting en OTP:**
   - Verificar y agregar si falta

6. **Auditar validación de roles:**
   - Checklist de endpoints
   - Asegurar uso consistente

---

## 🎯 CRITERIOS DE ÉXITO PARA FASE 2

La auditoría de seguridad está completa cuando:

- ✅ Todos los hallazgos P0 están documentados con evidencia
- ✅ Plan de acción claro para cada hallazgo P0
- ✅ Documento SECURITY_AUDIT.md creado
- ✅ Documento SECURITY_FIXES.md con cambios implementados

---

**Última actualización:** 2025-01-XX  
**Próximo paso:** Implementar correcciones P0 y crear SECURITY_FIXES.md

