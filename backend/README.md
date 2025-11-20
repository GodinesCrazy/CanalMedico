# CanalMedico Backend API

Backend API para la plataforma de consultas médicas asíncronas CanalMedico.

## Tecnologías

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

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Generar cliente de Prisma:
```bash
npm run prisma:generate
```

4. Ejecutar migraciones:
```bash
npm run prisma:migrate
```

5. Iniciar servidor en desarrollo:
```bash
npm run dev
```

6. Compilar para producción:
```bash
npm run build
npm start
```

## Variables de Entorno

Ver `.env.example` para todas las variables de entorno requeridas.

## Documentación API

La documentación Swagger está disponible en: `http://localhost:3000/api-docs`

## Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/        # Módulos de negocio
│   │   ├── auth/
│   │   ├── users/
│   │   ├── doctors/
│   │   ├── patients/
│   │   ├── consultations/
│   │   ├── messages/
│   │   ├── chats/
│   │   ├── files/
│   │   ├── payments/
│   │   └── notifications/
│   ├── config/         # Configuraciones
│   ├── database/       # Configuración de base de datos
│   ├── middlewares/    # Middlewares personalizados
│   ├── utils/          # Utilidades
│   └── types/          # Tipos TypeScript
├── prisma/
│   └── schema.prisma   # Esquema de base de datos
└── server.ts           # Punto de entrada
```

## Endpoints Principales

- `/api/auth` - Autenticación (registro, login, refresh token)
- `/api/users` - Gestión de usuarios
- `/api/doctors` - Gestión de doctores
- `/api/patients` - Gestión de pacientes
- `/api/consultations` - Consultas médicas
- `/api/messages` - Mensajes del chat
- `/api/payments` - Pagos y webhooks de Stripe
- `/api/files` - Subida y gestión de archivos (S3)
- `/api/notifications` - Notificaciones push

## Socket.io

El servidor Socket.io está disponible en el mismo puerto HTTP. Eventos:

- `join-consultation` - Unirse a una sala de consulta
- `leave-consultation` - Dejar una sala de consulta
- `new-message` - Enviar nuevo mensaje
- `message-received` - Recibir mensaje

## Seguridad

- JWT con refresh tokens
- Bcrypt para hash de contraseñas
- Rate limiting
- Helmet para headers de seguridad
- CORS configurado
- Validación con Zod
- Sanitización de entrada

## Licencia

MIT

