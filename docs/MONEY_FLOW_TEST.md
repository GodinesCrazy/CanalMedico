# Money Flow Test - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Prueba E2E final del flujo completo WhatsApp ? Pago ? Consulta ? Chat

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.10, 4.11)

---

## Descripción de la Prueba

**Flujo Completo:**
1. WhatsApp mensaje ? Auto-respuesta con deep link
2. Click deep link ? Crear consulta
3. MercadoPago preference ? Pago exitoso
4. Webhook MercadoPago ? Activar consulta
5. Chat médico-paciente ? Mensajes intercambiados

**Tiempo Estimado:** 10-15 minutos

**Prioridad:** P0 (Crítica - Valida monetización)

---

## Datos Fake de Ejemplo

### Datos Iniciales

```javascript
// Paciente (WhatsApp)
patientPhone: "+56987654321"
patientName: "Juan Pérez"
patientEmail: "juan.perez@test.com"
patientId: "clx1234567890"  // ID existente en BD

// Médico
doctorId: "clx0987654321"  // ID existente en BD
doctorName: "Dr. María González"
doctorEmail: "maria.gonzalez@test.com"
whatsappBusinessNumber: "+56912345678"  // Número configurado en Meta

// Consulta
consultationType: "NORMAL"
consultationPrice: 15000  // CLP (en centavos)
```

### IDs Esperados (generados por el sistema)

```javascript
consultationAttemptId: "clx_attempt_abc123"  // Generado por WhatsApp webhook
consultationId: "clx_consultation_xyz789"  // Generado al crear consulta
paymentId: "clx_payment_def456"  // Generado al crear payment session
mercadopagoPreferenceId: "1234567890-abc-xyz"  // Generado por MercadoPago
mercadopagoPaymentId: "9876543210-xyz-abc"  // Generado por MercadoPago webhook
messageId: "clx_message_ghi789"  // Generado al enviar mensaje
```

---

## Paso 1: WhatsApp Mensaje ? Auto-Respuesta

### Acción

Enviar mensaje desde teléfono `+56987654321` a número WhatsApp Business `+56912345678`:

```
"Hola, necesito consulta médica"
```

### Endpoint Implicado

**POST** `/api/whatsapp/webhook`

**Request (Meta Webhook):**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "56987654321",
          "text": {
            "body": "Hola, necesito consulta médica"
          },
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

### Evidencias Obligatorias

**1. ConsultationAttempt creado:**
```sql
SELECT * FROM consultation_attempts 
WHERE "patientPhone" = '+56987654321' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Expected:**
```json
{
  "id": "clx_attempt_abc123",
  "patientPhone": "+56987654321",
  "messageText": "Hola, necesito consulta médica",
  "doctorId": "clx0987654321",
  "source": "WHATSAPP",
  "status": "PENDING",
  "deepLinkSent": true,
  "deepLink": "https://app.canalmedico.cl/consultation?attemptId=clx_attempt_abc123",
  "createdAt": "2025-01-26T10:00:00Z"
}
```

**2. Logs Esperados:**
```
[WHATSAPP] Mensaje entrante recibido de +56987654321
[WHATSAPP] ConsultationAttempt creado: clx_attempt_abc123
[WHATSAPP] Auto-respuesta enviada con deep link: https://app.canalmedico.cl/consultation?attemptId=clx_attempt_abc123
[WHATSAPP] Webhook procesado exitosamente
```

**3. Mensaje WhatsApp recibido por paciente:**
```
"Gracias por contactarnos. Para continuar con tu consulta, haz clic en el siguiente enlace: https://app.canalmedico.cl/consultation?attemptId=clx_attempt_abc123"
```

---

## Paso 2: Click Deep Link ? Crear Consulta

### Acción

Click en deep link recibido por WhatsApp:
```
https://app.canalmedico.cl/consultation?attemptId=clx_attempt_abc123
```

Frontend debe:
1. Extraer `attemptId` de query params
2. Si `ENABLE_QUICK_CONSULTATION=true`, crear consulta automáticamente
3. Redirigir a página de pago

### Endpoint Implicado

**POST** `/api/consultations`

**Request Body:**
```json
{
  "doctorId": "clx0987654321",
  "patientId": "clx1234567890",
  "type": "NORMAL",
  "price": 15000,
  "consultationAttemptId": "clx_attempt_abc123"
}
```

### Evidencias Obligatorias

**1. Consultation creada:**
```sql
SELECT * FROM consultations 
WHERE id = 'clx_consultation_xyz789';
```

**Expected:**
```json
{
  "id": "clx_consultation_xyz789",
  "doctorId": "clx0987654321",
  "patientId": "clx1234567890",
  "type": "NORMAL",
  "status": "PENDING",
  "price": 15000,
  "consultationAttemptId": "clx_attempt_abc123",
  "source": "WHATSAPP",
  "createdAt": "2025-01-26T10:01:00Z"
}
```

**2. ConsultationAttempt vinculado:**
```sql
SELECT * FROM consultation_attempts 
WHERE id = 'clx_attempt_abc123';
```

**Expected:**
```json
{
  "consultationId": "clx_consultation_xyz789",  // Vinculado
  "status": "PENDING"
}
```

---

## Paso 3: MercadoPago Preference ? Pago

### Acción

Frontend llama a `POST /api/payments/session` y redirige a MercadoPago Checkout.

### Endpoint Implicado

**POST** `/api/payments/session`

**Request Body:**
```json
{
  "consultationId": "clx_consultation_xyz789",
  "amount": 15000
}
```

**Response:**
```json
{
  "initPoint": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=1234567890-abc-xyz",
  "preferenceId": "1234567890-abc-xyz"
}
```

### Evidencias Obligatorias

**1. Payment creado:**
```sql
SELECT * FROM payments 
WHERE "consultationId" = 'clx_consultation_xyz789';
```

**Expected:**
```json
{
  "id": "clx_payment_def456",
  "consultationId": "clx_consultation_xyz789",
  "amount": 15000.00,
  "fee": 2250.00,  // 15% comisión
  "netAmount": 12750.00,  // Monto - comisión
  "status": "PENDING",
  "mercadopagoPreferenceId": "1234567890-abc-xyz",
  "createdAt": "2025-01-26T10:02:00Z"
}
```

**2. Cálculo de comisión verificado:**
```sql
-- Comisión debe ser exactamente 15%
SELECT 
  amount, 
  fee, 
  "netAmount",
  (fee / amount) * 100 as commission_percentage
FROM payments 
WHERE id = 'clx_payment_def456';
```

**Expected:**
- `commission_percentage = 15.00`
- `fee = amount * 0.15`
- `netAmount = amount - fee`

---

## Paso 4: MercadoPago Webhook ? Activar Consulta

### Acción

Completar pago en MercadoPago (usar tarjeta de prueba). MercadoPago envía webhook automáticamente.

### Endpoint Implicado

**POST** `/api/payments/webhook`

**Request (MercadoPago Webhook):**
```json
{
  "action": "payment.created",
  "data": {
    "id": "9876543210-xyz-abc",
    "status": "approved",
    "transaction_amount": 150.00,
    "currency_id": "CLP"
  }
}
```

### Evidencias Obligatorias

**1. Payment actualizado:**
```sql
SELECT * FROM payments 
WHERE "mercadopagoPaymentId" = '9876543210-xyz-abc';
```

**Expected:**
```json
{
  "status": "PAID",
  "mercadopagoPaymentId": "9876543210-xyz-abc",
  "paidAt": "2025-01-26T10:03:00Z"
}
```

**2. Consultation activada:**
```sql
SELECT * FROM consultations 
WHERE id = 'clx_consultation_xyz789';
```

**Expected:**
```json
{
  "status": "ACTIVE",
  "paymentId": "clx_payment_def456",
  "startedAt": "2025-01-26T10:03:00Z"
}
```

**3. ConsultationAttempt convertido:**
```sql
SELECT * FROM consultation_attempts 
WHERE id = 'clx_attempt_abc123';
```

**Expected:**
```json
{
  "status": "CONVERTED",
  "consultationId": "clx_consultation_xyz789"
}
```

**4. Logs Esperados:**
```
[PAYMENT] Webhook recibido: payment.created
[PAYMENT] MercadoPago payment ID: 9876543210-xyz-abc
[PAYMENT] Payment actualizado: id=clx_payment_def456, status=PAID
[CONSULTATION] Consultation activada: id=clx_consultation_xyz789
[CONSULTATION] ConsultationAttempt convertido: id=clx_attempt_abc123
```

---

## Paso 5: Chat Médico-Paciente

### Acción Paciente

Enviar mensaje desde `/chat/clx_consultation_xyz789`:

```
"Buenos días doctor, tengo dolor de cabeza hace 3 días"
```

### Endpoint Implicado

**POST** `/api/messages`

**Request Body (Paciente):**
```json
{
  "consultationId": "clx_consultation_xyz789",
  "senderId": "clx1234567890",
  "text": "Buenos días doctor, tengo dolor de cabeza hace 3 días"
}
```

### Evidencias Obligatorias

**1. Message creado:**
```sql
SELECT * FROM messages 
WHERE "consultationId" = 'clx_consultation_xyz789' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Expected:**
```json
{
  "id": "clx_message_ghi789",
  "consultationId": "clx_consultation_xyz789",
  "senderId": "clx1234567890",
  "text": "Buenos días doctor, tengo dolor de cabeza hace 3 días",
  "createdAt": "2025-01-26T10:04:00Z"
}
```

---

### Acción Médico

Médico responde desde `/chat/clx_consultation_xyz789`:

```
"Buenos días. ¿El dolor es constante o intermitente? ¿Tienes fiebre?"
```

### Request Body (Médico):**
```json
{
  "consultationId": "clx_consultation_xyz789",
  "senderId": "clx0987654321",  // Doctor user ID
  "text": "Buenos días. ¿El dolor es constante o intermitente? ¿Tienes fiebre?"
}
```

### Evidencias Obligatorias

**2. Segundo message creado:**
```sql
SELECT * FROM messages 
WHERE "consultationId" = 'clx_consultation_xyz789' 
ORDER BY "createdAt" DESC 
LIMIT 2;
```

**Expected:** 2 mensajes en orden cronológico

**3. Logs Esperados:**
```
[MESSAGES] Mensaje creado: id=clx_message_ghi789, consultation=clx_consultation_xyz789
[SOCKET] Evento emitido: new-message, consultation=clx_consultation_xyz789
[NOTIFICATIONS] Push notification enviada a médico (si aplica)
```

---

## Verificación Final Completa

### Query SQL Completa (Prisma)

```sql
-- 1. ConsultationAttempt
SELECT * FROM consultation_attempts WHERE id = 'clx_attempt_abc123';

-- 2. Consultation
SELECT c.*, p.status as payment_status, p.amount, p.fee, p."paidAt"
FROM consultations c 
LEFT JOIN payments p ON c."paymentId" = p.id 
WHERE c.id = 'clx_consultation_xyz789';

-- 3. Payment
SELECT * FROM payments WHERE id = 'clx_payment_def456';

-- 4. Messages
SELECT m.*, u.role as sender_role 
FROM messages m 
JOIN users u ON m."senderId" = u.id 
WHERE m."consultationId" = 'clx_consultation_xyz789' 
ORDER BY m."createdAt" ASC;
```

### Estado Final Esperado

```json
{
  "consultationAttempt": {
    "status": "CONVERTED",
    "consultationId": "clx_consultation_xyz789",
    "deepLinkSent": true
  },
  "consultation": {
    "status": "ACTIVE",
    "paymentId": "clx_payment_def456",
    "startedAt": "2025-01-26T10:03:00Z"
  },
  "payment": {
    "status": "PAID",
    "amount": 15000.00,
    "fee": 2250.00,
    "netAmount": 12750.00,
    "paidAt": "2025-01-26T10:03:00Z"
  },
  "messages": {
    "count": 2,
    "messages": [
      {
        "senderId": "clx1234567890",
        "text": "Buenos días doctor...",
        "createdAt": "2025-01-26T10:04:00Z"
      },
      {
        "senderId": "clx0987654321",
        "text": "Buenos días. ¿El dolor...",
        "createdAt": "2025-01-26T10:05:00Z"
      }
    ]
  }
}
```

---

## Checklist de Evidencias Obligatorias

### Paso 1: WhatsApp
- [ ] `ConsultationAttempt` creado con `status='PENDING'`
- [ ] `deepLinkSent=true`
- [ ] Auto-respuesta recibida por paciente
- [ ] Logs muestran "Auto-respuesta enviada"

### Paso 2: Consulta
- [ ] `Consultation` creada con `status='PENDING'`
- [ ] `ConsultationAttempt.consultationId` vinculado
- [ ] `source='WHATSAPP'`

### Paso 3: Pago
- [ ] `Payment` creado con `status='PENDING'`
- [ ] `fee = amount × 0.15` (comisión 15%)
- [ ] `netAmount = amount - fee`
- [ ] `mercadopagoPreferenceId` generado

### Paso 4: Webhook
- [ ] `Payment.status='PAID'`
- [ ] `Payment.paidAt` tiene timestamp
- [ ] `Consultation.status='ACTIVE'`
- [ ] `ConsultationAttempt.status='CONVERTED'`
- [ ] Logs muestran "Consultation activada"

### Paso 5: Chat
- [ ] Al menos 2 `Message` creados
- [ ] Mensajes en orden cronológico
- [ ] Socket.io emite eventos (si aplica)

---

## Logs Esperados Completos

```
[10:00:00] [WHATSAPP] Mensaje entrante recibido de +56987654321
[10:00:01] [WHATSAPP] ConsultationAttempt creado: clx_attempt_abc123
[10:00:02] [WHATSAPP] Auto-respuesta enviada con deep link: https://app.canalmedico.cl/consultation?attemptId=clx_attempt_abc123
[10:01:00] [CONSULTATIONS] Consulta creada: id=clx_consultation_xyz789, doctor=clx0987654321, patient=clx1234567890
[10:02:00] [PAYMENTS] Payment session creada: id=clx_payment_def456, preference=1234567890-abc-xyz
[10:02:01] [PAYMENTS] Comisión calculada: fee=2250.00, netAmount=12750.00
[10:03:00] [PAYMENTS] Webhook recibido: payment.created, payment_id=9876543210-xyz-abc
[10:03:01] [PAYMENTS] Payment actualizado: id=clx_payment_def456, status=PAID
[10:03:02] [CONSULTATIONS] Consultation activada: id=clx_consultation_xyz789
[10:03:03] [WHATSAPP] ConsultationAttempt convertido: id=clx_attempt_abc123
[10:04:00] [MESSAGES] Mensaje creado: id=clx_message_ghi789, consultation=clx_consultation_xyz789
[10:05:00] [MESSAGES] Mensaje creado: id=clx_message_jkl012, consultation=clx_consultation_xyz789
```

---

## Troubleshooting

### WhatsApp no recibe mensajes
- Verificar `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- Verificar webhook URL en Meta Dashboard
- Revisar logs: `[WHATSAPP]` entries

### Pago no se actualiza
- Verificar webhook URL en MercadoPago Dashboard
- Revisar logs: `[PAYMENTS] Webhook recibido`
- Verificar signature del webhook

### Consulta no se activa
- Verificar `Payment.status='PAID'`
- Revisar logs: `[CONSULTATIONS] Consultation activada`
- Verificar relación `Consultation.paymentId`

---

## Referencias

- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Secciones 4.10, 4.11)
- `docs/WHATSAPP_QA_RUNBOOK.md`
- `docs/QA_MASTER_CHECKLIST.md`

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA EJECUTAR**
