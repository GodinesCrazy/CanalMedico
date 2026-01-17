# WhatsApp QA Runbook - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Guía para probar flujo WhatsApp ? Pago ? Consulta en staging/producción

---

## ?? Pre-Requisitos

### Variables de Entorno Requeridas
- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- [ ] `WHATSAPP_ACCESS_TOKEN` - Token de WhatsApp Cloud API
- [ ] `WHATSAPP_PHONE_NUMBER_ID` - ID del número de WhatsApp Business
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` - ID de la cuenta de negocio
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Token de verificación del webhook
- [ ] `API_URL` - URL del backend (ej: `https://api.canalmedico.cl`)

### Configuración WhatsApp Cloud API
1. **Meta for Developers:** https://developers.facebook.com/apps
2. **WhatsApp Business Account:** Verificado y activo
3. **Phone Number:** Verificado y asociado a la cuenta
4. **Webhook URL:** `https://api.canalmedico.cl/api/whatsapp/webhook`

---

## ?? Escenarios de Prueba

### Escenario 1: Webhook de Verificación (Meta Challenge)

**Objetivo:** Verificar que Meta puede validar el webhook

**Pasos:**
1. Configurar webhook en Meta Dashboard con URL: `https://api.canalmedico.cl/api/whatsapp/webhook`
2. Meta enviará GET request con query params: `hub.mode=subscribe&hub.challenge=<random>&hub.verify_token=<token>`
3. El servidor debe responder con `hub.challenge` si `hub.verify_token` coincide

**Comando de Verificación:**
```bash
# Simular request de Meta
curl "https://api.canalmedico.cl/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=<WHATSAPP_WEBHOOK_VERIFY_TOKEN>"

# Respuesta esperada: "test_challenge_123" (status 200)
```

**Logs Esperados:**
```
[WHATSAPP] Webhook verification: mode=subscribe, challenge=test_challenge_123
[WHATSAPP] Webhook verification: SUCCESS
```

---

### Escenario 2: Mensaje Entrante ? Auto-Respuesta

**Objetivo:** Verificar que el sistema envía auto-respuesta con link de pago

**Flujo Esperado:**
1. Paciente envía mensaje a número de WhatsApp Business
2. Sistema detecta mensaje entrante via webhook
3. Sistema busca `ConsultationAttempt` o crea uno nuevo
4. Sistema envía auto-respuesta con deep link a pago
5. Paciente hace clic en link ? redirige a MercadoPago

**Simulación:**
```bash
# Simular webhook de Meta (mensaje entrante)
curl -X POST https://api.canalmedico.cl/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<signature>" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "entry_id",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+1234567890",
            "phone_number_id": "<WHATSAPP_PHONE_NUMBER_ID>"
          },
          "contacts": [{
            "profile": {"name": "Test Patient"},
            "wa_id": "+56912345678"
          }],
          "messages": [{
            "from": "+56912345678",
            "id": "msg_id_123",
            "timestamp": "1234567890",
            "text": {"body": "Hola, necesito consulta médica"},
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

**Evidencia Esperada:**
- ? Log: `[WHATSAPP] Mensaje entrante recibido de +56912345678`
- ? Log: `[WHATSAPP] ConsultationAttempt creado/actualizado`
- ? Log: `[WHATSAPP] Auto-respuesta enviada con deep link`
- ? Base de datos: `ConsultationAttempt` creado con `deepLinkSent=true`

**Verificación en BD:**
```sql
SELECT * FROM consultation_attempts 
WHERE patient_phone = '+56912345678' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### Escenario 3: Deep Link Clicked ? Crear Consulta

**Objetivo:** Verificar que el deep link crea consulta automáticamente

**Flujo Esperado:**
1. Paciente hace clic en deep link de WhatsApp
2. Deep link redirige a app/web con `consultationAttemptId`
3. Sistema crea `Consultation` automáticamente
4. Sistema redirige a MercadoPago para pago

**Deep Link Esperado:**
```
https://app.canalmedico.cl/consultation?attemptId=<consultation_attempt_id>
```

**Evidencia Esperada:**
- ? Log: `[CONSULTATION] Consultation creada desde ConsultationAttempt`
- ? Base de datos: `Consultation` creado con `consultationAttemptId`
- ? Redirección a MercadoPago con `preference_id`

---

### Escenario 4: Pago MercadoPago Sandbox ? Webhook

**Objetivo:** Verificar que el webhook de MercadoPago actualiza el estado del pago

**Configuración MercadoPago Sandbox:**
1. **MercadoPago Dashboard:** https://www.mercadopago.cl/developers/panel
2. **Webhook URL:** `https://api.canalmedico.cl/api/payments/webhook`
3. **Sandbox Test Cards:** https://www.mercadopago.cl/developers/es/docs/checkout-api/testing

**Test Card (Aprobada):**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: `11/25` (cualquier fecha futura)
- Nombre: `APRO` (para aprobar) o `CONT` (para rechazar)

**Flujo de Pago:**
1. Paciente completa pago en MercadoPago
2. MercadoPago envía webhook a `/api/payments/webhook`
3. Sistema actualiza `Payment.status = 'PAID'`
4. Sistema activa `Consultation` (si corresponde)

**Simulación Webhook:**
```bash
# Simular webhook de MercadoPago (pago aprobado)
curl -X POST https://api.canalmedico.cl/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: <signature>" \
  -H "x-request-id: <request_id>" \
  -d '{
    "action": "payment.created",
    "api_version": "v1",
    "data": {
      "id": "123456789"
    },
    "date_created": "2025-01-26T12:00:00Z",
    "id": 123456789,
    "live_mode": false,
    "type": "payment",
    "user_id": "123456"
  }'
```

**Evidencia Esperada:**
- ? Log: `[PAYMENT] Webhook recibido: payment.created`
- ? Log: `[PAYMENT] Payment actualizado: status=PAID`
- ? Base de datos: `Payment.status = 'PAID'`, `paidAt` actualizado

**Verificación en BD:**
```sql
SELECT * FROM payments 
WHERE mercadopago_payment_id = '123456789' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### Escenario 5: Flujo Completo End-to-End

**Objetivo:** Probar flujo completo desde mensaje WhatsApp hasta consulta pagada

**Pasos Manuales:**
1. ? Enviar mensaje a WhatsApp Business number
2. ? Recibir auto-respuesta con deep link
3. ? Hacer clic en deep link
4. ? Crear consulta automáticamente
5. ? Completar pago en MercadoPago (sandbox)
6. ? Verificar que consulta está activa
7. ? Enviar mensaje en consulta (chat)

**Tiempo Estimado:** 5-10 minutos

**Evidencia Esperada:**
- ? `ConsultationAttempt` ? `status = 'CONVERTED'`
- ? `Consultation` ? `status = 'ACTIVE'` o `'COMPLETED'`
- ? `Payment` ? `status = 'PAID'`
- ? `Message` creado en la consulta

---

## ?? Logs Esperados

### Webhook de Verificación
```
[WHATSAPP] Webhook verification: mode=subscribe, challenge=...
[WHATSAPP] Webhook verification: SUCCESS
```

### Mensaje Entrante
```
[WHATSAPP] Mensaje entrante recibido de +56912345678
[WHATSAPP] ConsultationAttempt encontrado/creado: <attempt_id>
[WHATSAPP] Auto-respuesta enviada con deep link: <link>
```

### Pago MercadoPago
```
[PAYMENT] Webhook recibido: payment.created
[PAYMENT] Payment actualizado: id=<payment_id>, status=PAID
[CONSULTATION] Consultation activada: id=<consultation_id>
```

---

## ?? Troubleshooting

### Webhook No Recibe Mensajes
- [ ] Verificar `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- [ ] Verificar webhook URL en Meta Dashboard
- [ ] Verificar `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincide
- [ ] Revisar logs de Railway para errores

### Auto-Respuesta No Se Envía
- [ ] Verificar `WHATSAPP_ACCESS_TOKEN` válido
- [ ] Verificar `WHATSAPP_PHONE_NUMBER_ID` correcto
- [ ] Revisar logs para errores de API de WhatsApp
- [ ] Verificar límites de rate limiting de Meta

### Pago No Se Actualiza
- [ ] Verificar webhook URL en MercadoPago Dashboard
- [ ] Verificar `MERCADOPAGO_ACCESS_TOKEN` válido
- [ ] Revisar logs para errores de webhook
- [ ] Verificar signature del webhook

---

## ? Checklist de QA

### Funcionalidad
- [ ] Webhook de verificación funciona (Meta challenge)
- [ ] Mensajes entrantes se procesan correctamente
- [ ] Auto-respuesta se envía con deep link
- [ ] Deep link crea consulta automáticamente
- [ ] Pago en MercadoPago funciona (sandbox)
- [ ] Webhook de MercadoPago actualiza pago
- [ ] Consulta se activa después del pago

### Performance
- [ ] Auto-respuesta enviada en < 5 segundos
- [ ] Webhook procesado en < 2 segundos
- [ ] No hay timeouts en llamadas a API de WhatsApp

### Seguridad
- [ ] Webhook verifica signature de Meta
- [ ] Webhook verifica signature de MercadoPago
- [ ] Tokens no expuestos en logs

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26
