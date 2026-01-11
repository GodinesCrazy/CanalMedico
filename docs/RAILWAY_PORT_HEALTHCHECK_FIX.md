# Railway Port & Healthcheck Fix

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - FIX DEFINITIVO

---

## 🎯 OBJETIVO

Asegurar que el backend escuche SIEMPRE en `process.env.PORT` (asignado por Railway) y que el healthcheck funcione automáticamente sin depender de configuraciones manuales.

---

## 🔍 CAUSA RAÍZ

Railway asigna puertos dinámicamente a través de la variable de entorno `PORT`. El problema ocurría cuando:

1. **Puerto hardcodeado**: Algunos archivos podían tener puertos fijos (8080, 3000)
2. **Railway networking**: Railway mostraba puerto 8080 como "exposed" pero el backend no lo respetaba
3. **Healthcheck desalineado**: Railway hacía healthcheck en un puerto diferente al que el backend escuchaba

---

## ✅ CAMBIOS APLICADOS

### 1. `backend/src/server.ts`

**ANTES:**
```typescript
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : (env.PORT || 3000);
```

**DESPUÉS:**
```typescript
// CRÍTICO RAILWAY: PORT debe venir SIEMPRE de process.env.PORT (Railway lo asigna dinámicamente)
// NO usar env.PORT ni valores hardcodeados - Railway asigna el puerto automáticamente
const port = Number(process.env.PORT) || 3000;
```

**Logs agregados:**
```typescript
console.log(`[BOOT] PORT env = ${process.env.PORT || 'not set (using 3000)'}`);
console.log(`[BOOT] Listening on 0.0.0.0:${port}`);
```

### 2. Script de Verificación

**Creado:** `backend/scripts/verify-railway-port.ts`

- Hace fetch a `/health` desde `API_URL`
- Valida que responda 200 OK
- Exit code 0 si pasa, 1 si falla

**Script npm:**
```json
"verify:railway": "tsx scripts/verify-railway-port.ts"
```

### 3. Configuración Railway

**`backend/railway.json`:**
- ✅ `healthcheckPath: "/healthz"` (ultra mínimo, responde siempre)
- ✅ `startCommand: "node dist/server.js"` (sin puerto hardcodeado)
- ✅ No especifica puerto (Railway lo asigna automáticamente)

**`backend/nixpacks.toml`:**
- ✅ `[start] cmd = "node dist/server.js"` (sin puerto hardcodeado)

**`backend/package.json`:**
- ✅ `"start": "node dist/server.js"` (sin puerto hardcodeado)

---

## 📋 CÓMO VALIDAR EN RAILWAY

### 1. Verificar Logs Railway

En **Railway Dashboard → Service (Backend) → Logs**, buscar:

```
[BOOT] PORT env = <puerto-asignado-por-railway>
[BOOT] Listening on 0.0.0.0:<puerto>
[BOOT] Health endpoints ready: /healthz /health
```

**Ejemplo esperado:**
```
[BOOT] PORT env = 8080
[BOOT] Listening on 0.0.0.0:8080
[BOOT] Health endpoints ready: /healthz /health
```

### 2. Verificar Networking

En **Railway Dashboard → Service (Backend) → Settings → Networking**:

- **Public Networking**: Debe mostrar el puerto asignado por Railway (ej: 8080)
- **Healthcheck**: Debe estar configurado en `/healthz` o `/health`
- **Status**: Debe mostrar "Healthy"

### 3. Verificar Healthcheck Manualmente

```bash
# Desde local (reemplazar URL con la de Railway)
curl https://canalmedico-production.up.railway.app/healthz
# Debe responder: {"ok":true,"status":"ok"}

curl https://canalmedico-production.up.railway.app/health
# Debe responder: JSON con status, version, commit, etc.
```

### 4. Ejecutar Script de Verificación

```bash
cd backend
API_URL=https://canalmedico-production.up.railway.app npm run verify:railway
```

**Salida esperada:**
```
✅ VERIFICATION PASSED
✅ /health responde 200 OK
✅ Railway healthcheck debería pasar
```

---

## 🚨 TROUBLESHOOTING

### Problema: Healthcheck sigue fallando

**Verificar:**
1. Railway logs: ¿Aparece `[BOOT] PORT env = ...`?
2. Railway logs: ¿Aparece `[BOOT] Listening on 0.0.0.0:...`?
3. Railway logs: ¿Hay errores de `process.exit(1)` de `env.ts`?
4. Railway Dashboard: Root Directory = `backend`
5. Railway Dashboard: Start Command = `node dist/server.js` (o vacío)
6. Railway Dashboard: Healthcheck Path = `/healthz` o `/health`

**Solución:**
- Si `env.ts` falla, el proceso muere antes de `listen()`
- Verificar variables de entorno en Railway Dashboard
- Ver logs Railway para ver qué variable falta

### Problema: Puerto incorrecto en Railway Networking

**Causa:**
- Railway asigna puertos dinámicamente
- El puerto mostrado en Networking es el asignado por Railway
- El backend DEBE escuchar en ese puerto (via `process.env.PORT`)

**Verificar:**
- Railway logs: `[BOOT] PORT env = ...` debe coincidir con Networking
- Si no coincide, Railway no está pasando `PORT` correctamente

**Solución:**
- Verificar que Railway esté configurado para pasar `PORT` automáticamente
- No hardcodear puertos en ningún lugar del código

---

## ✅ CRITERIO DONE

El sistema se considera **LISTO** cuando:

- ✅ Railway logs muestran: `[BOOT] PORT env = <puerto>`
- ✅ Railway logs muestran: `[BOOT] Listening on 0.0.0.0:<puerto>`
- ✅ Railway logs muestran: `[BOOT] Health endpoints ready: /healthz /health`
- ✅ Railway healthcheck pasa (status: Healthy)
- ✅ `curl https://<railway-url>/healthz` responde 200 OK
- ✅ `npm run verify:railway` pasa (exit code 0)
- ✅ Railway Networking muestra el puerto asignado (coincide con logs)

---

## 📝 NOTAS IMPORTANTES

1. **NO hardcodear puertos**: El backend DEBE usar siempre `process.env.PORT`
2. **Railway asigna puertos**: Railway asigna puertos dinámicamente, no los especifiques
3. **Healthcheck dual**: `/healthz` (ultra mínimo) y `/health` (completo) están disponibles
4. **Logs obligatorios**: Los logs `[BOOT] PORT env = ...` son críticos para debugging

---

**Última actualización:** 2024-11-23  
**Commit:** `a3359bf` - `fix(railway): make healthcheck always pass and align port/path`

