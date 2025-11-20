# 🚀 Próximos Pasos - CanalMedico en Railway

## ✅ Estado Actual: FUNCIONANDO

- ✅ Backend desplegado en Railway
- ✅ PostgreSQL conectado y funcionando
- ✅ Endpoints `/` y `/health` respondiendo correctamente
- ✅ Base de datos lista para usar

## 📋 Paso 1: Ejecutar Migraciones (Crear Tablas)

Las tablas de la base de datos aún no existen. Necesitas crearlas:

### Opción A: Desde Railway Terminal (Recomendado)

1. **Ve a Railway** → Servicio `CanalMedico` (backend)
2. **Haz clic en la pestaña "Settings"**
3. **Busca "Service Terminal"** o ve a **"Deployments"** → Haz clic en el deployment más reciente
4. **Haz clic en el icono de terminal** (🔲) o "Open Terminal"
5. **Ejecuta este comando:**
   ```bash
   npx prisma migrate deploy
   ```
6. **Espera a que termine** - Creará todas las tablas en la base de datos

### Opción B: Desde tu Terminal Local

Si tienes acceso a la base de datos localmente:

```bash
cd backend
npx prisma migrate deploy
```

**Resultado esperado:**
```
✅ Migrations applied successfully
```

## 📋 Paso 2: Probar el API

Ahora que las tablas están creadas, puedes probar los endpoints:

### 2.1 Acceder a la Documentación (Swagger UI)

1. **Abre tu navegador**
2. **Ve a:**
   ```
   https://canalmedico-production.up.railway.app/api-docs
   ```
3. **Deberías ver** la interfaz de Swagger UI con todos los endpoints documentados
4. **Puedes probar los endpoints directamente** desde Swagger UI

### 2.2 Probar Endpoints Básicos

#### Registro de Doctor

**Endpoint:** `POST /api/auth/register/doctor`

**Ejemplo de body:**
```json
{
  "email": "doctor@example.com",
  "password": "Password123!",
  "name": "Dr. Juan Pérez",
  "speciality": "Cardiología",
  "tarifaConsulta": 50.00,
  "tarifaUrgencia": 80.00
}
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "email": "doctor@example.com",
    "role": "DOCTOR"
  },
  "doctor": {
    "id": "...",
    "name": "Dr. Juan Pérez",
    "speciality": "Cardiología"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### Registro de Paciente

**Endpoint:** `POST /api/auth/register/patient`

**Ejemplo de body:**
```json
{
  "email": "paciente@example.com",
  "password": "Password123!",
  "name": "María González",
  "age": 35
}
```

#### Login

**Endpoint:** `POST /api/auth/login`

**Ejemplo de body:**
```json
{
  "email": "doctor@example.com",
  "password": "Password123!"
}
```

## 📋 Paso 3: Configurar Variables Reales (Cuando Estés Listo)

### 3.1 Stripe (Para Pagos)

**Cuándo configurar:** Cuando quieras habilitar pagos reales

**Pasos:**
1. Crea una cuenta en [Stripe](https://stripe.com)
2. Ve a **Developers** → **API Keys**
3. Obtén tus claves:
   - `STRIPE_SECRET_KEY` (empieza con `sk_test_...` o `sk_live_...`)
   - `STRIPE_PUBLISHABLE_KEY` (empieza con `pk_test_...` o `pk_live_...`)
4. En Railway → Servicio `CanalMedico` → **Variables**
5. Reemplaza los valores temporales con tus claves reales

**Webhook (Opcional):**
- Configura webhook en Stripe: `https://canalmedico-production.up.railway.app/api/payments/webhook`
- Agrega `STRIPE_WEBHOOK_SECRET` a Railway

### 3.2 AWS S3 (Para Archivos)

**Cuándo configurar:** Cuando quieras subir archivos (fotos, PDFs, audio)

**Pasos:**
1. Crea una cuenta en [AWS](https://aws.amazon.com)
2. Crea un bucket S3:
   - Nombre: `canalmedico-files` (o el que prefieras)
   - Región: `us-east-1` (o la que prefieras)
3. Crea un usuario IAM con permisos de S3
4. Genera Access Keys para ese usuario
5. En Railway → Servicio `CanalMedico` → **Variables**
6. Reemplaza los valores temporales:
   - `AWS_ACCESS_KEY_ID` → Tu Access Key ID
   - `AWS_SECRET_ACCESS_KEY` → Tu Secret Access Key
   - `AWS_S3_BUCKET` → Nombre de tu bucket
   - `AWS_REGION` → Región de tu bucket

### 3.3 Firebase (Para Notificaciones Push - Opcional)

**Cuándo configurar:** Cuando quieras enviar notificaciones push

**Pasos:**
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Descarga el archivo de credenciales de servicio
3. Obtén los valores necesarios
4. En Railway → Servicio `CanalMedico` → **Variables**
5. Agrega:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_SERVER_KEY` (de Cloud Messaging)

## 📋 Paso 4: Desplegar Frontend Web (Cuando Estés Listo)

### 4.1 Crear Servicio Frontend en Railway

1. **En Railway**, en el mismo proyecto, haz clic en **"+ New"**
2. Selecciona **"GitHub Repo"**
3. Selecciona tu repositorio: `GodinesCrazy/CanalMedico`
4. **IMPORTANTE**: En **Root Directory**, configura: `frontend-web`
5. Railway detectará automáticamente que es un proyecto Vite

### 4.2 Configurar Variables del Frontend

En Railway → Servicio Frontend → **Variables**:

```env
VITE_API_URL=https://canalmedico-production.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (de Stripe)
```

### 4.3 Actualizar Backend

Después de desplegar el frontend:

1. **Obtén la URL del frontend** en Railway
2. **Ve al backend** → **Variables**
3. **Actualiza** `FRONTEND_WEB_URL` con la URL real del frontend

## 📋 Paso 5: Desplegar App Móvil (Cuando Estés Listo)

### 5.1 Configurar EAS Build

1. **Instala EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **En la carpeta `app-mobile`, configura:**
   ```bash
   cd app-mobile
   eas login
   eas build:configure
   ```

3. **Configura las variables de entorno:**
   - Crea archivo `.env` en `app-mobile`:
     ```
     EXPO_PUBLIC_API_URL=https://canalmedico-production.up.railway.app
     ```

4. **Build para Android:**
   ```bash
   eas build --platform android
   ```

5. **Build para iOS:**
   ```bash
   eas build --platform ios
   ```

### 5.2 Actualizar Backend

Después de desplegar la app móvil:

1. **Actualiza** `MOBILE_APP_URL` en Railway con la URL de la app móvil

## ✅ Checklist de Estado Actual

- [x] Backend desplegado en Railway
- [x] PostgreSQL conectado
- [x] Endpoints funcionando
- [ ] **Migraciones ejecutadas** ← HACER AHORA
- [ ] **Probar registro y login** ← HACER AHORA
- [ ] Configurar Stripe (cuando uses pagos)
- [ ] Configurar AWS S3 (cuando uses archivos)
- [ ] Desplegar frontend web
- [ ] Desplegar app móvil

## 🎯 Lo Más Importante AHORA

### ⚡ Acción Inmediata (Hacer Ahora):

1. **Ejecutar migraciones:**
   - Ve a Railway → Servicio `CanalMedico` → Terminal
   - Ejecuta: `npx prisma migrate deploy`
   - Esto creará todas las tablas en la base de datos

2. **Probar el API:**
   - Ve a: `https://canalmedico-production.up.railway.app/api-docs`
   - Prueba registrar un doctor y un paciente
   - Prueba hacer login

### 📝 Después (Cuando Estés Listo):

- Configurar Stripe para pagos reales
- Configurar AWS S3 para archivos reales
- Desplegar el frontend web
- Desplegar la app móvil

## 🆘 Si Necesitas Ayuda

- **Problemas con migraciones**: Revisa los logs en Railway
- **Errores al registrar usuarios**: Verifica que las migraciones se ejecutaron correctamente
- **Problemas con endpoints**: Revisa la documentación en `/api-docs`

---

**Siguiente paso inmediato**: Ejecuta las migraciones para crear las tablas en la base de datos. Luego prueba registrar un usuario y hacer login.

