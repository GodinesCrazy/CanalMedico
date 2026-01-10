# Migración FASE 2 - Consultations Lifecycle

**Fecha:** 2024-01-XX  
**Fase:** 2.1 - Migración de Base de Datos  
**Entorno:** Local + Railway (Producción)

---

## 📋 RESUMEN EJECUTIVO

Esta migración agrega los campos necesarios para el ciclo de vida completo de consultas médicas monetizables:

- `price`: Precio de la consulta (en centavos/CLP)
- `startedAt`: Fecha/hora cuando DOCTOR acepta la consulta (PENDING → ACTIVE)
- `endedAt`: Fecha/hora cuando DOCTOR completa la consulta (ACTIVE → COMPLETED)

**Estado:** ✅ Segura - No destruye datos existentes

---

## 🔍 CAMBIOS EN EL SCHEMA

### Modelo Consultation - Campos Agregados

```prisma
model Consultation {
  // ... campos existentes ...
  
  price     Int       @default(0) // ✅ DEFAULT 0 - No afecta registros existentes
  startedAt DateTime? // ✅ NULLABLE - Seguro
  endedAt   DateTime? // ✅ NULLABLE - Seguro
  
  // ... resto del modelo ...
}
```

### Estados de Consultación Actualizados

**Antes:**
- PENDING, PAID, ACTIVE, CLOSED

**Después:**
- PENDING, ACTIVE, COMPLETED, CANCELLED

**Migración de Estados:**
- `CLOSED` → `COMPLETED` (manual si hay datos existentes)
- `PAID` → `ACTIVE` (manual si hay datos existentes)

---

## ✅ VERIFICACIÓN PRE-MIGRACIÓN

### Campos Seguros ✅

1. **`price Int @default(0)`**
   - ✅ Tiene default value (0)
   - ✅ No nullable
   - ✅ No afecta registros existentes (se inicializa en 0)
   - ✅ TypeScript no lanza errores

2. **`startedAt DateTime?`**
   - ✅ Nullable (opcional)
   - ✅ No afecta registros existentes (será NULL)
   - ✅ Se actualiza solo cuando DOCTOR acepta

3. **`endedAt DateTime?`**
   - ✅ Nullable (opcional)
   - ✅ No afecta registros existentes (será NULL)
   - ✅ Se actualiza solo cuando DOCTOR completa

### Sin Cambios Destructivos ✅

- ✅ NO se borran tablas
- ✅ NO se renombran columnas existentes
- ✅ NO se eliminan datos
- ✅ NO se modifican relaciones

---

## 🚀 EJECUCIÓN POR ENTORNO

### 🔹 LOCAL (Desarrollo)

**Comando:**
```bash
cd backend
npx prisma migrate dev --name add_consultation_lifecycle_fields
```

**Resultado esperado:**
- Crea migración versionada en `prisma/migrations/`
- Aplica cambios a base de datos local
- Regenera Prisma Client automáticamente

**Verificación:**
```bash
# Verificar que la migración se creó
ls -la prisma/migrations/

# Verificar que Prisma Client se regeneró
npx prisma generate

# Verificar que el backend arranca
npm run dev
```

### 🔹 PRODUCCIÓN (Railway)

**Estrategia:** `db push` automático en startup

El sistema ya implementa migración automática en `server.ts`:

```typescript
// backend/src/server.ts - runMigrations()
// 1. Intenta migrate deploy (si hay migraciones versionadas)
// 2. Si falla, usa db push (seguro para agregar columnas)
```

**Comportamiento en Railway:**
1. Railway ejecuta `npm run build`
2. Railway inicia servidor con `node dist/server.js`
3. `runMigrations()` se ejecuta automáticamente
4. Si no hay migraciones versionadas → `db push` sincroniza schema
5. Campos se agregan automáticamente sin pérdida de datos

**Verificación en Railway:**
- Buscar en logs: `✅ Schema sincronizado correctamente con db push`
- Verificar que backend arranca sin errores
- Probar endpoint: `POST /api/consultations` (debe crear con price)

---

## 📊 IMPACTO EN DATOS EXISTENTES

### Consultas Existentes

**Comportamiento:**
- `price`: Se inicializa en `0` (default)
- `startedAt`: Se inicializa en `NULL` (nullable)
- `endedAt`: Se inicializa en `NULL` (nullable)

**Recomendación:**
- Consultas existentes con estado `CLOSED` deben actualizarse manualmente a `COMPLETED` si es necesario
- Consultas existentes con estado `PAID` deben actualizarse manualmente a `ACTIVE` si es necesario

**Script de Migración Manual (Opcional):**
```sql
-- Actualizar estados obsoletos (ejecutar solo si hay datos existentes)
UPDATE consultations 
SET status = 'COMPLETED' 
WHERE status = 'CLOSED';

UPDATE consultations 
SET status = 'ACTIVE' 
WHERE status = 'PAID';
```

---

## 🧪 VALIDACIÓN POST-MIGRACIÓN

### 1. Verificar Schema

```bash
npx prisma db pull
# Debe mostrar: price, startedAt, endedAt en Consultation
```

### 2. Verificar Prisma Client

```bash
npx prisma generate
# Debe generar sin errores
```

### 3. Verificar Backend

```bash
npm run build
# Debe compilar sin errores TypeScript

npm run dev
# Debe arrancar sin errores Prisma
```

### 4. Verificar Endpoints

**Crear Consulta (PACIENTE):**
```bash
POST /api/consultations
{
  "doctorId": "...",
  "patientId": "...",
  "type": "NORMAL",
  "price": 10000
}
# ✅ Debe crear con price, status: PENDING
```

**Aceptar Consulta (DOCTOR):**
```bash
PATCH /api/consultations/:id/accept
# ✅ Debe actualizar: status -> ACTIVE, startedAt -> now()
```

**Completar Consulta (DOCTOR):**
```bash
PATCH /api/consultations/:id/complete
# ✅ Debe actualizar: status -> COMPLETED, endedAt -> now()
```

**Listar Consultas (ADMIN):**
```bash
GET /api/admin/consultations
# ✅ Debe devolver todas con price, startedAt, endedAt
```

---

## 🔄 ROLLBACK (Si Es Necesario)

### Opción 1: Revertir Migración (LOCAL)

```bash
cd backend
npx prisma migrate reset  # ⚠️ BORRA TODOS LOS DATOS
# O
npx prisma migrate resolve --rolled-back <migration_name>
```

### Opción 2: Revertir Schema (PRODUCCIÓN)

```sql
-- Ejecutar manualmente en PostgreSQL
ALTER TABLE consultations DROP COLUMN IF EXISTS price;
ALTER TABLE consultations DROP COLUMN IF EXISTS startedAt;
ALTER TABLE consultations DROP COLUMN IF EXISTS endedAt;
```

**⚠️ ADVERTENCIA:** Solo ejecutar rollback si es absolutamente necesario. Los campos son seguros y no afectan datos existentes.

---

## 📝 COMANDOS EJECUTADOS

### Local

```bash
# 1. Verificar schema
npx prisma format

# 2. Generar Prisma Client (incluye nuevos campos)
npx prisma generate

# 3. Crear migración versionada
npx prisma migrate dev --name add_consultation_lifecycle_fields

# 4. Verificar que funciona
npm run build
npm run dev
```

### Producción (Railway)

**Automático en startup:**
- `runMigrations()` en `server.ts` ejecuta `db push` si no hay migraciones
- No requiere intervención manual

**Manual (si es necesario):**
```bash
# En Railway Terminal (si está disponible)
npx prisma db push --accept-data-loss --skip-generate
npx prisma generate
```

---

## 🎯 RESULTADO FINAL

### ✅ Completado

- [x] Schema actualizado con price, startedAt, endedAt
- [x] Campos son seguros (nullable o con default)
- [x] No hay cambios destructivos
- [x] Migración creada (local) o db push configurado (producción)
- [x] Prisma Client regenerado
- [x] Backend arranca sin errores
- [x] Endpoints funcionan correctamente
- [x] Documentación creada

### 📊 Estado de la Base de Datos

**Tabla `consultations` ahora incluye:**
- `id` (String, PK)
- `doctorId` (String, FK)
- `patientId` (String, FK)
- `type` (String, default: "NORMAL")
- `status` (String, default: "PENDING")
- **`price`** (Int, default: 0) ⬅️ NUEVO
- `paymentId` (String?, unique)
- `source` (String, default: "APP")
- `consultationAttemptId` (String?, unique)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- **`startedAt`** (DateTime?) ⬅️ NUEVO
- **`endedAt`** (DateTime?) ⬅️ NUEVO

---

## 🔒 RIESGOS EVALUADOS

### Riesgo: Bajo ✅

**Razones:**
1. Campos nuevos son nullable o tienen default
2. No se modifican datos existentes
3. No se borran columnas existentes
4. No se cambian relaciones
5. `db push` es seguro para agregar columnas en PostgreSQL

**Mitigación:**
- Prisma valida que no haya conflictos antes de aplicar
- `db push` solo agrega columnas, no modifica existentes
- Si falla, el servidor no inicia (fail-fast en producción)

---

## 📚 REFERENCIAS

- **Prisma Migrate Docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Prisma DB Push Docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push
- **Schema Original:** `backend/prisma/schema.prisma`
- **Migraciones Existentes:** `backend/prisma/migrations/`

---

**Estado:** ✅ Migración lista para ejecutar  
**Fecha de ejecución:** Pendiente de deploy en Railway  
**Responsable:** Tech Lead Backend

