# FASE 3 — ANÁLISIS HEALTHCHECK FAIL

**Fecha:** 2024-11-23  
**Objetivo:** Analizar y resolver healthcheck fail con estrategia escalonada

---

## 📊 ESTADO ACTUAL DEL CÓDIGO

### ✅ NIVEL 1: LISTEN INMEDIATO - IMPLEMENTADO

**Estado:** ✅ **CORRECTO**

- `listen()` se ejecuta ANTES de migraciones/DB (línea 464)
- `listen()` se ejecuta ANTES de `initializeBackend()` (línea 464)
- `/healthz` está montado ANTES de imports pesados (línea 35)
- `/health` está montado DESPUÉS pero ANTES de middlewares pesados (línea 139)
- `/health` responde 200 SIEMPRE (incluso en modo degraded)

**Evidencia:**
```typescript
// Línea 464: listen() se ejecuta inmediatamente
httpServer.listen(PORT, HOST, () => {
  // Logs inmediatos
  console.log(`[BOOT] Server listening on ${HOST}:${PORT}`);
  
  // initializeBackend() se ejecuta DESPUÉS en background
  initializeBackend()
    .then(...)
    .catch(...)
});
```

### ✅ NIVEL 2: PORT Y TARGET PORT - IMPLEMENTADO

**Estado:** ✅ **CORRECTO**

- Server escucha en `process.env.PORT` (línea 26, 432)
- Fallback a 8080 si PORT no está definido (línea 26)
- Escucha en `0.0.0.0` (línea 27, 432)
- `railway.json` startCommand: `node dist/server.js` ✅
- `nixpacks.toml` start cmd: `node dist/server.js` ✅
- No hay conflictos en Dockerfile (no se usa, Railway usa Nixpacks)

**Evidencia:**
```typescript
// Línea 26-27
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

// Línea 432
httpServer.listen(PORT, HOST, () => { ... });
```

### ⚠️ NIVEL 3: BLOQUEO POR HOSTNAME - REQUIERE VERIFICACIÓN

**Estado:** ⚠️ **REQUIERE VERIFICACIÓN**

Railway healthcheck origina desde hostname: `healthcheck.railway.app`

**Configuración actual:**
- `helmet()` se aplica (línea 251) - puede bloquear por defecto
- `cors()` se aplica (línea 253) - solo permite origins específicos
- `trust proxy` está configurado (línea 249) - `app.set('trust proxy', 1)`

**Análisis:**
- CORS solo aplica a requests con `Origin` header
- Healthcheck de Railway probablemente NO envía `Origin` header
- Helmet puede tener configuraciones que bloqueen
- **ACCION REQUERIDA:** Verificar que `/healthz` y `/health` NO estén bloqueados por helmet/cors

**Solución recomendada:**
- `/healthz` y `/health` están montados ANTES de helmet/cors (línea 35, 139)
- Express aplica middlewares en orden de montaje
- **Conclusión:** `/healthz` y `/health` NO deberían estar bloqueados por helmet/cors
- **Pero:** Si hay algún middleware global que se aplique antes, podría bloquear

### ⚠️ NIVEL 4: ENV EXIT CRASH - REQUIERE VERIFICACIÓN

**Estado:** ⚠️ **REQUIERE VERIFICACIÓN**

Si `env.ts` hace `process.exit(1)` por placeholders, el servidor crashea ANTES de `listen()`

**Configuración actual:**
- `env.ts` se importa en línea 54 (DESPUÉS de montar `/healthz` en línea 35)
- Si `env.ts` hace `process.exit(1)`, el proceso muere ANTES de `listen()`
- `/healthz` está montado ANTES de importar `env.ts` (línea 35)

**Análisis:**
- Si `env.ts` falla, el proceso termina ANTES de que el servidor pueda escuchar
- `/healthz` está montado, pero el servidor nunca hace `listen()`
- **PROBLEMA POTENCIAL:** Si hay variables de entorno faltantes en producción, el servidor crashea antes de escuchar

**Solución recomendada:**
- En producción, `env.ts` NO debe hacer `process.exit(1)` si faltan variables opcionales
- Solo debe hacer `process.exit(1)` si faltan variables CRÍTICAS (DATABASE_URL, JWT_SECRET, etc.)
- Verificar que `env.ts` maneje variables opcionales correctamente

---

## 🔍 PROBLEMAS IDENTIFICADOS Y CORREGIDOS

### 1. Endpoint /healthz Duplicado ✅ CORREGIDO

**Problema:** Había dos definiciones de `/healthz` (línea 35 y línea 130)

**Solución:** Eliminado el duplicado en línea 130

**Commit:** Pendiente (próximo commit)

---

## 📋 CHECKLIST NIVELES FASE 3

| Nivel | Requisito | Estado | Notas |
|-------|-----------|--------|-------|
| NIVEL 1 | Listen inmediato | ✅ OK | listen() antes de migraciones/DB |
| NIVEL 1 | /health montado antes | ✅ OK | /healthz y /health montados correctamente |
| NIVEL 1 | /health responde 200 siempre | ✅ OK | Responde 200 incluso en modo degraded |
| NIVEL 2 | Escucha en process.env.PORT | ✅ OK | PORT = Number(process.env.PORT) \|\| 8080 |
| NIVEL 2 | Escucha en 0.0.0.0 | ✅ OK | HOST = '0.0.0.0' |
| NIVEL 2 | Start command correcto | ✅ OK | node dist/server.js en todos lados |
| NIVEL 3 | healthcheck.railway.app permitido | ⚠️ VERIFICAR | Endpoints montados antes de helmet/cors |
| NIVEL 4 | No process.exit antes de listen | ⚠️ VERIFICAR | env.ts puede hacer exit si faltan vars críticas |

---

## 🎯 SIGUIENTE PASO

**ACCION REQUERIDA:**
1. Commit cambios (eliminación duplicado /healthz)
2. Push a main
3. Verificar en Railway logs:
   - `[DEPLOY] Commit: <hash>` aparece
   - `[BOOT] Server listening on 0.0.0.0:<port>` aparece
   - No hay crash antes de listen
4. Verificar healthcheck en Railway Dashboard
5. Si falla, verificar logs para identificar causa específica

---

**Última actualización:** 2024-11-23  
**Commit de referencia:** Pendiente (próximo commit después de eliminar duplicado)

