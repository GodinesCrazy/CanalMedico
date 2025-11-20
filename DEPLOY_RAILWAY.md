# Guía de Despliegue en Railway

Esta guía te ayudará a desplegar el proyecto CanalMedico en Railway.

## 🚀 Despliegue del Backend

### Paso 1: Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app/) y crea una cuenta o inicia sesión
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio: `https://github.com/GodinesCrazy/CanalMedico.git`
5. Selecciona la carpeta `backend` como root directory

### Paso 2: Configurar Base de Datos PostgreSQL

1. En el proyecto de Railway, haz clic en "+ New"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente una base de datos PostgreSQL
4. Copia la `DATABASE_URL` de las variables de entorno

### Paso 3: Configurar Variables de Entorno

En Railway, ve a "Variables" y agrega las siguientes variables:

```env
# Base de Datos
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Servidor
NODE_ENV=production
PORT=${{PORT}}

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_minimo_32_caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_COMMISSION_FEE=0.15

# AWS S3
AWS_ACCESS_KEY_ID=tu_aws_access_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=canalmedico-files

# Firebase
FIREBASE_SERVER_KEY=tu_firebase_server_key
FIREBASE_PROJECT_ID=tu_firebase_project_id
FIREBASE_PRIVATE_KEY=tu_firebase_private_key
FIREBASE_CLIENT_EMAIL=tu_firebase_client_email

# CORS (URLs de producción)
FRONTEND_WEB_URL=https://tu-frontend.railway.app
MOBILE_APP_URL=https://tu-app.com

# Otros
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Paso 4: Ejecutar Migraciones

Railway ejecutará automáticamente las migraciones durante el build gracias al script `postinstall` y `railway:deploy`.

Si necesitas ejecutarlas manualmente:

1. En Railway, ve a tu servicio
2. Abre la terminal
3. Ejecuta: `npx prisma migrate deploy`

### Paso 5: Configurar Dominio

1. En Railway, ve a "Settings" → "Networking"
2. Haz clic en "Generate Domain" para obtener una URL automática
3. O configura un dominio personalizado en "Custom Domain"

## 🌐 Despliegue del Frontend Web

### Paso 1: Crear Nuevo Servicio en Railway

1. En el mismo proyecto de Railway, haz clic en "+ New"
2. Selecciona "GitHub Repo"
3. Selecciona el mismo repositorio
4. Configura el root directory como `frontend-web`

### Paso 2: Configurar Variables de Entorno

```env
# API
VITE_API_URL=https://tu-backend.railway.app

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Firebase (si es necesario)
VITE_FIREBASE_API_KEY=tu_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_firebase_project_id
```

### Paso 3: Configurar Build y Start

Railway detectará automáticamente que es un proyecto Vite. El build se ejecutará automáticamente.

### Paso 4: Configurar Dominio

1. Genera un dominio en Railway o configura uno personalizado
2. Actualiza `FRONTEND_WEB_URL` en las variables del backend

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

### Monitoreo y Logs

Railway proporciona logs en tiempo real:
1. Ve a tu servicio en Railway
2. Haz clic en "Logs" para ver los logs en vivo
3. Los logs de Winston también estarán disponibles en Railway

## 📋 Checklist de Despliegue

- [ ] Backend desplegado en Railway
- [ ] Base de datos PostgreSQL configurada
- [ ] Variables de entorno configuradas
- [ ] Migraciones de Prisma ejecutadas
- [ ] Dominio del backend configurado
- [ ] Frontend Web desplegado en Railway
- [ ] Variables de entorno del frontend configuradas
- [ ] Dominio del frontend configurado
- [ ] Webhooks de Stripe configurados
- [ ] CORS actualizado con URLs de producción
- [ ] App Móvil configurada con URL del backend

## 🐛 Troubleshooting

### Error de conexión a la base de datos
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos PostgreSQL esté activa

### Error en las migraciones
- Ejecuta manualmente: `npx prisma migrate deploy` en la terminal de Railway

### CORS Errors
- Actualiza `FRONTEND_WEB_URL` y `MOBILE_APP_URL` en las variables del backend

### Build fails
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de Railway para errores específicos

## 🔗 Enlaces Útiles

- [Documentación de Railway](https://docs.railway.app/)
- [Railway Dashboard](https://railway.app/dashboard)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

**Nota**: Recuerda actualizar las URLs en producción después de desplegar cada servicio.

