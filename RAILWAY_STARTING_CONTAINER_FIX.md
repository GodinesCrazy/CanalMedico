# 🔧 Fix: Servidor Se Queda Pegado en "Starting Container"

## ❌ Problema

El servidor se queda pegado en "Starting Container" en Railway. Esto significa que el contenedor está iniciando pero el servidor crashea inmediatamente.

## 🔍 Causa Probable

El servidor está crasheando al validar las variables de entorno. Si alguna variable crítica falta o está mal configurada, el servidor hace `process.exit(1)` inmediatamente.

## ✅ Correcciones Aplicadas

### 1. Logging Mejorado
- Ahora **siempre muestra logs en consola** (no solo en desarrollo)
- Los errores serán visibles en Railway → Logs
- Mensajes más claros cuando faltan variables

### 2. Mensajes de Error Mejorados
- Ahora muestra **instrucciones claras** sobre qué variables configurar
- Indica **exactamente qué variables faltan**
- Proporciona **valores de ejemplo** para cada variable

## 🔴 Variables CRÍTICAS que DEBEN Estar Configuradas

El servidor **NO iniciará** si estas variables no están configuradas:

### 1. DATABASE_URL (CRÍTICA)
- **Variable**: `DATABASE_URL`
- **Valor**: `${{Postgres.DATABASE_URL}}` (usa Reference Variable)
- **O**: URL completa de PostgreSQL

### 2. API_URL (CRÍTICA)
- **Variable**: `API_URL`
- **Valor**: `https://canalmedico-production.up.railway.app`
- **Nota**: Usa la URL del dominio que generaste en Railway

### 3. JWT_SECRET (CRÍTICA)
- **Variable**: `JWT_SECRET`
- **Valor**: Mínimo 32 caracteres
- **Genera con**: `openssl rand -base64 32` (o PowerShell equivalente)
- **Ya generado**: `3Bgvf01WfYoxYxIwBjfeMOPs9A57X7vsZKZ/sILGoyk=`

### 4. JWT_REFRESH_SECRET (CRÍTICA)
- **Variable**: `JWT_REFRESH_SECRET`
- **Valor**: Mínimo 32 caracteres
- **Genera con**: `openssl rand -base64 32` (o PowerShell equivalente)
- **Ya generado**: `RL9gobZIvWH3hz1ogxkLWoR+OVDPOUDL27FKapwqXoA=`

## ✅ Variables con Valores por Defecto (Pueden estar vacías)

Estas variables tienen valores por defecto y funcionarán aunque estén vacías:

- `FRONTEND_WEB_URL` → `http://localhost:5173` (por defecto)
- `MOBILE_APP_URL` → `http://localhost:8081` (por defecto)
- `STRIPE_SECRET_KEY` → Valor temporal por defecto
- `STRIPE_PUBLISHABLE_KEY` → Valor temporal por defecto
- `AWS_ACCESS_KEY_ID` → Valor temporal por defecto
- `AWS_SECRET_ACCESS_KEY` → Valor temporal por defecto
- `AWS_S3_BUCKET` → Valor temporal por defecto

## 📋 Pasos para Resolver

### Paso 1: Verificar Logs en Railway

Después del próximo deployment, ve a Railway → Servicio `CanalMedico` → "Logs"

Ahora deberías ver **mensajes más claros** como:
```
❌ Error de configuración de variables de entorno:
  - DATABASE_URL: Required
  - API_URL: Required
  ...

📋 Variables requeridas que deben configurarse en Railway:
  1. DATABASE_URL → ${{Postgres.DATABASE_URL}}
  2. API_URL → URL del backend
  ...
```

### Paso 2: Configurar Variables Faltantes

En Railway → Servicio `CanalMedico` → Variables:

1. **DATABASE_URL**
   - "+ New Variable" o edita si existe
   - Nombre: `DATABASE_URL`
   - Valor: Haz clic en "Reference Variable" → Selecciona `${{Postgres.DATABASE_URL}}`
   - O escribe: `${{Postgres.DATABASE_URL}}`

2. **API_URL**
   - "+ New Variable" o edita si existe
   - Nombre: `API_URL`
   - Valor: `https://canalmedico-production.up.railway.app` (tu URL del backend)

3. **JWT_SECRET**
   - Edita la variable existente
   - Valor: `3Bgvf01WfYoxYxIwBjfeMOPs9A57X7vsZKZ/sILGoyk=`

4. **JWT_REFRESH_SECRET**
   - "+ New Variable"
   - Nombre: `JWT_REFRESH_SECRET`
   - Valor: `RL9gobZIvWH3hz1ogxkLWoR+OVDPOUDL27FKapwqXoA=`

### Paso 3: Verificar el Deployment

1. **Guarda todas las variables**
2. Railway hará un deployment automático
3. Ve a "Logs" del servicio `CanalMedico`
4. Deberías ver:
   ```
   🚀 Servidor corriendo en puerto XXXX
   ✅ Conexión a la base de datos establecida
   ```

## ✅ Checklist de Variables Críticas

- [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- [ ] `API_URL` = `https://canalmedico-production.up.railway.app`
- [ ] `JWT_SECRET` = Valor generado (mínimo 32 caracteres)
- [ ] `JWT_REFRESH_SECRET` = Valor generado (mínimo 32 caracteres)

## 🆘 Si Aún Se Queda Pegado

Después de configurar las variables:

1. **Espera 1-2 minutos** para que Railway haga el deployment
2. **Revisa los logs** en Railway → Servicio `CanalMedico` → "Logs"
3. **Busca errores** específicos en los logs
4. **Comparte los logs** para diagnosticar el problema exacto

## 📝 Notas

- Los logs ahora siempre se muestran en consola, incluso en producción
- Los mensajes de error son más claros y proporcionan instrucciones
- El servidor NO iniciará hasta que las 4 variables críticas estén configuradas

---

**Siguiente paso**: Configura las 4 variables críticas en Railway y revisa los logs para ver mensajes más claros sobre qué falta.

