# 🔧 Solución al Error 500 en el Login

## 🔍 Diagnóstico del Problema

El error **500 (Internal Server Error)** al intentar hacer login puede tener varias causas:

### Posibles Causas:

1. **❌ Los usuarios de prueba no existen en la base de datos**
2. **❌ Variables de entorno no configuradas correctamente en el frontend**
3. **❌ CORS no está permitiendo el dominio del frontend**
4. **❌ JWT_SECRET o JWT_REFRESH_SECRET no configurados en el backend**
5. **❌ Error en la conexión a la base de datos**

---

## ✅ Soluciones Paso a Paso

### Paso 1: Verificar y Crear Usuarios de Prueba

Primero, asegúrate de que los usuarios de prueba existan en la base de datos:

#### Opción A: Usando el Endpoint de Seed (Recomendado)

1. **Abre Swagger UI:**
   ```
   https://canalmedico-production.up.railway.app/api-docs
   ```

2. **Busca el endpoint:** `POST /api/seed`

3. **Ejecuta el endpoint** (haz clic en "Try it out" → "Execute")

4. **Verifica la respuesta** - Debería mostrar:
   ```json
   {
     "success": true,
     "message": "Base de datos poblada exitosamente",
     "users": [...]
   }
   ```

#### Opción B: Usando cURL

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/seed
```

#### Opción C: Desde Railway Terminal

1. Ve a Railway → Servicio `CanalMedico` (backend)
2. Ve a **Deployments** → Haz clic en el deployment más reciente
3. Haz clic en **"View logs"** o abre la terminal
4. Ejecuta:
   ```bash
   npx ts-node prisma/seed.ts
   ```

---

### Paso 2: Verificar Variables de Entorno del Frontend

Asegúrate de que el frontend tenga configurada la URL correcta del backend en Railway:

1. **Ve a Railway** → Servicio `CanalMedico-Web` (frontend)
2. **Ve a la pestaña "Variables"**
3. **Verifica que existe:**
   ```
   VITE_API_URL=https://canalmedico-production.up.railway.app
   ```
4. **Si no existe, agrégalo:**
   - Variable: `VITE_API_URL`
   - Valor: `https://canalmedico-production.up.railway.app`
5. **Haz redeploy** del frontend después de agregar la variable

---

### Paso 3: Verificar CORS en el Backend

Asegúrate de que el backend permita el dominio del frontend:

1. **Ve a Railway** → Servicio `CanalMedico` (backend)
2. **Ve a la pestaña "Variables"**
3. **Verifica que existe:**
   ```
   FRONTEND_WEB_URL=https://canalmedico-web-production.up.railway.app
   ```
4. **Si no existe, agrégalo:**
   - Variable: `FRONTEND_WEB_URL`
   - Valor: `https://canalmedico-web-production.up.railway.app`
5. **Haz redeploy** del backend después de agregar la variable

---

### Paso 4: Verificar Variables JWT en el Backend

Asegúrate de que el backend tenga los secrets de JWT configurados:

1. **Ve a Railway** → Servicio `CanalMedico` (backend)
2. **Ve a la pestaña "Variables"**
3. **Verifica que existen:**
   - `JWT_SECRET` (mínimo 32 caracteres)
   - `JWT_REFRESH_SECRET` (mínimo 32 caracteres)

4. **Si no existen, créalos:**
   - Genera secrets seguros con:
     ```bash
     openssl rand -base64 32
     ```
   - O usa Railway's secret generator

---

### Paso 5: Verificar los Logs del Backend

Revisa los logs del backend para ver el error exacto:

1. **Ve a Railway** → Servicio `CanalMedico` (backend)
2. **Ve a la pestaña "Logs"** o **"Deployments"** → **"View logs"**
3. **Busca errores** que aparezcan cuando intentas hacer login
4. **Comparte los logs** si el problema persiste

---

## 🧪 Probar el Login Directamente

### Opción 1: Usando Swagger UI

1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca: `POST /api/auth/login`
3. Haz clic en "Try it out"
4. Ingresa:
   ```json
   {
     "email": "doctor1@ejemplo.com",
     "password": "doctor123"
   }
   ```
5. Haz clic en "Execute"
6. **Si funciona aquí pero no en el frontend**, el problema es CORS o configuración del frontend
7. **Si no funciona aquí**, el problema está en el backend

### Opción 2: Usando cURL

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor1@ejemplo.com",
    "password": "doctor123"
  }'
```

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Los usuarios de prueba están creados (`POST /api/seed` ejecutado exitosamente)
- [ ] `VITE_API_URL` está configurado en el frontend de Railway
- [ ] `FRONTEND_WEB_URL` está configurado en el backend de Railway
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` están configurados en el backend
- [ ] El backend está desplegado y funcionando (verifica `/health`)
- [ ] El frontend está desplegado y funcionando (página de login visible)
- [ ] Revisaste los logs del backend para ver el error exacto

---

## 🔄 Después de Hacer Cambios

Después de cambiar variables de entorno en Railway:

1. **Haz redeploy** del servicio correspondiente:
   - Backend: Railway → CanalMedico → Deployments → "Redeploy"
   - Frontend: Railway → CanalMedico-Web → Deployments → "Redeploy"

2. **Espera 1-2 minutos** para que el deploy termine

3. **Limpia la caché del navegador** (Ctrl+Shift+R o Cmd+Shift+R)

4. **Intenta hacer login nuevamente**

---

## 🆘 Si el Problema Persiste

Si después de seguir estos pasos el error persiste:

1. **Revisa los logs del backend** y comparte el error exacto
2. **Prueba el endpoint directamente** en Swagger para aislar el problema
3. **Verifica que todas las variables de entorno** estén configuradas correctamente
4. **Asegúrate de que el backend esté funcionando** probando el endpoint `/health`

---

## 📝 Variables de Entorno Requeridas

### Backend (CanalMedico):
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_URL=https://canalmedico-production.up.railway.app
JWT_SECRET=<genera con: openssl rand -base64 32>
JWT_REFRESH_SECRET=<genera con: openssl rand -base64 32>
FRONTEND_WEB_URL=https://canalmedico-web-production.up.railway.app
MOBILE_APP_URL=https://canalmedico-app-production.up.railway.app (opcional)
```

### Frontend Web (CanalMedico-Web):
```
VITE_API_URL=https://canalmedico-production.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=<tu clave de Stripe> (opcional)
```

---

## ✅ Credenciales de Prueba

Una vez creados los usuarios con el seed:

- **Médico:**
  - Email: `doctor1@ejemplo.com`
  - Password: `doctor123`

- **Admin:**
  - Email: `admin@canalmedico.com`
  - Password: `admin123`

- **Paciente:**
  - Email: `paciente1@ejemplo.com`
  - Password: `patient123`

