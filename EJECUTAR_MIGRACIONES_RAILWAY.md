# 🚀 Ejecutar Migraciones en Railway

## ✅ Opción 1: Usar el Endpoint (MÁS FÁCIL - Recomendado)

Ya existe un endpoint que ejecuta las migraciones automáticamente:

### Pasos:

1. **Ve a Swagger:**
   ```
   https://canalmedico-production.up.railway.app/api-docs
   ```

2. **Busca:** `POST /api/seed/migrate`

3. **Haz clic en "Try it out"** → Luego **"Execute"**

4. **Espera la respuesta** - Debería decir:
   ```json
   {
     "success": true,
     "message": "Migración ejecutada exitosamente"
   }
   ```

5. **¡Listo!** Las tablas deberían estar creadas ahora

---

## 📟 Opción 2: Usar el Terminal de Railway

Si prefieres usar el terminal directamente:

### Pasos para Abrir el Terminal:

1. **Ve a Railway:**
   - https://railway.app
   - Selecciona tu proyecto **CanalMedico**

2. **Abre el servicio del backend:**
   - Haz clic en el servicio **"CanalMedico"** (no el frontend)

3. **Abre la terminal:**
   - **Opción A - Desde Deployments:**
     - Ve a la pestaña **"Deployments"**
     - Haz clic en el deployment más reciente (el que está marcado como "ACTIVE")
     - Haz clic en el icono de **terminal** (📟) o en **"View logs"**
     - En la parte inferior de los logs, debería haber una **barra de terminal**
   
   - **Opción B - Desde Settings:**
     - Ve a la pestaña **"Settings"**
     - Busca **"Service Terminal"** o **"Open Terminal"**
     - Haz clic en **"Open Terminal"**

4. **Ejecuta el comando:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

5. **Espera a que termine** - Debería mostrar que las tablas se crearon

---

## 🎯 Opción 3: Ejecutar Desde Swagger con cURL

Si prefieres usar cURL directamente:

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/seed/migrate
```

---

## ✅ Después de Ejecutar las Migraciones

Una vez que las tablas estén creadas:

### 1. Crear Usuarios de Prueba:

**Ve a Swagger:**
- `https://canalmedico-production.up.railway.app/api-docs`
- Busca: `POST /api/seed`
- Haz clic en "Try it out" → "Execute"

Esto creará:
- Usuario Doctor: `doctor1@ejemplo.com` / `doctor123`
- Usuario Admin: `admin@canalmedico.com` / `admin123`
- Usuario Paciente: `paciente1@ejemplo.com` / `patient123`

### 2. Probar el Login:

**Ve al frontend:**
- `https://canalmedico-web-production.up.railway.app/login`
- Ingresa: `doctor1@ejemplo.com` / `doctor123`
- **Debería funcionar ahora** ✅

---

## 🆘 Si el Endpoint No Funciona

Si el endpoint `/api/seed/migrate` no funciona, intenta:

1. **Verificar que el backend esté desplegado:**
   - Ve a Railway → Servicio `CanalMedico` → Deployments
   - Verifica que el último deployment esté en estado "ACTIVE"

2. **Verificar los logs:**
   - Revisa los logs del backend para ver si hay errores

3. **Usar el terminal directamente** (Opción 2)

---

## 📝 Notas

- `db push` sincroniza el schema directamente sin crear archivos de migración
- `--accept-data-loss` permite que se sobrescriban datos existentes
- Las tablas se crearán según el schema de Prisma en `backend/prisma/schema.prisma`

