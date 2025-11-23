# ⚡ Acción Inmediata: Error 500 en Login

## 🔥 Causa Más Probable: JWT_SECRET no configurado

El error 500 más común es que **faltan las variables JWT_SECRET o JWT_REFRESH_SECRET** en el backend.

## ✅ Solución Rápida (5 minutos)

### 1️⃣ Verificar Variables JWT

**En Railway:**
1. Ve a: **Railway** → Servicio `CanalMedico` (backend) → **"Variables"**
2. **Busca estas variables:**
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`

3. **Si NO existen o están vacías:**
   - Genera secrets seguros (usa Railway's secret generator o terminal):
     ```bash
     # Opción 1: Usa Railway's secret generator
     # O genera localmente:
     openssl rand -base64 32
     ```
   - Copia el resultado y agrégalo a Railway
   - **IMPORTANTE:** Cada secret debe tener **mínimo 32 caracteres**

4. **Agrega las variables:**
   - Variable: `JWT_SECRET`
     - Valor: `<pega el secret generado>`
   - Variable: `JWT_REFRESH_SECRET`
     - Valor: `<pega otro secret generado>`

### 2️⃣ Verificar Otras Variables Requeridas

**Asegúrate de que también existan:**
```
✅ DATABASE_URL=${{Postgres.DATABASE_URL}}
✅ API_URL=https://canalmedico-production.up.railway.app
✅ FRONTEND_WEB_URL=https://canalmedico-web-production.up.railway.app
```

### 3️⃣ Redeploy del Backend

**Después de agregar las variables:**
1. Ve a **Railway** → Servicio `CanalMedico` → **"Deployments"**
2. Haz clic en **"Redeploy"** o **"Deploy Latest Commit"**
3. **Espera 1-2 minutos** a que termine el deploy

### 4️⃣ Probar el Login

**Opción A - Desde Swagger:**
1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca: `POST /api/auth/login`
3. Ejecuta con:
   ```json
   {
     "email": "doctor1@ejemplo.com",
     "password": "doctor123"
   }
   ```
4. Debería funcionar ahora ✅

**Opción B - Desde Frontend:**
1. Ve a: `https://canalmedico-web-production.up.railway.app/login`
2. Ingresa las credenciales
3. Debería funcionar ahora ✅

---

## 🔍 Si el Problema Persiste

### Revisar Logs del Backend

1. Ve a **Railway** → Servicio `CanalMedico` → **"Logs"**
2. Intenta hacer login
3. **Busca errores** que aparezcan en los logs
4. **Copia el error completo** y compártelo

### Ejecutar Seed

Si los usuarios no existen:
1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca: `POST /api/seed`
3. Haz clic en **"Execute"**
4. Espera la respuesta de éxito

---

## 📋 Checklist Rápido

- [ ] `JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` configurado (mínimo 32 caracteres)
- [ ] `DATABASE_URL` configurada
- [ ] `API_URL` configurada
- [ ] `FRONTEND_WEB_URL` configurada
- [ ] Backend redeployado después de agregar variables
- [ ] Seed ejecutado (`POST /api/seed`)
- [ ] Login probado en Swagger

---

## 🆘 Si Nada Funciona

1. **Revisa los logs del backend** y copia el error exacto
2. **Prueba el endpoint directamente** en Swagger y copia la respuesta de error
3. **Verifica que el backend esté funcionando:**
   - `https://canalmedico-production.up.railway.app/health`
   - Debería retornar: `{"status":"ok",...}`

Con esta información podremos identificar el problema exacto.

