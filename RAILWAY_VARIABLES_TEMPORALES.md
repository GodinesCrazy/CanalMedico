# 🔧 Variables Temporales para Iniciar el Servidor

## ✅ Solución Aplicada

He configurado **valores por defecto temporales** para las variables de Stripe y AWS para que el servidor pueda iniciar sin errores. Esto permite que el healthcheck pase mientras configuras las variables reales.

## ⚠️ Variables con Valores Temporales

Las siguientes variables tienen valores por defecto temporales:

### Stripe
- `STRIPE_SECRET_KEY`: `sk_test_temporal_placeholder_minimo_32_caracteres_para_produccion`
- `STRIPE_PUBLISHABLE_KEY`: `pk_test_temporal_placeholder_minimo_32_caracteres_para_produccion`

### AWS
- `AWS_ACCESS_KEY_ID`: `AKIA_TEMPORAL_PLACEHOLDER_FOR_PRODUCTION`
- `AWS_SECRET_ACCESS_KEY`: `temporal_secret_key_placeholder_minimo_32_caracteres_para_produccion`
- `AWS_S3_BUCKET`: `canalmedico-files-temp`

## 🔔 Advertencias en los Logs

Cuando el servidor inicia con valores temporales, verás advertencias en los logs:

```
⚠️ STRIPE_SECRET_KEY está usando un valor temporal. Configura tu clave real de Stripe.
⚠️ Variables de AWS están usando valores temporales. Configura tus credenciales reales de AWS.
```

## ✅ Qué Funciona Ahora

Con los valores temporales:
- ✅ El servidor puede iniciar
- ✅ El healthcheck en `/health` funciona
- ✅ El endpoint raíz `/` funciona
- ✅ La documentación API `/api-docs` funciona
- ⚠️ **Las funcionalidades de Stripe NO funcionarán** (fallarán cuando se usen)
- ⚠️ **Las funcionalidades de AWS NO funcionarán** (fallarán cuando se usen)

## 📋 Variables que AÚN DEBES Configurar

### Variables CRÍTICAS que aún faltan:

1. **JWT_SECRET** - Ya deberías haberlo configurado
2. **JWT_REFRESH_SECRET** - Debes agregarlo
3. **FRONTEND_WEB_URL** - Temporalmente: `http://localhost:5173`
4. **MOBILE_APP_URL** - Temporalmente: `http://localhost:8081`

### Variables TEMPORALES (funcionan con defaults pero configura las reales):

1. **STRIPE_SECRET_KEY** - Configura cuando tengas tu cuenta de Stripe
2. **STRIPE_PUBLISHABLE_KEY** - Configura cuando tengas tu cuenta de Stripe
3. **AWS_ACCESS_KEY_ID** - Configura cuando tengas tu cuenta de AWS
4. **AWS_SECRET_ACCESS_KEY** - Configura cuando tengas tu cuenta de AWS
5. **AWS_S3_BUCKET** - Configura cuando crees tu bucket S3

### Variable que DEBES Corregir:

1. **DATABASE_URL** - Debe ser `${{Postgres.DATABASE_URL}}` o la URL completa

## 🚀 Próximos Pasos

### Paso 1: Verificar que el Servidor Inicia

1. Espera que Railway haga el deployment automático
2. Ve a los logs del servicio
3. Deberías ver:
   ```
   🚀 Servidor corriendo en puerto XXXX
   ⚠️ STRIPE_SECRET_KEY está usando un valor temporal...
   ⚠️ Variables de AWS están usando valores temporales...
   ```

### Paso 2: Configurar Variables Faltantes

Agrega las variables que aún faltan en Railway:

1. **JWT_REFRESH_SECRET** - Usa el segundo valor generado
2. **FRONTEND_WEB_URL** - `http://localhost:5173` (temporal)
3. **MOBILE_APP_URL** - `http://localhost:8081` (temporal)

### Paso 3: Verificar Endpoints

Prueba estos endpoints:

- `GET /` → Debería responder con JSON
- `GET /health` → Debería responder con `{"status":"ok"}`

### Paso 4: Configurar Variables Reales (Después)

Cuando estés listo, configura las variables reales de Stripe y AWS:

1. **Stripe**: Crea una cuenta en Stripe y obtén las API keys
2. **AWS**: Crea una cuenta en AWS, crea un bucket S3, y genera las access keys
3. Actualiza las variables en Railway con los valores reales

## ⚠️ Importante

- **Los valores temporales solo permiten que el servidor inicie**
- **NO funcionarán para pagos reales o subida de archivos**
- **Configura las variables reales antes de usar la plataforma en producción**

## 📝 Notas

- El servidor ahora es más resiliente y puede iniciar con variables temporales
- Las advertencias en los logs te indicarán qué variables necesitas configurar
- Una vez configuradas las variables reales, las advertencias desaparecerán

---

**El servidor debería iniciar correctamente ahora. Verifica los logs en Railway para confirmar que el healthcheck pasa.**

