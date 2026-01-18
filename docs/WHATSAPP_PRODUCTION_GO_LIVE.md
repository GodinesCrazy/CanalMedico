# WhatsApp Cloud API - Guía de Producción GO LIVE

**Fecha:** 2025-01-26  
**Versión:** 1.0.0  
**Objetivo:** Guía completa para pasar WhatsApp Cloud API de sandbox a producción real

---

## ?? Índice

1. [Pre-Requisitos](#pre-requisitos)
2. [Configuración en Meta Dashboard](#configuración-en-meta-dashboard)
3. [Variables de Entorno en Railway](#variables-de-entorno-en-railway)
4. [Configuración del Backend](#configuración-del-backend)
5. [Verificación y Testing](#verificación-y-testing)
6. [Checklist Final](#checklist-final)
7. [Troubleshooting](#troubleshooting)

---

## 1. Pre-Requisitos

### 1.1 Requisitos del Sistema

- ? Backend desplegado en Railway
- ? Webhook funcionando (GET challenge responde 200)
- ? Endpoint: `https://canalmedico-production.up.railway.app/api/whatsapp/webhook`
- ? Feature flag: `ENABLE_WHATSAPP_AUTO_RESPONSE=true`

### 1.2 Cuenta Meta

- ? Meta Developers Account: https://developers.facebook.com
- ? WhatsApp Business Account verificada
- ? App creada en Meta Developers
- ? Producto WhatsApp agregado a la App

---

## 2. Configuración en Meta Dashboard

### 2.1 Obtener Access Token Permanente (System User Token)

**CRÍTICO:** En producción, usar token permanente (System User Token), NO token temporal.

#### Opción A: System User Token (Recomendado - Permanente)

1. Ir a **Meta Developers** ? Tu App ? **WhatsApp** ? **API Setup**
2. En la sección **"Access tokens"**, buscar **"System User Token"**
3. Si no existe, crear System User:
   - Ir a **Settings** ? **Business Settings** ? **Users** ? **System Users**
   - Click **"Add"** ? Nombre: `CanalMedico-WhatsApp-Service`
   - Click **"Create System User"**
   - Agregar permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Generar token: **"Generate New Token"**
   - Seleccionar App y permisos ? **"Generate Token"**
   - **?? IMPORTANTE:** Copiar el token INMEDIATAMENTE (solo se muestra una vez)
   - Guardar en lugar seguro ? Este es `WHATSAPP_ACCESS_TOKEN`

#### Opción B: Page Access Token (Alternativa)

1. Crear una Página de Facebook para tu negocio
2. Conectar la Página a tu WhatsApp Business Account
3. En **WhatsApp** ? **API Setup** ? **"Page Access Token"**
4. Generar token permanente (siempre que la página esté conectada)

**Validez:**
- System User Token: **Permanente** (hasta que se revoque manualmente)
- Page Access Token: **Permanente** (mientras la página esté conectada)
- Temporary Token: ? **NO USAR EN PRODUCCIÓN** (expira en 24 horas)

---

### 2.2 Obtener Phone Number ID

1. Ir a **WhatsApp** ? **API Setup**
2. En la sección **"Phone number ID"**, copiar el ID
   - Ejemplo: `123456789012345`
   - Este es `WHATSAPP_PHONE_NUMBER_ID`
3. **Verificar:** El número debe estar verificado y listo para usar

---

### 2.3 Obtener Business Account ID (WABA ID)

1. Ir a **WhatsApp** ? **API Setup**
2. Buscar **"WhatsApp Business Account ID"** o **"Business Account ID"**
   - Ejemplo: `1234567890123456`
   - Este es `WHATSAPP_BUSINESS_ACCOUNT_ID`
3. **Alternativa:** Ir a **Settings** ? **Business Settings** ? **WhatsApp Business Account** ? Ver Account ID

---

### 2.4 Configurar Webhook

1. Ir a **WhatsApp** ? **Configuration** ? **Webhook**
2. Click **"Edit"** o **"Setup Webhook"**
3. Configurar:
   - **Callback URL:** `https://canalmedico-production.up.railway.app/api/whatsapp/webhook`
   - **Verify Token:** `canalmedico_verify_2026` (debe coincidir con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
   - **Subscription Fields:** Marcar `messages` (para recibir mensajes)
4. Click **"Verify and Save"**
5. **Verificar:** Debe mostrar ? "Webhook verified successfully"

---

### 2.5 Obtener App Secret (Opcional pero Recomendado)

**CRÍTICO:** Necesario para verificar la signature del webhook y prevenir ataques.

1. Ir a **Settings** ? **Basic** ? **App Secret**
2. Click **"Show"** (puede requerir contraseña)
3. Copiar el **App Secret**
   - Este es `WHATSAPP_APP_SECRET`
4. **?? IMPORTANTE:** Guardar de forma segura

**Si no configuras App Secret:**
- El webhook seguirá funcionando, pero sin verificación de signature
- Menos seguro (posibles ataques de falsificación)
- En producción, se recomienda configurarlo

---

### 2.6 Verificar Número y Templates

#### Verificar Número de Teléfono

1. El número debe estar **verificado** en Meta Dashboard
2. Estado debe ser **"Connected"** o **"Ready"**
3. Si no está verificado:
   - Ir a **WhatsApp** ? **API Setup** ? **Phone number**
   - Seguir instrucciones para verificar

#### Crear Templates de Mensajes

Para enviar mensajes fuera de la ventana de 24 horas, se requieren templates aprobados:

1. Ir a **WhatsApp** ? **Message Templates** ? **"Create Template"**
2. Configurar:
   - **Name:** `consultation_redirect` (o el nombre que uses)
   - **Category:** `UTILITY` o `MARKETING` (según tu caso)
   - **Language:** `Spanish (Spain)` o `Spanish (Latin America)`
   - **Body:** Tu mensaje con parámetros `{{1}}`, `{{2}}`, etc.
   - Ejemplo:
     ```
     Hola {{1}}, te invitamos a iniciar tu consulta médica.
     Haz clic aquí: {{2}}
     ```
3. Submit para revisión (puede tomar horas o días)
4. Esperar aprobación antes de usar en producción

**Templates Necesarios:**
- `consultation_redirect`: Para enviar deep links a pacientes

---

## 3. Variables de Entorno en Railway

### 3.1 Variables Requeridas

Configurar en **Railway Dashboard** ? Tu Proyecto ? **Variables**:

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `ENABLE_WHATSAPP_AUTO_RESPONSE` | Habilitar módulo WhatsApp | `true` | ? Sí |
| `WHATSAPP_ACCESS_TOKEN` | Token permanente de Meta | `EAAB...` | ? Sí |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp | `123456789012345` | ? Sí |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID de la cuenta Business | `1234567890123456` | ? Sí |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token de verificación webhook | `canalmedico_verify_2026` | ? Sí |
| `WHATSAPP_API_VERSION` | Versión de la API | `v21.0` | ? Sí (default: v21.0) |
| `WHATSAPP_APP_SECRET` | App Secret para verificar signatures | `abc123...` | ?? Recomendado |
| `INTERNAL_API_KEY` | Secret para proteger endpoints de envío | `generar-secreto-seguro` | ? Sí (para envío) |

### 3.2 Generar INTERNAL_API_KEY

**CRÍTICO:** Este secret protege los endpoints de envío (`/api/whatsapp/send/*`).

**Generar con OpenSSL:**
```bash
openssl rand -base64 32
```

**O usar Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Guardar el resultado** en `INTERNAL_API_KEY` en Railway.

**?? IMPORTANTE:**
- Debe ser un string aleatorio de al menos 32 caracteres
- NO compartir públicamente
- Usar para autenticar requests a `/api/whatsapp/send/*`

---

## 4. Configuración del Backend

### 4.1 Verificar Feature Flags

El backend debe tener habilitado el módulo WhatsApp:

```env
ENABLE_WHATSAPP_AUTO_RESPONSE=true
```

### 4.2 Verificar Variables en Railway

1. Ir a **Railway Dashboard** ? Tu Proyecto ? **Variables**
2. Verificar que todas las variables estén configuradas (ver sección 3.1)
3. **Aplicar cambios** (Railway reinicia automáticamente)

### 4.3 Verificar Logs

Después de configurar las variables, verificar logs en Railway:

```
[WHATSAPP] WhatsApp router montado (feature flag ACTIVO)
[WHATSAPP] Webhook verified by Meta (GET challenge)
```

Si ves errores, revisar:
- Variables mal configuradas
- Token inválido o expirado
- Phone Number ID incorrecto

---

## 5. Verificación y Testing

### 5.1 Test 1: Verificar Webhook (GET Challenge)

**Desde PowerShell (Windows):**

```powershell
$verifyToken = "canalmedico_verify_2026"
$challenge = "test_challenge_123"
$url = "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$verifyToken&hub.challenge=$challenge"

Invoke-WebRequest -Uri $url -Method GET
```

**Respuesta esperada:**
- Status: `200 OK`
- Body: `test_challenge_123` (mismo valor que `hub.challenge`)

**Con curl:**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=canalmedico_verify_2026&hub.challenge=test123"
```

---

### 5.2 Test 2: Enviar Mensaje de Texto (Ventana 24h)

**?? IMPORTANTE:** Solo funciona dentro de la ventana de 24 horas después de que el usuario inició la conversación.

**Desde PowerShell:**

```powershell
$apiUrl = "https://canalmedico-production.up.railway.app"
$internalKey = "TU_INTERNAL_API_KEY_AQUI"
$phoneNumber = "56912345678" # Número real del usuario (formato internacional sin +)

$headers = @{
    "Content-Type" = "application/json"
    "X-Internal-Secret" = $internalKey
}

$body = @{
    to = $phoneNumber
    text = "?? Test de WhatsApp - Mensaje de prueba desde producción"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/api/whatsapp/send/text" -Method POST -Headers $headers -Body $body
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxxxx...",
    "to": "56912345678"
  }
}
```

**Con curl:**
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: TU_INTERNAL_API_KEY_AQUI" \
  -d '{
    "to": "56912345678",
    "text": "?? Test de WhatsApp - Mensaje de prueba"
  }'
```

---

### 5.3 Test 3: Enviar Template Message

**Funciona fuera de la ventana de 24 horas** (requiere template aprobado).

**Desde PowerShell:**

```powershell
$apiUrl = "https://canalmedico-production.up.railway.app"
$internalKey = "TU_INTERNAL_API_KEY_AQUI"
$phoneNumber = "56912345678"

$headers = @{
    "Content-Type" = "application/json"
    "X-Internal-Secret" = $internalKey
}

$body = @{
    to = $phoneNumber
    templateName = "consultation_redirect"
    languageCode = "es"
    parameters = @("Dr. Juan Pérez", "canalmedico://consultation/create?doctorId=123")
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/api/whatsapp/send/template" -Method POST -Headers $headers -Body $body
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxxxx...",
    "to": "56912345678",
    "templateName": "consultation_redirect"
  }
}
```

---

### 5.4 Test 4: Smoke Test Automático

Ejecutar script de smoke test automatizado:

```bash
cd backend
npm run whatsapp:test
```

**Con variables personalizadas:**
```bash
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
WHATSAPP_TEST_TO=56912345678 \
npm run whatsapp:test
```

**Este script prueba:**
1. ? GET /api/whatsapp/webhook (challenge)
2. ? POST /api/whatsapp/send/text (si WHATSAPP_TEST_TO está configurado)
3. ? Validación de autenticación (debe fallar sin X-Internal-Secret)

---

### 5.5 Test 5: Recibir Mensaje Real

1. Enviar un mensaje de WhatsApp al número configurado desde tu teléfono personal
2. Verificar logs en Railway:
   ```
   [WHATSAPP] POST webhook recibido y validado
   [WHATSAPP] Procesando mensaje de WhatsApp
   [WHATSAPP] Auto-respuesta de WhatsApp enviada
   ```
3. Debes recibir una respuesta automática con el deep link

---

## 6. Checklist Final

### Meta Dashboard

- [ ] Token permanente configurado (System User Token o Page Access Token)
- [ ] Phone Number ID obtenido y verificado
- [ ] Business Account ID obtenido
- [ ] Webhook configurado y verificado (? "Webhook verified successfully")
- [ ] Subscription Fields: `messages` marcado
- [ ] App Secret obtenido (recomendado)
- [ ] Templates creados y aprobados (si los usas)

### Railway Variables

- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- [ ] `WHATSAPP_ACCESS_TOKEN` configurado (token permanente)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` configurado
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` configurado
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` configurado (debe coincidir con Meta)
- [ ] `WHATSAPP_API_VERSION` configurado (default: v21.0)
- [ ] `WHATSAPP_APP_SECRET` configurado (recomendado)
- [ ] `INTERNAL_API_KEY` configurado (para proteger endpoints)

### Backend

- [ ] Backend desplegado en Railway
- [ ] Logs muestran: `[WHATSAPP] WhatsApp router montado (feature flag ACTIVO)`
- [ ] GET /api/whatsapp/webhook responde 200 (challenge)
- [ ] POST /api/whatsapp/webhook recibe mensajes correctamente

### Testing

- [ ] Test 1: GET webhook challenge ? ? 200 OK
- [ ] Test 2: POST send/text (con autenticación) ? ? 200 + messageId
- [ ] Test 3: POST send/text (sin autenticación) ? ? 401/403
- [ ] Test 4: Smoke test automatizado ? ? Todos los tests pasan
- [ ] Test 5: Mensaje real recibido ? ? Auto-respuesta enviada

---

## 7. Troubleshooting

### Error: "WhatsApp Cloud API no está configurado"

**Causa:** Variables `WHATSAPP_ACCESS_TOKEN` o `WHATSAPP_PHONE_NUMBER_ID` no configuradas.

**Solución:**
1. Verificar variables en Railway Dashboard
2. Asegurar que están configuradas (no vacías)
3. Reiniciar servicio en Railway

---

### Error: "Invalid OAuth access token"

**Causa:** Token expirado o inválido.

**Solución:**
1. Generar nuevo token permanente (System User Token)
2. Actualizar `WHATSAPP_ACCESS_TOKEN` en Railway
3. Reiniciar servicio

---

### Error: "Webhook verification failed"

**Causa:** `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide con Meta Dashboard.

**Solución:**
1. Verificar valor en Meta Dashboard ? Webhook ? Verify Token
2. Verificar valor en Railway ? `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Deben ser exactamente iguales (case-sensitive)

---

### Error: "Phone number not found"

**Causa:** `WHATSAPP_PHONE_NUMBER_ID` incorrecto o número no verificado.

**Solución:**
1. Verificar Phone Number ID en Meta Dashboard ? API Setup
2. Verificar que el número esté "Connected" o "Ready"
3. Actualizar `WHATSAPP_PHONE_NUMBER_ID` en Railway

---

### Error: "X-Internal-Secret header requerido" (401/403)

**Causa:** Endpoint `/api/whatsapp/send/*` requiere autenticación.

**Solución:**
1. Agregar header `X-Internal-Secret` con valor de `INTERNAL_API_KEY`
2. Verificar que `INTERNAL_API_KEY` esté configurado en Railway

---

### Error: "Template not found" o "Template not approved"

**Causa:** Template no existe o no está aprobado.

**Solución:**
1. Verificar nombre del template en Meta Dashboard
2. Verificar estado: debe estar "Approved" (no "Pending" o "Rejected")
3. Esperar aprobación si está pendiente (puede tomar horas/días)

---

### Webhook no recibe mensajes

**Causa:** Webhook no está configurado correctamente en Meta.

**Solución:**
1. Verificar Callback URL en Meta Dashboard ? Webhook
2. Verificar que Subscription Fields tenga `messages` marcado
3. Verificar logs en Railway (debe aparecer `[WHATSAPP] POST webhook recibido`)
4. Verificar que `ENABLE_WHATSAPP_AUTO_RESPONSE=true`

---

### Mensajes no se envían fuera de ventana 24h

**Causa:** Para enviar fuera de 24h, se requiere template aprobado.

**Solución:**
1. Crear template en Meta Dashboard ? Message Templates
2. Esperar aprobación
3. Usar `POST /api/whatsapp/send/template` (no `/send/text`)

---

## ?? Soporte

Si encuentras problemas:

1. Revisar logs en Railway Dashboard ? Logs
2. Verificar variables de entorno
3. Revisar Meta Dashboard ? Webhook ? Event Logs
4. Consultar documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api

---

**Última actualización:** 2025-01-26  
**Estado:** ? Producción Ready
