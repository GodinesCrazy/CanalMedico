# QA Master Checklist - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Checklist completo de pruebas manuales click-by-click por rol

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Secciones 4.7, 4.8, 4.9, 4.15)

---

## ADMIN QA Checklist

### 1. Login ? P0

**Pasos:**
1. Abrir navegador: `https://app.canalmedico.cl/login`
2. Ingresar email: `admin@canalmedico.com`
3. Ingresar password: `[password]`
4. Click en botón "Login"

**Expected Result:**
- Redirect a `/` (Dashboard)
- Token almacenado en localStorage
- Usuario autenticado visible en UI

**Endpoint Implicado:**
- `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "admin@canalmedico.com",
  "password": "[password]"
}
```

**Response Esperado:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "admin@canalmedico.com",
    "role": "ADMIN"
  }
}
```

**Query SQL/Prisma:**
```sql
SELECT * FROM users WHERE email='admin@canalmedico.com' AND role='ADMIN';
```

**Prioridad:** P0 (Crítica)

---

### 2. Ver Usuarios/Doctores ? P0

**Pasos:**
1. Navegar a `/admin/doctors` o similar
2. Verificar lista de usuarios/doctores

**Expected Result:**
- Lista de usuarios con roles
- Datos correctos (nombre, email, estado)

**Endpoint Implicado:**
- `GET /api/admin/doctors` (o similar)

**Query SQL/Prisma:**
```sql
SELECT u.id, u.email, u.role, d.name, d.speciality, d.verificacionEstadoFinal 
FROM users u 
LEFT JOIN doctors d ON u.id = d."userId" 
WHERE u.role IN ('DOCTOR', 'ADMIN');
```

**Prioridad:** P0 (Crítica)

---

### 3. Aprobar Médicos ? P0

**Pasos:**
1. Navegar a `/admin/signup-requests`
2. Ver lista de solicitudes con estado `PENDING`
3. Click en solicitud específica
4. Revisar datos: nombre, RUT, especialidad
5. Click en botón "Aprobar" o "Rechazar"

**Expected Result:**
- Lista muestra solicitudes pendientes
- Botones "Aprobar"/"Rechazar" funcionan
- Estado cambia a `APPROVED` o `REJECTED`
- Usuario recibe notificación (si aplica)

**Endpoint Implicado:**
- `GET /api/signup-requests` (query: `status=PENDING`)
- `PATCH /api/signup-requests/:id/status`

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Query SQL/Prisma:**
```sql
-- Antes de aprobar
SELECT * FROM doctor_signup_requests WHERE status='PENDING';

-- Después de aprobar
SELECT * FROM doctor_signup_requests WHERE id='[id]' AND status='APPROVED';
SELECT * FROM doctors WHERE userId IN (SELECT userId FROM doctor_signup_requests WHERE id='[id]');
```

**Prioridad:** P0 (Crítica)

---

### 4. Ver Consultas y Pagos ? P0

**Pasos:**
1. Navegar a `/consultations`
2. Ver lista de consultas
3. Click en consulta específica
4. Ver detalles: estado, pago, médico, paciente

**Expected Result:**
- Lista completa de consultas
- Estados visibles: `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- Estado de pago visible: `PENDING`, `PAID`, `FAILED`

**Endpoint Implicado:**
- `GET /api/admin/consultations` (o `GET /api/consultations`)

**Query SQL/Prisma:**
```sql
SELECT 
  c.id, 
  c.status as consultation_status, 
  c.price, 
  c."startedAt", 
  c."endedAt",
  p.status as payment_status, 
  p.amount, 
  p.fee, 
  p."paidAt",
  d.name as doctor_name,
  pt.name as patient_name
FROM consultations c 
LEFT JOIN payments p ON c."paymentId" = p.id 
LEFT JOIN doctors d ON c."doctorId" = d.id 
LEFT JOIN patients pt ON c."patientId" = pt.id 
ORDER BY c."createdAt" DESC 
LIMIT 50;
```

**Prioridad:** P0 (Crítica)

---

## DOCTOR QA Checklist

### 1. Login ? P0

**Pasos:**
1. Abrir navegador: `https://app.canalmedico.cl/login`
2. Ingresar email: `doctor@canalmedico.com`
3. Ingresar password: `[password]`
4. Click en botón "Login"

**Expected Result:**
- Redirect a `/` (Dashboard)
- Token almacenado en localStorage
- Perfil de médico visible

**Endpoint Implicado:**
- `POST /api/auth/login`

**Query SQL/Prisma:**
```sql
SELECT u.*, d.* FROM users u JOIN doctors d ON u.id = d."userId" WHERE u.email='doctor@canalmedico.com';
```

**Prioridad:** P0 (Crítica)

---

### 2. Disponibilidad (Estado Online/Offline) ? P0

**Pasos:**
1. Navegar a `/settings`
2. Buscar toggle "Estado Online" o "Disponibilidad"
3. Activar/desactivar toggle

**Expected Result:**
- Toggle cambia estado visual
- Estado se guarda en backend
- Cambio se refleja en lista de doctores disponibles

**Endpoint Implicado:**
- `PUT /api/doctor/profile` o `PATCH /api/doctor/profile`

**Request Body:**
```json
{
  "estadoOnline": true
}
```

**Query SQL/Prisma:**
```sql
SELECT "estadoOnline" FROM doctors WHERE "userId" = '[user_id]';
```

**Prioridad:** P0 (Crítica)

---

### 3. Ver Consulta Pagada ? P0

**Pasos:**
1. Navegar a `/consultations`
2. Ver lista de consultas
3. Click en consulta con estado `PENDING` o `ACTIVE`
4. Ver detalles: paciente, estado de pago, precio

**Expected Result:**
- Consulta visible en lista
- Estado de pago: `PAID`
- Consulta activa: `status = 'ACTIVE'`
- Botón "Aceptar Consulta" visible (si `PENDING`)

**Endpoint Implicado:**
- `GET /api/consultations/doctor/:doctorId`
- `GET /api/consultations/:id`

**Query SQL/Prisma:**
```sql
SELECT 
  c.*, 
  p.status as payment_status, 
  p.amount,
  pt.name as patient_name
FROM consultations c 
JOIN payments p ON c."paymentId" = p.id 
JOIN patients pt ON c."patientId" = pt.id 
WHERE c."doctorId" = '[doctor_id]' 
  AND p.status = 'PAID' 
  AND c.status = 'ACTIVE'
ORDER BY c."createdAt" DESC;
```

**Prioridad:** P0 (Crítica)

---

### 4. Responder Chat ? P0

**Pasos:**
1. Navegar a `/chat/:consultationId`
2. Ver mensajes existentes
3. Escribir mensaje en input
4. Click en botón "Enviar" o presionar Enter

**Expected Result:**
- Mensaje aparece inmediatamente en chat
- Mensaje se guarda en BD
- Socket.io emite `new-message` (si aplica)
- Paciente recibe notificación (si aplica)

**Endpoint Implicado:**
- `POST /api/messages`
- `GET /api/messages/consultation/:consultationId`

**Request Body:**
```json
{
  "consultationId": "[consultation_id]",
  "senderId": "[doctor_user_id]",
  "text": "Hola, ¿en qué puedo ayudarte?"
}
```

**Query SQL/Prisma:**
```sql
-- Verificar último mensaje
SELECT * FROM messages 
WHERE "consultationId" = '[consultation_id]' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Prioridad:** P0 (Crítica)

---

### 5. Ver Historial de Consultas ? P1

**Pasos:**
1. Navegar a `/consultations`
2. Ver lista completa de consultas
3. Filtrar por estado: `PENDING`, `ACTIVE`, `COMPLETED`

**Expected Result:**
- Lista muestra todas las consultas del doctor
- Filtros funcionan correctamente
- Fechas y estados correctos

**Endpoint Implicado:**
- `GET /api/consultations/doctor/:doctorId`

**Query SQL/Prisma:**
```sql
SELECT * FROM consultations 
WHERE "doctorId" = '[doctor_id]' 
ORDER BY "createdAt" DESC;
```

**Prioridad:** P1 (Importante)

---

## PATIENT QA Checklist

### 1. WhatsApp Mensaje (Feature Flag) ?? P1

**Pasos:**
1. Enviar mensaje a número WhatsApp Business configurado
2. Mensaje: "Hola, necesito consulta médica"
3. Esperar auto-respuesta

**Expected Result:**
- Auto-respuesta recibida en < 5 segundos
- Mensaje contiene deep link: `https://app.canalmedico.cl/consultation?attemptId=<id>`
- `ConsultationAttempt` creado en BD

**Endpoint Implicado:**
- `POST /api/whatsapp/webhook`

**Query SQL/Prisma:**
```sql
SELECT * FROM consultation_attempts 
WHERE "patientPhone" = '+56912345678' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Pre-requisito:** `ENABLE_WHATSAPP_AUTO_RESPONSE=true`

**Prioridad:** P1 (Importante si WhatsApp está habilitado)

---

### 2. Recibir Deep Link ? P0

**Pasos:**
1. Click en deep link recibido por WhatsApp
2. Verificar que abre app/web con `attemptId` en URL

**Expected Result:**
- URL contiene `attemptId` como query param
- Página carga correctamente
- Datos del `ConsultationAttempt` visibles

**Deep Link Esperado:**
```
https://app.canalmedico.cl/consultation?attemptId=[id]
```

**Query SQL/Prisma:**
```sql
SELECT * FROM consultation_attempts WHERE id = '[attempt_id]';
```

**Prioridad:** P0 (Crítica para flujo WhatsApp)

---

### 3. Pagar Consulta ? P0

**Pasos:**
1. Desde `/payment` o desde deep link
2. Ver resumen: precio, médico, tipo de consulta
3. Click en botón "Pagar"
4. Redirección a MercadoPago Checkout
5. Completar pago (usar tarjeta de prueba)

**Expected Result:**
- Redirección a MercadoPago exitosa
- Pago completado en MercadoPago
- Webhook actualiza `Payment.status = 'PAID'`
- Consulta se activa automáticamente

**Endpoint Implicado:**
- `POST /api/payments/session`
- `POST /api/payments/webhook` (MercadoPago)

**Request Body:**
```json
{
  "consultationId": "[consultation_id]",
  "amount": 15000
}
```

**Query SQL/Prisma:**
```sql
-- Verificar pago creado
SELECT * FROM payments WHERE "consultationId" = '[consultation_id]' AND status = 'PENDING';

-- Después del webhook (debe ser PAID)
SELECT * FROM payments WHERE "consultationId" = '[consultation_id]' AND status = 'PAID';

-- Verificar consulta activada
SELECT * FROM consultations WHERE id = '[consultation_id]' AND status = 'ACTIVE';
```

**Prioridad:** P0 (Crítica)

---

### 4. Entrar a Consulta (Chat) ? P0

**Pasos:**
1. Desde `/consultations` o desde notificación
2. Click en consulta activa
3. Navegar a `/chat/:consultationId`
4. Ver interfaz de chat

**Expected Result:**
- Chat habilitado (consulta `status = 'ACTIVE'`)
- Mensajes anteriores visibles
- Input de mensaje habilitado

**Endpoint Implicado:**
- `GET /api/consultations/:id`
- `GET /api/messages/consultation/:consultationId`

**Query SQL/Prisma:**
```sql
SELECT * FROM consultations WHERE id = '[consultation_id]' AND status = 'ACTIVE';
SELECT * FROM messages WHERE "consultationId" = '[consultation_id]' ORDER BY "createdAt" ASC;
```

**Prioridad:** P0 (Crítica)

---

### 5. Escribir Mensaje ? P0

**Pasos:**
1. En `/chat/:consultationId`
2. Escribir mensaje en input
3. Click en botón "Enviar" o presionar Enter

**Expected Result:**
- Mensaje aparece inmediatamente en chat
- Mensaje se guarda en BD
- Médico recibe notificación (si aplica)

**Endpoint Implicado:**
- `POST /api/messages`

**Request Body:**
```json
{
  "consultationId": "[consultation_id]",
  "senderId": "[patient_user_id]",
  "text": "Buenos días doctor, tengo dolor de cabeza"
}
```

**Query SQL/Prisma:**
```sql
SELECT * FROM messages 
WHERE "consultationId" = '[consultation_id]' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Prioridad:** P0 (Crítica)

---

## Resumen de Prioridades

| Rol | Caso de Prueba | Prioridad |
|-----|---------------|-----------|
| **ADMIN** |
| Login | P0 |
| Ver Usuarios/Doctores | P0 |
| Aprobar Médicos | P0 |
| Ver Consultas y Pagos | P0 |
| **DOCTOR** |
| Login | P0 |
| Disponibilidad | P0 |
| Ver Consulta Pagada | P0 |
| Responder Chat | P0 |
| Ver Historial | P1 |
| **PATIENT** |
| WhatsApp Mensaje | P1 (si FF habilitado) |
| Recibir Deep Link | P0 |
| Pagar Consulta | P0 |
| Entrar a Consulta | P0 |
| Escribir Mensaje | P0 |

---

**Leyenda:**
- ? **OK** - Funcionalidad implementada
- ?? **Feature Flag** - Requiere habilitar feature flag
- **P0** - Crítica (bloquea monetización)
- **P1** - Importante (afecta UX pero no bloquea)
- **P2** - Deseable (nice-to-have)

---

**Referencias:**
- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Secciones 4.7, 4.8, 4.9, 4.15)
- `docs/RBAC_VERIFIED.md` (Endpoints protegidos)
- `docs/WHATSAPP_QA_RUNBOOK.md` (Flujo WhatsApp)

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA QA**
