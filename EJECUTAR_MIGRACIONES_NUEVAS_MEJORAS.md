# 🚀 Ejecutar Migraciones para las Nuevas Mejoras (CanalMedico)

Este documento explica cómo ejecutar las migraciones para las tres nuevas mejoras implementadas:

1. **Sistema de disponibilidad automática del médico**
2. **Cambio de moneda a peso chileno (CLP)**
3. **Formulario de solicitud de registro médico**

---

## Cambios en la Base de Datos

Las migraciones agregan:

1. **Tabla `doctor_signup_requests`**: Para almacenar las solicitudes de registro médico
2. **Campos en tabla `doctors`**:
   - `modoDisponibilidad` (String, default: 'MANUAL')
   - `horariosAutomaticos` (String, nullable, JSON)

---

## Opción 1: Usar el Endpoint de Migración (Recomendado y más fácil)

### Pasos:

1. **Abre la Documentación de Swagger UI:**
   - Ve a la URL de tu backend API en Railway, seguida de `/api-docs`:
     ```
     https://canalmedico-production.up.railway.app/api-docs
     ```

2. **Busca el Endpoint de Migración:**
   - En la interfaz de Swagger, busca la sección `Seed` (haz clic para expandirla).
   - Verás dos endpoints:
     - `POST /api/seed` - Para crear usuarios de prueba (este NO es el correcto)
     - `POST /api/seed/migrate` - **Este es el que necesitas** ✅

3. **Ejecuta el Endpoint:**
   - Haz clic en `POST /api/seed/migrate` para expandirlo.
   - Haz clic en el botón **"Try it out"** (verde, arriba a la derecha).
   - Verás que **no requiere parámetros** (es normal, no necesita ninguno).
   - Haz clic en el botón azul **"Execute"** (abajo).

4. **Verifica la Respuesta:**
   - La respuesta debería ser un JSON similar a este:
     ```json
     {
       "success": true,
       "message": "Migración ejecutada exitosamente",
       "output": "..." // Contendrá los logs de Prisma
     }
     ```
   - Si ves `success: true`, las tablas y campos se han creado correctamente.

---

## Opción 2: Usar la Terminal de Railway (Alternativa)

Si por alguna razón la Opción 1 no funciona o prefieres usar la terminal directamente:

### Pasos:

1. **Accede a tu Proyecto en Railway:**
   - Ve a [https://railway.app](https://railway.app)
   - Selecciona tu proyecto `CanalMedico`.

2. **Abre el Servicio del Backend:**
   - Haz clic en el servicio llamado `CanalMedico` (el que corresponde al backend, no al frontend).

3. **Abre la Terminal del Servicio:**
   - **Opción A (desde Deployments):**
     - Ve a la pestaña **"Deployments"**.
     - Haz clic en el deployment más reciente (el que dice `ACTIVE`).
     - En la vista de logs del deployment, busca y haz clic en el icono de **terminal** (generalmente un cuadrado con un cursor) o en el botón "Open Terminal" si está disponible.
   - **Opción B (desde Settings):**
     - Ve a la pestaña **"Settings"**.
     - Desplázate hacia abajo hasta encontrar la sección **"Service Terminal"** o un botón "Open Terminal".

4. **Ejecuta el Comando de Migración:**
   - Una vez que la terminal esté abierta y conectada a tu contenedor de backend, ejecuta el siguiente comando:
     ```bash
     npx prisma db push --accept-data-loss
     ```
   - Este comando sincronizará tu esquema de Prisma con la base de datos, creando todas las tablas y campos nuevos.

5. **Verifica la Salida:**
   - Deberías ver mensajes de Prisma indicando que el esquema se ha sincronizado y las tablas/campos se han creado.

---

## Opción 3: Ejecutar SQL Directamente (Si las opciones anteriores no funcionan)

Si prefieres ejecutar el SQL directamente en tu base de datos PostgreSQL de Railway:

1. **Obtén las Credenciales de la Base de Datos:**
   - En Railway, ve a tu servicio de PostgreSQL
   - Ve a la pestaña **"Variables"** o **"Connect"**
   - Copia la `DATABASE_URL`

2. **Ejecuta el SQL:**
   - Puedes usar cualquier cliente PostgreSQL (pgAdmin, DBeaver, psql, etc.)
   - Conecta usando la `DATABASE_URL`
   - Ejecuta el siguiente SQL:

```sql
-- Agregar campos a la tabla doctors
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "modoDisponibilidad" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "horariosAutomaticos" TEXT;

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
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_status_idx" ON "doctor_signup_requests"("status");
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_email_idx" ON "doctor_signup_requests"("email");
CREATE INDEX IF NOT EXISTS "doctor_signup_requests_createdAt_idx" ON "doctor_signup_requests"("createdAt");
```

---

## Después de Ejecutar las Migraciones

Una vez que las tablas y campos estén creados (usando cualquiera de las tres opciones):

1. **Verificar que el Backend Funcione:**
   - El servidor debería reiniciarse automáticamente en Railway
   - Verifica los logs para asegurarte de que no hay errores

2. **Probar las Nuevas Funcionalidades:**
   - **Disponibilidad Automática:**
     - Inicia sesión en el panel de médicos
     - Ve a Configuración
     - Deberías ver la sección "Configuración de Disponibilidad"
     - Prueba cambiar entre modo Manual y Automático

   - **Moneda CLP:**
     - Ve al Dashboard y verifica que los ingresos se muestren en formato CLP
     - Ve a Configuración y verifica que las tarifas muestren "CLP" en lugar de "USD"

   - **Solicitud de Registro:**
     - En la página de login, haz clic en "¿No tienes cuenta? Contacta al administrador"
     - Deberías ser redirigido al formulario de solicitud
     - Completa y envía una solicitud de prueba
     - Si eres admin, ve a "Solicitudes de Registro" en el menú lateral
     - Deberías poder ver y gestionar las solicitudes

---

## Resumen de las Mejoras Implementadas

### 1. Sistema de Disponibilidad Automática del Médico ✅
- Los médicos pueden configurar horarios automáticos de disponibilidad
- Modo Manual: el médico activa/desactiva manualmente (como antes)
- Modo Automático: el sistema calcula la disponibilidad según los horarios configurados
- La disponibilidad se calcula en tiempo real en el backend

### 2. Cambio de Moneda a Peso Chileno (CLP) ✅
- Todas las referencias a USD han sido eliminadas
- Formato consistente usando `formatCLP()` en todas las pantallas
- Tarifas y precios ahora se muestran en CLP con formato chileno ($12.000)

### 3. Formulario de Solicitud de Registro Médico ✅
- Formulario completo para solicitar acceso a la plataforma
- Accesible desde la página de login
- Panel de administración para revisar y gestionar solicitudes
- Estados: PENDING, REVIEWED, APPROVED, REJECTED

---

Si encuentras algún problema al ejecutar las migraciones o al probar las nuevas funcionalidades, revisa los logs del backend en Railway para obtener más detalles.

