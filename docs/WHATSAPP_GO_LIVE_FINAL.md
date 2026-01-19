# WhatsApp Cloud API - GO LIVE Final Checklist

**Fecha:** 2025-01-26  
**Versión:** 1.0.0  
**Estado:** ? Producción Ready  
**Objetivo:** Checklist final y procedimientos para GO LIVE de WhatsApp Cloud API en producción

---

## ?? Checklist Meta Dashboard

### 1. App Mode LIVE
- [ ] Ir a **Meta Developers** ? Tu App ? **Settings** ? **Basic**
- [ ] Verificar **"App Mode"**: Debe estar en **"Live"** (NO "Development")
- [ ] Si está en Development:
  - [ ] Completar verificación de negocio si es requerida
  - [ ] Cambiar a modo **Live**

### 2. Webhook Configuration
- [ ] Ir a **WhatsApp** ? **Configuration** ? **Webhook**
- [ ] Click **"Edit"** o **"Setup Webhook"**
- [ ] Configurar:
  - [ ] **Callback URL:** `https://canalmedico-production.up.railway.app/api/whatsapp/webhook`
  - [ ] **Verify Token:** `canalmedico_verify_2026` (debe coincidir con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
- [ ] Click **"Verify and Save"**
- [ ] Verificar que muestra: ? **"Webhook verified successfully"**

### 3. Subscription Fields
- [ ] En la misma página de Webhook
- [ ] Marcar checkbox: **`messages`** (para recibir mensajes entrantes)
- [ ] Guardar cambios

### 4. Phone Number ID y WABA ID
- [ ] Ir a **WhatsApp** ? **API Setup**
- [ ] Anotar **Phone Number ID**: `_________________` (ejemplo: `123456789012345`)
- [ ] Anotar **WhatsApp Business Account ID** (WABA ID): `_________________` (ejemplo: `1234567890123456`)
- [ ] Verificar que el número esté en estado **"Connected"** o **"Ready"**

### 5. Token Permanente (System User Token)
- [ ] Ir a **Settings** ? **Business Settings** ? **Users** ? **System Users**
- [ ] Si no existe System User:
  - [ ] Click **"Add"** ? Nombre: `CanalMedico-WhatsApp-Service`
  - [ ] Click **"Create System User"**
  - [ ] Agregar permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
- [ ] Generar token: **"Generate New Token"**
  - [ ] Seleccionar App
  - [ ] Seleccionar permisos
  - [ ] Click **"Generate Token"**
  - [ ] **?? CRÍTICO:** Copiar token INMEDIATAMENTE (solo se muestra una vez)
  - [ ] Guardar en lugar seguro ? Este es `WHATSAPP_ACCESS_TOKEN`

### 6. App Secret (Opcional pero Recomendado)
- [ ] Ir a **Settings** ? **Basic** ? **App Secret**
- [ ] Click **"Show"** (puede requerir contraseña)
- [ ] Copiar **App Secret** ? Este es `WHATSAPP_APP_SECRET`
- [ ] Guardar de forma segura

---

## ?? Checklist Railway Variables

### Variables Obligatorias

- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE` = `true`
- [ ] `WHATSAPP_ACCESS_TOKEN` = `[token permanente de Meta]`
- [ ] `WHATSAPP_PHONE_NUMBER_ID` = `[phone number id]`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` = `[waba id]`
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` = `canalmedico_verify_2026`
- [ ] `INTERNAL_API_KEY` = `[generar con: openssl rand -base64 32]`

### Variables Opcionales (Recomendadas)

- [ ] `WHATSAPP_APP_SECRET` = `[app secret de Meta]`
- [ ] `WHATSAPP_API_VERSION` = `v21.0` (default si no se configura)

**Ver documentación completa:** `docs/WHATSAPP_RAILWAY_VARIABLES.md`

---

## ?? Comandos de Smoke Test

### Test Local (requiere servidor corriendo)
```bash
cd backend
npm run dev  # En otra terminal
# En esta terminal:
API_URL=http://localhost:3000 \
INTERNAL_API_KEY=tu_internal_key \
npm run whatsapp:test
```

### Test contra Producción
```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
WHATSAPP_TEST_TO=56912345678 \
npm run whatsapp:test
```

### Test con Validación Meta Graph API
```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
WHATSAPP_ACCESS_TOKEN=tu_token_meta \
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id \
WHATSAPP_TEST_TO=56912345678 \
npm run whatsapp:test
```

**Tests que ejecuta:**
1. ? GET /api/whatsapp/webhook (challenge válido) ? 200 OK
2. ? GET /api/whatsapp/webhook (token inválido) ? 403 Forbidden
3. ? POST /api/whatsapp/send/text (con secret) ? 200 + messageId
4. ? POST /api/whatsapp/send/text (sin secret) ? 401/403
5. ? Meta Graph API direct test (opcional)

---

## ?? Verificación de Logs en Railway

### Buscar Logs de WhatsApp
1. Ir a **Railway Dashboard** ? Tu Proyecto ? **Servicio Backend** ? **Logs**
2. Filtrar por: `[WHATSAPP]`

### Logs Esperados

**Al arrancar:**
```
[WHATSAPP] WhatsApp router montado (feature flag ACTIVO)
```

**GET Challenge exitoso:**
```
[WHATSAPP] CHALLENGE_OK
```

**GET Challenge fallido:**
```
[WHATSAPP] CHALLENGE_FORBIDDEN
```

**POST desactivado:**
```
[WHATSAPP] POST_DISABLED
```

**POST activado:**
```
[WHATSAPP] POST_ENABLED
[WHATSAPP] POST webhook recibido y validado
```

**Envío exitoso:**
```
[WHATSAPP] SEND_TEXT_OK
```

**Envío fallido:**
```
[WHATSAPP] SEND_TEXT_FAIL
```

---

## ?? Troubleshooting

### Error: 403 Forbidden en GET Challenge

**Causa:** `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide con Meta Dashboard.

**Solución:**
1. Verificar valor en Meta Dashboard ? Webhook ? Verify Token
2. Verificar valor en Railway ? `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Deben ser exactamente iguales (case-sensitive)
4. Reiniciar servicio en Railway

**Log esperado:** `[WHATSAPP] CHALLENGE_FORBIDDEN`

---

### Error: 401/403 en POST /api/whatsapp/send/*

**Causa:** Falta header `X-Internal-Secret` o valor incorrecto.

**Solución:**
1. Verificar que `INTERNAL_API_KEY` esté configurado en Railway
2. Verificar que se envía header `X-Internal-Secret` con el valor correcto
3. Ejemplo:
   ```bash
   curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
     -H "Content-Type: application/json" \
     -H "X-Internal-Secret: tu_internal_key" \
     -d '{"to":"56912345678","text":"Test"}'
   ```

---

### Error: "Invalid OAuth access token"

**Causa:** Token expirado, inválido o sin permisos.

**Solución:**
1. Verificar que el token sea permanente (System User Token)
2. Verificar que tenga permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
3. Generar nuevo token si es necesario
4. Actualizar `WHATSAPP_ACCESS_TOKEN` en Railway
5. Reiniciar servicio

**Log esperado:** `[WHATSAPP] SEND_TEXT_FAIL`

---

### Error: "Phone number not found"

**Causa:** `WHATSAPP_PHONE_NUMBER_ID` incorrecto o número no verificado.

**Solución:**
1. Verificar Phone Number ID en Meta Dashboard ? API Setup
2. Verificar que el número esté "Connected" o "Ready"
3. Actualizar `WHATSAPP_PHONE_NUMBER_ID` en Railway
4. Reiniciar servicio

---

### Webhook no recibe mensajes

**Causa:** Webhook no configurado correctamente o Subscription Fields no marcado.

**Solución:**
1. Verificar Callback URL en Meta Dashboard ? Webhook
2. Verificar que Subscription Fields tenga `messages` marcado
3. Verificar logs en Railway (debe aparecer `[WHATSAPP] POST_ENABLED`)
4. Verificar que `ENABLE_WHATSAPP_AUTO_RESPONSE=true` en Railway

**Log esperado:** `[WHATSAPP] POST_DISABLED` (si está desactivado)

---

### POST responde {ok: true, disabled: true}

**Causa:** `ENABLE_WHATSAPP_AUTO_RESPONSE` no está en `true`.

**Solución:**
1. Verificar en Railway Variables que `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
2. Reiniciar servicio en Railway
3. Verificar logs: debe aparecer `[WHATSAPP] POST_ENABLED`

**Log esperado:** `[WHATSAPP] POST_DISABLED`

---

## ?? Plan de Rollback

### Si algo falla después de GO LIVE

**Opción 1: Desactivar Feature Flag (Rápido)**
1. En Railway Variables, cambiar `ENABLE_WHATSAPP_AUTO_RESPONSE=false`
2. Railway reinicia automáticamente
3. El webhook seguirá respondiendo 200 OK pero no procesará mensajes
4. Tiempo: ~1 minuto

**Opción 2: Desactivar Webhook en Meta (Completo)**
1. Ir a Meta Dashboard ? WhatsApp ? Configuration ? Webhook
2. Click **"Remove"** o desmarcar Subscription Fields
3. Meta dejará de enviar eventos
4. Tiempo: Inmediato

**Opción 3: Revertir Deployment (Último Recurso)**
1. En Railway Dashboard ? Deployments
2. Seleccionar deployment anterior
3. Click **"Redeploy"**
4. Tiempo: ~5 minutos

---

## ? Verificación Final Post-GO LIVE

### 1. Health Check
```bash
curl https://canalmedico-production.up.railway.app/health
```
**Esperado:** `200 OK` con `{"status":"ok"}`

### 2. Webhook Challenge
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=canalmedico_verify_2026&hub.challenge=test123"
```
**Esperado:** `200 OK` con body `test123`

### 3. Webhook Challenge (Token Inválido)
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test123"
```
**Esperado:** `403 Forbidden`

### 4. Envío de Mensaje (con autenticación)
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: tu_internal_key" \
  -d '{"to":"56912345678","text":"Test mensaje"}'
```
**Esperado:** `200 OK` con `{"success":true,"data":{"messageId":"wamid.xxx","to":"56912345678"}}`

### 5. Envío de Mensaje (sin autenticación)
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
  -H "Content-Type: application/json" \
  -d '{"to":"56912345678","text":"Test mensaje"}'
```
**Esperado:** `401` o `403` Forbidden

### 6. Mensaje Real
1. Enviar mensaje de WhatsApp al número configurado desde tu teléfono
2. Verificar logs en Railway: debe aparecer `[WHATSAPP] POST_ENABLED`
3. Debes recibir auto-respuesta con deep link

---

## ?? Resumen de Tiempos

| Tarea | Tiempo Estimado |
|-------|----------------|
| Meta Dashboard Setup | 15-30 min |
| Railway Variables | 5-10 min |
| Smoke Test | 5-10 min |
| Verificación Final | 5-10 min |
| **Total** | **30-60 min** |

---

## ?? Soporte

Si encuentras problemas:

1. **Revisar logs en Railway:** Filtrar por `[WHATSAPP]`
2. **Ejecutar smoke test:** `npm run whatsapp:test`
3. **Verificar variables:** Revisar `docs/WHATSAPP_RAILWAY_VARIABLES.md`
4. **Consultar Meta Dashboard:** Webhook ? Event Logs
5. **Documentación oficial:** https://developers.facebook.com/docs/whatsapp/cloud-api

---

**Última actualización:** 2025-01-26  
**Estado:** ? Listo para GO LIVE  
**Próximo paso:** Ejecutar checklist Meta Dashboard ? Configurar Railway Variables ? Ejecutar smoke test
