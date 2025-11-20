# 🔐 Configuración de Variables de Entorno en Railway

## ❌ Problema Actual

El build funciona correctamente, pero el servidor no inicia porque faltan las variables de entorno requeridas. El error muestra:

```
❌ Error de configuración de variables de entorno:
  - API_URL: Required
  - DATABASE_URL: Required
  - JWT_SECRET: Required
  - JWT_REFRESH_SECRET: Required
  - STRIPE_SECRET_KEY: Required
  - STRIPE_PUBLISHABLE_KEY: Required
  - AWS_ACCESS_KEY_ID: Required
  - AWS_SECRET_ACCESS_KEY: Required
  - AWS_S3_BUCKET: Required
  - FRONTEND_WEB_URL: Required
  - MOBILE_APP_URL: Required
```

## ✅ Solución: Configurar Variables de Entorno en Railway

### Paso 1: Acceder a Variables de Entorno en Railway

1. Ve a tu proyecto en [Railway](https://railway.app/dashboard)
2. Haz clic en el servicio **backend** (el que está fallando)
3. Ve a la pestaña **"Variables"** en el menú lateral
4. Haz clic en **"+ New Variable"** para agregar cada variable

### Paso 2: Configurar Variables Requeridas

#### 🔴 Variables CRÍTICAS (Debes configurarlas ahora)

Agrega estas variables **una por una** haciendo clic en **"+ New Variable"**:

##### 1. Base de Datos PostgreSQL

**Si ya tienes PostgreSQL en Railway:**
- Variable: `DATABASE_URL`
- Valor: Haz clic en **"Reference Variable"** → Selecciona `Postgres.DATABASE_URL`

**Si NO tienes PostgreSQL:**
1. En tu proyecto Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. Luego, en el servicio backend → Variables → Haz clic en **"Reference Variable"**
5. Selecciona `Postgres.DATABASE_URL`

##### 2. Configuración del Servidor

- Variable: `NODE_ENV`
- Valor: `production`

- Variable: `PORT`
- Valor: `${{PORT}}` (Railway usa esta variable automáticamente)

- Variable: `API_URL`
- Valor: Primero necesitas obtener el dominio de Railway:
  1. **Ve al servicio backend** (no a Project Settings, sino al servicio individual)
  2. Ve a **Settings** del servicio → **Networking**
  3. Haz clic en **"Generate Domain"** (por ejemplo: `https://tu-backend-production.up.railway.app`)
  4. Copia esta URL y úsala como valor de `API_URL`
  
  **Nota**: Si no encuentras Networking, ver guía detallada en `RAILWAY_CONFIGURAR_DOMINIO.md`

##### 3. JWT Secrets (Genera valores seguros)

**Genera secrets seguros:**

En tu terminal local o en Railway:
```bash
# Generar JWT_SECRET (mínimo 32 caracteres)
openssl rand -base64 32

# Generar JWT_REFRESH_SECRET (mínimo 32 caracteres)
openssl rand -base64 32
```

Luego agrega en Railway:
- Variable: `JWT_SECRET`
- Valor: El valor generado con `openssl rand -base64 32` (sin comillas)

- Variable: `JWT_REFRESH_SECRET`
- Valor: El valor generado con `openssl rand -base64 32` (sin comillas)

##### 4. Stripe (Obtén de tu cuenta de Stripe)

Necesitas crear una cuenta en [Stripe](https://stripe.com) si no la tienes:

- Variable: `STRIPE_SECRET_KEY`
- Valor: De Stripe Dashboard → Developers → API Keys → Secret key (empieza con `sk_test_...` o `sk_live_...`)

- Variable: `STRIPE_PUBLISHABLE_KEY`
- Valor: De Stripe Dashboard → Developers → API Keys → Publishable key (empieza con `pk_test_...` o `pk_live_...`)

- Variable: `STRIPE_WEBHOOK_SECRET` (Opcional por ahora)
- Valor: Puedes dejarlo vacío o configurarlo después

- Variable: `STRIPE_COMMISSION_FEE` (Opcional, tiene valor por defecto)
- Valor: `0.15` (15% de comisión)

##### 5. AWS S3 (Para almacenar archivos)

Necesitas crear una cuenta en [AWS](https://aws.amazon.com) y configurar S3:

1. Crea un bucket de S3 en AWS Console
2. Crea un usuario IAM con permisos de S3
3. Genera Access Keys para ese usuario

- Variable: `AWS_ACCESS_KEY_ID`
- Valor: Tu AWS Access Key ID

- Variable: `AWS_SECRET_ACCESS_KEY`
- Valor: Tu AWS Secret Access Key

- Variable: `AWS_REGION` (Opcional, tiene valor por defecto)
- Valor: `us-east-1` (o la región donde creaste tu bucket)

- Variable: `AWS_S3_BUCKET`
- Valor: El nombre de tu bucket de S3 (ejemplo: `canalmedico-files`)

##### 6. URLs de Frontend (Configura temporalmente)

Mientras no tengas los frontends desplegados, puedes usar valores temporales:

- Variable: `FRONTEND_WEB_URL`
- Valor: `http://localhost:5173` (temporal, actualiza después)

- Variable: `MOBILE_APP_URL`
- Valor: `http://localhost:8081` (temporal, actualiza después)

**Nota**: Actualiza estas URLs después de desplegar el frontend web y la app móvil.

#### 🟡 Variables Opcionales (Puedes configurarlas después)

Estas variables tienen valores por defecto o son opcionales:

- `JWT_EXPIRES_IN`: `15m` (por defecto)
- `JWT_REFRESH_EXPIRES_IN`: `7d` (por defecto)
- `BCRYPT_ROUNDS`: `10` (por defecto)
- `RATE_LIMIT_WINDOW_MS`: `900000` (por defecto)
- `RATE_LIMIT_MAX_REQUESTS`: `100` (por defecto)
- `LOG_LEVEL`: `info` (por defecto)
- `FIREBASE_SERVER_KEY`: (Opcional, solo si usas notificaciones push)
- `FIREBASE_PROJECT_ID`: (Opcional)
- `FIREBASE_PRIVATE_KEY`: (Opcional)
- `FIREBASE_CLIENT_EMAIL`: (Opcional)

### Paso 3: Verificar Variables Configuradas

Después de agregar todas las variables, deberías ver en Railway:

✅ **Variables Requeridas:**
- `DATABASE_URL` (de PostgreSQL)
- `NODE_ENV` = `production`
- `PORT` = `${{PORT}}`
- `API_URL` = `https://tu-backend.railway.app`
- `JWT_SECRET` = `[tu-secret-generado]`
- `JWT_REFRESH_SECRET` = `[tu-secret-generado]`
- `STRIPE_SECRET_KEY` = `sk_test_...` o `sk_live_...`
- `STRIPE_PUBLISHABLE_KEY` = `pk_test_...` o `pk_live_...`
- `AWS_ACCESS_KEY_ID` = `[tu-aws-key]`
- `AWS_SECRET_ACCESS_KEY` = `[tu-aws-secret]`
- `AWS_S3_BUCKET` = `canalmedico-files`
- `FRONTEND_WEB_URL` = `http://localhost:5173` (temporal)
- `MOBILE_APP_URL` = `http://localhost:8081` (temporal)

### Paso 4: Reiniciar el Servicio

Después de configurar todas las variables:

1. En Railway, ve a tu servicio backend
2. Haz clic en **"Settings"** → **"Redeploy"** o espera a que Railway detecte los cambios
3. Railway debería hacer un nuevo deployment automáticamente

### Paso 5: Verificar que Funciona

1. Ve a la pestaña **"Logs"** en Railway
2. Deberías ver:
   - ✅ Build exitoso
   - ✅ Servidor iniciando sin errores
   - ✅ Healthcheck pasando en `/health`

## 🔧 Valores Temporales para Pruebas

Si solo quieres probar que el servidor inicia, puedes usar estos valores temporales:

### Para Stripe (modo test):
```
STRIPE_SECRET_KEY=sk_test_51... (de Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY=pk_test_51... (de Stripe Dashboard)
```

### Para AWS (puedes usar un bucket temporal):
```
AWS_ACCESS_KEY_ID=AKIA... (de AWS IAM)
AWS_SECRET_ACCESS_KEY=... (de AWS IAM)
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu-bucket-temporal
```

### Para JWT (genera con openssl):
```bash
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para JWT_REFRESH_SECRET
```

## 📋 Checklist de Variables de Entorno

Marca cada variable cuando la configures:

- [ ] `DATABASE_URL` (de PostgreSQL en Railway)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `${{PORT}}`
- [ ] `API_URL` = URL de Railway (después de generar dominio)
- [ ] `JWT_SECRET` = Generado con `openssl rand -base64 32`
- [ ] `JWT_REFRESH_SECRET` = Generado con `openssl rand -base64 32`
- [ ] `STRIPE_SECRET_KEY` = De Stripe Dashboard
- [ ] `STRIPE_PUBLISHABLE_KEY` = De Stripe Dashboard
- [ ] `AWS_ACCESS_KEY_ID` = De AWS IAM
- [ ] `AWS_SECRET_ACCESS_KEY` = De AWS IAM
- [ ] `AWS_S3_BUCKET` = Nombre de tu bucket de S3
- [ ] `FRONTEND_WEB_URL` = URL temporal o real del frontend
- [ ] `MOBILE_APP_URL` = URL temporal o real de la app móvil

## 🚀 Después de Configurar Variables

Una vez configuradas todas las variables:

1. **Railway debería hacer un deployment automático**
2. **El servidor debería iniciar correctamente**
3. **El healthcheck debería pasar** en `/health`
4. **Podrás acceder a la API** en `https://tu-backend.railway.app`

## ❓ ¿Necesitas Ayuda?

### Error: "Variable not found"
- Verifica que escribiste el nombre exactamente como se muestra
- Verifica que no hay espacios antes o después del nombre

### Error: "Invalid value"
- Verifica que los valores no tienen comillas adicionales
- Para URLs, asegúrate de que empiezan con `http://` o `https://`

### El servidor aún no inicia
- Revisa los logs en Railway para ver qué variable falta
- Verifica que `DATABASE_URL` esté correctamente referenciada de PostgreSQL

---

**Nota Importante**: Guarda estos valores de forma segura. Algunos secrets como JWT_SECRET no deben cambiarse una vez configurados en producción.

