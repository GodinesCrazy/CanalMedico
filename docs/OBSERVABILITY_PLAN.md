# 📊 OBSERVABILITY_PLAN.md

**Plan de Observabilidad: Logs, Metrics, Alertas**  
**Fecha:** 2025-01-XX  
**Auditor:** Equipo Tier-1 Product Engineering / SRE Lead

---

## 📋 LOGS ESTRUCTURADOS

### ⚠️ Request ID / Correlation ID
**Estado:** ⚠️ **NO IMPLEMENTADO**  
**Problema:** Logs no incluyen request ID, dificulta rastrear requests.

**Acción:**
1. Crear middleware que agregue `requestId` a cada request
2. Incluir `requestId` en todos los logs
3. Usar `cls-hooked` o similar para contexto async

---

### ✅ Duración Request
**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- `morgan` middleware registra requests ✅
- No hay métrica explícita de duración

**Acción:**
1. Agregar middleware que calcule duración
2. Incluir en logs estructurados

---

### ✅ Status Codes
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `morgan` registra status codes ✅
- Error middleware registra códigos de error ✅

---

### 🔴 Errores con Stack pero Sin Secrets
**Estado:** 🔴 **PROBLEMA**  
**Problema:** Logs pueden incluir stack traces con información sensible.

**Acción:**
1. Crear `sanitizeForLogging()` (ver SECURITY_AUDIT.md)
2. Configurar logger para NO incluir stack traces en producción
3. Aplicar sanitización antes de loguear

---

## 📋 HEALTH REAL

### ✅ /health (Liveness)
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `server.ts` línea 196-226: `/health` endpoint ✅
- Responde 200 incluso si DB está desconectada (modo degraded) ✅

---

### ⚠️ /ready (Readiness)
**Estado:** ⚠️ **NO IMPLEMENTADO**  
**Problema:** No hay endpoint `/ready` que verifique TODAS las dependencias.

**Acción:**
1. Crear endpoint `/ready` que verifique:
   - DB connection
   - Prisma migrations
   - Servicios externos críticos (MercadoPago, AWS S3, SNRE)
2. Railway debe usar `/ready` para healthcheck
3. `/health` para liveness (solo servidor)
4. `/ready` para readiness (servidor + dependencias)

---

## 📋 RAILWAY

### ✅ Logging Claro
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `console.log` para Railway logs ✅
- `logger` (Winston) para logs estructurados ✅
- Logs visibles en Railway dashboard ✅

---

### ✅ Deploy Considerado "Healthy"
**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- Health checks configurados ✅
- Servidor escucha antes de lógica pesada ✅

---

## ✅ ACCIONES PROPUESTAS

1. **Agregar request ID:**
   - Middleware que genera `requestId`
   - Incluir en todos los logs

2. **Crear /ready endpoint:**
   - Verificar DB, migrations, servicios externos
   - Configurar Railway para usar `/ready`

3. **Sanitizar logs:**
   - Implementar `sanitizeForLogging()`
   - Configurar logger para producción

---

**Última actualización:** 2025-01-XX

