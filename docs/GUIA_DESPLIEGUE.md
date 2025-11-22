# 🚀 Guía de Despliegue - CanalMedico

## Tabla de Contenidos
1. [Preparación](#preparación)
2. [Despliegue en Railway](#railway)
3. [Configuración de Dominio](#dominio)
4. [Variables de Entorno](#variables)
5. [Migraciones](#migraciones)
6. [Monitoreo](#monitoreo)
7. [Troubleshooting](#troubleshooting)

---

## 1. Preparación

### Prerrequisitos
- Cuenta en Railway.app
- Cuenta en MercadoPago Chile
- Cuenta en AWS (para S3)
- Cuenta en Firebase (para notificaciones)
- Dominio propio (opcional)

### Checklist Pre-Despliegue
- [ ] Código en repositorio Git
- [ ] Variables de entorno documentadas
- [ ] Migraciones de BD probadas
- [ ] Tests pasando
- [ ] Build local exitoso

---

## 2. Despliegue en Railway

### Backend

#### Paso 1: Crear Proyecto
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init
```

#### Paso 2: Configurar Base de Datos
1. En Railway Dashboard, agregar PostgreSQL
2. Copiar `DATABASE_URL` de las variables de entorno
3. Actualizar en configuración del proyecto

#### Paso 3: Variables de Entorno
```env
# Base de Datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=tu-secret-super-seguro-produccion
JWT_EXPIRES_IN=7d

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=canalmedico-prod

# Firebase
FIREBASE_PROJECT_ID=canalmedico-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com

# CORS
CORS_ORIGIN=https://tu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Paso 4: Configurar Build
En `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Paso 5: Deploy
```bash
railway up
```

### Frontend Web

#### Paso 1: Configurar Variables
```env
VITE_API_URL=https://tu-backend.railway.app/api
VITE_SOCKET_URL=https://tu-backend.railway.app
VITE_ENV=production
```

#### Paso 2: Build
```bash
npm run build
```

#### Paso 3: Deploy
```bash
railway init
railway up
```

### App Móvil

#### Paso 1: Configurar EAS
```bash
npm install -g eas-cli
eas login
eas build:configure
```

#### Paso 2: Build Android
```bash
eas build --platform android --profile production
```

#### Paso 3: Build iOS
```bash
eas build --platform ios --profile production
```

---

## 3. Configuración de Dominio

### Railway

1. En Railway Dashboard → Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS:

```
Type: CNAME
Name: @
Value: tu-proyecto.railway.app
```

### SSL
Railway configura SSL automáticamente con Let's Encrypt.

---

## 4. Variables de Entorno

### Backend Producción
```bash
# Copiar desde .env.example
cp .env.example .env.production

# Editar con valores reales
nano .env.production
```

### Secrets Sensibles
**NUNCA** commitear:
- `JWT_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `AWS_SECRET_ACCESS_KEY`
- `FIREBASE_PRIVATE_KEY`
- `DATABASE_URL`

### Generar Secrets
```bash
# JWT Secret (256 bits)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O usar OpenSSL
openssl rand -hex 32
```

---

## 5. Migraciones

### Desarrollo
```bash
npx prisma migrate dev --name nombre_migracion
```

### Producción
```bash
# Aplicar migraciones
npx prisma migrate deploy

# Verificar estado
npx prisma migrate status
```

### Rollback
```bash
# No hay rollback automático en Prisma
# Crear migración inversa manualmente
npx prisma migrate dev --name rollback_feature_x
```

---

## 6. Monitoreo

### Logs

**Railway**:
```bash
railway logs
```

**Backend**:
```typescript
// Winston configurado en src/config/logger.ts
logger.info('Mensaje informativo');
logger.error('Error crítico', { error });
```

### Métricas

**Health Check**:
```http
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-11-22T18:00:00Z",
  "uptime": 3600
}
```

**Monitoring Tools**:
- Railway Dashboard (CPU, RAM, Network)
- Sentry (errores)
- LogRocket (sesiones de usuario)

### Alertas

Configurar en Railway:
- CPU > 80%
- RAM > 90%
- Errores 5xx > 10/min

---

## 7. Troubleshooting

### Error: "Cannot connect to database"

**Solución**:
```bash
# Verificar DATABASE_URL
railway variables

# Verificar conexión
railway run npx prisma db push
```

### Error: "Port already in use"

**Solución**:
```bash
# Railway asigna PORT automáticamente
# Usar process.env.PORT en código
const PORT = process.env.PORT || 3000;
```

### Error: "Prisma Client not generated"

**Solución**:
```bash
# Agregar a build command
npx prisma generate
```

### Error: "CORS policy"

**Solución**:
```typescript
// Verificar CORS_ORIGIN en .env
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
}));
```

### Error: "MercadoPago webhook not working"

**Solución**:
1. Verificar URL pública en MercadoPago
2. Verificar que endpoint acepta POST
3. Revisar logs de Railway

### Performance Issues

**Optimizaciones**:
```typescript
// 1. Índices en BD
@@index([doctorId, status, createdAt])

// 2. Paginación
const consultations = await prisma.consultation.findMany({
  take: 20,
  skip: page * 20
});

// 3. Caché
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 });
```

---

## Checklist de Despliegue

### Pre-Producción
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas
- [ ] SSL configurado
- [ ] Dominio apuntando

### Producción
- [ ] Backend desplegado
- [ ] Frontend desplegado
- [ ] App móvil en stores
- [ ] Monitoreo activo
- [ ] Backups configurados
- [ ] Documentación actualizada

### Post-Despliegue
- [ ] Smoke tests
- [ ] Monitoreo 24h
- [ ] Logs revisados
- [ ] Performance OK
- [ ] Usuarios notificados

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
railway logs --follow

# Ejecutar comando en producción
railway run npx prisma studio

# Reiniciar servicio
railway restart

# Ver variables
railway variables

# Agregar variable
railway variables set KEY=value

# Conectar a BD
railway connect

# Ver status
railway status
```

---

**Última actualización**: 22 de Noviembre de 2024
