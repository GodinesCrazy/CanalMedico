# WhatsApp Cloud API - Variables de Entorno en Railway

**Fecha:** 2025-01-26  
**Versión:** 1.0.0  
**Objetivo:** Lista completa de variables de entorno requeridas para WhatsApp Cloud API en producción

---

## Variables Obligatorias

### 1. `ENABLE_WHATSAPP_AUTO_RESPONSE`
- **Tipo:** Boolean (string)
- **Valor:** `true`
- **Descripción:** Habilita el módulo de WhatsApp en el backend
- **Ubicación Railway:** Variables ? `ENABLE_WHATSAPP_AUTO_RESPONSE` ? `true`
- **Validación:** Debe ser exactamente `"true"` (string)

---

### 2. `WHATSAPP_ACCESS_TOKEN`
- **Tipo:** String
- **Valor:** Token permanente de Meta (System User Token o Page Access Token)
- **Descripción:** Token de acceso para autenticar requests a Meta Graph API
- **Cómo obtener:**
  1. Meta Developers ? Tu App ? WhatsApp ? API Setup
  2. Crear System User Token (recomendado) o Page Access Token
  3. Copiar token INMEDIATAMENTE (solo se muestra una vez)
- **Formato:** `EAAB...` (token largo de Meta)
- **Validez:** Permanente (hasta que se revoque manualmente)
- **?? CRÍTICO:** NO usar token temporal (expira en 24h)

---

### 3. `WHATSAPP_PHONE_NUMBER_ID`
- **Tipo:** String (numérico)
- **Valor:** ID del número de teléfono de WhatsApp Business
- **Descripción:** Identificador único del número de teléfono en Meta
- **Cómo obtener:**
  1. Meta Developers ? Tu App ? WhatsApp ? API Setup
  2. Buscar "Phone number ID" en la sección API Setup
  3. Copiar el ID (ejemplo: `123456789012345`)
- **Formato:** Número largo (15-16 dígitos)
- **Validación:** El número debe estar verificado y en estado "Connected" o "Ready"

---

### 4. `WHATSAPP_BUSINESS_ACCOUNT_ID`
- **Tipo:** String (numérico)
- **Valor:** ID de la cuenta WhatsApp Business (WABA ID)
- **Descripción:** Identificador de la cuenta Business en Meta
- **Cómo obtener:**
  1. Meta Developers ? Tu App ? WhatsApp ? API Setup
  2. Buscar "WhatsApp Business Account ID" o "Business Account ID"
  3. Copiar el ID (ejemplo: `1234567890123456`)
- **Formato:** Número largo (15-16 dígitos)
- **Alternativa:** Settings ? Business Settings ? WhatsApp Business Account ? Account ID

---

### 5. `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- **Tipo:** String
- **Valor:** `canalmedico_verify_2026` (o el que configures en Meta Dashboard)
- **Descripción:** Token de verificación para el webhook (Meta valida con este token)
- **?? CRÍTICO:** Debe coincidir EXACTAMENTE con el valor configurado en Meta Dashboard
- **Ubicación Meta:** WhatsApp ? Configuration ? Webhook ? Verify Token
- **Validación:** Case-sensitive, debe ser exactamente igual en ambos lados

---

### 6. `INTERNAL_API_KEY`
- **Tipo:** String (secreto fuerte)
- **Valor:** Generar con `openssl rand -base64 32`
- **Descripción:** Secret para proteger endpoints de envío (`/api/whatsapp/send/*`)
- **Cómo generar:**
  ```bash
  openssl rand -base64 32
  ```
  O con Node.js:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Requisitos:**
  - Mínimo 32 caracteres
  - Aleatorio y único
  - NO compartir públicamente
- **Uso:** Se envía en header `X-Internal-Secret` para autenticar requests a `/api/whatsapp/send/*`

---

## Variables Opcionales (Recomendadas)

### 7. `WHATSAPP_APP_SECRET`
- **Tipo:** String
- **Valor:** App Secret de Meta
- **Descripción:** Secret para verificar la signature del webhook (X-Hub-Signature-256)
- **Cómo obtener:**
  1. Meta Developers ? Tu App ? Settings ? Basic ? App Secret
  2. Click "Show" (puede requerir contraseña)
  3. Copiar el App Secret
- **Recomendado:** Sí (para seguridad adicional)
- **Si no se configura:**
  - El webhook seguirá funcionando
  - Pero sin verificación de signature (menos seguro)
  - Se logueará WARNING en logs

---

### 8. `WHATSAPP_API_VERSION`
- **Tipo:** String
- **Valor:** `v21.0` (default)
- **Descripción:** Versión de la API de Meta Graph API a usar
- **Default:** `v21.0` (si no se configura)
- **Ubicación Railway:** Variables ? `WHATSAPP_API_VERSION` ? `v21.0`
- **Nota:** Verificar versión actual en Meta Developers Dashboard

---

## Resumen de Configuración en Railway

### Paso 1: Acceder a Variables
1. Ir a **Railway Dashboard** ? Tu Proyecto ? **Servicio Backend**
2. Click en **"Variables"** en el menú lateral
3. Click **"+ New Variable"** para cada variable

### Paso 2: Configurar Variables Obligatorias

| Variable | Valor | Notas |
|----------|-------|-------|
| `ENABLE_WHATSAPP_AUTO_RESPONSE` | `true` | String exacto "true" |
| `WHATSAPP_ACCESS_TOKEN` | `EAAB...` | Token permanente de Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | `123456789012345` | ID del número verificado |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `1234567890123456` | WABA ID |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `canalmedico_verify_2026` | Debe coincidir con Meta |
| `INTERNAL_API_KEY` | `[generar]` | `openssl rand -base64 32` |

### Paso 3: Configurar Variables Opcionales

| Variable | Valor | Notas |
|----------|-------|-------|
| `WHATSAPP_APP_SECRET` | `abc123...` | Recomendado para seguridad |
| `WHATSAPP_API_VERSION` | `v21.0` | Default si no se configura |

### Paso 4: Aplicar Cambios
- Railway reinicia automáticamente el servicio después de guardar variables
- Verificar logs para confirmar que el servicio arrancó correctamente
- Buscar en logs: `[WHATSAPP] WhatsApp router montado`

---

## Validación Post-Configuración

### Verificar Variables Configuradas
```bash
# En Railway Dashboard ? Variables
# Verificar que todas las variables obligatorias estén presentes
```

### Verificar Logs
Buscar en Railway Logs:
```
[WHATSAPP] WhatsApp router montado (feature flag ACTIVO)
```

### Ejecutar Smoke Test
```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app \
INTERNAL_API_KEY=tu_internal_key \
npm run whatsapp:test
```

---

## Troubleshooting

### Error: "WhatsApp Cloud API no está configurado"
**Causa:** `WHATSAPP_ACCESS_TOKEN` o `WHATSAPP_PHONE_NUMBER_ID` no configurados o vacíos.

**Solución:**
1. Verificar que las variables estén en Railway Variables
2. Verificar que no estén vacías
3. Reiniciar servicio en Railway

---

### Error: "Webhook verification failed"
**Causa:** `WHATSAPP_WEBHOOK_VERIFY_TOKEN` no coincide con Meta Dashboard.

**Solución:**
1. Verificar valor en Meta Dashboard ? Webhook ? Verify Token
2. Verificar valor en Railway ? `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Deben ser exactamente iguales (case-sensitive)

---

### Error: "X-Internal-Secret header requerido"
**Causa:** `INTERNAL_API_KEY` no configurado o header faltante.

**Solución:**
1. Verificar que `INTERNAL_API_KEY` esté configurado en Railway
2. Verificar que se envía header `X-Internal-Secret` con el valor correcto

---

**Última actualización:** 2025-01-26  
**Estado:** ? Listo para producción
