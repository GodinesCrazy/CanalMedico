# 🔧 Corrección: Variables de Entorno Vacías

## ❌ Problema

El servidor estaba crasheando con errores de variables de entorno:
```
❌ Error de configuración de variables de entorno:
  - STRIPE_SECRET_KEY: String must contain at least 1 character(s)
  - STRIPE_PUBLISHABLE_KEY: String must contain at least 1 character(s)
  - AWS_ACCESS_KEY_ID: String must contain at least 1 character(s)
  - AWS_SECRET_ACCESS_KEY: String must contain at least 1 character(s)
  - AWS_S3_BUCKET: String must contain at least 1 character(s)
```

## 🔍 Causa

Cuando las variables de entorno están configuradas en Railway como **strings vacíos** (`""`), Zod las toma como valores válidos (no como `undefined`), por lo que **NO aplica los valores por defecto** definidos con `.default()`.

**Problema en Zod:**
- `.default()` solo se aplica cuando la variable es `undefined` (no existe)
- Si la variable existe pero es un string vacío `""`, Zod la toma como valor válido
- Por lo tanto, los valores por defecto NO se aplican

## ✅ Solución Aplicada

Agregado un **preprocesador** que convierte strings vacíos a `undefined` antes de validar con Zod:

```typescript
const preprocessEnv = () => {
  const env = { ...process.env };
  Object.keys(env).forEach((key) => {
    if (env[key] === '') {
      delete env[key]; // Convertir string vacío a undefined
    }
  });
  return env;
};
```

Ahora, cuando las variables están vacías en Railway:
1. El preprocesador las convierte a `undefined`
2. Zod las trata como no definidas
3. Zod aplica los valores por defecto configurados

## ✅ Variables con Valores por Defecto

Estas variables ahora usarán valores por defecto si están vacías o no están configuradas:

### Stripe
- `STRIPE_SECRET_KEY`: `sk_test_temporal_placeholder_minimo_32_caracteres_para_produccion`
- `STRIPE_PUBLISHABLE_KEY`: `pk_test_temporal_placeholder_minimo_32_caracteres_para_produccion`

### AWS
- `AWS_ACCESS_KEY_ID`: `AKIA_TEMPORAL_PLACEHOLDER_FOR_PRODUCTION`
- `AWS_SECRET_ACCESS_KEY`: `temporal_secret_key_placeholder_minimo_32_caracteres_para_produccion`
- `AWS_S3_BUCKET`: `canalmedico-files-temp`

## 🚀 Próximos Pasos

1. **Railway hará un deployment automático** con la corrección
2. **El servidor debería iniciar correctamente** ahora
3. **Las variables vacías usarán valores por defecto** temporalmente

## 📋 Notas Importantes

### Variables que AÚN deben configurarse

Estas variables NO tienen valores por defecto y DEBEN estar configuradas:

- `DATABASE_URL` - **CRÍTICA** - Debe ser `${{Postgres.DATABASE_URL}}`
- `API_URL` - Debe ser la URL del backend en Railway
- `JWT_SECRET` - Debe tener mínimo 32 caracteres
- `JWT_REFRESH_SECRET` - Debe tener mínimo 32 caracteres
- `FRONTEND_WEB_URL` - URL temporal o real del frontend
- `MOBILE_APP_URL` - URL temporal o real de la app móvil

### Variables que pueden estar vacías (temporalmente)

Estas variables ahora funcionarán con valores por defecto temporales:
- Stripe (usarán valores temporales)
- AWS (usarán valores temporales)

**Importante**: Las funcionalidades de Stripe y AWS NO funcionarán hasta que configures los valores reales.

## ✅ Verificación

Después del deployment:

1. **Revisa los logs del backend** en Railway
2. **Deberías ver**:
   ```
   🚀 Servidor corriendo en puerto XXXX
   ⚠️ STRIPE_SECRET_KEY está usando un valor temporal...
   ⚠️ Variables de AWS están usando valores temporales...
   ✅ Conexión a la base de datos establecida
   ```

3. **Prueba los endpoints**:
   - `GET /` → Debe responder con JSON
   - `GET /health` → Debe responder con `{"status":"ok"}`

---

**El servidor debería iniciar correctamente ahora, incluso si algunas variables están vacías en Railway.**

