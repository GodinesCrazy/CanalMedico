# FASE 1: Auditoría Total Automática

**Fecha:** 2025-01-XX  
**Estado:** ⏳ EN PROGRESO

---

## 1. NPM Audit

### Resultados

**Vulnerabilidades encontradas:** 5 HIGH, 0 CRITICAL

#### Vulnerabilidades HIGH (P0)

1. **body-parser / qs (CVE relacionado)**
   - **Severidad:** HIGH
   - **CVSS:** 7.5
   - **Problema:** DoS via memory exhaustion en arrayLimit bypass
   - **Fix:** Actualizar express y body-parser
   - **Evidencia:** `npm audit --json`

2. **express (via body-parser/qs)**
   - **Severidad:** HIGH
   - **Problema:** Dependencia de body-parser vulnerable
   - **Fix:** Actualizar express a versión segura
   - **Evidencia:** `npm audit --json`

3. **jws (via jsonwebtoken)**
   - **Severidad:** HIGH
   - **CVSS:** 7.5
   - **Problema:** Improperly Verifies HMAC Signature (CWE-347)
   - **Fix:** Actualizar jsonwebtoken
   - **Evidencia:** `npm audit --json`

4. **node-forge**
   - **Severidad:** HIGH
   - **CVSS:** 8.6
   - **Problema:** ASN.1 vulnerabilities (CWE-674, CWE-436, CWE-190)
   - **Fix:** Actualizar node-forge a >=1.3.2
   - **Evidencia:** `npm audit --json`

5. **qs (direct)**
   - **Severidad:** HIGH
   - **CVSS:** 7.5
   - **Problema:** ArrayLimit bypass DoS (CWE-20)
   - **Fix:** Actualizar qs a >=6.14.1
   - **Evidencia:** `npm audit --json`

### Acción Requerida

```bash
npm audit fix
```

**Riesgo:** MEDIO - Puede romper compatibilidad si hay breaking changes  
**Impacto clínico:** Bajo (no afecta funcionalidad médica directamente, pero compromete seguridad)

---

## 2. ESLint / TypeScript

### Resultados

**ESLint:** ❌ NO CONFIGURADO
- No existe `.eslintrc*` en backend
- Comando `npm run lint` falla

**TypeScript:** ⏳ PENDIENTE VERIFICACIÓN
- Necesita ejecutar `npm run build` para verificar

### Acción Requerida

1. Crear configuración ESLint
2. Ejecutar typecheck
3. Corregir errores encontrados

**Riesgo:** BAJO  
**Impacto clínico:** Ninguno (solo calidad de código)

---

## 3. Análisis de Secretos

### Resultados

**Archivos con referencias a secrets:** 33 archivos encontrados

**Verificación:** ✅ NO se encontraron secretos hardcodeados
- Todas las referencias usan `process.env.*` o `env.*`
- No hay valores literales de secrets en código

### Archivos Revisados

- `backend/src/config/env.ts` - ✅ Usa variables de entorno
- `backend/src/utils/jwt.ts` - ✅ Usa `env.JWT_SECRET`
- `backend/src/modules/auth/*` - ✅ Usa `env.*`
- `backend/src/modules/payments/*` - ✅ Usa `env.MERCADOPAGO_ACCESS_TOKEN`
- `backend/src/modules/files/*` - ✅ Usa `env.AWS_*`

**Riesgo:** BAJO  
**Impacto clínico:** Ninguno (buena práctica)

---

## 4. Express Security

### Headers de Seguridad

**Helmet:** ✅ CONFIGURADO
- Ubicación: `backend/src/server.ts:314`
- `app.use(helmet())`

**CORS:** ⚠️ REQUIERE REVISIÓN
- Ubicación: `backend/src/server.ts:316-328`
- **Problema:** Incluye dominios de desarrollo en producción
  - `http://localhost:5173`
  - `http://localhost:19000`
  - `http://192.168.4.43:*` (IPs locales)
- **Fix requerido:** Filtrar por `NODE_ENV`

**Rate Limiting:** ✅ CONFIGURADO
- Ubicación: `backend/src/middlewares/rateLimit.middleware.ts`
- General: 100 requests / 15 min
- Auth: 5 requests / 15 min
- Payment: 10 requests / 1 hora
- ✅ Excluye healthcheck endpoints

**Body Size Limits:** ✅ CONFIGURADO
- `express.json({ limit: '10mb' })`
- `express.urlencoded({ extended: true, limit: '10mb' })`

### Acción Requerida

1. **CORS:** Filtrar dominios dev en producción
2. **Verificar:** Helmet configuración completa

**Riesgo:** MEDIO (CORS permite acceso desde dev en prod)  
**Impacto clínico:** MEDIO (riesgo de seguridad)

---

## 5. Prisma / Postgres

### Migraciones

**Estado:** ✅ AUTOMÁTICAS
- Ubicación: `backend/src/server.ts:411-479`
- Estrategia: `prisma migrate deploy` → fallback a `db push`
- ✅ No bloquea startup si fallan

### Schema

**Revisión pendiente:**
- Soft delete (deletedAt)
- Índices compuestos
- Optimización queries

**Acción:** Revisar en FASE 4

**Riesgo:** BAJO  
**Impacto clínico:** Bajo (performance, no funcionalidad)

---

## 6. Railway Config

### Verificación

**Root Directory:** ✅ `backend` (según `docs/INSTRUCCIONES_RAILWAY_DEPLOY_FIX.md`)

**Start Command:** ✅ `node dist/server.js` (según `package.json`)

**Health Check:** ✅ `/health` (según `server.ts`)

**PORT:** ✅ `process.env.PORT` (según `server.ts:32`)

**Listen:** ✅ `0.0.0.0:${PORT}` (según `server.ts:38`)

**Estado:** ✅ CONFIGURADO CORRECTAMENTE

**Riesgo:** BAJO  
**Impacto clínico:** Ninguno

---

## 7. Logging y Errores

### Logging

**Logger:** ✅ Winston configurado
- Ubicación: `backend/src/config/logger.ts`
- Formato: JSON estructurado
- Niveles: error, warn, info, debug

**Problema:** ⚠️ NO HAY SANITIZACIÓN DE DATOS SENSIBLES
- Logs pueden contener:
  - JWT tokens
  - Emails
  - Teléfonos
  - RUTs
  - Mensajes clínicos
  - Body completo de requests

**Evidencia:** `backend/src/middlewares/error.middleware.ts:39-46`
```typescript
logger.error('Error no manejado:', {
  error: err.message,
  stack: err.stack,
  url: req.url,
  method: req.method,
  body: req.body,  // ⚠️ Puede contener datos sensibles
  query: req.query,
});
```

### Errores

**Stack Traces:** ⚠️ PARCIALMENTE PROTEGIDO
- Ubicación: `backend/src/middlewares/error.middleware.ts:48-54`
- ✅ No expone stack en producción
- ⚠️ Pero expone `err.message` completo (puede contener info sensible)

**Acción Requerida:**

1. **Sanitización de logs:** Implementar `sanitizeForLogging()`
2. **Redaction PII/PHI:** Filtrar datos sensibles antes de loguear
3. **Errores:** Sanitizar mensajes de error en producción

**Riesgo:** ALTO (violación de privacidad de datos médicos)  
**Impacto clínico:** ALTO (datos sensibles en logs)

---

## 8. JWT / Autenticación

### JWT Implementation

**Generación:** ✅ Configurado
- Ubicación: `backend/src/utils/jwt.ts`
- Access token: 15m
- Refresh token: 7d

**Verificación:** ✅ Implementada
- Ubicación: `backend/src/middlewares/auth.middleware.ts`

**Problema:** ❌ NO HAY BLACKLIST/INVALIDACIÓN
- Logout no invalida tokens
- Tokens comprometidos no se pueden revocar
- No hay rotación de tokens

**Acción Requerida:**

1. Implementar `TokenBlacklist` table
2. Agregar `revokedAt` timestamp
3. Verificar blacklist en `verifyAccessToken()`
4. Implementar cleanup job para tokens expirados

**Riesgo:** ALTO (tokens comprometidos siguen válidos)  
**Impacto clínico:** ALTO (acceso no autorizado a datos médicos)

---

## 9. RBAC / Autorización

### Implementación

**Roles:** ✅ ADMIN, DOCTOR, PATIENT
- Ubicación: `backend/src/types/index.ts`

**Middleware:** ✅ `requireRole()` implementado
- Ubicación: `backend/src/middlewares/auth.middleware.ts:35-51`

**Problema:** ⚠️ NO VERIFICADO EN TODOS LOS ENDPOINTS
- Necesita auditoría completa de endpoints
- Verificar validación de propiedad (ownership)

**Acción Requerida:**

1. Auditoría completa de endpoints
2. Verificar que todos usan `authenticate` + `requireRole`
3. Verificar `ownership.middleware` donde aplica

**Riesgo:** MEDIO (posibles IDOR)  
**Impacto clínico:** ALTO (acceso no autorizado a datos médicos)

---

## 10. Resumen de Hallazgos

### P0 (BLOQUEA GO LIVE)

1. **SEC-P0-001:** 5 vulnerabilidades HIGH en npm audit
2. **SEC-P0-002:** JWT sin blacklist (logout no invalida tokens)
3. **SEC-P0-003:** CORS incluye dominios dev en producción
4. **SEC-P0-004:** Logs no sanitizados (pueden contener datos sensibles)
5. **SEC-P0-005:** Errores pueden exponer información sensible
6. **SEC-P0-006:** RBAC no verificado en todos los endpoints

### P1 (PRE GO LIVE)

1. **SEC-P1-001:** ESLint no configurado
2. **SEC-P1-002:** TypeScript typecheck no ejecutado
3. **SEC-P1-003:** Helmet configuración no verificada completamente
4. **STAB-P1-001:** Timeouts no configurados explícitamente
5. **OBS-P1-001:** Structured logging sin requestId/correlationId
6. **OBS-P1-002:** Redaction PII/PHI no implementado

### P2 (POST GO LIVE)

1. **DB-P2-001:** Soft delete no evaluado
2. **DB-P2-002:** Índices compuestos no optimizados
3. **OBS-P2-001:** Métricas no implementadas

---

## 11. Próximos Pasos

1. ✅ FASE 1: Auditoría total (COMPLETADO)
2. ⏳ FASE 2: Seguridad bloqueante (P0/P1)
3. ⏳ FASE 3: Estabilidad/arquitectura
4. ⏳ FASE 4: Datos médicos y DB
5. ⏳ FASE 5: QA funcional
6. ⏳ FASE 6: Observabilidad/SRE
7. ⏳ FASE 7: CI/CD y Release
8. ⏳ FASE 8: GO LIVE final

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo de Desarrollo CanalMedico

