# Changelog - Go Live Preparation

**Versión:** 1.0.1  
**Fecha:** 2025-01-XX

---

## [1.0.1] - 2025-01-XX

### 🔒 Security (P0)

#### Fixed
- **SEC-P0-001:** Resueltas 5 vulnerabilidades HIGH de npm audit
  - body-parser, express, jws, node-forge, qs actualizados
  - Commit: `fix(security): resolve npm audit vulnerabilities`

- **SEC-P0-002:** Implementado JWT blacklist para invalidación de tokens
  - Tabla `TokenBlacklist` creada en Prisma schema
  - Endpoint `POST /api/auth/logout` implementado
  - Verificación de blacklist en middleware de autenticación
  - Job de limpieza automática de tokens expirados (diario 02:00)
  - Commit: `fix(security): implement JWT blacklist for token invalidation`

- **SEC-P0-003:** CORS filtrado por ambiente (dev solo en desarrollo)
  - Dominios de desarrollo removidos de producción
  - Soporte para `RAILWAY_PUBLIC_DOMAIN`
  - Commit: `fix(security): filter dev origins from CORS in production`

- **SEC-P0-004:** Implementada sanitización de logs para PII/PHI
  - Utilidad `sanitizeForLogging()` creada
  - Logger integrado con sanitización automática
  - Redacción de campos sensibles (JWT, email, phone, RUT, mensajes clínicos)
  - Detección de patrones sensibles (JWT, RUT, email, teléfono)
  - Commit: `fix(security): implement log sanitization for PII/PHI`

- **SEC-P0-005:** Stack traces protegidos en producción
  - Errores sanitizados antes de loguear
  - Mensajes genéricos en producción
  - Stack traces solo en desarrollo
  - Commit: `fix(security): sanitize error messages and stack traces`

### 📝 Added

- **Documentación:**
  - `docs/FASE0_BASELINE_AND_DEFINITION_OF_DONE.md`
  - `docs/FASE1_AUDITORIA_TOTAL.md`
  - `docs/FASE2_SEGURIDAD_BLOQUEANTE.md`
  - `docs/SECURITY_REMEDIATION_PLAN.md`
  - `docs/PRODUCTION_READINESS_REPORT.md`
  - `docs/CHANGELOG_GO_LIVE.md`

- **Utilidades:**
  - `backend/src/utils/sanitize.ts` - Sanitización de datos sensibles
  - `backend/src/jobs/token-cleanup.job.ts` - Limpieza de tokens expirados

- **Modelos:**
  - `TokenBlacklist` en Prisma schema

### 🔄 Changed

- **Logger:**
  - Sanitización automática de metadata
  - Redacción de datos sensibles

- **Error Middleware:**
  - Sanitización de errores antes de loguear
  - Stack traces solo en desarrollo

- **Auth Middleware:**
  - Verificación de blacklist en cada autenticación
  - Async/await para verificación de blacklist

- **Auth Service:**
  - Método `logout()` implementado

- **Auth Routes:**
  - Endpoint `POST /api/auth/logout` agregado

- **Server:**
  - CORS configurado dinámicamente por ambiente
  - Job de limpieza de tokens iniciado

### ⚠️ Known Issues

- **SEC-P0-006:** RBAC no verificado completamente en todos los endpoints
  - Pendiente auditoría completa
  - Ver `docs/SECURITY_REMEDIATION_PLAN.md`

- **Migración TokenBlacklist:**
  - Pendiente ejecución en Railway
  - Se ejecutará automáticamente en próximo deploy

### 📋 Pending

- Auditoría RBAC completa (SEC-P0-006)
- Helmet configuración completa (SEC-P1-001)
- Rate limiting endpoints sensibles (SEC-P1-002)
- Tests automatizados mínimos
- Observabilidad completa (requestId, métricas)
- CI/CD pipeline

---

## Breaking Changes

Ninguno.

---

## Migration Guide

### TokenBlacklist Migration

La migración de `TokenBlacklist` se ejecutará automáticamente en Railway al hacer deploy.

Si necesitas ejecutarla manualmente:

```bash
cd backend
npx prisma migrate deploy
```

---

## Upgrade Notes

1. **Variables de entorno:** No se requieren cambios
2. **Database:** Migración automática de TokenBlacklist
3. **API:** Nuevo endpoint `POST /api/auth/logout` disponible

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo de Desarrollo CanalMedico

