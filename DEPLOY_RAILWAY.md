# Guía de Despliegue en Railway

Esta guía te ayudará a desplegar el proyecto CanalMedico en Railway.

## ⚠️ IMPORTANTE: Configurar Root Directory

**Railway necesita que especifiques el Root Directory para cada servicio**. De lo contrario, intentará construir todo el repositorio y fallará.

## 🚀 Despliegue del Backend

### Paso 1: Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app/) y crea una cuenta o inicia sesión
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio: `https://github.com/GodinesCrazy/CanalMedico.git`
5. **IMPORTANTE**: En la configuración del servicio, busca "Root Directory" o "Source"
6. **Configura el Root Directory como: `backend`**
7. Railway debería detectar automáticamente que es un proyecto Node.js

### Paso 2: Configurar Base de Datos PostgreSQL

1. En el proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente una base de datos PostgreSQL
4. Copia la `DATABASE_URL` de las variables de entorno

### Paso 3: Conectar PostgreSQL al Backend

1. Haz clic en el servicio del backend
2. Ve a la pestaña "Variables"
3. Railway debería haber agregado automáticamente `DATABASE_URL` desde el servicio de PostgreSQL
4. Si no está, haz clic en "Reference Variable" y selecciona `Postgres.DATABASE_URL`

### Paso 4: Configurar Variables de Entorno

⚠️ **IMPORTANTE**: Esta es la causa más común de fallos. Debes configurar TODAS las variables requeridas.

📖 **Ver guía detallada**: `RAILWAY_ENV_VARIABLES.md`

En Railway, ve a "Variables" del servicio backend y agrega:

```env
# Base de Datos (se configura automáticamente si conectaste PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Servidor
NODE_ENV=production
PORT=${{PORT}}
API_URL=https://tu-backend.railway.app  # ⚠️ IMPORTANTE: Obtén esto después de generar el dominio en Railway

# JWT (GENERA VALORES SEGUROS con: openssl rand -base64 32)
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres_genera_con_openssl
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_minimo_32_caracteres_genera_con_openssl
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe (obtén de Stripe Dashboard → Developers → API Keys)
STRIPE_SECRET_KEY=sk_test_... o sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... o pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Opcional por ahora
STRIPE_COMMISSION_FEE=0.15

# AWS S3 (necesitas crear cuenta AWS y bucket S3)
AWS_ACCESS_KEY_ID=tu_aws_access_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=canalmedico-files

# Firebase (opcional si usas notificaciones)
FIREBASE_SERVER_KEY=tu_firebase_server_key
FIREBASE_PROJECT_ID=tu_firebase_project_id
FIREBASE_PRIVATE_KEY=tu_firebase_private_key
FIREBASE_CLIENT_EMAIL=tu_firebase_client_email

# CORS (actualiza con tus URLs de producción - puede ser temporal inicialmente)
FRONTEND_WEB_URL=https://tu-frontend.railway.app  # Temporal: http://localhost:5173
MOBILE_APP_URL=https://tu-app.com  # Temporal: http://localhost:8081

# Otros (tienen valores por defecto)
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

**Variables CRÍTICAS que deben configurarse:**
1. `DATABASE_URL` - De PostgreSQL en Railway (usa Reference Variable)
2. `API_URL` - URL del backend en Railway (genera dominio primero)
3. `JWT_SECRET` - Genera con `openssl rand -base64 32`
4. `JWT_REFRESH_SECRET` - Genera con `openssl rand -base64 32`
5. `STRIPE_SECRET_KEY` - De Stripe Dashboard
6. `STRIPE_PUBLISHABLE_KEY` - De Stripe Dashboard
7. `AWS_ACCESS_KEY_ID` - De AWS IAM
8. `AWS_SECRET_ACCESS_KEY` - De AWS IAM
9. `AWS_S3_BUCKET` - Nombre de tu bucket S3
10. `FRONTEND_WEB_URL` - URL temporal o real del frontend
11. `MOBILE_APP_URL` - URL temporal o real de la app móvil

### Paso 5: Configurar Build Settings (si es necesario)

Si Railway no detecta automáticamente la configuración:

1. Ve a "Settings" → "Build & Deploy"
2. El "Build Command" debería ser: `npm install && npm run build && npx prisma generate`
3. El "Start Command" debería ser: `node dist/server.js`

### Paso 6: Ejecutar Migraciones

Las migraciones se ejecutarán automáticamente durante el build gracias al script `postinstall`.

Si necesitas ejecutarlas manualmente:

1. En Railway, ve a tu servicio backend
2. Abre la terminal (icono de terminal en la parte superior)
3. Ejecuta: `npx prisma migrate deploy`

### Paso 7: Configurar Dominio

1. En Railway, ve a "Settings" → "Networking"
2. Haz clic en "Generate Domain" para obtener una URL automática
3. O configura un dominio personalizado en "Custom Domain"
4. **Copia esta URL** (ejemplo: `https://tu-backend.railway.app`)
5. **IMPORTANTE**: Actualiza la variable `API_URL` en "Variables" con esta URL

## 🌐 Despliegue del Frontend Web

### Paso 1: Crear Nuevo Servicio en Railway

1. En el **mismo proyecto** de Railway, haz clic en "+ New"
2. Selecciona "GitHub Repo"
3. Selecciona el mismo repositorio: `GodinesCrazy/CanalMedico`
4. **IMPORTANTE**: En "Root Directory", configura: `frontend-web`
5. Railway detectará automáticamente que es un proyecto Vite

### Paso 2: Configurar Variables de Entorno

En "Variables" del servicio frontend-web, agrega:

```env
# API (usa la URL del backend que obtuviste en el paso 7 del backend)
VITE_API_URL=https://tu-backend.railway.app

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Firebase (si es necesario)
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_firebase_project_id
```

### Paso 3: Configurar Build Settings

1. Ve a "Settings" → "Build & Deploy"
2. El "Build Command" debería ser: `npm install && npm run build`
3. El "Start Command" debería ser: `npm run preview`
4. El "Output Directory" debería ser: `dist`

### Paso 4: Configurar Dominio

1. Genera un dominio en Railway
2. **Actualiza `FRONTEND_WEB_URL` en las variables del backend** con esta nueva URL

## 📱 Configurar App Móvil

La app móvil se despliega directamente en las tiendas (App Store / Play Store) usando EAS Build.

1. Configura `EXPO_PUBLIC_API_URL` apuntando a tu backend en Railway
2. Build con EAS: `eas build --platform android`
3. Build con EAS: `eas build --platform ios`

## 🔧 Configuración Adicional

### Configurar Webhooks de Stripe

1. En el dashboard de Stripe, ve a "Developers" → "Webhooks"
2. Agrega un endpoint: `https://tu-backend.railway.app/api/payments/webhook`
3. Selecciona los eventos: `checkout.session.completed`, `payment_intent.payment_failed`
4. Copia el webhook secret y agrégalo a `STRIPE_WEBHOOK_SECRET` en Railway

### Generar JWT Secrets Seguros

En tu terminal local o en Railway:

```bash
# Generar JWT_SECRET
openssl rand -base64 32

# Generar JWT_REFRESH_SECRET
openssl rand -base64 32
```

### Monitoreo y Logs

Railway proporciona logs en tiempo real:
1. Ve a tu servicio en Railway
2. Haz clic en "Logs" para ver los logs en vivo
3. Los logs de Winston también estarán disponibles en Railway

## 📋 Checklist de Despliegue

- [ ] Backend desplegado en Railway con **Root Directory = backend**
- [ ] Base de datos PostgreSQL agregada y conectada
- [ ] Variables de entorno del backend configuradas
- [ ] Migraciones de Prisma ejecutadas
- [ ] Dominio del backend configurado
- [ ] Frontend Web desplegado con **Root Directory = frontend-web**
- [ ] Variables de entorno del frontend configuradas
- [ ] Dominio del frontend configurado
- [ ] CORS actualizado con URLs de producción
- [ ] Webhooks de Stripe configurados
- [ ] App Móvil configurada con URL del backend

## 🐛 Troubleshooting

### Error: "Nixpacks was unable to generate a build plan"
**Solución**: Asegúrate de configurar el **Root Directory** correctamente:
- Backend: `backend`
- Frontend: `frontend-web`

### Error de conexión a la base de datos
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de haber conectado el servicio PostgreSQL al backend en Railway
- Verifica que la base de datos PostgreSQL esté activa

### Error en las migraciones
- Ejecuta manualmente: `npx prisma migrate deploy` en la terminal de Railway
- Verifica que `DATABASE_URL` sea correcta

### CORS Errors
- Actualiza `FRONTEND_WEB_URL` y `MOBILE_APP_URL` en las variables del backend
- Asegúrate de usar las URLs correctas de Railway (https://...)

### Build fails
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de Railway para errores específicos
- Asegúrate de que el Root Directory esté configurado correctamente

### El servicio no inicia
- Verifica que `dist/server.js` exista después del build
- Revisa los logs de Railway para errores
- Verifica que todas las variables de entorno necesarias estén configuradas

## 🔗 Enlaces Útiles

- [Documentación de Railway](https://docs.railway.app/)
- [Railway Dashboard](https://railway.app/dashboard)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Railway Root Directory Configuration](https://docs.railway.app/deploy/builds#root-directory)

## 📝 Notas Importantes

1. **Root Directory es CRÍTICO**: Debes configurarlo para cada servicio
2. **Variables de entorno**: Asegúrate de usar `${{Postgres.DATABASE_URL}}` para la base de datos
3. **URLs de producción**: Actualiza CORS después de obtener los dominios
4. **Build automático**: Railway construye automáticamente en cada push a GitHub

---

**Nota**: Recuerda actualizar las URLs en producción después de desplegar cada servicio.
