# WhatsApp Webhook 404 Fix Report

**Fecha:** 2025-01-27  
**Estado:** ? Resuelto  
**Autor:** Backend Engineer

## Resumen Ejecutivo

Se corrigió el problema crítico donde el webhook de WhatsApp devolvía 404 al intentar validar con Meta. El endpoint GET `/api/whatsapp/webhook` ahora está SIEMPRE disponible, incluso cuando el módulo WhatsApp falla al cargarse o el feature flag está desactivado.

## Problema Identificado

### Síntoma
El backend respondía OK en `/health`, pero devolvía **404** en:
```
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026
```

Esto bloqueaba la validación del webhook en Meta, impidiendo la configuración completa del webhook.

### Root Cause

El problema se debía a que el router de WhatsApp se montaba a través de `loadOptionalModules()`, que usa `require()` dinámico. Si el módulo fallaba al cargarse (por cualquier razón), el router nunca se montaba, causando el 404.

**Código problemático (antes):**
```typescript
try {
  const whatsappModule = require('../modules/whatsapp/runtime');
  whatsappModule.register(app);
} catch (error: any) {
  logger.warn('[BOOT] WhatsApp no disponible, continuando sin él');
  // ? NO se montaba ningún router ? 404
}
```

## Solución Implementada

### Estrategia

Se implementó un **router de fallback** que SIEMPRE se monta si el módulo principal falla al cargarse. Este router mínimo maneja:

1. **GET `/api/whatsapp/webhook`**: Challenge de verificación de Meta (CRÍTICO - debe funcionar siempre)
2. **POST `/api/whatsapp/webhook`**: Respuesta OK cuando el flag está desactivado

### Cambios Realizados

#### Archivo: `backend/src/bootstrap/loadOptionalModules.ts`

**Antes:**
```typescript
try {
  const whatsappModule = require('../modules/whatsapp/runtime');
  whatsappModule.register(app);
} catch (error: any) {
  logger.warn('[BOOT] WhatsApp no disponible, continuando sin él');
  // ? No se montaba router ? 404
}
```

**Después:**
```typescript
let whatsappRouterMounted = false;

try {
  const whatsappModule = require('../modules/whatsapp/runtime');
  whatsappModule.register(app);
  whatsappRouterMounted = true;
} catch (error: any) {
  logger.warn('[BOOT] WhatsApp module failed to load, mounting fallback webhook handler');
  
  // ? Montar router de fallback SIEMPRE
  const fallbackRouter = Router();
  
  // GET /api/whatsapp/webhook - Challenge de verificación de Meta
  fallbackRouter.get('/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.info('[WHATSAPP] Webhook verified by Meta (GET challenge - fallback handler)');
      return res.status(200).send(challenge);
    }
    
    logger.warn('[WHATSAPP] Webhook verification failed (GET challenge - fallback handler)');
    return res.status(403).send('Forbidden');
  });
  
  // POST /api/whatsapp/webhook - Responder OK pero no procesar si el flag está desactivado
  fallbackRouter.post('/webhook', (_req: Request, res: Response) => {
    if (!enableWhatsApp) {
      logger.debug('[WHATSAPP] POST webhook recibido pero feature flag desactivado (fallback handler)');
      return res.status(200).json({ status: 'ok', message: 'Feature not enabled' });
    }
    
    logger.warn('[WHATSAPP] POST webhook recibido pero módulo no disponible (fallback handler)');
    return res.status(200).json({ status: 'ok', message: 'Module not available' });
  });
  
  app.use('/api/whatsapp', fallbackRouter);
  whatsappRouterMounted = true;
}
```

### Comportamiento del Fix

#### GET `/api/whatsapp/webhook` (Challenge de Meta)

**Comportamiento:**
- ? **SIEMPRE disponible**, incluso si el módulo principal falla
- ? Valida `hub.verify_token` contra `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- ? Si el token coincide: responde `200` con el `hub.challenge`
- ? Si el token no coincide: responde `403 Forbidden`

**Logging:**
```
[WHATSAPP] Webhook verified by Meta (GET challenge - fallback handler)
[WHATSAPP] Webhook verification failed (GET challenge - fallback handler)
```

#### POST `/api/whatsapp/webhook` (Mensajes entrantes)

**Comportamiento:**
- ? **SIEMPRE disponible**, incluso si el módulo principal falla
- ? Si `ENABLE_WHATSAPP_AUTO_RESPONSE=false`: responde `200 OK` pero NO procesa
- ? Si `ENABLE_WHATSAPP_AUTO_RESPONSE=true` pero módulo falló: responde `200 OK` con mensaje de error

**Logging:**
```
[WHATSAPP] POST webhook recibido pero feature flag desactivado (fallback handler)
[WHATSAPP] POST webhook recibido pero módulo no disponible (fallback handler)
```

### Flujo de Carga del Módulo

```
1. loadOptionalModules() intenta cargar módulo principal
   ?
2. ¿Módulo carga exitosamente?
   ?? SÍ ? Monta router principal (whatsapp.routes.ts)
   ?? NO ? Monta router de fallback (mínimo, solo webhook)
   ?
3. Router SIEMPRE montado en /api/whatsapp
   ?
4. GET /api/whatsapp/webhook SIEMPRE responde
```

## Validación Local

### Comandos de Prueba

#### 1. Verificar que el servidor compila
```bash
cd backend
npm run build
# ? Debe compilar sin errores
```

#### 2. Iniciar servidor (desarrollo)
```bash
npm run dev
# O en producción:
npm start
```

#### 3. Probar GET challenge (token correcto)
```bash
curl "http://localhost:PORT/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026"
```

**Respuesta esperada:**
```
test123
HTTP/1.1 200 OK
```

**Logs esperados:**
```
[WHATSAPP] Webhook verified by Meta (GET challenge)
# o si usa fallback:
[WHATSAPP] Webhook verified by Meta (GET challenge - fallback handler)
```

#### 4. Probar GET challenge (token incorrecto)
```bash
curl "http://localhost:PORT/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=token_incorrecto"
```

**Respuesta esperada:**
```
Forbidden
HTTP/1.1 403 Forbidden
```

**Logs esperados:**
```
[WHATSAPP] Webhook verification failed (GET challenge)
```

#### 5. Probar POST webhook (flag desactivado)
```bash
curl -X POST "http://localhost:PORT/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

**Respuesta esperada:**
```json
{"status":"ok","message":"Feature not enabled"}
HTTP/1.1 200 OK
```

**Logs esperados:**
```
[WHATSAPP] POST webhook recibido pero feature flag desactivado
```

#### 6. Verificar que no hay 404
```bash
curl -v "http://localhost:PORT/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=canalmedico_verify_2026"
```

**Verificar en output:**
```
< HTTP/1.1 200 OK  # ? No debe ser 404
```

## Checklist para Railway + Meta

### Pre-Deployment

- [x] Build local compila sin errores TypeScript
- [x] Commit creado siguiendo Conventional Commits
- [x] Documentación creada
- [x] Código revisado (fallback router implementado)

### Post-Deployment (Railway)

#### 1. Verificar Build
- [ ] Build step "npm run build" completa exitosamente
- [ ] No hay errores en los logs de build
- [ ] Service está "ACTIVE"

#### 2. Verificar Logs de Inicio
Los logs deben mostrar uno de estos mensajes:
- `[BOOT] WhatsApp router montado (feature flag ACTIVO)` (si módulo principal cargó)
- `[BOOT] WhatsApp router montado (feature flag DESACTIVADO - webhook disponible para validación Meta)` (si módulo principal cargó)
- `[BOOT] WhatsApp fallback router montado (webhook challenge disponible)` (si módulo principal falló)

**IMPORTANTE:** Cualquiera de los tres significa que el router está montado.

#### 3. Probar Webhook desde Railway
```bash
# Reemplazar DOMAIN con el dominio de Railway
curl "https://DOMAIN.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=TU_TOKEN"
```

**Respuesta esperada:**
```
test123
HTTP/1.1 200 OK
```

**Si recibe 404:** El router no se montó. Revisar logs de inicio.

### Configuración en Meta (WhatsApp Cloud API)

#### 1. Configurar Webhook URL
- **Webhook URL:** `https://canalmedico-production.up.railway.app/api/whatsapp/webhook`
- **Verify Token:** Debe coincidir con `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Railway

#### 2. Verificar Webhook
1. En Meta Developer Console ? WhatsApp ? Configuration ? Webhook
2. Click en "Verify and Save"
3. Meta enviará GET request con:
   - `hub.mode=subscribe`
   - `hub.challenge=<random_string>`
   - `hub.verify_token=<tu_token>`

**Resultado esperado:**
- ? **Status: Verified** (el webhook responde con el challenge)
- ? **Error: Webhook verification failed** ? Revisar:
  - ¿El token en Meta coincide con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`?
  - ¿El endpoint responde con 200 (no 404)?
  - ¿El body de respuesta es exactamente el `hub.challenge`?

#### 3. Suscribir a Eventos
Una vez verificado, suscribir a:
- `messages` (mensajes entrantes)
- `message_status` (status de mensajes enviados)

### Variables de Entorno Requeridas (Railway)

#### Mínimas para GET challenge:
```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=canalmedico_verify_2026
# ENABLE_WHATSAPP_AUTO_RESPONSE=false (opcional, puede ser false)
```

#### Completas para funcionalidad completa:
```bash
ENABLE_WHATSAPP_AUTO_RESPONSE=true
WHATSAPP_ACCESS_TOKEN=<token_de_meta>
WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<business_account_id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=canalmedico_verify_2026
WHATSAPP_APP_SECRET=<app_secret>  # Para validar signature POST
```

## Seguridad

### ? Validaciones Implementadas

1. **GET Challenge:**
   - ? Valida `hub.verify_token` contra `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - ? Solo responde 200 si el token coincide
   - ? Responde 403 si el token no coincide

2. **POST Webhook:**
   - ? Si flag desactivado: responde OK pero NO procesa (evita reintentos de Meta)
   - ? Si flag activo: valida signature del webhook (en módulo principal)

### ?? Consideraciones

- El router de fallback NO valida signature en POST (solo responde OK)
- Si `ENABLE_WHATSAPP_AUTO_RESPONSE=true`, el módulo principal debe cargarse correctamente para validar signatures
- El fallback es solo para garantizar que Meta pueda validar el webhook (GET challenge)

## Impacto y Consideraciones

### Funcionalidad
- ? **GET webhook SIEMPRE disponible** ? Meta puede validar webhook
- ? **POST webhook SIEMPRE disponible** ? Meta no recibe errores 404
- ? **Comportamiento correcto según flag** ? POST procesa solo si flag activo

### Compatibilidad
- ? **Backward compatible** ? No rompe funcionalidad existente
- ? **Módulo principal tiene prioridad** ? Si carga exitosamente, usa router principal
- ? **Fallback solo si necesario** ? No afecta performance normal

### Testing
- ? **Build exitoso** ? TypeScript compila sin errores
- ?? **Testing manual requerido** ? Probar GET challenge con curl/Meta
- ?? **Testing de producción** ? Verificar en Railway después de deploy

## Referencias

- **Commit:** `1e8be47` - `fix(whatsapp): ensure webhook challenge always available and prevent 404`
- **Archivo modificado:** `backend/src/bootstrap/loadOptionalModules.ts`
- **Cambios:** +66 líneas, -18 líneas (net +48)
- **Documentación Meta:** [WhatsApp Cloud API Webhook Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)

---

**Estado Final:** ? GET webhook challenge SIEMPRE disponible. Webhook de Meta puede validarse correctamente.
