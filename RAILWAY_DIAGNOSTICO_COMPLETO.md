# 🔍 Diagnóstico Completo: Application Failed to Respond

## ❌ Problema

El servidor muestra "Application failed to respond" en Railway.

## 🔍 Pasos de Diagnóstico

### Paso 1: Revisar Logs de Deployment

1. **Ve a Railway** → Tu proyecto → Servicio `CanalMedico`
2. Haz clic en la pestaña **"Logs"** o **"Deploy Logs"**
3. **Busca errores** en los logs más recientes

**Errores comunes a buscar:**
- `❌ Error de configuración de variables de entorno:`
- `Error: Cannot find module`
- `Error: Connection refused`
- `Port XXXX is already in use`

### Paso 2: Verificar Variables de Entorno Requeridas

Ve a Railway → Servicio `CanalMedico` → Variables

**Variables CRÍTICAS que DEBEN estar configuradas:**

#### ✅ Variables que DEBEN tener valor:
- [ ] `DATABASE_URL` → Debe ser: `${{Postgres.DATABASE_URL}}` o URL completa
- [ ] `API_URL` → Debe ser: `https://canalmedico-production.up.railway.app`
- [ ] `JWT_SECRET` → Debe tener mínimo 32 caracteres
- [ ] `JWT_REFRESH_SECRET` → Debe tener mínimo 32 caracteres
- [ ] `FRONTEND_WEB_URL` → Temporalmente: `http://localhost:5173`
- [ ] `MOBILE_APP_URL` → Temporalmente: `http://localhost:8081`

#### ⚠️ Variables que pueden estar vacías (tienen defaults):
- `STRIPE_SECRET_KEY` → Tiene valor por defecto temporal
- `STRIPE_PUBLISHABLE_KEY` → Tiene valor por defecto temporal
- `AWS_ACCESS_KEY_ID` → Tiene valor por defecto temporal
- `AWS_SECRET_ACCESS_KEY` → Tiene valor por defecto temporal
- `AWS_S3_BUCKET` → Tiene valor por defecto temporal

### Paso 3: Verificar Estado de Deployment

1. **Ve a Railway** → Servicio `CanalMedico` → **"Deployments"**
2. Verifica el estado del deployment más reciente:
   - ✅ **Active** → Deployment exitoso
   - ❌ **Failed** → Revisa los logs
   - ⏳ **Building** → Espera a que termine

### Paso 4: Verificar Healthcheck

1. Ve a **"Settings"** del servicio `CanalMedico`
2. Busca **"Healthcheck Path"**
3. Debe estar configurado como: `/health`
4. **Healthcheck Timeout** debe ser: `100` segundos

## 🔧 Soluciones Comunes

### Solución 1: Variables de Entorno Faltantes

**Si los logs muestran errores de variables de entorno:**

1. Ve a **Variables** en Railway
2. Verifica que estas variables estén configuradas:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}`
   - `API_URL` → URL del backend
   - `JWT_SECRET` → Valor generado (mínimo 32 caracteres)
   - `JWT_REFRESH_SECRET` → Valor generado (mínimo 32 caracteres)
   - `FRONTEND_WEB_URL` → `http://localhost:5173`
   - `MOBILE_APP_URL` → `http://localhost:8081`

3. **Guarda los cambios**
4. Railway hará un deployment automático

### Solución 2: DATABASE_URL No Configurada

**Si los logs muestran errores de conexión a la base de datos:**

1. Verifica que PostgreSQL esté creado en Railway
2. Ve al servicio backend → Variables
3. Agrega o edita `DATABASE_URL`:
   - Valor: `${{Postgres.DATABASE_URL}}`
   - O usa "Reference Variable" → Selecciona `Postgres.DATABASE_URL`

### Solución 3: Puerto Incorrecto

**Si los logs muestran errores de puerto:**

1. **NO configures manualmente** la variable `PORT`
2. **Elimina la variable `PORT`** si está configurada
3. Railway asigna el puerto automáticamente
4. El código usa `process.env.PORT` automáticamente

### Solución 4: Build Fallando

**Si el build está fallando:**

1. Ve a **"Deployments"** → Haz clic en el deployment fallido
2. Revisa los **"Build Logs"**
3. Busca errores de:
   - Dependencias faltantes
   - TypeScript errors
   - Prisma errors

## 📋 Checklist de Verificación Completa

### ✅ Infraestructura
- [ ] Servicio `CanalMedico` existe en Railway
- [ ] Servicio `Postgres` existe en Railway
- [ ] Root Directory configurado como `backend`
- [ ] Build completado exitosamente

### ✅ Variables de Entorno
- [ ] `DATABASE_URL` configurada con `${{Postgres.DATABASE_URL}}`
- [ ] `API_URL` configurada con URL del backend
- [ ] `JWT_SECRET` configurada (mínimo 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` configurada (mínimo 32 caracteres)
- [ ] `FRONTEND_WEB_URL` configurada (puede ser temporal)
- [ ] `MOBILE_APP_URL` configurada (puede ser temporal)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` NO configurada (Railway la asigna automáticamente)

### ✅ Base de Datos
- [ ] PostgreSQL está activo en Railway
- [ ] `DATABASE_URL` conectada al backend
- [ ] Migraciones ejecutadas (si es necesario)

### ✅ Logs
- [ ] Logs muestran: `🚀 Servidor corriendo en puerto XXXX`
- [ ] Logs muestran: `✅ Conexión a la base de datos establecida`
- [ ] NO hay errores de variables de entorno
- [ ] NO hay errores de conexión a la base de datos

## 🆘 Si Aún No Funciona

### Comparte Información

1. **Copia los logs de deployment** (los últimos 50-100 líneas)
2. **Lista las variables de entorno** configuradas en Railway
3. **Estado del deployment** (¿está activo, falló, o está construyendo?)
4. **Mensajes de error específicos** que veas en los logs

### Revisa Estos Puntos Específicos

1. **¿El build completó exitosamente?**
   - Ve a Deployments → Build Logs

2. **¿El servidor inició?**
   - Ve a Logs → Busca "🚀 Servidor corriendo"

3. **¿La base de datos está conectada?**
   - Ve a Logs → Busca "✅ Conexión a la base de datos"

4. **¿El healthcheck está pasando?**
   - Ve a Deployments → Busca "Healthcheck succeeded"

---

**Siguiente paso**: Revisa los logs de deployment en Railway y comparte los errores específicos que veas para diagnosticar el problema exacto.

