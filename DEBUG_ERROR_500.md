# 🔍 Debug: Error 500 en Login

## 📋 Pasos para Diagnosticar

El error 500 indica que hay un problema en el servidor backend. Sigue estos pasos para identificarlo:

### 1️⃣ Revisar Logs del Backend en Railway

**Pasos:**
1. Ve a **Railway** → Servicio `CanalMedico` (backend)
2. Ve a la pestaña **"Logs"** o **"Deployments"** → Haz clic en el deployment más reciente → **"View logs"**
3. **Intenta hacer login** desde el frontend (o usa Swagger)
4. **Revisa los logs** que aparecen en tiempo real
5. **Busca líneas que digan:**
   - `ERROR`
   - `Error en login`
   - `500`
   - Stack traces (errores con líneas de código)

**¿Qué buscar?**
- Si dice "JWT_SECRET is not defined" → Falta configurar JWT_SECRET
- Si dice "Cannot connect to database" → Problema con DATABASE_URL
- Si dice "User not found" → Los usuarios no se crearon
- Si hay un stack trace → Copia el error completo

---

### 2️⃣ Verificar Variables de Entorno del Backend

**En Railway:**
1. Ve a **Railway** → Servicio `CanalMedico` → **"Variables"**
2. **Verifica que existan estas variables:**

```
✅ DATABASE_URL=${{Postgres.DATABASE_URL}}
✅ API_URL=https://canalmedico-production.up.railway.app
✅ JWT_SECRET=<debe tener mínimo 32 caracteres>
✅ JWT_REFRESH_SECRET=<debe tener mínimo 32 caracteres>
✅ FRONTEND_WEB_URL=https://canalmedico-web-production.up.railway.app
```

**Si falta alguna:**
- `DATABASE_URL`: Ve a Railway → Postgres → Variables → Copia `DATABASE_URL` y pega en el backend
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: Genera con:
  ```bash
  openssl rand -base64 32
  ```
  O usa Railway's secret generator
- `API_URL`: Debe ser `https://canalmedico-production.up.railway.app`
- `FRONTEND_WEB_URL`: Debe ser `https://canalmedico-web-production.up.railway.app`

**Después de agregar variables:**
- Haz **redeploy** del backend

---

### 3️⃣ Verificar que los Usuarios Existan

**Prueba directamente en Swagger:**

1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca: `POST /api/seed`
3. Haz clic en **"Execute"**
4. Debería retornar:
   ```json
   {
     "success": true,
     "message": "Base de datos poblada exitosamente"
   }
   ```

5. Luego prueba: `POST /api/auth/login` con:
   ```json
   {
     "email": "doctor1@ejemplo.com",
     "password": "doctor123"
   }
   ```

**Si el seed falla**, hay un problema con la base de datos o Prisma.
**Si el login falla**, copia el error que aparece en la respuesta.

---

### 4️⃣ Probar Endpoints Básicos

**Health Check:**
```bash
curl https://canalmedico-production.up.railway.app/health
```
Debería retornar: `{"status":"ok",...}`

**Root Endpoint:**
```bash
curl https://canalmedico-production.up.railway.app/
```
Debería retornar: `{"message":"CanalMedico API",...}`

**Si estos fallan**, el backend no está funcionando correctamente.

---

### 5️⃣ Verificar Variable del Frontend

**En Railway:**
1. Ve a **Railway** → Servicio `CanalMedico-Web` → **"Variables"**
2. Verifica que exista:
   ```
   VITE_API_URL=https://canalmedico-production.up.railway.app
   ```
3. Si no existe, créala y haz **redeploy** del frontend

---

## 🐛 Errores Comunes y Soluciones

### Error: "JWT_SECRET is not defined"
**Solución:**
- Ve a Railway → Backend → Variables
- Agrega `JWT_SECRET` con un valor de al menos 32 caracteres
- Agrega `JWT_REFRESH_SECRET` con un valor de al menos 32 caracteres
- Haz redeploy

### Error: "Cannot connect to database"
**Solución:**
- Verifica que `DATABASE_URL` esté configurada
- Verifica que el servicio Postgres esté corriendo en Railway
- Verifica que las migraciones se hayan ejecutado

### Error: "User not found" o "Email o contraseña incorrectos"
**Solución:**
- Ejecuta `POST /api/seed` para crear los usuarios
- Verifica que el email y password sean correctos

### Error: Stack trace con Prisma
**Solución:**
- Verifica que las migraciones estén ejecutadas
- Revisa los logs del backend para más detalles

---

## 📝 Información para Compartir

Si el problema persiste, comparte:

1. **Logs del backend** (especialmente los errores cuando intentas login)
2. **Respuesta de Swagger** cuando pruebas `POST /api/auth/login`
3. **Variables de entorno** que tienes configuradas (sin los valores secretos)
4. **Resultado de** `GET /health` y `GET /`

Esto ayudará a identificar el problema exacto.

