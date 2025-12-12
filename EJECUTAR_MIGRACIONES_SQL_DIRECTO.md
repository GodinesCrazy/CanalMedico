# 🚀 Ejecutar Migraciones SQL Directamente en Railway

## ⚡ Solución Inmediata - Sin Esperar Deployment

Ya que el endpoint `/api/seed/migrate` aún no está disponible en Swagger, puedes ejecutar las migraciones directamente usando SQL en la base de datos de Railway.

---

## 📋 SQL Completo para Ejecutar

Copia y ejecuta este SQL completo en tu base de datos PostgreSQL de Railway:

```sql
-- ============================================
-- MIGRACIÓN: Disponibilidad Automática y Solicitudes de Registro
-- ============================================

-- 1. Agregar campos a la tabla doctors
ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "modoDisponibilidad" TEXT NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "horariosAutomaticos" TEXT;

-- 2. Crear tabla doctor_signup_requests
CREATE TABLE IF NOT EXISTS "doctor_signup_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rut" TEXT,
    "specialty" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "clinicOrCenter" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    CONSTRAINT "doctor_signup_requests_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices para doctor_signup_requests
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_status_idx" 
ON "doctor_signup_requests"("status");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_email_idx" 
ON "doctor_signup_requests"("email");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_createdAt_idx" 
ON "doctor_signup_requests"("createdAt");

-- 4. Verificar que los campos se agregaron correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('modoDisponibilidad', 'horariosAutomaticos');

-- 5. Verificar que la tabla se creó correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'doctor_signup_requests';
```

---

## 🎯 Opción 1: Ejecutar SQL desde Railway PostgreSQL

### Pasos:

1. **Accede a Railway:**
   - Ve a [https://railway.app](https://railway.app)
   - Selecciona tu proyecto `CanalMedico`

2. **Abre tu Base de Datos PostgreSQL:**
   - Haz clic en el servicio de PostgreSQL
   - Ve a la pestaña **"Data"** o **"Query"**
   - O haz clic en **"Connect"** para ver las credenciales

3. **Ejecuta el SQL:**
   - Copia todo el SQL de arriba
   - Pégalo en el editor SQL
   - Haz clic en **"Run"** o **"Execute"**

4. **Verifica:**
   - Deberías ver mensajes de éxito
   - Los SELECT al final te mostrarán que las columnas y tabla se crearon

---

## 🎯 Opción 2: Ejecutar desde Terminal de Railway (Backend)

Si prefieres usar la terminal del servicio backend:

### Pasos:

1. **Abre Terminal del Backend en Railway:**
   - Ve a tu proyecto en Railway
   - Selecciona el servicio del **backend**
   - Ve a la pestaña **"Deployments"** o **"Settings"**
   - Busca **"Terminal"** o **"Service Terminal"**
   - Abre la terminal

2. **Ejecuta el Comando:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

3. **Verifica la Salida:**
   - Deberías ver mensajes de Prisma indicando que el schema se sincronizó
   - Los campos y tablas se crearán automáticamente

---

## 🎯 Opción 3: Usar psql desde tu Máquina Local

Si tienes `psql` instalado y las credenciales de la base de datos:

### Pasos:

1. **Obtén la DATABASE_URL de Railway:**
   - Ve a tu servicio PostgreSQL en Railway
   - Ve a **"Variables"** o **"Connect"**
   - Copia la `DATABASE_URL`

2. **Ejecuta psql:**
   ```bash
   psql "DATABASE_URL_AQUI" -f migracion.sql
   ```

   O pega el SQL directamente:
   ```bash
   psql "DATABASE_URL_AQUI" -c "ALTER TABLE doctors ADD COLUMN IF NOT EXISTS modoDisponibilidad TEXT NOT NULL DEFAULT 'MANUAL';"
   ```

---

## ✅ Verificación Post-Migración

Después de ejecutar las migraciones, verifica:

### 1. Verificar Campos en Tabla Doctors

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('modoDisponibilidad', 'horariosAutomaticos');
```

**Resultado Esperado:**
```
column_name          | data_type | column_default
---------------------|-----------|----------------
modoDisponibilidad   | text      | 'MANUAL'
horariosAutomaticos  | text      | NULL
```

### 2. Verificar Tabla doctor_signup_requests

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'doctor_signup_requests';
```

**Resultado Esperado:**
```
table_name
----------------------
doctor_signup_requests
```

### 3. Verificar Índices

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'doctor_signup_requests';
```

**Resultado Esperado:** Deberías ver 3 índices (status, email, createdAt)

### 4. Probar Endpoint (Después del Deployment)

Una vez que el backend se actualice con el nuevo código:

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/signup-requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test",
    "email": "test@ejemplo.com",
    "specialty": "Medicina General"
  }'
```

Si funciona sin errores, las migraciones se ejecutaron correctamente.

---

## 🔄 Después de Ejecutar las Migraciones

1. **Verifica que el backend se reinicie** sin errores
2. **Prueba las nuevas funcionalidades:**
   - Disponibilidad automática en Settings
   - Formato CLP en Dashboard
   - Formulario de solicitud de registro

---

## 📝 Notas Importantes

1. **IF NOT EXISTS:** El SQL usa `IF NOT EXISTS` para que sea seguro ejecutarlo múltiples veces
2. **DEFAULT 'MANUAL':** Todos los médicos existentes tendrán modo manual por defecto (compatible con lo anterior)
3. **Sin pérdida de datos:** Los campos nuevos son opcionales o tienen valores por defecto, no se pierden datos existentes

---

**¡Ejecuta el SQL y las migraciones estarán listas!** 🚀

