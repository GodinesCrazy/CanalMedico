# 🔧 Corrección: FRONTEND_WEB_URL y MOBILE_APP_URL

## ❌ Problema

El servidor estaba crasheando porque `FRONTEND_WEB_URL` y `MOBILE_APP_URL` son requeridas y deben ser URLs válidas. Si no están configuradas o tienen valores inválidos, el servidor no puede iniciar.

## ✅ Solución Aplicada

Agregados valores por defecto temporales para estas variables:

- `FRONTEND_WEB_URL`: `http://localhost:5173` (por defecto)
- `MOBILE_APP_URL`: `http://localhost:8081` (por defecto)

Ahora el servidor puede iniciar incluso si estas variables no están configuradas en Railway.

## 📋 Variables que AÚN Debes Configurar

Estas variables NO tienen valores por defecto y DEBEN estar configuradas:

1. **`DATABASE_URL`** → `${{Postgres.DATABASE_URL}}` (CRÍTICA)
2. **`API_URL`** → `https://canalmedico-production.up.railway.app` (CRÍTICA)
3. **`JWT_SECRET`** → Valor generado (mínimo 32 caracteres) (CRÍTICA)
4. **`JWT_REFRESH_SECRET`** → Valor generado (mínimo 32 caracteres) (CRÍTICA)

## ✅ Variables con Valores por Defecto (Pueden estar vacías)

Estas variables ahora tienen valores por defecto y funcionarán aunque estén vacías:

- `FRONTEND_WEB_URL` → `http://localhost:5173` (temporal)
- `MOBILE_APP_URL` → `http://localhost:8081` (temporal)
- `STRIPE_SECRET_KEY` → Valor temporal
- `STRIPE_PUBLISHABLE_KEY` → Valor temporal
- `AWS_ACCESS_KEY_ID` → Valor temporal
- `AWS_SECRET_ACCESS_KEY` → Valor temporal
- `AWS_S3_BUCKET` → Valor temporal

## 🚀 Después del Deployment

Después de que Railway haga el deployment automático:

1. **El servidor debería iniciar correctamente**
2. **Revisa los logs** para confirmar:
   ```
   🚀 Servidor corriendo en puerto XXXX
   ✅ Conexión a la base de datos establecida
   ```

3. **Prueba los endpoints**:
   - `GET /` → Debe responder con JSON
   - `GET /health` → Debe responder con `{"status":"ok"}`

## ⚠️ Importante

- Los valores por defecto son **temporales** para permitir que el servidor inicie
- **Actualiza estas URLs** cuando despliegues el frontend web y la app móvil
- Las funcionalidades de Stripe y AWS **NO funcionarán** hasta que configures los valores reales

---

**El servidor debería iniciar correctamente ahora, incluso si `FRONTEND_WEB_URL` y `MOBILE_APP_URL` no están configuradas.**

