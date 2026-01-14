# ROOT CAUSE ANALYSIS - Railway Deploy Failure

**INCIDENT**: Railway healthcheck failed / service unavailable después del commit 56b248f

**GOOD_COMMIT**: 501a91a (deploy estable)
**BAD_COMMIT**: 56b248f (fix(deploy): enforce backend deploy settings on railway)

---

## EVIDENCIA DEL DIFF

### Archivos modificados en BAD_COMMIT (56b248f):
1. `backend/Dockerfile` - Agregó comando para guardar build timestamp
2. `backend/nixpacks.toml` - Agregó comando para guardar build timestamp
3. `backend/Procfile` - **AGREGÓ LÍNEA `release:`**
4. `backend/src/server.ts` - **CAMBIOS CRÍTICOS EN startServer()**
5. Nuevos módulos deploy (deploy.service.ts, deploy.controller.ts, deploy.routes.ts)
6. Scripts de verificación

---

## CAUSA RAÍZ IDENTIFICADA

### PROBLEMA PRINCIPAL: Import dinámico en `startServer()` (CRÍTICO)

En el commit BAD (56b248f), el código de `startServer()` cambió de:

**GOOD (501a91a) - Código síncrono simple:**
```typescript
const commitHash = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || ...;
let packageVersion = '1.0.1';
try {
  const fs = require('fs');
  const path = require('path');
  const packagePath = path.join(__dirname, '../../package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    packageVersion = packageJson.version || '1.0.1';
  }
} catch (error) {
  logger.warn('⚠️ No se pudo leer versión de package.json, usando por defecto');
}
```

**BAD (56b248f) - Import dinámico problemático:**
```typescript
const { getDeployInfo } = await import('./modules/deploy/deploy.service');
const deployInfo = getDeployInfo();
```

### PROBLEMA SECUNDARIO: Línea `release:` en Procfile

El Procfile agregó:
```
release: npx prisma migrate deploy || npx prisma db push --accept-data-loss
```

Railway puede intentar ejecutar esta línea `release:` y si falla, puede causar que el deploy falle.

---

## ANÁLISIS DEL PROBLEMA

### Por qué el import dinámico rompe Railway:

1. **Timing crítico**: `startServer()` debe ejecutarse rápidamente para que Railway healthcheck responda
2. **Dependencia del módulo**: Si `deploy.service.ts` tiene un error o no está disponible en el momento del build, el import dinámico falla
3. **Error no capturado**: El import dinámico puede fallar silenciosamente o causar que el servidor no arranque
4. **Orden de inicialización**: El módulo deploy se monta ANTES de que el servidor esté listo

### Por qué el `release:` en Procfile puede causar problemas:

1. Railway puede intentar ejecutar `release:` antes del servicio web
2. Si las migraciones fallan, Railway puede marcar el deploy como fallido
3. No es necesario porque las migraciones ya se ejecutan en `runMigrations()`

---

## IMPACTO

- Railway healthcheck falla porque el servidor no arranca correctamente
- El import dinámico en `startServer()` puede fallar si el módulo deploy no está disponible
- El código GOOD usaba código síncrono simple que siempre funcionaba
- El código BAD introdujo una dependencia dinámica que puede fallar

---

## SOLUCIÓN PROPUESTA

### FIX MÍNIMO:

**Cambio más crítico identificado**: La línea `release:` en Procfile que NO estaba en GOOD_COMMIT.

1. **REVERTIR la línea `release:` en Procfile**: Eliminar la línea agregada en BAD_COMMIT
   - GOOD_COMMIT (501a91a): Solo `web: node dist/server.js`
   - BAD_COMMIT (56b248f): Agregó `release: npx prisma migrate deploy || npx prisma db push --accept-data-loss`
   - Estado actual: Aún tiene la línea `release:` (problemática)

**NOTA**: El código actual de `server.ts` ya ha sido modificado después del BAD_COMMIT y usa `getDeployInfoSync()` en lugar del import dinámico problemático. Sin embargo, el cambio más obvio y problemático que todavía está presente es la línea `release:` en Procfile.

### Cambios específicos:

1. `backend/Procfile` - **ELIMINAR** línea `release: npx prisma migrate deploy || npx prisma db push --accept-data-loss`
   - Dejar solo: `web: node dist/server.js`

---

## VALIDACIÓN

Después del fix, validar:
1. Local build: `npm run build` debe funcionar
2. Local run: `node dist/server.js` debe arrancar
3. Healthcheck: `curl http://localhost:8080/health` debe responder 200
4. Railway: Deploy debe pasar healthcheck

---

## EVIDENCIA COMPLETA

Ver: `docs/INCIDENT_DIFF_GOOD_BAD.patch` para el diff completo entre GOOD y BAD commits.
