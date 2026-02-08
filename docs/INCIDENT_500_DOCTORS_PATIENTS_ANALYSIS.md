# INFORME TÉCNICO — Análisis de Errores 500 en Endpoints Auxiliares

**Fecha:** 2025-02-07  
**Rol:** Backend Incident Analyst  
**Proyecto:** CanalMedico  
**Estado:** ANÁLISIS — Sin cambios implementados

---

## RESUMEN EJECUTIVO

Los endpoints GET /api/doctors, GET /api/admin/doctors y GET /api/patients/user/:userId devuelven HTTP 500. La **causa raíz más probable** es un desajuste entre el schema de Prisma y el esquema real de la base de datos en producción: columnas presentes en el schema pero ausentes en las tablas, provocando errores Prisma P2022 o equivalentes al ejecutar consultas con `findMany` / `findUnique` sin `select` explícito.

---

## FASE 1 — MAPEO DE ENDPOINTS

| Endpoint | Controlador | Servicio | Método ejecutado |
|----------|-------------|----------|------------------|
| GET /api/doctors | doctors.controller.ts | doctors.service.ts | `doctorsService.getAll(page, limit)` |
| GET /api/admin/doctors | admin.controller.ts | admin.service.ts | `adminService.getAllDoctors(page, limit)` |
| GET /api/patients/user/:userId | patients.controller.ts | patients.service.ts | `patientsService.getByUserId(userId)` |

**Rutas:**
- `backend/src/modules/doctors/doctors.routes.ts` línea 17: `router.get('/', doctorsController.getAll.bind(...))`
- `backend/src/modules/admin/admin.routes.ts` línea 77: `router.get('/doctors', adminController.getAllDoctors.bind(...))`
- `backend/src/modules/patients/patients.routes.ts` línea 54: `router.get('/user/:userId', ..., patientsController.getByUserId.bind(...))`

---

## FASE 2 — ANÁLISIS DE PRISMA

### 2.1 GET /api/doctors ? doctorsService.getAll

**Archivo:** `backend/src/modules/doctors/doctors.service.ts`  
**Líneas:** 8-36

```typescript
prisma.doctor.findMany({
  skip, take,
  include: {
    user: { select: { id: true, email: true, role: true } },
  },
  orderBy: { createdAt: 'desc' },
})
```

- No hay `select` en el modelo Doctor: se recuperan **todas** las columnas del Doctor según el schema.
- El schema de Doctor incluye columnas que no aparecen en las migraciones revisadas: `identidadValidada`, `profesionValidada`, `rnpiEstado`, `rnpiProfesion`, `rnpiFechaVerificacion`, `verificacionEstadoFinal`, `logsValidacion`, `identityVerificationData`, `rnpiVerificationData`, `lastVerificationAt`, `verificationErrors`.

### 2.2 GET /api/admin/doctors ? adminService.getAllDoctors

**Archivo:** `backend/src/modules/admin/admin.service.ts`  
**Líneas:** 193-237

```typescript
prisma.doctor.findMany({
  skip, take,
  include: {
    user: { select: { id: true, email: true, role: true, createdAt: true } },
    _count: { select: { consultations: true } },
  },
  orderBy: { createdAt: 'desc' },
})
```

- Misma situación: se obtienen todas las columnas del Doctor.
- El `include` de User usa `createdAt`; la tabla `users` sí tiene `createdAt` en las migraciones.

### 2.3 GET /api/patients/user/:userId ? patientsService.getByUserId

**Archivo:** `backend/src/modules/patients/patients.service.ts`  
**Líneas:** 32-55

```typescript
prisma.patient.findUnique({
  where: { userId },
  include: {
    user: { select: { id: true, email: true, role: true } },
  },
})
```

- No hay `select` en Patient: se recuperan **todas** las columnas del Patient según el schema.
- El schema de Patient incluye: `rut`, `birthDate`, `gender`, `address`, `phoneNumber`.
- En las migraciones revisadas solo se añade `phoneNumber` a `patients` (FASE1_FUNDACION). No se han visto migraciones para `rut`, `birthDate`, `gender`, `address`.

### 2.4 Hipótesis P2022

Si las columnas del schema no existen en la base de datos de producción, Prisma lanzará P2022 u otros errores de acceso a columna inexistente. El error se propaga, el errorHandler devuelve 500 y el cliente recibe "Error interno del servidor".

---

## FASE 3 — ANÁLISIS DE SEED Y DATOS

| Entidad | Seed / Origen | Suposición en endpoints |
|---------|---------------|--------------------------|
| Doctor | `prisma/seed.ts`, `seed.routes.ts` | No se asume existencia; `findMany` puede devolver [] sin lanzar error. |
| Patient | `prisma/seed.ts` | No se asume existencia; `findUnique` puede devolver `null` y se lanza `createError(404)`. |

Los fallos observados son 500, no 404, por lo que el origen más probable está en el acceso a datos (Prisma) y no en la inexistencia de filas.

---

## FASE 4 — MANEJO DE ERRORES

| Archivo | try/catch | Tratamiento de errores |
|---------|-----------|--------------------------|
| doctors.service.ts | Sí (líneas 9-35, 33-35) | `logger.error` + `throw error` ? se propaga como 500 si no es createError. |
| admin.service.ts | Sí (líneas 194-236, 232-235) | `logger.error` + `throw createError(..., 500)` ? siempre 500. |
| patients.service.ts | Sí (líneas 33-55, 53-54) | `logger.error` + `throw error` ? 500 si el error no es createError. |

Cualquier error de Prisma (P2022, etc.) no se marca como operacional, por lo que termina en 500.

---

## FASE 5 — CAUSA RAÍZ Y PROPUESTAS

### Causa raíz más probable

**Desajuste schema–DB (P2022):** El schema de Prisma define columnas que no existen en la base de datos de producción. Al usar `findMany` / `findUnique` sin `select` explícito, Prisma intenta leer todas las columnas del modelo y falla cuando alguna columna no existe.

**Columnas sospechosas:**

- **Doctor:** `identidadValidada`, `profesionValidada`, `rnpiEstado`, `rnpiProfesion`, `rnpiFechaVerificacion`, `verificacionEstadoFinal`, `logsValidacion`, `identityVerificationData`, `rnpiVerificationData`, `lastVerificationAt`, `verificationErrors` (no aparecen en las migraciones revisadas).
- **Patient:** `rut`, `birthDate`, `gender`, `address` (no aparecen en las migraciones revisadas para `patients`).

---

## PROPUESTAS DE CORRECCIÓN

### Opción A — `select` explícito (mínimo, defensivo)

**Endpoint:** GET /api/doctors  
**Archivo:** `backend/src/modules/doctors/doctors.service.ts`  
**Líneas:** 13-27

- Sustituir `include` por un `select` explícito que incluya solo columnas confirmadas en las migraciones:
  - Doctor: `id`, `userId`, `name`, `rut`, `speciality`, `horarios`, `tarifaConsulta`, `tarifaUrgencia`, `estadoOnline`, `payoutMode`, `payoutDay`, `bankAccountInfo`, `horariosAutomaticos`, `whatsappBusinessNumber`, `whatsappBusinessId`, `createdAt`, `updatedAt`.
- Añadir `user` en el `select` con `id`, `email`, `role`.

**Impacto:** Solo se devuelven campos conocidos; si faltan columnas en DB, se excluyen del `select` para evitar P2022.  
**Contratos:** Posible reducción de campos en la respuesta si el cliente espera más; evaluar impacto en frontend.

---

**Endpoint:** GET /api/admin/doctors  
**Archivo:** `backend/src/modules/admin/admin.service.ts`  
**Líneas:** 199-218

- Aplicar la misma lógica: usar `select` explícito para Doctor y User en lugar de `include` sin restricción.
- Mantener `_count: { select: { consultations: true } }` si el schema lo soporta.

**Impacto:** Idem que GET /api/doctors.  
**Contratos:** Igual consideración sobre campos que el frontend admin pueda esperar.

---

**Endpoint:** GET /api/patients/user/:userId  
**Archivo:** `backend/src/modules/patients/patients.service.ts`  
**Líneas:** 34-45

- Sustituir `include` por `select` explícito en Patient:
  - Patient: `id`, `userId`, `name`, `age`, `medicalHistory`, `phoneNumber`, `createdAt`, `updatedAt` (columnas presentes en migraciones revisadas).
- Incluir `user: { select: { id: true, email: true, role: true } }` en el `select`.

**Impacto:** Se evita P2022 en `patients` por columnas inexistentes.  
**Contratos:** Si el frontend usa `rut`, `birthDate`, `gender`, `address`, habrá que añadirlas al `select` cuando existan en la DB, o migrarlas.

---

### Opción B — Migración para columnas faltantes

- Crear una migración que añada a `doctors` y `patients` las columnas definidas en el schema pero no creadas por migraciones anteriores.
- Ejecutarla en producción con `prisma migrate deploy` o el flujo que se use actualmente.

**Impacto:** Alinea schema y DB; permite seguir usando `include` sin `select` restringido.  
**Contratos:** No se alteran contratos; puede requerir coordinación de despliegue y posibles defaults para datos existentes.

---

### Opción C — Diagnóstico con logs

- Revisar logs de Railway en el momento de la petición a `/api/doctors` y `/api/patients/user/:userId`.
- Buscar stack traces y mensajes de Prisma (P2022, “column does not exist”, etc.).

**Objetivo:** Confirmar P2022 u otro código Prisma antes de aplicar Opción A o B.

---

## RECOMENDACIÓN

1. **Corto plazo:** Implementar Opción A en los tres endpoints para evitar 500 de forma defensiva.  
2. **Medio plazo:** Crear la migración (Opción B) para completar las tablas y alinear schema y DB.  
3. **Validación:** Usar Opción C para validar la hipótesis antes de aplicar cambios.

---

## CONFIRMACIÓN DE CONTRATOS

- La Opción A puede cambiar el shape de la respuesta si se omiten campos que el cliente usa; se recomienda revisar consumidores de la API.
- La Opción B no altera contratos, solo el esquema de la base de datos.
- Ninguna opción implica modificar rutas, métodos HTTP ni estructura básica de la API.

---

**Última actualización:** 2025-02-07  
**Próximo paso:** Aprobación y elección de opción(es) a implementar.
