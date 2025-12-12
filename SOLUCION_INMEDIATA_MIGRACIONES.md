# ⚡ Solución Inmediata - Ejecutar Migraciones AHORA

## 🎯 Problema

El endpoint `/api/seed/migrate` no aparece en Swagger porque el backend desplegado en Railway aún no tiene la versión más reciente con la documentación Swagger actualizada.

## ✅ Solución: Ejecutar SQL Directamente

**Esta es la forma MÁS RÁPIDA y funciona inmediatamente sin esperar deployment.**

---

## 🚀 Pasos Rápidos (5 minutos)

### Paso 1: Abre tu Base de Datos en Railway

1. Ve a: [https://railway.app](https://railway.app)
2. Selecciona tu proyecto **`CanalMedico`**
3. Haz clic en el servicio de **PostgreSQL** (no el backend, sino la base de datos)
4. Ve a la pestaña **"Data"** o **"Query"**
   - Si no ves esta opción, haz clic en **"Connect"** y copia la `DATABASE_URL`

### Paso 2: Ejecuta el SQL

1. **Copia TODO el contenido** del archivo **`MIGRACION_SQL_COMPLETA.sql`** que está en la raíz del proyecto
2. **Pégalo** en el editor SQL de Railway
3. **Haz clic en "Run"** o **"Execute"**
4. **Espera** unos segundos (normalmente toma 5-15 segundos)

### Paso 3: Verifica

Deberías ver mensajes como:
- ✅ "ALTER TABLE"
- ✅ "CREATE TABLE"
- ✅ "CREATE INDEX"

Si ves estos mensajes, **¡las migraciones se ejecutaron correctamente!** ✅

---

## 📋 SQL para Copiar (Archivo: `MIGRACION_SQL_COMPLETA.sql`)

```sql
-- Agregar campos a la tabla doctors
ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "modoDisponibilidad" TEXT NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "doctors" 
ADD COLUMN IF NOT EXISTS "horariosAutomaticos" TEXT;

-- Crear tabla doctor_signup_requests
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

-- Crear índices
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_status_idx" 
ON "doctor_signup_requests"("status");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_email_idx" 
ON "doctor_signup_requests"("email");

CREATE INDEX IF NOT EXISTS "doctor_signup_requests_createdAt_idx" 
ON "doctor_signup_requests"("createdAt");
```

---

## ✅ Verificación Post-Migración

### 1. Verifica que los campos se agregaron:

Ejecuta este SQL en Railway:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('modoDisponibilidad', 'horariosAutomaticos');
```

**Resultado esperado:** Deberías ver 2 filas con `modoDisponibilidad` y `horariosAutomaticos`

### 2. Verifica que la tabla se creó:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'doctor_signup_requests';
```

**Resultado esperado:** Deberías ver 1 fila con `doctor_signup_requests`

---

## 🎉 Después de Ejecutar las Migraciones

Una vez ejecutadas las migraciones:

1. ✅ **Las nuevas funcionalidades estarán disponibles:**
   - Disponibilidad automática en Configuración
   - Formato CLP en todas las pantallas
   - Formulario de solicitud de registro en login

2. ✅ **Verifica que el backend funcione:**
   - Revisa los logs de Railway (debería reiniciarse sin errores)
   - Prueba hacer login en el frontend

3. ✅ **Prueba las nuevas funcionalidades:**
   - Ve a Configuración → Deberías ver "Configuración de Disponibilidad"
   - Ve a Dashboard → Deberías ver ingresos en formato CLP
   - Ve a Login → Haz clic en "Contactar administrador" → Deberías ver el formulario

---

## 🔄 Alternativa: Terminal de Railway Backend

Si prefieres usar la terminal del backend:

1. **Abre terminal del backend** en Railway
2. **Ejecuta:**
   ```bash
   npx prisma db push --accept-data-loss
   ```
3. **Espera** a que termine (deberías ver mensajes de Prisma)

---

**¡Ejecuta el SQL y estarás listo para probar las nuevas funcionalidades!** 🚀

