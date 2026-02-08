# 🗄️ DB_AUDIT.md

**Auditoría Completa de Base de Datos / Prisma**  
**Fecha:** 2025-01-XX  
**Auditor:** Equipo Tier-1 Product Engineering  
**Objetivo:** Asegurar schema robusto, queries optimizadas y migraciones consistentes

---

## 📊 REVISIÓN DE SCHEMA PRISMA

### ✅ Constraints Necesarias

#### Primary Keys
**Estado:** ✅ **CORRECTO**  
- Todos los modelos tienen `@id @default(cuid())` ✅
- IDs únicos y no secuenciales (seguridad)

#### Unique Constraints
**Estado:** ✅ **CORRECTO**  
- `User.email` - `@unique` ✅
- `User.phoneNumber` - `@unique` ✅
- `Doctor.userId` - `@unique` ✅
- `Doctor.rut` - `@unique` ✅
- `Patient.userId` - `@unique` ✅
- `Patient.phoneNumber` - `@unique` ✅
- `Payment.mercadopagoPreferenceId` - `@unique` ✅
- `Payment.mercadopagoPaymentId` - `@unique` ✅
- `Payment.consultationId` - `@unique` ✅

**Verificación:** Todas las relaciones 1:1 tienen `@unique` correctamente.

---

### ✅ Índices

**Estado:** ✅ **BIEN IMPLEMENTADO**  
**Evidencia:**
- Índices en campos de búsqueda frecuente:
  - `User`: `email`, `phoneNumber` ✅
  - `Doctor`: `userId`, `rut`, `verificacionEstadoFinal`, `whatsappBusinessNumber` ✅
  - `Patient`: `userId`, `rut`, `phoneNumber` ✅
  - `Consultation`: `doctorId`, `patientId`, `status`, `createdAt`, `source` ✅
  - `Message`: `consultationId`, `createdAt` ✅
  - `Payment`: `status`, `mercadopagoPreferenceId`, `createdAt`, `payoutStatus` ✅

**Mejora Sugerida:**
- Considerar índice compuesto en `Consultation(doctorId, status)` para queries frecuentes
- Considerar índice compuesto en `Payment(payoutStatus, payoutBatchId)` para liquidaciones

**Acción:**
1. Agregar índices compuestos si queries lo requieren
2. Monitorear slow queries en producción

---

### ✅ Relaciones

**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- Relaciones 1:1 correctamente definidas:
  - `User` ↔ `Doctor` (1:1) ✅
  - `User` ↔ `Patient` (1:1) ✅
  - `Consultation` ↔ `Payment` (1:1 opcional) ✅
- Relaciones 1:N correctamente definidas:
  - `Doctor` → `Consultation[]` ✅
  - `Patient` → `Consultation[]` ✅
  - `Consultation` → `Message[]` ✅
  - `Consultation` → `Prescription[]` ✅

**Verificación:** Todas las relaciones tienen `onDelete: Cascade` donde corresponde ✅

---

### ✅ Cascadas

**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- `User` → `Doctor`, `Patient`: `onDelete: Cascade` ✅
- `Consultation` → `Message`, `Prescription`: `onDelete: Cascade` ✅
- `Doctor` → `Consultation`: `onDelete: Cascade` ✅
- `Patient` → `Consultation`: `onDelete: Cascade` ✅

**Verificación:** Cascadas configuradas correctamente para mantener integridad referencial.

---

### ✅ Defaults

**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- Valores por defecto apropiados:
  - `User.role`: `"PATIENT"` ✅
  - `Consultation.type`: `"NORMAL"` ✅
  - `Consultation.status`: `"PENDING"` ✅
  - `Payment.status`: `"PENDING"` ✅
  - `Doctor.payoutMode`: `"IMMEDIATE"` ✅
  - `Doctor.payoutDay`: `5` ✅

**Verificación:** Defaults apropiados para el dominio.

---

### ⚠️ Timestamps y Soft Delete

**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- `createdAt`, `updatedAt` presentes en modelos principales ✅
- **PROBLEMA:** No hay soft delete implementado
- Si se elimina un registro, se pierde información histórica

**Impacto:** 🟡 **MEDIO** - Pérdida de datos históricos, dificulta auditoría

**Acción:**
1. Considerar agregar `deletedAt DateTime?` a modelos críticos
2. O implementar archivado en lugar de eliminación física
3. Para datos de salud, puede ser requerido por normativa

---

## 🔍 REVISIÓN DE QUERIES

### ✅ Evitar N+1

**Estado:** ✅ **BIEN IMPLEMENTADO**  
**Evidencia:**
- Queries usan `include` para cargar relaciones:
  - `consultations.service.ts` línea 64-85: `include` anidado ✅
  - `doctors.service.ts` línea 16-23: `include` con `select` ✅
  - `payments.service.ts`: `include` para relaciones ✅

**Mejora Sugerida:**
- Algunos `include` pueden cargar más datos de los necesarios
- Usar `select` para limitar campos retornados

**Acción:**
1. Auditar queries con `include` anidados
2. Usar `select` para limitar campos cuando sea posible
3. Considerar `select` en lugar de `include` si solo se necesitan algunos campos

---

### ⚠️ Evitar SELECT * Innecesario

**Estado:** ⚠️ **PARCIAL**  
**Evidencia:**
- Algunos servicios usan `select` para limitar campos ✅
- Otros usan `include` sin `select`, cargando todos los campos

**Problema:**
- `consultations.service.ts` línea 64-85: `include` sin `select` en algunos niveles
- Puede cargar más datos de los necesarios

**Impacto:** 🟡 **BAJO** - Performance, pero no crítico

**Acción:**
1. Revisar queries que retornan muchos datos
2. Usar `select` para limitar campos cuando sea posible
3. Especialmente en listados paginados

---

### ✅ Paginación en Listados

**Estado:** ✅ **IMPLEMENTADO**  
**Evidencia:**
- `consultations.service.ts`: `getByDoctor()`, `getByPatient()` usan paginación ✅
- `doctors.service.ts`: `getAll()` usa paginación ✅
- `payments.service.ts`: `getPaymentsByDoctor()` usa paginación ✅
- `utils/pagination.ts`: Helper para paginación ✅

**Verificación:** Paginación implementada correctamente con `skip`, `take` y `count`.

---

### ⚠️ Performance en Endpoints Críticos

**Estado:** ⚠️ **REVISAR**  
**Evidencia:**
- Queries principales tienen índices ✅
- Algunas queries pueden ser optimizadas:
  - `getByDoctor()` con `include` anidado puede ser lento con muchos datos
  - `getByPatient()` carga mensajes (puede ser pesado)

**Acción:**
1. Monitorear performance de queries en producción
2. Agregar índices compuestos si es necesario
3. Considerar cache para queries frecuentes (futuro)

---

## 📋 REVISIÓN DE MIGRACIONES

### ✅ Consistencia Entre Entornos

**Estado:** ✅ **CORRECTO**  
**Evidencia:**
- Migraciones en `prisma/migrations/` ✅
- `server.ts` ejecuta migraciones automáticamente en producción ✅
- Usa `prisma migrate deploy` (producción) y `db push` (fallback) ✅

**Verificación:** Migraciones automáticas funcionando.

---

### ⚠️ Rollback Plan

**Estado:** ⚠️ **NO DOCUMENTADO**  
**Evidencia:**
- Migraciones existen pero no hay plan de rollback documentado
- Prisma no soporta rollback automático

**Impacto:** 🟡 **MEDIO** - Dificulta recuperación si migración falla

**Acción:**
1. Documentar proceso de rollback manual
2. Crear migraciones de rollback si es necesario
3. Probar migraciones en staging antes de producción

---

## 🔴 HALLAZGOS CRÍTICOS (P0)

### P0-DB1: Falta de Soft Delete
**Ubicación:** Todos los modelos  
**Problema:** No hay soft delete, eliminación física de datos históricos.

**Impacto:** 🔴 **ALTO** - Pérdida de datos históricos, puede violar normativa de salud

**Acción:**
1. Evaluar necesidad de soft delete según normativa
2. Agregar `deletedAt` a modelos críticos si es necesario
3. O implementar archivado en lugar de eliminación

---

## 🟡 HALLAZGOS IMPORTANTES (P1)

### P1-DB1: Índices Compuestos Faltantes
**Ubicación:** `Consultation`, `Payment`  
**Problema:** Queries frecuentes pueden beneficiarse de índices compuestos.

**Acción:**
1. Agregar índice compuesto `Consultation(doctorId, status)`
2. Agregar índice compuesto `Payment(payoutStatus, payoutBatchId)`
3. Monitorear slow queries en producción

---

### P1-DB2: Queries con Include Anidado Pueden Ser Optimizadas
**Ubicación:** `consultations.service.ts`, `payments.service.ts`  
**Problema:** Algunas queries cargan más datos de los necesarios.

**Acción:**
1. Revisar queries con `include` anidados
2. Usar `select` para limitar campos cuando sea posible
3. Especialmente en listados paginados

---

### P1-DB3: Plan de Rollback No Documentado
**Ubicación:** Migraciones  
**Problema:** No hay proceso documentado para rollback de migraciones.

**Acción:**
1. Documentar proceso de rollback
2. Crear migraciones de rollback si es necesario
3. Probar en staging

---

## 📊 RESUMEN DE HALLAZGOS

| Categoría | Estado | Cantidad |
|-----------|--------|----------|
| ✅ Implementado Correctamente | 6 | - |
| ⚠️ Parcial / Mejora Necesaria | 3 | - |
| 🔴 Crítico (P0) | 1 | Requiere evaluación |
| 🟡 Importante (P1) | 3 | Mejoras recomendadas |

---

## ✅ ACCIONES PROPUESTAS

### Fase Inmediata (P0)

1. **Evaluar necesidad de soft delete:**
   - Revisar normativa de salud (retención de datos)
   - Decidir si soft delete es requerido
   - Si es necesario, implementar `deletedAt` en modelos críticos

### Fase Pre-GO LIVE (P1)

2. **Agregar índices compuestos:**
   - `Consultation(doctorId, status)`
   - `Payment(payoutStatus, payoutBatchId)`
   - Monitorear performance

3. **Optimizar queries:**
   - Revisar queries con `include` anidados
   - Usar `select` para limitar campos
   - Especialmente en listados

4. **Documentar rollback:**
   - Proceso de rollback manual
   - Migraciones de rollback si es necesario
   - Probar en staging

---

## 🎯 CRITERIOS DE ÉXITO PARA FASE 3

La auditoría de base de datos está completa cuando:

- ✅ Schema revisado completamente
- ✅ Queries auditadas para N+1 y performance
- ✅ Migraciones verificadas
- ✅ Documento DB_AUDIT.md creado
- ✅ Plan de acción para hallazgos P0/P1

---

**Última actualización:** 2025-01-XX  
**Próximo paso:** FASE 4 - Calidad (lint, typecheck, tests)

