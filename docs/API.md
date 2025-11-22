# 📡 Documentación de API - CanalMedico

## Base URL
```
Desarrollo: http://localhost:3000/api
Producción: https://api.canalmedico.cl/api
```

## Autenticación

Todos los endpoints protegidos requieren:
```http
Authorization: Bearer <jwt_token>
```

---

## Auth

### Registro
```http
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "DOCTOR",
  "name": "Dr. Juan Pérez",
  "rut": "12345678-9",
  "speciality": "Medicina General"
}

Response 201:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "clx...",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "profile": { ... }
    }
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

---

## Consultas

### Listar Consultas
```http
GET /consultations
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "type": "NORMAL",
      "status": "ACTIVE",
      "doctor": { ... },
      "patient": { ... },
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ]
}
```

### Crear Consulta
```http
POST /consultations
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "clx...",
  "type": "NORMAL"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "PENDING",
    "paymentUrl": "https://mercadopago.com/..."
  }
}
```

### Cerrar Consulta
```http
PATCH /consultations/:id/close
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "CLOSED",
    "closedAt": "2024-11-22T12:00:00Z"
  }
}
```

---

## Pagos

### Crear Preferencia
```http
POST /payments/create-preference
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "clx..."
}

Response 200:
{
  "success": true,
  "data": {
    "preferenceId": "123456789-...",
    "initPoint": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=..."
  }
}
```

### Webhook MercadoPago
```http
POST /payments/webhook
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}

Response 200: OK
```

### Pagos de Médico
```http
GET /payments/doctor/:doctorId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "amount": 30000,
      "fee": 3000,
      "netAmount": 27000,
      "status": "PAID",
      "payoutStatus": "PAID_OUT",
      "paidAt": "2024-11-22T10:30:00Z"
    }
  ]
}
```

---

## Liquidaciones

### Mis Liquidaciones (Doctor)
```http
GET /payouts/my-payouts
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "period": "2024-11",
      "totalAmount": 270000,
      "paymentCount": 10,
      "processedAt": "2024-11-05T00:00:00Z"
    }
  ]
}
```

### Mis Estadísticas (Doctor)
```http
GET /payouts/my-stats
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalEarnings": 500000,
    "pendingAmount": 50000,
    "paidOutAmount": 450000
  }
}
```

### Procesar Liquidaciones (Admin)
```http
POST /payouts/process
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "processed": 5,
    "batches": [ ... ]
  }
}
```

---

## Comisiones (Admin)

### Estadísticas
```http
GET /commissions/stats
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalCommissions": 150000,
    "monthlyCommissions": 30000,
    "paymentsCount": 100
  }
}
```

### Por Médico
```http
GET /commissions/by-doctor?startDate=2024-11-01&endDate=2024-11-30
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "doctorId": "clx...",
      "doctorName": "Dr. Juan Pérez",
      "totalCommissions": 50000,
      "paymentsCount": 20
    }
  ]
}
```

---

## Mensajes

### Listar Mensajes
```http
GET /messages/consultation/:consultationId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "senderId": "clx...",
      "text": "Hola doctor",
      "fileUrl": null,
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ]
}
```

### Enviar Mensaje
```http
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "clx...",
  "text": "Mensaje de prueba"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "clx...",
    "text": "Mensaje de prueba",
    "createdAt": "2024-11-22T10:05:00Z"
  }
}
```

---

## Archivos

### Upload
```http
POST /files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
consultationId: clx...

Response 200:
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/..."
  }
}
```

---

## WebSocket Events

### Conexión
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'jwt-token' }
});
```

### Eventos Cliente → Servidor
```javascript
// Unirse a consulta
socket.emit('join-consultation', consultationId);

// Enviar mensaje
socket.emit('send-message', {
  consultationId,
  text: 'Mensaje',
  senderId: userId
});
```

### Eventos Servidor → Cliente
```javascript
// Nuevo mensaje
socket.on('new-message', (message) => {
  console.log(message);
});

// Usuario conectado
socket.on('user-connected', (userId) => {
  console.log(`Usuario ${userId} conectado`);
});

// Usuario desconectado
socket.on('user-disconnected', (userId) => {
  console.log(`Usuario ${userId} desconectado`);
});
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email duplicado) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## Rate Limiting

- **Window**: 15 minutos
- **Max Requests**: 100
- **Headers**:
  - `X-RateLimit-Limit`: Límite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

---

**Última actualización**: 22 de Noviembre de 2024
