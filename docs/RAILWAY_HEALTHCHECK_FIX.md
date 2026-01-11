# Railway Healthcheck Fix

**Fecha:** 2024-11-23  
**Prioridad:** 🔴 CRÍTICO - FIX DEFINITIVO

---

## 🎯 OBJETIVO

Asegurar que Railway healthcheck pase correctamente. Railway usa `/healthz` (NO `/health`) para el healthcheck.

---

## 🔍 CAUSA RAÍZ

Railway está configurado para hacer healthcheck a `/healthz` (como se ve en los logs: `Path: /healthz`). El backend tenía `/health` pero NO tenía `/healthz`, causando que el healthcheck siempre fallara con "service unavailable".

**Configuración Railway:**
- `backend/railway.json`: `healthcheckPath: "/healthz"`
- Railway logs muestran: `Path: /healthz`

---

## ✅ SOLUCIÓN APLICADA

### 1. Endpoint `/healthz` Agregado

**Ubicación:** `backend/src/server.ts` (montado ANTES de imports pesados)

**Implementación:**
```typescript
app.get('/healthz', (_req, res) => {
  try {
    const deployInfo = getDeployInfoSync();
    const uptime = Math.floor((Date.now() - systemHealth.startTime) / 1000);
    
    res.status(200).json({
      ok: true,
      status: systemHealth.status === 'initializing' ? 'ok' : systemHealth.status,
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      environment: process.env.NODE_ENV || 'unknown',
      version: deployInfo.version,
      commit: deployInfo.commitHash,
      services: {
        database: systemHealth.dbConnected ? 'connected' : 'disconnected',
        migrations: systemHealth.migrationsRun ? 'completed' : 'pending',
      },
    });
  } catch (error: any) {
    // Si falla, responder 200 de todas formas (degraded mode)
    res.status(200).json({
      ok: true,
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: 'Health check error',
    });
  }
});
```

**Características:**
- ✅ Responde EXACTAMENTE lo mismo que `/health`
- ✅ Montado ANTES de imports pesados (env.ts, DB, Prisma)
- ✅ Responde SIEMPRE 200 (incluso si DB falla - modo degraded)
- ✅ Sin dependencias pesadas (usa `getDeployInfoSync()` y `systemHealth`)

### 2. Endpoints Disponibles

Ahora el backend tiene DOS endpoints de healthcheck:

1. **`/healthz`** (para Railway)
   - Montado ANTES de imports pesados
   - Responde siempre 200
   - Mismo formato que `/health`

2. **`/health`** (compatibilidad)
   - Montado después de imports, pero antes de middlewares pesados
   - Responde siempre 200
   - Mismo formato que `/healthz`

**Ambos endpoints:**
- Responden 200 OK siempre
- Incluyen: `ok`, `status`, `timestamp`, `uptime`, `environment`, `version`, `commit`, `services`
- Funcionan en modo degraded si DB falla

---

## 📋 CÓMO VALIDAR EN PRODUCCIÓN

### 1. Verificar Logs Railway

En **Railway Dashboard → Service (Backend) → Logs**, buscar:

```
[BOOT] Healthz route mounted at /healthz (ultra minimal, before env load)
[BOOT] Health route mounted at /health
[BOOT] Server listening on 0.0.0.0:<port>
[BOOT] Health endpoints ready: /healthz /health
```

### 2. Verificar Healthcheck en Railway Dashboard

En **Railway Dashboard → Service (Backend) → Settings → Healthcheck**:

- **Path:** `/healthz` (debe estar configurado)
- **Status:** Debe mostrar "Healthy" después del deploy

### 3. Verificar Endpoints Manualmente

```bash
# Desde local (reemplazar URL con la de Railway)
curl https://canalmedico-production.up.railway.app/healthz
# Debe responder: {"ok":true,"status":"ok",...}

curl https://canalmedico-production.up.railway.app/health
# Debe responder: {"ok":true,"status":"ok",...}
```

**Respuesta esperada (ambos endpoints):**
```json
{
  "ok": true,
  "status": "ok",
  "timestamp": "2024-11-23T12:00:00.000Z",
  "uptime": "10s",
  "environment": "production",
  "version": "1.0.1",
  "commit": "f1c8740",
  "services": {
    "database": "connected",
    "migrations": "completed"
  }
}
```

### 4. Test Local

```bash
cd backend
npm run build
npm start
# En otra terminal:
curl http://localhost:8080/healthz
curl http://localhost:8080/health
```

**Ambos deben responder 200 OK.**

---

## 🚨 TROUBLESHOOTING

### Problema: Healthcheck sigue fallando

**Verificar:**
1. Railway logs: ¿Aparece `[BOOT] Healthz route mounted at /healthz`?
2. Railway logs: ¿Aparece `[BOOT] Server listening on 0.0.0.0:<port>`?
3. Railway Dashboard: Healthcheck Path = `/healthz`?
4. Railway Dashboard: ¿El deploy está usando el último commit?

**Solución:**
- Verificar que `/healthz` está en el código (grep `app.get('/healthz'`)
- Verificar que el build incluye `/healthz` (grep en `dist/server.js`)
- Forzar redeploy en Railway Dashboard

### Problema: 404 en `/healthz`

**Causa:**
- El endpoint no está montado
- El servidor no está escuchando
- El código no está desplegado

**Solución:**
- Verificar que `app.get('/healthz', ...)` existe en `backend/src/server.ts`
- Rebuild: `npm run build`
- Verificar que `dist/server.js` contiene `/healthz`
- Forzar redeploy en Railway

---

## ✅ CRITERIO DONE

El sistema se considera **LISTO** cuando:

- ✅ Railway logs muestran: `[BOOT] Healthz route mounted at /healthz`
- ✅ Railway logs muestran: `[BOOT] Server listening on 0.0.0.0:<port>`
- ✅ Railway healthcheck pasa (status: Healthy)
- ✅ `curl https://<railway-url>/healthz` responde 200 OK
- ✅ `curl https://<railway-url>/health` responde 200 OK
- ✅ Ambos endpoints devuelven el mismo formato JSON

---

## 📝 NOTAS IMPORTANTES

1. **Railway usa `/healthz`**: Railway está configurado para usar `/healthz` (ver `backend/railway.json`)
2. **Compatibilidad**: Se mantiene `/health` para compatibilidad con otras herramientas
3. **Orden de montaje**: `/healthz` está montado ANTES de imports pesados para máxima robustez
4. **Modo degraded**: Ambos endpoints responden 200 incluso si DB falla

---

## 📚 REFERENCIAS

- `backend/railway.json`: `healthcheckPath: "/healthz"`
- `backend/src/server.ts`: Endpoints `/healthz` y `/health`
- Railway logs: `Path: /healthz`

---

**Última actualización:** 2024-11-23  
**Commit:** `f1c8740` - `fix(deploy): listen on Railway PORT and fallback 8080 to satisfy healthcheck`

