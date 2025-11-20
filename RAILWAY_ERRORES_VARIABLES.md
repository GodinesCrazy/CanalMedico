# 🔧 Corrección de Errores en Variables de Railway

## ❌ Errores Encontrados en las Variables

### 1. **PORT está vacío** ⚠️ CRÍTICO
- **Problema**: `PORT: <empty string>` en Railway
- **Solución**: 
  - **OPCIÓN 1 (Recomendada)**: Eliminar la variable PORT manualmente. Railway asigna `PORT` automáticamente durante el runtime.
  - **OPCIÓN 2**: Si Railway no asigna PORT automáticamente, agregar `PORT` = `3000` (o cualquier puerto válido)

### 2. **JWT_SECRET tiene el comando en lugar del valor** ⚠️ CRÍTICO
- **Problema**: `JWT_SECRET: openssl rand -base64 32`
- **Solución**: Debe contener el **valor generado**, no el comando. Ejecuta el comando y pega el resultado.

### 3. **Variables vacías** ⚠️ CRÍTICO
- `AWS_S3_BUCKET`: `<empty string>`
- `AWS_SECRET_ACCESS_KEY`: `<empty string>`
- `STRIPE_PUBLISHABLE_KEY`: `<empty string>`
- `STRIPE_SECRET_KEY`: `<empty string>`

### 4. **Variables faltantes** ⚠️ CRÍTICO
- `JWT_REFRESH_SECRET` - No está en la lista
- `FRONTEND_WEB_URL` - No está en la lista
- `MOBILE_APP_URL` - No está en la lista

### 5. **DATABASE_URL incompleta** ⚠️ CRÍTICO
- **Problema**: `DATABASE_URL: PostgreSQL:`
- **Solución**: Debe ser una URL completa de conexión. Usa "Reference Variable" de Railway: `${{Postgres.DATABASE_URL}}`

## ✅ Solución Paso a Paso

### Paso 1: Eliminar o Corregir PORT

1. Ve a **Variables** en Railway
2. Busca la variable `PORT`
3. **Si está vacía**, haz clic en los 3 puntos (⋮) y selecciona **"Delete"**
4. Railway asignará `PORT` automáticamente durante el runtime
5. **Si Railway no asigna PORT automáticamente**, agrega `PORT` = `3000`

### Paso 2: Generar JWT_SECRET Correctamente

**En tu terminal local (o en Railway terminal):**

```bash
# Genera el secret
openssl rand -base64 32
```

**Resultado ejemplo:**
```
xK9pL2mN8qR5tW3vY7zB4dF6gH1jK8nM2pQ5rT9uV2wX6yZ3aB7cD4eF8g
```

**Luego en Railway:**
1. Edita la variable `JWT_SECRET`
2. Pega el valor generado (sin comillas)
3. Guarda

### Paso 3: Agregar JWT_REFRESH_SECRET

1. En Railway **Variables**, haz clic en **"+ New Variable"**
2. Variable: `JWT_REFRESH_SECRET`
3. Valor: Ejecuta `openssl rand -base64 32` y pega el resultado
4. Guarda

### Paso 4: Corregir DATABASE_URL

1. En Railway **Variables**, busca `DATABASE_URL`
2. Edita la variable
3. Si tienes PostgreSQL en Railway:
   - Haz clic en **"Reference Variable"** o **"Connect Variable"**
   - Selecciona `${{Postgres.DATABASE_URL}}`
   - O escribe directamente: `${{Postgres.DATABASE_URL}}`
4. Si no tienes PostgreSQL:
   - Agrega el servicio PostgreSQL primero
   - Luego conecta la variable

### Paso 5: Completar Variables Vacías

#### AWS_S3_BUCKET
1. Edita `AWS_S3_BUCKET`
2. Valor: El nombre de tu bucket S3 (ejemplo: `canalmedico-files`)

#### AWS_SECRET_ACCESS_KEY
1. Edita `AWS_SECRET_ACCESS_KEY`
2. Valor: Tu AWS Secret Access Key (de AWS IAM)

#### STRIPE_SECRET_KEY
1. Edita `STRIPE_SECRET_KEY`
2. Valor: De Stripe Dashboard → Developers → API Keys → Secret key

#### STRIPE_PUBLISHABLE_KEY
1. Edita `STRIPE_PUBLISHABLE_KEY`
2. Valor: De Stripe Dashboard → Developers → API Keys → Publishable key

### Paso 6: Agregar Variables Faltantes

#### FRONTEND_WEB_URL
1. **"+ New Variable"**
2. Variable: `FRONTEND_WEB_URL`
3. Valor: Temporalmente usa `http://localhost:5173` (actualiza después)

#### MOBILE_APP_URL
1. **"+ New Variable"**
2. Variable: `MOBILE_APP_URL`
3. Valor: Temporalmente usa `http://localhost:8081` (actualiza después)

## 📋 Checklist de Variables Corregidas

Después de seguir los pasos, deberías tener:

- [ ] `PORT` - Eliminada (Railway la asigna) O configurada con `3000`
- [ ] `JWT_SECRET` - Valor generado (no el comando)
- [ ] `JWT_REFRESH_SECRET` - Valor generado (nueva variable)
- [ ] `DATABASE_URL` - URL completa o referencia `${{Postgres.DATABASE_URL}}`
- [ ] `AWS_S3_BUCKET` - Nombre del bucket
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS Secret Key
- [ ] `STRIPE_SECRET_KEY` - Stripe Secret Key
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe Publishable Key
- [ ] `FRONTEND_WEB_URL` - URL temporal o real (nueva variable)
- [ ] `MOBILE_APP_URL` - URL temporal o real (nueva variable)
- [ ] `API_URL` - URL del dominio de Railway
- [ ] `NODE_ENV` - `production`
- [ ] `AWS_ACCESS_KEY_ID` - AWS Access Key (ya está)
- [ ] `DATABASE_URL` - Correcta (corregida)

## 🚀 Después de Corregir

1. **Railway hará un deployment automático** después de guardar las variables
2. **Revisa los logs** para confirmar que el servidor inicia correctamente
3. **Verifica los endpoints**:
   - `GET /` → Debe responder con JSON
   - `GET /health` → Debe responder con `{"status":"ok"}`

## ⚠️ Notas Importantes

1. **PORT**: Railway asigna `PORT` automáticamente durante el runtime. Si tienes una variable `PORT` vacía, elimínala.

2. **JWT Secrets**: Estos valores NO deben cambiarse una vez configurados en producción.

3. **Valores temporales**: `FRONTEND_WEB_URL` y `MOBILE_APP_URL` pueden ser URLs temporales por ahora, pero actualízalas después de desplegar los frontends.

4. **DATABASE_URL**: Asegúrate de que sea una URL completa de PostgreSQL, no solo `PostgreSQL:`.

## 🆘 Si Aún Falla

1. **Revisa los logs** en Railway para ver qué variable falta o está incorrecta
2. **Verifica que todas las variables estén guardadas** (no solo escritas, sino guardadas)
3. **Espera 1-2 minutos** después de guardar las variables para que Railway las aplique

---

**Importante**: Después de corregir todas las variables, el servidor debería iniciar correctamente. Si aún hay problemas, comparte los logs de Railway para diagnosticar.

