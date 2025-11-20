# CanalMedico - Plataforma de Consultas Médicas Asíncronas

CanalMedico es una plataforma médica profesional que permite a médicos cobrar por consultas asincrónicas vía chat, y a pacientes contactar a sus médicos enviando texto, fotos, PDFs y audios.

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en tres partes principales:

- **Backend API** - Node.js + Express + TypeScript + PostgreSQL + Prisma
- **Frontend Web** - React + Vite + TypeScript + TailwindCSS (Panel de médicos)
- **App Móvil** - React Native + Expo + TypeScript (Para pacientes)

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js LTS (v18.x o superior)
- PostgreSQL 14+
- Docker Desktop (opcional, para PostgreSQL)
- npm 9.x o superior
- Expo CLI (para app móvil)

### Instalación

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales

# Configurar PostgreSQL (opción A: Docker)
cd ..
docker-compose up -d

# O instalar PostgreSQL localmente (opción B)
# Crear base de datos: canalmedico

# Generar cliente Prisma
cd backend
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor
npm run dev
```

El backend estará disponible en: `http://localhost:3000`
Documentación API: `http://localhost:3000/api-docs`

#### 2. Frontend Web

```bash
cd frontend-web
npm install
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

#### 3. App Móvil

```bash
cd app-mobile
npm install
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar Expo
npx expo start
```

## 📁 Estructura del Proyecto

```
CanalMedico/
├── backend/              # API Backend
│   ├── src/
│   │   ├── modules/      # Módulos de negocio
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── doctors/
│   │   │   ├── patients/
│   │   │   ├── consultations/
│   │   │   ├── messages/
│   │   │   ├── chats/    # Socket.io
│   │   │   ├── files/    # S3 uploads
│   │   │   ├── payments/ # Stripe
│   │   │   └── notifications/ # Firebase
│   │   ├── config/       # Configuraciones
│   │   ├── database/     # Prisma
│   │   ├── middlewares/  # Middlewares
│   │   ├── utils/        # Utilidades
│   │   └── server.ts     # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma # Esquema de base de datos
│   └── package.json
│
├── frontend-web/         # Frontend Web (Médicos)
│   ├── src/
│   │   ├── pages/        # Páginas
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ConsultationsPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── EarningsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── components/   # Componentes
│   │   ├── layouts/      # Layouts
│   │   ├── store/        # Zustand
│   │   ├── services/     # Servicios API
│   │   └── styles/       # Estilos
│   └── package.json
│
├── app-mobile/           # App Móvil (Pacientes)
│   ├── src/
│   │   ├── screens/      # Pantallas
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── PaymentScreen.tsx
│   │   │   ├── HistoryScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── ScannerScreen.tsx
│   │   │   └── DoctorSearchScreen.tsx
│   │   ├── navigation/   # Navegación
│   │   ├── services/     # Servicios
│   │   ├── store/        # Zustand
│   │   ├── theme/        # Tema
│   │   └── utils/        # Utilidades
│   ├── app.json          # Config Expo
│   └── package.json
│
├── docker-compose.yml    # Docker Compose para PostgreSQL
├── README.md             # Este archivo
└── PROMPTMAESTRO.txt     # Especificaciones completas
```

## 🔑 Variables de Entorno

Cada parte del proyecto necesita su archivo `.env`. Ver `.env.example` en cada directorio para referencia.

### Backend (.env)

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
STRIPE_SECRET_KEY="..."
AWS_ACCESS_KEY_ID="..."
FIREBASE_SERVER_KEY="..."
```

### Frontend Web (.env)

```env
VITE_API_URL="http://localhost:3000"
VITE_STRIPE_PUBLISHABLE_KEY="..."
```

### App Móvil (.env)

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
```

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (chat en tiempo real)
- JWT (autenticación)
- Stripe (pagos)
- AWS S3 (archivos)
- Firebase (notificaciones push)
- Swagger (documentación API)
- Winston (logs)

### Frontend Web
- React 18 + Vite
- TypeScript
- TailwindCSS
- Zustand (estado global)
- Axios (API client)
- React Router
- Socket.io Client

### App Móvil
- React Native + Expo (~50.0.0)
- TypeScript
- React Navigation
- Zustand
- Expo Notifications
- Expo Image Picker
- Expo Barcode Scanner
- Socket.io Client

## 📚 Funcionalidades Principales

### Para Médicos (Frontend Web)
- ✅ Dashboard con estadísticas
- ✅ Gestión de consultas
- ✅ Chat en tiempo real
- ✅ Configuración de tarifas
- ✅ Panel de ingresos
- ✅ Perfil y configuración
- ✅ Notificaciones push

### Para Pacientes (App Móvil)
- ✅ Registro e inicio de sesión
- ✅ Búsqueda/selección de médicos
- ✅ Escaneo de códigos QR
- ✅ Iniciar consulta (normal/urgencia)
- ✅ Chat en tiempo real
- ✅ Envío de archivos (fotos, PDFs, audio)
- ✅ Pago de consultas con Stripe
- ✅ Historial de consultas
- ✅ Perfil del paciente
- ✅ Notificaciones push
- ✅ Deep links desde WhatsApp

### Sistema
- ✅ Autenticación con JWT + refresh tokens
- ✅ Chat en tiempo real con Socket.io
- ✅ Pagos con Stripe (comisiones automáticas)
- ✅ Subida de archivos a S3
- ✅ Notificaciones push (Firebase)
- ✅ Deep links para WhatsApp: `canalmedico://doctor/ID?openChat=true`
- ✅ Seguridad completa (rate limiting, CORS, validación)
- ✅ Documentación API con Swagger

## 🔒 Seguridad

- JWT con refresh tokens
- Bcrypt para hash de contraseñas
- Rate limiting
- CORS configurado
- Validación exhaustiva con Zod
- Sanitización de entrada
- HTTPS en producción
- AES256 para datos médicos sensibles

## 📖 Documentación API

La documentación Swagger está disponible en:
- Desarrollo: `http://localhost:3000/api-docs`

## 🧪 Desarrollo

### Backend
```bash
cd backend
npm run dev        # Modo desarrollo
npm run build      # Compilar
npm start          # Producción
npm run prisma:studio  # Prisma Studio
```

### Frontend Web
```bash
cd frontend-web
npm run dev        # Modo desarrollo
npm run build      # Compilar
npm run preview    # Preview de producción
```

### App Móvil
```bash
cd app-mobile
npx expo start     # Modo desarrollo
npx expo start --android  # Android
npx expo start --ios      # iOS
```

## 🚢 Despliegue

### Backend (AWS EC2)
1. Configurar instancia EC2
2. Instalar Node.js y PM2
3. Clonar repositorio
4. Configurar `.env` de producción
5. Ejecutar migraciones Prisma
6. Iniciar con PM2

### Base de Datos (AWS RDS)
1. Crear instancia RDS PostgreSQL
2. Actualizar `DATABASE_URL` en `.env`

### Archivos (AWS S3)
1. Crear bucket S3
2. Configurar IAM user
3. Actualizar credenciales en `.env`

### Frontend Web
1. Build: `npm run build`
2. Subir a S3 o CloudFront
3. Configurar dominio y SSL

### App Móvil
1. Build con EAS: `eas build`
2. Subir a App Store / Play Store

## 📝 Notas Importantes

- Mantén siempre las credenciales seguras
- No subas archivos `.env` a Git
- Realiza backups regulares de la base de datos
- Revisa los logs regularmente
- Configura SSL/HTTPS en producción
- Configura los deep links en producción

## 🎯 Estado del Proyecto

### ✅ Completado (100%)

- ✅ Backend completo (API REST + Socket.io)
- ✅ Frontend Web completo (Panel de médicos)
- ✅ App Móvil completa (App de pacientes)
- ✅ Base de datos con Prisma
- ✅ Autenticación y autorización
- ✅ Chat en tiempo real
- ✅ Sistema de pagos (Stripe)
- ✅ Subida de archivos (S3)
- ✅ Notificaciones push
- ✅ Deep links
- ✅ Documentación completa

## 📄 Licencia

MIT

## 👥 Contribuir

Este es un proyecto empresarial. Para contribuciones, contacta al equipo de desarrollo.

## 📞 Soporte

Para soporte técnico, revisa la documentación o contacta al equipo de desarrollo.

## 🔗 Repositorio

GitHub: https://github.com/GodinesCrazy/CanalMedico.git

---

**Versión:** 1.0.0  
**Última actualización:** 2024
