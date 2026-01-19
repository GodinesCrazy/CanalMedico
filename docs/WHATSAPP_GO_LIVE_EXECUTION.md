# WhatsApp Cloud API - GO LIVE Execution Guide

**Fecha:** 2025-01-26  
**Versión:** 1.0.0  
**Estado:** ? Producción Ready  
**Objetivo:** Guía paso a paso para ejecutar el GO LIVE de WhatsApp Cloud API

---

## ?? Checklist Pre-Ejecución

### Meta Dashboard

- [ ] App en modo **LIVE** (no Development)
- [ ] Webhook configurado:
  - [ ] Callback URL: `https://canalmedico-production.up.railway.app/api/whatsapp/webhook`
  - [ ] Verify Token: `canalmedico_verify_2026`
  - [ ] Subscription Fields: `messages` marcado
- [ ] Token permanente obtenido (System User Token)
- [ ] Phone Number ID anotado
- [ ] WABA ID anotado
- [ ] App Secret obtenido (opcional pero recomendado)

### Railway Variables

- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- [ ] `WHATSAPP_ACCESS_TOKEN=[token permanente]`
- [ ] `WHATSAPP_PHONE_NUMBER_ID=[phone number id]`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID=[waba id]`
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN=canalmedico_verify_2026`
- [ ] `INTERNAL_API_KEY=[generar con: openssl rand -base64 32]`
- [ ] `WHATSAPP_APP_SECRET=[app secret]` (opcional)
- [ ] `WHATSAPP_API_VERSION=v21.0` (opcional, default)

**Ver documentación completa:** `docs/WHATSAPP_RAILWAY_VARIABLES.md`

---

## ?? Comandos de Smoke Test

### Test contra Producción (Recomendado)

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
WHATSAPP_WEBHOOK_VERIFY_TOKEN=canalmedico_verify_2026 \
npm run whatsapp:test
```

### Test con Validación Completa (incluye Meta Graph API)

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
WHATSAPP_ACCESS_TOKEN=tu_token_meta \
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id \
WHATSAPP_TEST_TO=56912345678 \
WHATSAPP_WEBHOOK_VERIFY_TOKEN=canalmedico_verify_2026 \
npm run whatsapp:test
```

### Tests que Ejecuta

1. ? **Test 0:** GET /health ? 200 OK
2. ? **Test 0b:** GET /api/whatsapp/status ? Estado del módulo
3. ? **Test 1:** GET /api/whatsapp/webhook (challenge válido) ? 200 OK
4. ? **Test 1b:** GET /api/whatsapp/webhook (token inválido) ? 403 Forbidden
5. ? **Test 2b:** POST /api/whatsapp/webhook (simulación) ? 200 OK
6. ? **Test 2:** POST /api/whatsapp/send/text (con secret) ? 200 + messageId
7. ? **Test 3:** POST /api/whatsapp/send/text (sin secret) ? 401/403
8. ? **Test 4:** Meta Graph API direct test (opcional)

---

## ?? Verificación de Logs en Railway

### Buscar Logs de WhatsApp

1. Ir a **Railway Dashboard** ? Tu Proyecto ? **Servicio Backend** ? **Logs**
2. Filtrar por: `[WHATSAPP]`

### Logs Esperados Post-GO LIVE

**Al arrancar:**
```
[BOOT] WhatsApp router montado (feature flag ACTIVO)
[WHATSAPP] Webhook route mounted at /api/whatsapp/webhook
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

**Status check:**
```
[WHATSAPP] STATUS
```

---

## ? Verificación Manual con curl

### 1. Health Check
```bash
curl https://canalmedico-production.up.railway.app/health
```
**Esperado:** `200 OK` con `{"status":"ok"}`

### 2. Status del Módulo
```bash
curl -H "X-Internal-Secret: tu_internal_key" \
  https://canalmedico-production.up.railway.app/api/whatsapp/status
```
**Esperado:** `200 OK` con JSON con `moduleLoaded`, `fallbackActive`, etc.

### 3. Webhook Challenge (Token Válido)
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=canalmedico_verify_2026&hub.challenge=test123"
```
**Esperado:** `200 OK` con body `test123`  
**Log esperado:** `[WHATSAPP] CHALLENGE_OK`

### 4. Webhook Challenge (Token Inválido)
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test123"
```
**Esperado:** `403 Forbidden`  
**Log esperado:** `[WHATSAPP] CHALLENGE_FORBIDDEN`

### 5. POST Webhook (Simulación)
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=fake" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```
**Esperado:** `200 OK` con `{"ok":true}` o `{"ok":true,"disabled":true}`

### 6. Envío de Mensaje (con autenticación)
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: tu_internal_key" \
  -d '{"to":"56912345678","text":"Test mensaje"}'
```
**Esperado:** `200 OK` con `{"success":true,"data":{"messageId":"wamid.xxx","to":"56912345678"}}`  
**Log esperado:** `[WHATSAPP] SEND_TEXT_OK`

### 7. Envío de Mensaje (sin autenticación)
```bash
curl -X POST "https://canalmedico-production.up.railway.app/api/whatsapp/send/text" \
  -H "Content-Type: application/json" \
  -d '{"to":"56912345678","text":"Test mensaje"}'
```
**Esperado:** `401` o `403` Forbidden

---

## ?? Troubleshooting

### Módulo en Fallback

**Síntoma:** `/api/whatsapp/status` muestra `fallbackActive: true`

**Causa:** El módulo WhatsApp no se cargó correctamente.

**Solución:**
1. Verificar logs en Railway buscando errores de carga del módulo
2. Verificar que `dist/modules/whatsapp/runtime.js` existe
3. Verificar que todas las dependencias están instaladas
4. Reiniciar servicio en Railway

**Log esperado:** `[BOOT] WhatsApp module failed to load, mounting fallback webhook handler`

---

### GET Challenge retorna 403

**Causa:** `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide con Meta Dashboard.

**Solución:**
1. Verificar valor en Meta Dashboard ? Webhook ? Verify Token
2. Verificar valor en Railway ? `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Deben ser exactamente iguales (case-sensitive)
4. Reiniciar servicio

**Log esperado:** `[WHATSAPP] CHALLENGE_FORBIDDEN`

---

### POST responde {ok: true, disabled: true}

**Causa:** `ENABLE_WHATSAPP_AUTO_RESPONSE` no está en `true`.

**Solución:**
1. Verificar en Railway Variables que `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
2. Reiniciar servicio
3. Verificar logs: debe aparecer `[WHATSAPP] POST_ENABLED`

**Log esperado:** `[WHATSAPP] POST_DISABLED`

---

### Status endpoint retorna 404

**Causa:** Feature flag desactivado o módulo no cargado.

**Solución:**
1. Verificar que `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
2. Verificar que el módulo se cargó correctamente
3. Verificar que `INTERNAL_API_KEY` está configurado

---

## ?? Resumen de Tiempos

| Tarea | Tiempo Estimado |
|-------|----------------|
| Meta Dashboard Setup | 15-30 min |
| Railway Variables | 5-10 min |
| Smoke Test | 5-10 min |
| Verificación Manual | 5-10 min |
| **Total** | **30-60 min** |

---

## ? Checklist Post-GO LIVE

- [ ] Smoke test pasa todos los tests
- [ ] GET /health responde 200 OK
- [ ] GET /api/whatsapp/status muestra `moduleLoaded: true`
- [ ] GET webhook challenge responde correctamente
- [ ] POST webhook responde 200 OK
- [ ] Envío de mensaje funciona (si está configurado)
- [ ] Logs muestran `[WHATSAPP]` sin errores críticos
- [ ] Mensaje real recibido y procesado (opcional)

---

**Última actualización:** 2025-01-26  
**Estado:** ? Listo para ejecución  
**Próximo paso:** Ejecutar checklist Meta Dashboard ? Configurar Railway Variables ? Ejecutar smoke test
