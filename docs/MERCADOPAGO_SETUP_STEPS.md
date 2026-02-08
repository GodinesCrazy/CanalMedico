# MercadoPago Setup Steps - CanalMedico

**Fecha:** 2025-01-26  
**Versión:** 1.0.1  
**Objetivo:** Guía paso a paso para configurar MercadoPago en producción

**Referencia:** Basado en `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.11)

---

## Pre-Requisitos

1. Cuenta de MercadoPago (Chile): https://www.mercadopago.cl
2. Cuenta verificada (completa tu perfil y verifica identidad)

---

## Paso 1: Crear Aplicación en MercadoPago

### 1.1 Acceder a Developers

1. Abrir: https://www.mercadopago.cl/developers/panel
2. Login con tu cuenta de MercadoPago

### 1.2 Crear Nueva Aplicación

1. Click en **"Tus integraciones"** o **"Aplicaciones"**
2. Click en **"Crear aplicación"**

### 1.3 Configurar Aplicación

1. **Nombre:** `CanalMedico Production`
2. **Descripción:** `Sistema de consultas médicas - Producción`
3. **Plataforma:** Seleccionar **"Web"**
4. Click en **"Crear"**

### 1.4 Anotar Credentials

Después de crear, verás:
- **Application ID** (ejemplo: `1234567890123456`)
- **Public Key** (opcional, para frontend)
- **Access Token** (?? **CRÍTICO - Guardar inmediatamente**)

---

## Paso 2: Obtener Access Token de Producción

### 2.1 Ir a Credentials

1. En la aplicación creada, ir a: **"Credenciales"**
2. Seleccionar ambiente: **"Producción"** (NO "Test")

### 2.2 Copiar Access Token

1. Buscar **"Access Token"** o **"Token de acceso"**
2. Click en **"Ver credenciales"** (puede requerir verificación 2FA)
3. Copiar el **Access Token** (formato: `APP_USR-1234567890123456-123456-abcd1234567890abcdef1234567890ABCD-123456789`)

### 2.3 Guardar Access Token

- ?? **GUARDAR ESTE VALOR:** Usar en variable `MERCADOPAGO_ACCESS_TOKEN`
- ?? **NO compartir:** Este token permite procesar pagos reales

---

## Paso 3: Configurar Webhook

### 3.1 Ir a Webhooks

1. En la aplicación, ir a: **"Webhooks"** o **"Notificaciones"**
2. Click en **"Configurar"** o **"Agregar webhook"**

### 3.2 Agregar URL del Webhook

1. **URL del webhook:**
   ```
   https://canalmedico-production.up.railway.app/api/payments/webhook
   ```

2. **Eventos a escuchar:**
   - ? **`payment`** (Pagos)
   - ? **`payment.created`** (Pago creado)
   - ? **`payment.updated`** (Pago actualizado)
   - Opcional: **`merchant_order`** (Órdenes de comercio)

3. Click en **"Guardar"** o **"Crear webhook"**

### 3.3 Obtener Webhook Secret (Opcional pero Recomendado)

1. Después de crear el webhook, verás **"Secret"** o **"Clave secreta"**
2. Copiar el secret
3. ?? **GUARDAR ESTE VALOR:** Usar en variable `MERCADOPAGO_WEBHOOK_SECRET` (opcional)

---

## Paso 4: Configurar Variables en Railway

### 4.1 Agregar Variables al Backend

Ir a **Railway Dashboard ? Service "Backend" ? Variables** y agregar:

| Variable | Valor |
|----------|-------|
| `MERCADOPAGO_ACCESS_TOKEN` | `<token del paso 2.2>` |
| `MERCADOPAGO_WEBHOOK_SECRET` | `<secret del paso 3.3>` (opcional) |

### 4.2 Reiniciar Servicio

1. Railway Dashboard ? Service ? Settings
2. Click en **"Restart"**
3. Verificar logs: debe mostrar validación exitosa

---

## Paso 5: Probar con Sandbox (Opcional)

### 5.1 Credenciales de Prueba

1. En la aplicación, cambiar a ambiente: **"Test"**
2. Copiar **Access Token de prueba** (formato: `TEST-...`)
3. Usar temporalmente en desarrollo

### 5.2 Tarjetas de Prueba

MercadoPago proporciona tarjetas de prueba:
- **Aprobada:** `5031 7557 3453 0604` (CVV: 123, Nombre: APRO)
- **Rechazada:** `5031 4332 1540 6351` (CVV: 123, Nombre: OTHE)

### 5.3 Probar Flujo Completo

1. Crear preference con token de prueba
2. Completar pago con tarjeta de prueba
3. Verificar que webhook se recibe correctamente
4. Verificar que `Payment.status = 'PAID'` en BD

---

## Paso 6: Probar en Producción (Real)

### 6.1 Usar Token de Producción

**?? IMPORTANTE:** Solo después de probar en sandbox, cambiar a token de producción.

### 6.2 Hacer Pago de Prueba Real (Pequeño)

1. Crear consulta de prueba (monto mínimo: $1.000 CLP)
2. Completar pago con tarjeta real
3. **Verificar que se recibe correctamente**

### 6.3 Verificar en Base de Datos

```sql
SELECT * FROM payments 
WHERE "mercadopagoPaymentId" IS NOT NULL 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**Expected:**
- `status = 'PAID'`
- `mercadopagoPaymentId` tiene valor
- `paidAt` tiene timestamp

---

## Resumen de Variables Configuradas

| Variable | Valor | Dónde Obtenerlo |
|----------|-------|-----------------|
| `MERCADOPAGO_ACCESS_TOKEN` | `<token>` | MercadoPago Developers ? App ? Credenciales ? Producción ? Access Token |
| `MERCADOPAGO_WEBHOOK_SECRET` | `<secret>` (opcional) | MercadoPago Developers ? App ? Webhooks ? Secret |

---

## Troubleshooting

### Webhook No Se Recibe

- ? Verificar que la URL del webhook es correcta (HTTPS, pública)
- ? Verificar que el backend está corriendo
- ? Verificar que MercadoPago puede alcanzar la URL (no firewall)
- ? Revisar logs del backend para errores

### Pago No Se Actualiza

- ? Verificar que webhook está configurado en MercadoPago
- ? Verificar que webhook está suscrito a eventos `payment`
- ? Verificar `MERCADOPAGO_ACCESS_TOKEN` válido
- ? Verificar signature del webhook (si se usa `MERCADOPAGO_WEBHOOK_SECRET`)

### Preference No Se Crea

- ? Verificar `MERCADOPAGO_ACCESS_TOKEN` válido (no expirado)
- ? Verificar que el token es de PRODUCCIÓN (no test)
- ? Revisar logs para errores de API de MercadoPago

---

## Referencias

- MercadoPago API Docs: https://www.mercadopago.cl/developers/es/docs
- `docs/DOCUMENTACION_TOTAL_MODELO.md` (Sección 4.11)
- `docs/MONEY_FLOW_TEST.md`

---

**Generado:** 2025-01-26  
**Última actualización:** 2025-01-26  
**Estado:** ? **LISTO PARA CONFIGURAR**
