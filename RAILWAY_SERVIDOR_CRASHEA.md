# 🔧 Solución: Servidor Crashea en Railway

## ❌ Problema

El servidor está crasheando al iniciar en Railway, mostrando error "Not Found" en `https://canalmedico-production.up.railway.app/`

## 🔍 Causas Identificadas

1. **Variables de entorno faltantes**: El servidor valida TODAS las variables al inicio y si falta alguna, hace `process.exit(1)`
2. **Conexión a base de datos bloqueante**: El servidor intentaba conectar a la DB antes de iniciar HTTP, bloqueando el inicio
3. **Puerto incorrecto**: No estaba usando `process.env.PORT` de Railway correctamente
4. **Falta endpoint raíz**: No había un endpoint `/` que responda

## ✅ Correcciones Aplicadas

### 1. Servidor inicia HTTP primero
- El servidor HTTP ahora inicia **antes** de intentar conectar a la base de datos
- Esto permite que Railway haga el healthcheck incluso si la DB no está disponible
- La conexión a la DB se intenta después, sin bloquear el inicio

### 2. Uso correcto del puerto de Railway
- Ahora usa `process.env.PORT` (asignado por Railway) como prioridad
- Si no está disponible, usa `env.PORT` como fallback
- Convierte correctamente el string a número

### 3. Endpoint raíz agregado
- Agregado endpoint `/` que responde con información básica del API
- Esto permite verificar que el servidor está corriendo

### 4. Manejo de errores mejorado
- Si la conexión a la DB falla, el servidor continúa ejecutándose
- Solo muestra una advertencia en los logs

## ⚠️ Problema Principal: Variables de Entorno

**El servidor NO iniciará si faltan variables de entorno requeridas.**

El archivo `backend/src/config/env.ts` valida TODAS las variables al inicio y hace `process.exit(1)` si falta alguna.

### Variables CRÍTICAS que DEBEN estar configuradas:

1. `DATABASE_URL` - De PostgreSQL en Railway
2. `API_URL` - URL del dominio generado
3. `JWT_SECRET` - Mínimo 32 caracteres
4. `JWT_REFRESH_SECRET` - Mínimo 32 caracteres
5. `STRIPE_SECRET_KEY` - De Stripe Dashboard
6. `STRIPE_PUBLISHABLE_KEY` - De Stripe Dashboard
7. `AWS_ACCESS_KEY_ID` - De AWS IAM
8. `AWS_SECRET_ACCESS_KEY` - De AWS IAM
9. `AWS_S3_BUCKET` - Nombre del bucket S3
10. `FRONTEND_WEB_URL` - URL del frontend (puede ser temporal)
11. `MOBILE_APP_URL` - URL de la app móvil (puede ser temporal)

## 📋 Pasos para Resolver

### Paso 1: Verificar Logs en Railway

1. Ve a Railway → Tu servicio backend
2. Haz clic en la pestaña **"Logs"**
3. Busca errores que digan:
   - `❌ Error de configuración de variables de entorno:`
   - Lista de variables faltantes

### Paso 2: Configurar Variables Faltantes

Sigue la guía en `RAILWAY_ENV_VARIABLES.md` para configurar todas las variables requeridas.

### Paso 3: Verificar que el Servidor Inicie

Después de configurar las variables:

1. Railway debería hacer un deployment automático
2. En los logs deberías ver:
   - `🚀 Servidor corriendo en puerto XXXX`
   - `✅ Conexión a la base de datos establecida` (si la DB está configurada)

### Paso 4: Verificar Endpoints

1. **Endpoint raíz**: `https://canalmedico-production.up.railway.app/`
   - Debería responder con JSON con información del API

2. **Healthcheck**: `https://canalmedico-production.up.railway.app/health`
   - Debería responder con `{"status":"ok",...}`

## 🔍 Verificación

### Si el servidor inicia correctamente:

✅ Deberías ver en los logs:
```
🚀 Servidor corriendo en puerto XXXX
📚 Documentación API disponible en https://...
🌍 Ambiente: production
✅ Conexión a la base de datos establecida
```

✅ Los endpoints deberían responder:
- `GET /` → JSON con información del API
- `GET /health` → `{"status":"ok",...}`

### Si el servidor aún crashea:

❌ Revisa los logs para ver:
- Qué variables faltan
- Si hay errores de conexión a la base de datos
- Si hay errores de compilación

## 🚀 Próximos Pasos

1. **Configura TODAS las variables de entorno** (ver `RAILWAY_ENV_VARIABLES.md`)
2. **Espera el deployment automático** de Railway
3. **Verifica los logs** para confirmar que el servidor inició
4. **Prueba los endpoints** `/` y `/health`

## 📝 Notas

- El servidor ahora es más resiliente y puede iniciar incluso si la DB no está disponible inicialmente
- Sin embargo, **DEBE tener todas las variables de entorno configuradas** para iniciar
- Railway asigna automáticamente el puerto en `process.env.PORT`, el servidor ahora lo usa correctamente

---

**Importante**: Si después de configurar todas las variables el servidor aún crashea, comparte los logs de Railway para diagnosticar el problema específico.

