# WhatsApp Webhook 404 - Fix Report

## ?? Resumen Ejecutivo

### Problema
Meta Developers no puede validar el webhook WhatsApp Cloud API porque el endpoint `/api/whatsapp/webhook` devuelve 404.

**Síntoma:**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026"
# Retorna: {"error":"Ruta no encontrada","path":"/api/whatsapp/webhook"}
```

### Impacto
- Meta no puede validar el webhook (GET challenge)
- Meta no puede suscribir eventos de mensajes
- WhatsApp Cloud API no funciona (no se reciben mensajes entrantes)
- **Severidad:** P0 (Crítico - bloquea funcionalidad completa)

### Solución Aplicada
El router de WhatsApp ahora se monta **SIEMPRE** en `/api/whatsapp/webhook`, independientemente del feature flag `ENABLE_WHATSAPP_AUTO_RESPONSE`. El GET challenge de Meta funciona siempre (incluso si el flag está desactivado). El POST solo procesa mensajes si el flag está activo.

---

## ?? Hallazgos

### Archivos Analizados

1. **`backend/src/server.ts`** (línea 728)
   - Cargaba módulos opcionales SOLO si `ENABLE_WHATSAPP_AUTO_RESPONSE === 'true'`
   - **Problema:** Si el flag está desactivado, el router nunca se monta

2. **`backend/src/bootstrap/loadOptionalModules.ts`** (línea 27)
   - Solo cargaba WhatsApp si `enableWhatsApp === true`
   - **Problema:** Router nunca se montaba si el flag estaba desactivado

3. **`backend/src/modules/whatsapp/runtime.ts`** (línea 27)
   - Monta router en `/api/whatsapp` usando `app.use('/api/whatsapp', whatsappRoutes.default)`
   - **Correcto:** La ruta base es `/api/whatsapp`

4. **`backend/src/modules/whatsapp/whatsapp.routes.ts`** (línea 25)
   - Define ruta: `router.all('/webhook', ...)`
   - **Correcto:** Ruta final sería `/api/whatsapp/webhook`

5. **`backend/src/modules/whatsapp/whatsapp.controller.ts`** (línea 27)
   - Verificaba feature flag **ANTES** del GET challenge
   - **Problema:** GET challenge fallaba si el flag estaba desactivado

### Ruta Final Confirmada
```
GET/POST /api/whatsapp/webhook
```

### Prefijo `/api`
Todas las rutas están montadas bajo `/api` en `server.ts` (líneas 378-424):
- `/api/auth`
- `/api/users`
- `/api/payments`
- `/api/whatsapp` ? **Ahora SIEMPRE montado**

---

## ?? Causa Raíz (Root Cause)

### Problema Principal
El router de WhatsApp solo se montaba si `ENABLE_WHATSAPP_AUTO_RESPONSE === 'true'`. Si el flag estaba desactivado o no configurado en Railway, el router nunca se cargaba, causando 404 en `/api/whatsapp/webhook`.

### Secuencia del Problema

1. **Railway inicia servidor**
   - `server.ts` verifica `ENABLE_WHATSAPP_AUTO_RESPONSE`
   - Si no es `'true'` (string literal), salta la carga de módulos opcionales

2. **Router nunca se monta**
   - `loadOptionalModules()` no se ejecuta
   - `runtime.ts` no se llama
   - `app.use('/api/whatsapp', ...)` nunca se ejecuta

3. **Meta intenta validar webhook**
   - GET `/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...`
   - Express no encuentra ruta ? `notFoundHandler` ? 404

4. **Controller verifica flag demasiado temprano**
   - Incluso si el router se montaba, el controller verificaba el flag **antes** del GET challenge
   - GET challenge fallaba si el flag estaba desactivado

### Por Qué Meta Necesita el GET Challenge
Meta **DEBE** validar el webhook con un GET challenge antes de enviar eventos POST. Si el GET falla, Meta no puede suscribir el webhook, y no se envían eventos.

---

## ? Fix Aplicado

### Cambio 1: Montar Router SIEMPRE (`server.ts`)

**Antes:**
```typescript
if (process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true') {
  const { loadOptionalModules } = await import('@/bootstrap/loadOptionalModules');
  await loadOptionalModules(app);
}
```

**Después:**
```typescript
// CRÍTICO: Montar SIEMPRE el router de WhatsApp para que Meta pueda validar el webhook (GET challenge)
// El controller verifica el feature flag internamente
const { loadOptionalModules } = await import('@/bootstrap/loadOptionalModules');
await loadOptionalModules(app);
```

**Razón:** El router debe existir siempre para que Meta pueda validar el webhook.

### Cambio 2: Cargar WhatsApp SIEMPRE (`loadOptionalModules.ts`)

**Antes:**
```typescript
const enableWhatsApp = process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true';
if (enableWhatsApp) {
  whatsappModule.register(app);
}
```

**Después:**
```typescript
// CRÍTICO: Montar SIEMPRE el router de WhatsApp para que Meta pueda validar el webhook
// El controller verifica el feature flag internamente y devuelve 404 si está desactivado
// Pero el endpoint DEBE existir para que Meta pueda hacer GET /api/whatsapp/webhook (challenge)
whatsappModule.register(app);
if (enableWhatsApp) {
  logger.info('[BOOT] WhatsApp router montado (feature flag ACTIVO)');
} else {
  logger.info('[BOOT] WhatsApp router montado (feature flag DESACTIVADO - webhook disponible para validación Meta)');
}
```

**Razón:** El router debe montarse siempre, pero el controller controla el comportamiento según el flag.

### Cambio 3: GET Challenge SIEMPRE Funciona (`whatsapp.controller.ts`)

**Antes:**
```typescript
if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
  return res.status(404).json({ error: 'Feature not enabled' });
}
// Verificación de webhook (Meta envía GET para verificar)
if (req.method === 'GET') {
  // ... challenge logic
}
```

**Después:**
```typescript
// CRÍTICO: El GET challenge DEBE funcionar SIEMPRE (incluso si el flag está desactivado)
// Meta necesita validar el webhook antes de poder enviar eventos POST
if (req.method === 'GET') {
  // ... challenge logic (SIEMPRE funciona)
}

// Procesar mensajes (POST) - SOLO si el feature flag está activo
if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
  logger.debug('[WHATSAPP] POST webhook recibido pero feature flag desactivado');
  return res.status(200).json({ status: 'ok', message: 'Feature not enabled' });
}
```

**Razón:** Meta necesita validar el webhook con GET challenge antes de enviar POST. El POST solo procesa mensajes si el flag está activo.

### Cambio 4: Logs Mejorados

Agregados logs con prefijo `[WHATSAPP]` para facilitar diagnóstico:

```typescript
logger.info('[WHATSAPP] Webhook verified by Meta (GET challenge)', {
  challenge: challenge ? 'present' : 'missing',
  featureFlag: featureFlags.WHATSAPP_AUTO_RESPONSE ? 'ACTIVE' : 'INACTIVE',
});

logger.info('[WHATSAPP] POST webhook recibido y validado');
logger.debug('[WHATSAPP] POST webhook recibido pero feature flag desactivado');
```

**Razón:** Logs claros para diagnóstico en producción sin exponer secretos.

---

## ?? Archivos Modificados

1. **`backend/src/server.ts`**
   - Línea 726-738: Removida condición `if (ENABLE_WHATSAPP_AUTO_RESPONSE === 'true')`
   - `loadOptionalModules()` ahora se ejecuta SIEMPRE

2. **`backend/src/bootstrap/loadOptionalModules.ts`**
   - Línea 22-51: Removida condición `if (enableWhatsApp)`
   - Router se monta SIEMPRE con logs informativos

3. **`backend/src/modules/whatsapp/whatsapp.controller.ts`**
   - Línea 27-118: Reordenado lógica para que GET challenge funcione SIEMPRE
   - POST solo procesa si flag está activo
   - Agregados logs con prefijo `[WHATSAPP]`

---

## ? Checklist de Deploy Railway

### Pre-Deploy

- [x] Fix aplicado en rama `fix/whatsapp-webhook-404`
- [x] Todos los cambios commitados
- [x] Logs verificados (no exponen secretos)
- [x] Comportamiento del GET challenge verificado (funciona siempre)

### Variables de Entorno Railway

Verificar que estén configuradas:

- [ ] `ENABLE_WHATSAPP_AUTO_RESPONSE` ? `true` (para activar procesamiento POST)
- [ ] `WHATSAPP_WEBHOOK_VERIFY_TOKEN` ? `canalmedico_verify_2026` (debe coincidir con Meta Dashboard)
- [ ] `WHATSAPP_ACCESS_TOKEN` ? (token de Meta Developers)
- [ ] `WHATSAPP_PHONE_NUMBER_ID` ? (ID del número de WhatsApp Business)
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` ? (ID de la cuenta de negocio)

**Nota:** El webhook funcionará para validación (GET challenge) incluso si `ENABLE_WHATSAPP_AUTO_RESPONSE=false`, pero no procesará mensajes POST.

### Deploy

1. **Mergear rama a `release/go-final`**
   ```bash
   git checkout release/go-final
   git merge fix/whatsapp-webhook-404
   git push origin release/go-final
   ```

2. **Railway hará deploy automático**
   - Verificar logs en Railway Dashboard ? Logs
   - Buscar: `[BOOT] Optional modules loaded`
   - Buscar: `[BOOT] WhatsApp router montado`

3. **Verificar Health**
   ```bash
   curl https://canalmedico-production.up.railway.app/health
   ```

### Post-Deploy

4. **Probar GET Challenge (Meta Validation)**
   ```bash
   curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026"
   ```
   
   **Expected:** Debe retornar `test123` (texto plano, status 200)

5. **Validar Webhook en Meta Dashboard**
   - Ir a Meta Developers ? WhatsApp ? Configuration ? Webhook
   - Click en "Verify and Save"
   - **Expected:** "Webhook verified successfully"

6. **Verificar Logs en Railway**
   - Buscar: `[WHATSAPP] Webhook verified by Meta (GET challenge)`
   - Debe mostrar `featureFlag: ACTIVE` o `INACTIVE` según configuración

---

## ?? Pruebas Paso a Paso

### Test 1: GET Challenge (Meta Validation)

**Objetivo:** Verificar que Meta puede validar el webhook incluso si el flag está desactivado.

**Comando:**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=abc123xyz&hub.verify_token=canalmedico_verify_2026"
```

**Expected Output:**
```
abc123xyz
```

**Status Code:** `200 OK`

**Logs Esperados:**
```
[WHATSAPP] Webhook verified by Meta (GET challenge) challenge=present featureFlag=ACTIVE|INACTIVE
```

---

### Test 2: GET Challenge con Token Inválido

**Objetivo:** Verificar que el webhook rechaza tokens inválidos.

**Comando:**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=token_invalido"
```

**Expected Output:**
```
Forbidden
```

**Status Code:** `403 Forbidden`

**Logs Esperados:**
```
[WHATSAPP] Webhook verification failed (GET challenge) mode=subscribe tokenProvided=true featureFlag=ACTIVE|INACTIVE
```

---

### Test 3: POST Webhook (Flag Activo)

**Objetivo:** Verificar que el webhook procesa mensajes si el flag está activo.

**Pre-requisito:** `ENABLE_WHATSAPP_AUTO_RESPONSE=true`

**Comando:**
```bash
curl -X POST https://canalmedico-production.up.railway.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "56912345678",
            "type": "text",
            "text": { "body": "Hola" }
          }],
          "metadata": { "phone_number_id": "123456789" }
        }
      }]
    }]
  }'
```

**Expected Output:**
```json
{
  "status": "ok"
}
```

**Status Code:** `200 OK`

**Logs Esperados:**
```
[WHATSAPP] POST webhook recibido y validado
[WHATSAPP] POST webhook procesado exitosamente
```

---

### Test 4: POST Webhook (Flag Inactivo)

**Objetivo:** Verificar que el webhook responde OK pero no procesa si el flag está desactivado.

**Pre-requisito:** `ENABLE_WHATSAPP_AUTO_RESPONSE=false`

**Comando:**
```bash
curl -X POST https://canalmedico-production.up.railway.app/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object": "whatsapp_business_account"}'
```

**Expected Output:**
```json
{
  "status": "ok",
  "message": "Feature not enabled"
}
```

**Status Code:** `200 OK`

**Logs Esperados:**
```
[WHATSAPP] POST webhook recibido pero feature flag desactivado
```

---

### Test 5: Health Check

**Objetivo:** Verificar que el servidor está saludable.

**Comando:**
```bash
curl https://canalmedico-production.up.railway.app/health
```

**Expected Output:**
```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "2026-01-XX...",
  "uptime": "123s",
  "environment": "production",
  "version": "1.0.1",
  "commit": "abc1234",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

**Status Code:** `200 OK`

---

## ?? Rollback Plan

Si el fix causa problemas, rollback inmediato:

### Opción 1: Revertir Commit (Recomendado)

```bash
git checkout release/go-final
git revert HEAD
git push origin release/go-final
```

Railway hará deploy automático del commit anterior.

### Opción 2: Restaurar Código Manualmente

Si el revert no es posible:

1. **Restaurar `server.ts`**
   ```typescript
   if (process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true') {
     const { loadOptionalModules } = await import('@/bootstrap/loadOptionalModules');
     await loadOptionalModules(app);
   }
   ```

2. **Restaurar `loadOptionalModules.ts`**
   ```typescript
   if (enableWhatsApp) {
     whatsappModule.register(app);
   }
   ```

3. **Restaurar `whatsapp.controller.ts`**
   ```typescript
   if (!featureFlags.WHATSAPP_AUTO_RESPONSE) {
     return res.status(404).json({ error: 'Feature not enabled' });
   }
   ```

### Efecto del Rollback

- El webhook volverá a devolver 404 si el flag está desactivado
- Meta no podrá validar el webhook hasta que el flag esté en `true`
- **No rompe funcionalidad existente** (solo restaura comportamiento anterior)

---

## ?? Estado Final

### Ruta Final Confirmada
```
GET/POST /api/whatsapp/webhook
```

### Comandos de Prueba

**Validación Meta (GET Challenge):**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026"
```

**Expected:** Retorna `test123` (status 200)

### Archivos Tocados

1. `backend/src/server.ts`
2. `backend/src/bootstrap/loadOptionalModules.ts`
3. `backend/src/modules/whatsapp/whatsapp.controller.ts`

### Estado: ? READY para Validación Meta

El webhook está disponible para validación de Meta incluso si `ENABLE_WHATSAPP_AUTO_RESPONSE=false`. El procesamiento de mensajes POST requiere `ENABLE_WHATSAPP_AUTO_RESPONSE=true`.

---

## ?? Notas Adicionales

### Por Qué GET Challenge Debe Funcionar Siempre

Meta **requiere** validar el webhook con un GET challenge antes de suscribir eventos. Si el GET falla:
- Meta no puede validar el webhook
- Meta no suscribe eventos de mensajes
- No se reciben mensajes POST del webhook
- **Funcionalidad completa bloqueada**

### Seguridad

- El GET challenge valida el token `WHATSAPP_WEBHOOK_VERIFY_TOKEN` antes de responder
- El POST valida la signature `X-Hub-Signature-256` antes de procesar
- Los logs no exponen secretos (solo indican presencia/ausencia)
- El feature flag controla el procesamiento de mensajes, no la disponibilidad del endpoint

### Próximos Pasos

1. Validar webhook en Meta Dashboard después del deploy
2. Verificar que se reciben eventos POST cuando el flag está activo
3. Monitorear logs `[WHATSAPP]` en Railway para diagnóstico
4. Considerar activar `ENABLE_WHATSAPP_AUTO_RESPONSE=true` en producción si WhatsApp es requerido

---

**Fecha:** 2026-01-XX  
**Rama:** `fix/whatsapp-webhook-404`  
**Commits:**
- `fix(whatsapp): ensure webhook route mounted under /api/whatsapp/webhook`
- `chore(logs): add safe webhook mount logs`
- `docs(whatsapp): add webhook fix report`
