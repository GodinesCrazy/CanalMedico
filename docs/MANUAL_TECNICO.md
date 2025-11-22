# 📘 Manual Técnico - CanalMedico

## Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura)
2. [Base de Datos](#base-de-datos)
3. [API REST](#api-rest)
4. [WebSocket](#websocket)
5. [Autenticación](#autenticación)
6. [Pagos](#pagos)
7. [Archivos](#archivos)
8. [Notificaciones](#notificaciones)
9. [Deployment](#deployment)

---

## 1. Arquitectura del Sistema

### Stack Tecnológico

**Backend**:
- Runtime: Node.js 18+
- Framework: Express.js
- Lenguaje: TypeScript
- ORM: Prisma
- Base de Datos: SQLite (dev) / PostgreSQL (prod)
- WebSocket: Socket.IO
- Autenticación: JWT

**Frontend Web**:
- Framework: React 18
- Build Tool: Vite
- Lenguaje: TypeScript
- Styling: Tailwind CSS
- State: Zustand
- Routing: React Router

**App Móvil**:
- Framework: React Native
- Platform: Expo
- Lenguaje: TypeScript
- State: Zustand
- Navigation: Expo Router

### Flujo de Datos

```
Cliente (Web/Mobile)
    ↓
API REST (Express)
    ↓
Middleware (Auth, Validation)
    ↓
Controller
    ↓
Service
    ↓
Prisma ORM
    ↓
Base de Datos
```

---

## 2. Base de Datos

### Modelos Principales

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Bcrypt hashed
  role      String   @default("PATIENT")
  createdAt DateTime @default(now())
}
```

**Roles**: `DOCTOR`, `PATIENT`, `ADMIN`

#### Doctor
```prisma
model Doctor {
  id              String   @id
  userId          String   @unique
  name            String
  rut             String?  @unique
  speciality      String
  tarifaConsulta  Decimal
  tarifaUrgencia  Decimal
  estadoOnline    Boolean
  payoutMode      String   // "IMMEDIATE" | "MONTHLY"
  payoutDay       Int      // 1-28
}
```

#### Consultation
```prisma
model Consultation {
  id        String   @id
  doctorId  String
  patientId String
  type      String   // "NORMAL" | "URGENT"
  status    String   // "PENDING" | "ACTIVE" | "CLOSED"
  paymentId String?
}
```

**Estados de Consulta**:
- `PENDING`: Creada, esperando pago
- `ACTIVE`: Pagada, en curso
- `CLOSED`: Finalizada

#### Payment
```prisma
model Payment {
  id              String
  amount          Decimal
  fee             Decimal  // Comisión (10%)
  netAmount       Decimal  // amount - fee
  status          String   // "PENDING" | "PAID" | "FAILED"
  payoutStatus    String   // "PENDING" | "PAID_OUT"
  mercadopagoPreferenceId String?
  mercadopagoPaymentId    String?
}
```

### Índices

Todos los modelos tienen índices en:
- IDs de relaciones (doctorId, patientId, etc.)
- Campos de búsqueda frecuente (email, status, createdAt)
- Campos únicos (rut, mercadopagoPreferenceId)

---

## 3. API REST

### Autenticación

**Registro**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "DOCTOR",
  "name": "Dr. Juan Pérez",
  "rut": "12345678-9",
  "speciality": "Medicina General"
}
```

**Login**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### Endpoints Principales

#### Consultas
```http
GET    /api/consultations              # Listar consultas
POST   /api/consultations              # Crear consulta
GET    /api/consultations/:id          # Obtener consulta
PATCH  /api/consultations/:id/close    # Cerrar consulta
```

#### Pagos
```http
POST   /api/payments/create-preference # Crear preferencia MercadoPago
POST   /api/payments/webhook           # Webhook MercadoPago
GET    /api/payments/doctor/:id        # Pagos de médico
```

#### Liquidaciones
```http
GET    /api/payouts/my-payouts         # Mis liquidaciones (Doctor)
GET    /api/payouts/my-stats           # Mis estadísticas (Doctor)
POST   /api/payouts/process            # Procesar liquidaciones (Admin)
```

#### Comisiones
```http
GET    /api/commissions/stats          # Estadísticas (Admin)
GET    /api/commissions/by-doctor      # Por médico (Admin)
GET    /api/commissions/monthly        # Mensuales (Admin)
```

### Autenticación de Requests

Todos los endpoints protegidos requieren header:
```http
Authorization: Bearer <token>
```

### Formato de Respuesta

**Éxito**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

---

## 4. WebSocket

### Conexión

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'jwt-token'
  }
});
```

### Eventos

**Cliente → Servidor**:
```typescript
// Unirse a sala de consulta
socket.emit('join-consultation', consultationId);

// Enviar mensaje
socket.emit('send-message', {
  consultationId,
  text: 'Mensaje',
  senderId: userId
});
```

**Servidor → Cliente**:
```typescript
// Nuevo mensaje
socket.on('new-message', (message) => {
  console.log(message);
});

// Usuario conectado
socket.on('user-connected', (userId) => {
  console.log(`Usuario ${userId} conectado`);
});
```

---

## 5. Autenticación

### JWT

**Generación**:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Verificación**:
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Middleware

```typescript
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  next();
};
```

### Roles

```typescript
export const requireRole = (role: string) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

---

## 6. Pagos

### MercadoPago

**Crear Preferencia**:
```typescript
const preference = {
  items: [{
    title: `Consulta ${type}`,
    quantity: 1,
    unit_price: amount
  }],
  back_urls: {
    success: `${FRONTEND_URL}/payment/success`,
    failure: `${FRONTEND_URL}/payment/failure`,
    pending: `${FRONTEND_URL}/payment/pending`
  },
  auto_return: 'approved',
  notification_url: `${BACKEND_URL}/api/payments/webhook`
};

const response = await mercadopago.preferences.create(preference);
```

**Webhook**:
```typescript
app.post('/api/payments/webhook', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const payment = await mercadopago.payment.get(data.id);
    // Actualizar estado en BD
  }
  
  res.sendStatus(200);
});
```

### Sistema de Liquidaciones

**Pago Inmediato**:
```typescript
if (doctor.payoutMode === 'IMMEDIATE') {
  payment.payoutStatus = 'PAID_OUT';
  payment.payoutDate = new Date();
}
```

**Pago Mensual**:
```typescript
// Job diario
cron.schedule('0 0 * * *', async () => {
  const today = new Date().getDate();
  const doctors = await prisma.doctor.findMany({
    where: {
      payoutMode: 'MONTHLY',
      payoutDay: today
    }
  });
  
  for (const doctor of doctors) {
    await processMonthlyPayout(doctor.id);
  }
});
```

---

## 7. Archivos

### AWS S3

**Upload**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: AWS_REGION });

const upload = async (file: Express.Multer.File) => {
  const key = `${Date.now()}-${file.originalname}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));
  
  return `https://${AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
};
```

**Tipos Soportados**:
- Imágenes: JPG, PNG, GIF
- Documentos: PDF
- Audio: MP3, WAV

---

## 8. Notificaciones

### Firebase Cloud Messaging

**Enviar Notificación**:
```typescript
import admin from 'firebase-admin';

await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: 'Nuevo mensaje',
    body: 'Tienes un nuevo mensaje del Dr. Pérez'
  },
  data: {
    consultationId,
    type: 'new-message'
  }
});
```

---

## 9. Deployment

### Variables de Entorno

Ver `.env.example` para lista completa.

**Críticas**:
- `DATABASE_URL`: Conexión a BD
- `JWT_SECRET`: Secret para JWT
- `MERCADOPAGO_ACCESS_TOKEN`: Token MercadoPago
- `AWS_ACCESS_KEY_ID`: AWS credentials
- `FIREBASE_PROJECT_ID`: Firebase config

### Railway

1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático en cada push

### Migraciones

```bash
# Desarrollo
npx prisma migrate dev

# Producción
npx prisma migrate deploy
```

---

**Última actualización**: 22 de Noviembre de 2024
