# 📐 ARCHITECTURE_AUDIT.md

**Auditoría Completa de Arquitectura y Código**  
**Fecha:** 2025-01-XX  
**Auditor:** Equipo Tier-1 Product Engineering  
**Objetivo:** Identificar deuda técnica, puntos de falla y mejoras necesarias para GO LIVE

---

## 🏗️ DIAGRAMA TEXTUAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTES                                    │
├─────────────────────────────────────────────────────────────────┤
│  • Frontend Web (React/Vite) - Panel Médicos                   │
│  • App Móvil (React Native/Expo) - Pacientes                  │
│  • WhatsApp Cloud API - Mensajes entrantes                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express/Node.js)               │
├─────────────────────────────────────────────────────────────────┤
│  Entrypoint: server.ts                                         │
│  ├── Health Checks (/health, /healthz)                        │
│  ├── Middlewares:                                             │
│  │   ├── auth.middleware.ts (JWT)                             │
│  │   ├── ownership.middleware.ts (IDOR prevention)           │
│  │   ├── rateLimit.middleware.ts                               │
│  │   ├── validation.middleware.ts (Zod)                      │
│  │   └── error.middleware.ts                                   │
│  │                                                             │
│  ├── Módulos (22 módulos):                                    │
│  │   ├── auth/ (login, register, OTP)                        │
│  │   ├── users/                                               │
│  │   ├── doctors/                                             │
│  │   ├── patients/                                            │
│  │   ├── consultations/ (core business logic)                │
│  │   ├── messages/                                            │
│  │   ├── payments/ (MercadoPago)                              │
│  │   ├── payouts/ (liquidaciones)                             │
│  │   ├── files/ (AWS S3)                                      │
│  │   ├── snre/ (recetas electrónicas)                         │
│  │   ├── whatsapp/ (opcional, feature flag)                  │
│  │   ├── doctor-verification/ (validación automática)         │
│  │   ├── signup-requests/                                     │
│  │   └── ... (otros)                                          │
│  │                                                             │
│  └── Socket.io (chat en tiempo real)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (PostgreSQL)                  │
├─────────────────────────────────────────────────────────────────┤
│  Modelos Principales:                                          │
│  • User, Doctor, Patient                                       │
│  • Consultation, Message                                       │
│  • Payment, PayoutBatch                                        │
│  • Prescription, PrescriptionItem                              │
│  • ConsultationAttempt (WhatsApp)                              │
│  • OTPVerification                                             │
│  • DoctorSignupRequest                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                          │
├─────────────────────────────────────────────────────────────────┤
│  • MercadoPago (pagos)                                         │
│  • AWS S3 (archivos)                                           │
│  • Firebase (notificaciones push)                              │
│  • WhatsApp Cloud API (opcional)                                │
│  • Floid (validación identidad)                                │
│  • RNPI API (validación profesional)                          │
│  • SNRE API (recetas electrónicas)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 HALLAZGOS PRIORIZADOS

### 🔴 P0 - CRÍTICOS (Bloquean GO LIVE)

#### P0-1: Validación de Propiedad Inconsistente
**Ubicación:** Varios endpoints  
**Problema:** No todos los endpoints usan `ownership.middleware.ts` de forma consistente. Algunos endpoints validan manualmente, otros no validan.

**Evidencia:**
- `consultations.service.ts` tiene validaciones manuales en algunos métodos
- Algunos endpoints de `doctors/` y `patients/` no usan el middleware centralizado
- Riesgo de IDOR (Insecure Direct Object Reference)

**Impacto:** 🔴 **ALTO** - Violación de seguridad, acceso no autorizado a datos médicos

**Acción:**
1. Auditar TODOS los endpoints que acceden a recursos por ID
2. Asegurar que TODOS usen `ownership.middleware.ts` o validación equivalente
3. Crear tests de seguridad para validar propiedad

---

#### P0-2: Manejo de Errores Inconsistente
**Ubicación:** Múltiples servicios  
**Problema:** Algunos servicios lanzan errores genéricos, otros no capturan errores de Prisma correctamente.

**Evidencia:**
- `consultations.service.ts` línea 92: `catch (error)` genérico
- Algunos servicios no distinguen entre errores de validación y errores de sistema
- Logs pueden exponer información sensible (stack traces en producción)

**Impacto:** 🔴 **ALTO** - Dificulta debugging, puede exponer información sensible

**Acción:**
1. Estandarizar manejo de errores en todos los servicios
2. Usar `createError()` de `error.middleware.ts` consistentemente
3. Asegurar que logs en producción NO incluyan stack traces completos
4. Crear tipos de error específicos (ValidationError, NotFoundError, etc.)

---

#### P0-3: Variables de Entorno Opcionales en Producción
**Ubicación:** `config/env.ts`  
**Problema:** Variables críticas están marcadas como `optional()` pero son requeridas en producción.

**Evidencia:**
- `MERCADOPAGO_ACCESS_TOKEN` es `optional()` pero requerido para pagos
- `AWS_ACCESS_KEY_ID` es `optional()` pero requerido para archivos
- `SNRE_API_KEY` es `optional()` pero requerido para recetas

**Impacto:** 🔴 **ALTO** - El sistema puede iniciar sin funcionalidades críticas, errores en runtime

**Acción:**
1. Crear validación condicional: requerir según `NODE_ENV`
2. En producción, validar que variables críticas estén presentes
3. Falla temprana si faltan variables críticas

---

#### P0-4: WhatsApp Module Opcional (Feature Flag)
**Ubicación:** `whatsapp/` module, `server.ts` línea 699  
**Problema:** El módulo WhatsApp está deshabilitado por defecto (`ENABLE_WHATSAPP_AUTO_RESPONSE=false`), pero es CRÍTICO según REQUIREMENTS_CLINICAL_NORTH.md.

**Evidencia:**
- Módulo existe pero no se carga si feature flag está desactivado
- Según REQUIREMENTS_CLINICAL_NORTH.md, auto-respuesta WhatsApp es P0

**Impacto:** 🔴 **ALTO** - Funcionalidad crítica no disponible, médico sigue siendo interrumpido

**Acción:**
1. Documentar que WhatsApp es requerido para cumplir el objetivo clínico
2. Si no está listo, crear plan de implementación explícito
3. O activar feature flag y validar que funciona correctamente

---

### 🟡 P1 - IMPORTANTES (Afectan Calidad/Confiabilidad)

#### P1-1: Duplicación de Lógica de Validación
**Ubicación:** Múltiples servicios  
**Problema:** Validaciones similares repetidas en diferentes servicios (ej: verificar que doctor existe).

**Evidencia:**
- `consultations.service.ts` línea 18-24: verifica doctor existe
- `payments.service.ts` probablemente tiene validación similar
- Lógica duplicada = riesgo de inconsistencias

**Impacto:** 🟡 **MEDIO** - Mantenibilidad, riesgo de bugs por inconsistencias

**Acción:**
1. Crear funciones helper reutilizables para validaciones comunes
2. Centralizar validaciones de existencia de entidades
3. Usar Prisma transactions cuando sea necesario

---

#### P1-2: N+1 Queries Potenciales
**Ubicación:** Varios servicios con `include` anidados  
**Problema:** Algunas queries pueden generar N+1 si no se usan `include` correctamente.

**Evidencia:**
- `consultations.service.ts` línea 64-85: `include` anidado puede ser ineficiente
- No hay evidencia de uso de `select` para limitar campos

**Impacto:** 🟡 **MEDIO** - Performance degradada con muchos datos

**Acción:**
1. Auditar queries con `include` anidados
2. Usar `select` para limitar campos retornados
3. Considerar paginación en listados grandes
4. Agregar índices en Prisma schema si faltan

---

#### P1-3: Falta de Transacciones en Operaciones Críticas
**Ubicación:** Servicios de pagos y consultas  
**Problema:** Operaciones que deben ser atómicas no usan transacciones de Prisma.

**Evidencia:**
- Crear consulta + crear pago debería ser transaccional
- Activar consulta después de pago debería ser transaccional

**Impacto:** 🟡 **MEDIO** - Riesgo de inconsistencias de datos

**Acción:**
1. Identificar operaciones que deben ser atómicas
2. Envolver en `prisma.$transaction()`
3. Agregar rollback en caso de error

---

#### P1-4: Logs Sin Request ID / Correlation ID
**Ubicación:** Logger config  
**Problema:** Logs no incluyen request ID, dificulta rastrear requests a través del sistema.

**Evidencia:**
- `logger.ts` no agrega request ID automáticamente
- No hay middleware que agregue correlation ID

**Impacto:** 🟡 **MEDIO** - Dificulta debugging en producción

**Acción:**
1. Crear middleware que agregue request ID a cada request
2. Incluir request ID en todos los logs
3. Usar `cls-hooked` o similar para contexto async

---

#### P1-5: Health Check No Verifica Dependencias Críticas
**Ubicación:** `server.ts` línea 196-226  
**Problema:** `/health` responde 200 incluso si DB está desconectada (modo degraded). No verifica servicios externos críticos.

**Evidencia:**
- Health check solo verifica DB connection
- No verifica MercadoPago, AWS S3, SNRE, etc.

**Impacto:** 🟡 **MEDIO** - Health check puede pasar pero sistema no funcional

**Acción:**
1. Crear `/ready` endpoint que verifica TODAS las dependencias
2. `/health` para liveness (solo servidor)
3. `/ready` para readiness (servidor + dependencias)
4. Railway debe usar `/ready` para healthcheck

---

### 🟢 P2 - MEJORAS (No Bloquean GO LIVE)

#### P2-1: Falta de Tests Unitarios
**Ubicación:** Todo el backend  
**Problema:** No hay tests unitarios para servicios críticos.

**Evidencia:**
- `tests/` existe pero solo tiene tests de integración
- No hay tests para `consultations.service.ts`, `payments.service.ts`, etc.

**Impacto:** 🟢 **BAJO** - Riesgo de regresiones, pero no bloquea GO LIVE

**Acción:**
1. Crear tests unitarios para servicios críticos (auth, payments, consultations)
2. Usar Jest (ya configurado)
3. Mock Prisma para tests aislados

---

#### P2-2: Documentación de API Incompleta
**Ubicación:** Swagger  
**Problema:** Algunos endpoints no tienen documentación Swagger completa.

**Evidencia:**
- Swagger configurado pero puede faltar documentación en algunos endpoints

**Impacto:** 🟢 **BAJO** - Dificulta integración pero no bloquea

**Acción:**
1. Auditar endpoints sin documentación Swagger
2. Agregar `@swagger` comments a todos los endpoints
3. Incluir ejemplos de request/response

---

#### P2-3: Naming Inconsistente
**Ubicación:** Múltiples archivos  
**Problema:** Algunas inconsistencias en naming (camelCase vs snake_case, español vs inglés).

**Evidencia:**
- Variables en español en algunos lugares
- Mezcla de convenciones

**Impacto:** 🟢 **BAJO** - Mantenibilidad, pero no funcional

**Acción:**
1. Estandarizar: inglés para código, español para mensajes de usuario
2. Usar camelCase para variables TypeScript
3. Linter puede ayudar a detectar inconsistencias

---

#### P2-4: Falta de Rate Limiting Específico por Endpoint
**Ubicación:** `rateLimit.middleware.ts`  
**Problema:** Rate limiting global pero no específico por endpoint sensible.

**Evidencia:**
- Rate limiting general configurado
- Endpoints sensibles (login, OTP) deberían tener límites más estrictos

**Impacto:** 🟢 **BAJO** - Seguridad mejorada pero no crítico

**Acción:**
1. Agregar rate limiting específico para `/api/auth/login`
2. Agregar rate limiting para `/api/auth/send-otp`
3. Usar diferentes límites según criticidad

---

## 📊 RESUMEN DE HALLAZGOS

| Prioridad | Cantidad | Estado |
|-----------|----------|--------|
| P0 (Críticos) | 4 | 🔴 Requieren acción inmediata |
| P1 (Importantes) | 5 | 🟡 Deben resolverse antes de GO LIVE |
| P2 (Mejoras) | 4 | 🟢 Deseables pero no bloquean |

**Total:** 13 hallazgos

---

## ✅ ACCIONES PROPUESTAS (Mínimas pero Efectivas)

### Fase Inmediata (P0)

1. **Auditar y corregir validación de propiedad:**
   - Revisar TODOS los endpoints que acceden a recursos por ID
   - Asegurar uso de `ownership.middleware.ts`
   - Crear checklist de endpoints auditados

2. **Estandarizar manejo de errores:**
   - Crear tipos de error específicos
   - Usar `createError()` consistentemente
   - Configurar logger para no exponer stack traces en producción

3. **Validar variables de entorno en producción:**
   - Crear validación condicional según `NODE_ENV`
   - Falla temprana si faltan variables críticas
   - Documentar variables requeridas por ambiente

4. **Decidir sobre WhatsApp:**
   - Si está listo: activar feature flag y validar
   - Si no está listo: documentar como pendiente y crear plan

### Fase Pre-GO LIVE (P1)

5. **Refactorizar validaciones duplicadas:**
   - Crear helpers reutilizables
   - Centralizar validaciones comunes

6. **Optimizar queries:**
   - Auditar queries con `include` anidados
   - Usar `select` para limitar campos
   - Agregar índices si faltan

7. **Agregar transacciones:**
   - Identificar operaciones atómicas
   - Envolver en `prisma.$transaction()`

8. **Mejorar observabilidad:**
   - Agregar request ID a logs
   - Crear `/ready` endpoint
   - Configurar Railway para usar `/ready`

### Fase Post-GO LIVE (P2)

9. **Agregar tests unitarios:**
   - Priorizar servicios críticos
   - Usar Jest (ya configurado)

10. **Completar documentación:**
    - Swagger para todos los endpoints
    - Ejemplos de request/response

---

## 🎯 CRITERIOS DE ÉXITO PARA FASE 1

La auditoría está completa cuando:

- ✅ Todos los hallazgos P0 están documentados con evidencia
- ✅ Plan de acción claro para cada hallazgo P0
- ✅ Documento ARCHITECTURE_AUDIT.md creado y revisado
- ✅ Checklist de endpoints auditados creado

---

## 📝 NOTAS ADICIONALES

### Fortalezas del Sistema

1. ✅ Arquitectura modular bien organizada
2. ✅ Middleware de ownership centralizado (aunque no usado consistentemente)
3. ✅ Feature flags para módulos opcionales
4. ✅ Health checks implementados
5. ✅ Validación con Zod
6. ✅ Prisma ORM bien estructurado
7. ✅ Manejo de errores centralizado (aunque inconsistente)

### Áreas de Mejora Identificadas

1. Consistencia en uso de middlewares
2. Manejo de errores estandarizado
3. Validación de variables de entorno
4. Observabilidad mejorada
5. Tests unitarios

---

**Última actualización:** 2025-01-XX  
**Próximo paso:** FASE 2 - Auditoría de Seguridad

