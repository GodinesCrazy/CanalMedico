# Railway Build Fix - TypeScript Port Scope Error

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - FIX BUILD TYPESCRIPT

---

## 🎯 OBJETIVO

Resolver errores de TypeScript que impedían el build en Railway:
- `error TS2304: Cannot find name 'port'`
- `error TS6133: 'PORT'/'HOST' declared but never read`

---

## 🔍 CAUSA RAÍZ

1. **Variables fuera de scope:** El código usaba `primaryPort` y `fallbackPort` dentro de `startServer()`, pero había referencias a `port` que no existía.
2. **Constantes no usadas:** Se declararon `PORT` y `HOST` globalmente pero el código seguía usando `primaryPort` y `fallbackPort`.
3. **Lógica compleja innecesaria:** Se intentó implementar doble listen (puerto principal + fallback 8080), pero esto complicaba el código y causaba errores de scope.

---

## ✅ SOLUCIÓN APLICADA

### 1. Constantes Globales Únicas

**Ubicación:** `backend/src/server.ts` (líneas 26-27)

```typescript
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
```

**Características:**
- ✅ Declaradas globalmente (fuera de funciones)
- ✅ `PORT` usa `process.env.PORT` con fallback a 3000
- ✅ `HOST` fijo en `'0.0.0.0'` (requerido para Railway)

### 2. Eliminación de Variables Locales

**Antes:**
```typescript
const primaryPort = Number(process.env.PORT) || 8080;
const fallbackPort = 8080;
```

**Después:**
- ✅ Eliminadas `primaryPort` y `fallbackPort`
- ✅ Todo el código usa `PORT` y `HOST` (constantes globales)

### 3. Simplificación de Listen

**Antes:**
- Lógica compleja con doble listen (primary + fallback)
- Variables `fallbackServer`, `primaryListening`, `fallbackListening`
- Función `onServersReady()` anidada

**Después:**
```typescript
httpServer.listen(PORT, HOST, () => {
  // Logs inmediatos
  // Inicialización en background
  initializeBackend()...
});
```

**Características:**
- ✅ Listen directo en `PORT` y `HOST`
- ✅ Sin lógica de fallback (simplificado)
- ✅ Inicialización en background (no bloquea healthcheck)

### 4. Reemplazo de Todas las Referencias

**Cambios realizados:**
- `primaryPort` → `PORT` (todas las ocurrencias)
- `fallbackPort` → eliminado (no se usa)
- `'0.0.0.0'` → `HOST` (en listen)
- Logs actualizados para usar `PORT` y `HOST`

---

## 📋 CÓMO VALIDAR EN PRODUCCIÓN

### 1. Verificar Build en Railway

En **Railway Dashboard → Service (Backend) → Logs**, buscar:

```
> npm run build
> tsc && tsc-alias
```

**Debe terminar sin errores TypeScript.**

### 2. Verificar Logs de Boot

Buscar en Railway logs:

```
[BOOT] env PORT = 8080 (o el puerto asignado)
[BOOT] Using PORT = 8080
[BOOT] Using HOST = 0.0.0.0
[BOOT] Server listening on 0.0.0.0:8080
[BOOT] Health endpoints ready: /healthz /health
```

### 3. Verificar Healthcheck

En **Railway Dashboard → Service (Backend) → Settings → Healthcheck**:

- **Status:** Debe mostrar "Healthy" después del deploy
- **Path:** `/healthz` o `/health`

### 4. Verificar Endpoints Manualmente

```bash
curl https://canalmedico-production.up.railway.app/healthz
# Debe responder: 200 OK

curl https://canalmedico-production.up.railway.app/health
# Debe responder: 200 OK con JSON
```

---

## 🚨 TROUBLESHOOTING

### Problema: Build sigue fallando con TS2304

**Verificar:**
1. ¿Existen referencias a `port` (sin mayúscula) en el código?
2. ¿Hay variables `primaryPort` o `fallbackPort` sin reemplazar?

**Solución:**
```bash
cd backend
grep -r "primaryPort\|fallbackPort\|[^A-Z]port[^A-Z]" src/
# Debe retornar vacío o solo comentarios
```

### Problema: TS6133 (unused variables)

**Verificar:**
1. ¿`PORT` y `HOST` se usan en `httpServer.listen()`?
2. ¿Hay otras constantes declaradas pero no usadas?

**Solución:**
- Asegurar que `PORT` y `HOST` se usan en `listen()`
- Eliminar constantes no usadas o marcarlas con `// eslint-disable-next-line @typescript-eslint/no-unused-vars`

---

## ✅ CRITERIO DONE

El sistema se considera **LISTO** cuando:

- ✅ `npm run build` termina sin errores TypeScript
- ✅ Railway build pasa exitosamente
- ✅ Railway logs muestran: `[BOOT] Server listening on 0.0.0.0:${PORT}`
- ✅ Railway healthcheck pasa (status: Healthy)
- ✅ `curl /healthz` responde 200 OK
- ✅ `curl /health` responde 200 OK

---

## 📝 NOTAS IMPORTANTES

1. **Fallback simplificado:** Se eliminó la lógica de doble listen. Railway asigna `process.env.PORT` automáticamente, así que solo necesitamos escuchar en ese puerto.
2. **Constantes globales:** `PORT` y `HOST` están declaradas al inicio del archivo para evitar problemas de scope.
3. **Listen inmediato:** El servidor hace `listen()` antes de cualquier inicialización pesada (DB, migraciones).

---

## 📚 REFERENCIAS

- `backend/src/server.ts`: Constantes `PORT` y `HOST` (líneas 26-27)
- `backend/src/server.ts`: `httpServer.listen(PORT, HOST, ...)` (línea ~430)
- Railway logs: Build stage y runtime logs

---

**Última actualización:** 2024-11-23  
**Commit:** `fix(build): resolve server.ts port scope and unused vars`

