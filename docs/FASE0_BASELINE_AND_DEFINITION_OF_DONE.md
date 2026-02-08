# FASE 0: Preparación y Baseline

**Fecha:** 2025-01-XX  
**Commit Baseline:** `9c69035b60208e5bad8850640f4c9786921e9d97`  
**Estado:** ✅ COMPLETADO

---

## 1. Resumen del Norte Clínico (10 Bullets)

Basado en `docs/REQUIREMENTS_CLINICAL_NORTH.md`:

1. **Problema principal:** Médico recibe mensajes WhatsApp a todas horas, no puede cobrar, se siente interrumpido
2. **Éxito médico:** Deja de perder tiempo en WhatsApp, deja de responder gratis, recupera control de cuándo/cómo responde, puede cobrar
3. **Flujo crítico 1:** Intercepción WhatsApp → Template automático → Redirige a CanalMedico → Elimina interrupción inicial
4. **Flujo crítico 2:** Login invisible → OTP por WhatsApp → Auto-creación cuenta/consulta → Pago → Chat activo (3-4 pasos, 1-2 min)
5. **Flujo crítico 3:** Consulta asíncrona → Mensajes → Receta SNRE → Cierre médico
6. **Flujo crítico 4:** Pago antes de atención → MercadoPago → Liquidación automática (inmediato/mensual)
7. **Flujo crítico 5:** Recetas electrónicas SNRE → Bundle FHIR → Validación MINSAL → Código único
8. **Datos críticos:** RUT médico (validado RNPI), RUT paciente (SNRE), mensajes clínicos, archivos médicos
9. **Seguridad:** JWT, RBAC (ADMIN/DOCTOR/PATIENT), validación propiedad, logs sin datos sensibles, encriptación datos médicos
10. **Métricas éxito:** Reducción interrupciones, 100% consultas pagadas, fricción reducida (3-4 pasos), conversión 60-80%

---

## 2. Definition of Done (DoD)

### Criterios Mínimos para GO LIVE

#### Seguridad (BLOQUEANTE)
- ✅ 0 vulnerabilidades críticas (npm audit)
- ✅ JWT con blacklist/rotación para logout
- ✅ CORS configurado (sin wildcard en prod)
- ✅ Helmet + secure headers
- ✅ Rate limiting en endpoints sensibles
- ✅ Logs sanitizados (sin JWT, email, phone, RUT, mensajes clínicos)
- ✅ Errores no exponen stack traces en producción
- ✅ RBAC validado en todos los endpoints

#### Estabilidad (BLOQUEANTE)
- ✅ `/health` responde 200 < 100ms
- ✅ Servidor escucha inmediatamente en `process.env.PORT`
- ✅ Modo degraded si DB cae (sin acceso a endpoints sensibles)
- ✅ Timeouts configurados (fetch/prisma/axios)
- ✅ Sin memory leaks evidentes

#### Datos Médicos (BLOQUEANTE)
- ✅ Soft delete evaluado (normativa clínica)
- ✅ Índices compuestos en queries críticas
- ✅ Migraciones seguras (sin downtime)
- ✅ Estrategia rollback documentada

#### QA (BLOQUEANTE)
- ✅ Tests mínimos: auth, consulta médica, mensajería, pagos
- ✅ Smoke tests prod-like
- ✅ Flujos clínicos críticos validados

#### Observabilidad (REQUERIDO)
- ✅ Structured logging JSON con requestId
- ✅ Redaction PII/PHI
- ✅ Healthcheck / readiness / liveness definidos
- ✅ Métricas básicas (latencia, errores, DB time)

#### CI/CD (REQUERIDO)
- ✅ `.github/workflows/ci.yml` con lint, typecheck, test, build
- ✅ Scripts verificación release
- ✅ Versionado y changelog

#### Documentación (REQUERIDO)
- ✅ Todos los documentos entregables creados
- ✅ Runbook producción actualizado
- ✅ Incident response playbook
- ✅ Postmortem deploy loop

---

## 3. Go Live Gates (P0/P1)

### P0 (BLOQUEA GO LIVE - DEBE ESTAR CERRADO)
1. **SEC-P0-001:** Vulnerabilidades críticas npm audit
2. **SEC-P0-002:** JWT sin blacklist (logout no invalida tokens)
3. **SEC-P0-003:** CORS con wildcard o dominios dev en producción
4. **SEC-P0-004:** Logs contienen datos sensibles (JWT, email, phone, RUT, mensajes)
5. **SEC-P0-005:** Stack traces expuestos en producción
6. **STAB-P0-001:** `/health` no responde < 100ms
7. **STAB-P0-002:** Servidor no escucha inmediatamente en `process.env.PORT`
8. **STAB-P0-003:** Sin modo degraded si DB cae
9. **DB-P0-001:** Migraciones sin rollback strategy
10. **QA-P0-001:** Tests críticos faltantes (auth, consulta, mensajería, pagos)

### P1 (PRE GO LIVE - DEBE ESTAR CERRADO)
1. **SEC-P1-001:** Rate limiting insuficiente
2. **SEC-P1-002:** Helmet no configurado completamente
3. **SEC-P1-003:** RBAC no validado en todos los endpoints
4. **STAB-P1-001:** Timeouts no configurados
5. **STAB-P1-002:** Memory leaks potenciales
6. **DB-P1-001:** Índices compuestos faltantes
7. **DB-P1-002:** Soft delete no evaluado
8. **OBS-P1-001:** Structured logging no implementado
9. **OBS-P1-002:** Redaction PII/PHI no implementado
10. **CI-P1-001:** CI/CD pipeline incompleto

---

## 4. Baseline Congelado

**Commit Hash:** `9c69035b60208e5bad8850640f4c9786921e9d97`  
**Fecha:** 2025-01-XX  
**Estado Deploy:** ✅ FUNCIONANDO (Railway)

### Estado Actual
- ✅ Backend escucha en `process.env.PORT`
- ✅ `/health` responde 200
- ✅ Migraciones automáticas
- ✅ Railway deploy funcional

### Cambios Permitidos
- ✅ Fixes de seguridad (P0/P1)
- ✅ Mejoras de estabilidad (P0/P1)
- ✅ Optimizaciones DB (P0/P1)
- ✅ Tests y observabilidad
- ✅ Documentación

### Cambios NO Permitidos
- ❌ Refactors masivos
- ❌ Cambios de arquitectura
- ❌ Features nuevas (fuera del scope)
- ❌ Cambios que rompan deploy actual

---

## 5. Reproducibilidad Local

### Backend
```bash
cd backend
npm ci
npm run build
PORT=3000 npm start
```

### Validación `/health`
```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "...",
  "uptime": "...",
  "environment": "development",
  "version": "1.0.1",
  "commit": "...",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

---

## 6. Próximos Pasos

1. ✅ FASE 0: Preparación y baseline (COMPLETADO)
2. ⏳ FASE 1: Auditoría total automática
3. ⏳ FASE 2: Seguridad bloqueante
4. ⏳ FASE 3: Estabilidad/arquitectura
5. ⏳ FASE 4: Datos médicos y DB
6. ⏳ FASE 5: QA funcional
7. ⏳ FASE 6: Observabilidad/SRE
8. ⏳ FASE 7: CI/CD y Release
9. ⏳ FASE 8: GO LIVE final

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo de Desarrollo CanalMedico

