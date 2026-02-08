# Meta WhatsApp Setup Steps - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Guía paso a paso para configurar WhatsApp Cloud API en Meta Developers

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.6, 4.10)

---

## Pre-Requisitos

1. Cuenta de Meta (Facebook)
2. Cuenta de WhatsApp Business (verificada)
3. Meta Developers Account: https://developers.facebook.com

---

## Paso 1: Crear App en Meta Developers

### 1.1 Acceder a Meta Developers

1. Abrir: https://developers.facebook.com
2. Click en **"Mis Apps"** (arriba a la derecha)
3. Click en **"Crear App"**

### 1.2 Tipo de App

1. Seleccionar tipo: **"Empresa"**
2. Click en **"Siguiente"**

### 1.3 Configurar App

1. **Nombre de la App:** `CanalMedico`
2. **Email de contacto:** [tu-email@canalmedico.cl]
3. Click en **"Crear App"**

---

## Paso 2: Agregar Producto WhatsApp

### 2.1 Agregar WhatsApp a la App

1. En la página de la App, buscar **"WhatsApp"** en la lista de productos
2. Click en **"Configurar"** en el producto WhatsApp

### 2.2 Configurar Número de Teléfono

1. Ir a: **WhatsApp ? API Setup**
2. Si no tienes número de teléfono:
   - Click en **"Agregar número de teléfono"**
   - Ingresar número de teléfono (debe estar verificado)
   - Confirmar vía SMS o llamada

3. **Anotar el Phone Number ID:**
   - Se muestra en **API Setup ? Phone number ID**
   - Ejemplo: `123456789012345`
   - ?? **GUARDAR ESTE VALOR:** Usar en variable `WHATSAPP_PHONE_NUMBER_ID`

---

## Paso 3: Obtener Access Token

### 3.1 Generar Access Token Permanente (Recomendado)

1. Ir a: **WhatsApp ? API Setup**
2. Buscar sección **"Temporary access token"** o **"Access tokens"**
3. Para token permanente:
   - Ir a: **Settings ? Basic ? App Secret**
   - Anotar **App Secret** (si necesitas verificar signature)
   - Ir a: **WhatsApp ? API Setup ? Token**
   - Generar **System User Token** o **Page Access Token** (permanente)

### 3.2 Token Temporal (Solo para pruebas)

1. En **API Setup ? Token**, copiar el **Temporary access token**
2. ?? **Validez:** 24 horas (solo para pruebas iniciales)
3. Para producción, usar token permanente (paso 3.1)

### 3.3 Guardar Access Token

- ?? **GUARDAR ESTE VALOR:** Usar en variable `WHATSAPP_ACCESS_TOKEN`

---

## Paso 4: Obtener Business Account ID

### 4.1 Buscar Business Account ID

1. Ir a: **WhatsApp ? API Setup**
2. Buscar **"WhatsApp Business Account ID"** o **"Business Account"**
3. El ID es un número largo (ejemplo: `1234567890123456`)

### 4.2 Alternativa: Business Settings

1. Ir a: **Settings ? Business Settings**
2. Seleccionar **WhatsApp Business Account**
3. Ver **Account ID** en los detalles

- ?? **GUARDAR ESTE VALOR:** Usar en variable `WHATSAPP_BUSINESS_ACCOUNT_ID`

---

## Paso 5: Configurar Webhook

### 5.1 Ir a Configuración de Webhook

1. En la App, ir a: **WhatsApp ? Configuration**
2. O directamente: **WhatsApp ? API Setup ? Webhook**

### 5.2 Agregar URL del Webhook

1. Click en **"Editar"** o **"Agregar"** en Webhook
2. **Callback URL:**
   ```
   https://canalmedico-production.up.railway.app/api/whatsapp/webhook
   ```
3. **Verify Token:**
   ```
   canalmedico_verify_2026
   ```
   - ?? **GUARDAR ESTE VALOR:** Usar en variable `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

4. Click en **"Verificar y guardar"**

### 5.3 Suscribirse a Eventos

1. Después de verificar, hacer click en **"Gestionar"** o **"Editar"**
2. En **"Webhook Fields"** o **"Suscripciones"**, marcar:
   - ? **`messages`** (Mensajes entrantes)
   - Opcional: **`message_status`** (Estados de mensajes)

3. Click en **"Guardar"**

---

## Paso 6: Verificar Webhook (Challenge de Meta)

### 6.1 Meta Enviará GET Request

Meta enviará un GET request a tu webhook URL:
```
GET https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=<random_string>&hub.verify_token=canalmedico_verify_2026
```

### 6.2 El Backend Debe Responder

El backend debe responder con `hub.challenge` si `hub.verify_token` coincide.

**Comando de Verificación:**
```bash
curl "https://canalmedico-production.up.railway.app/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=canalmedico_verify_2026"

# Respuesta esperada: "test_challenge_123" (status 200)
```

**Logs Esperados:**
```
[WHATSAPP] Webhook verification: mode=subscribe, challenge=test_challenge_123
[WHATSAPP] Webhook verification: SUCCESS
```

---

## Paso 7: Configurar Variables en Railway

### 7.1 Agregar Variables al Backend

Ir a **Railway Dashboard ? Service "Backend" ? Variables** y agregar:

| Variable | Valor |
|----------|-------|
| `ENABLE_WHATSAPP_AUTO_RESPONSE` | `true` |
| `WHATSAPP_ACCESS_TOKEN` | `<valor del paso 3>` |
| `WHATSAPP_PHONE_NUMBER_ID` | `<valor del paso 2.2>` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `<valor del paso 4>` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `canalmedico_verify_2026` |

### 7.2 Reiniciar Servicio

1. Railway Dashboard ? Service ? Settings
2. Click en **"Restart"**
3. Verificar logs: debe mostrar `[BOOT] WhatsApp cargado correctamente`

---

## Paso 8: Probar Webhook

### 8.1 Enviar Mensaje de Prueba

1. Desde WhatsApp Business number, enviar mensaje a número configurado
2. O usar herramienta de prueba de Meta

### 8.2 Verificar Logs

**Railway Dashboard ? Service ? Logs**, buscar:

```
[WHATSAPP] Mensaje entrante recibido de +56912345678
[WHATSAPP] ConsultationAttempt creado: clx_attempt_abc123
[WHATSAPP] Auto-respuesta enviada con deep link: https://app.canalmedico.cl/consultation?attemptId=...
```

### 8.3 Verificar en Base de Datos

```sql
SELECT * FROM consultation_attempts 
WHERE "patientPhone" = '+56912345678' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

---

## Resumen de Variables Configuradas

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `ENABLE_WHATSAPP_AUTO_RESPONSE` | `true` | Feature flag |
| `WHATSAPP_ACCESS_TOKEN` | `<token>` | Meta Developers ? WhatsApp ? API Setup ? Token |
| `WHATSAPP_PHONE_NUMBER_ID` | `<id>` | Meta Developers ? WhatsApp ? API Setup ? Phone number ID |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `<id>` | Meta Developers ? Business Settings ? WhatsApp Business Account ID |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `canalmedico_verify_2026` | Valor personalizado configurado en webhook |
| `WHATSAPP_APP_SECRET` | `<secret>` (opcional) | Meta Developers ? Settings ? Basic ? App Secret |

---

## Troubleshooting

### Webhook No Se Verifica

- ? Verificar que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` coincide exactamente
- ? Verificar que el backend está corriendo y accesible públicamente
- ? Verificar que la URL del webhook es correcta (HTTPS)
- ? Verificar logs del backend para errores

### Auto-Respuesta No Se Envía

- ? Verificar `ENABLE_WHATSAPP_AUTO_RESPONSE=true`
- ? Verificar `WHATSAPP_ACCESS_TOKEN` válido (no expirado)
- ? Verificar `WHATSAPP_PHONE_NUMBER_ID` correcto
- ? Revisar logs para errores de API de WhatsApp

### Mensajes No Se Reciben

- ? Verificar que webhook está suscrito a evento `messages`
- ? Verificar que número de teléfono está verificado en Meta
- ? Revisar límites de rate limiting de Meta

---

## Referencias

- Meta WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp
- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.10)
- `docs/WHATSAPP_QA_RUNBOOK.md`

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA CONFIGURAR**
