# FASE A: Reconstrucción del Estado + Evidencia

**Fecha:** 2025-01-23  
**Objetivo:** Capturar estado actual del proyecto y configuración Railway

---

## A1: Verificaciones Básicas

### Git Status
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  deleted:    CanalMedico

Untracked files:
  Zoom_cm_fo42mnktZ9vvrZo4_mq+5bhQebioumWnV4YlR-kFDfmZ+MUqxGbKXZ@I-rlJqW8cmycuOO-_k6b606137393c624f_.exe
  docs/FASE_A_REPORTE_ESTADO.md
```

### Git Log (últimos 30 commits)
- `cf9016c` docs: add FASE5 final deliverable with PowerShell commands and checklist
- `ee52837` docs: add Railway deploy status summary
- `04c959d` fix(healthcheck): remove duplicate /healthz endpoint
- `fda7f6b` feat(deploy): add deploy-info evidence endpoint + logs
- `c9ff860` fix(railway): ensure immediate listen and stable health endpoint
- `70e4629` fix(build): resolve server.ts port scope and unused vars
- `6e12469` fix(deploy): resolve server.ts port scope TS error and ensure listen on PORT
- `c973cb1` fix(railway): add /healthz alias for healthcheck
- `f1c8740` fix(deploy): listen on Railway PORT and fallback 8080 to satisfy healthcheck
- `f85f0e0` fix(deploy): align Railway port/healthcheck to env PORT
- ... (más commits relacionados con Railway fixes)

**Observación:** Hay muchos commits relacionados con fixes de Railway, lo que indica que ha habido problemas previos.

### Node Version
```
v22.17.1
```

### Estructura Backend
```
backend/
  - dist/          (compilado)
  - src/
    - server.ts    (archivo principal)
  - package.json
  - Dockerfile
  - railway.json
  - nixpacks.toml
  - prisma/
    - schema.prisma
    - migrations/
```

---

## A2: Configuración de Ejecución

### package.json
- **build:** `tsc && tsc-alias` ✅
- **start:** `node dist/server.js` ✅
- **Scripts disponibles:**
  - `dev`: `tsx watch src/server.ts`
  - `build`: `tsc && tsc-alias`
  - `start`: `node dist/server.js`
  - `verify:railway-deploy`: `tsx scripts/verify-railway-deploy.ts`
  - `verify:health`: `tsx scripts/verify-health.ts`

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Observación:** Dockerfile usa `EXPOSE 3000` pero el código usa `process.env.PORT || 8080`. Railway asigna PORT dinámicamente.

### backend/railway.json
```json
{
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/healthz",
    "healthcheckTimeout": 120,
    "healthcheckInterval": 10
  }
}
```

**Observación:** Healthcheck path está configurado como `/healthz`, pero el código tiene ambos `/health` y `/healthz`.

### backend/nixpacks.toml
```toml
[providers]
node = "18"

[phases.build]
cmds = [
  "npx prisma generate",
  "npm run build",
]

[start]
cmd = "node dist/server.js"
```

### railway.json (root)
```json
{
  "$comment": "Root railway.json for monorepo. Each service should have its own railway.json in its directory."
}
```

---

## A3: Mapeo de Server.ts

### listen() Calls
- **Ubicación:** `backend/src/server.ts:455`
- **Código:**
```typescript
httpServer.listen(PORT, HOST, () => {
  // ...
});
```
- **PORT:** `const PORT = Number(process.env.PORT) || 8080;` (línea 26)
- **HOST:** `const HOST = '0.0.0.0';` (línea 27)

### process.env.PORT Usage
- **Línea 9:** `console.log(\`[BOOT] PORT env: ${process.env.PORT || 'not set'}\`);`
- **Línea 26:** `const PORT = Number(process.env.PORT) || 8080;`
- **Línea 432:** `console.log(\`[BOOT] env PORT = ${process.env.PORT || 'not set'}\`);`
- **Línea 439:** `logger.info(\`[BOOT] PORT env detected: ${process.env.PORT || 'not set'}\`);`

**Observación:** El código usa `process.env.PORT` correctamente, con fallback a 8080.

### Health Endpoints
- **/healthz:** Línea 35-37 (montado ANTES de imports pesados)
- **/health:** Línea 130-160 (montado después de imports pero antes de middlewares)
- **/deploy-info:** Línea 166-188

**Estructura:**
1. `/healthz` - Ultra mínimo, montado al inicio
2. `/health` - Completo con info de servicios
3. `/deploy-info` - Info de deploy (commit, version)

---

## A4: Conclusión Preliminar

### ¿Qué rompe build?
**Estado actual:** ✅ Build pasa sin errores TypeScript
- `npm run build` ejecuta exitosamente
- No hay errores TS2304 (Cannot find name 'port')
- No hay errores TS6133 (unused variables)

**Historial:** Los commits muestran fixes previos:
- `70e4629` fix(build): resolve server.ts port scope and unused vars
- `6e12469` fix(deploy): resolve server.ts port scope TS error

Esto indica que **hubo errores de build previamente** relacionados con variables `port` no declaradas y variables no usadas.

### ¿Qué rompe startup?
**Estado actual:** Código parece correcto
- `listen()` se ejecuta en `PORT` y `HOST` (constantes globales)
- PORT se obtiene de `process.env.PORT || 8080`
- HOST está hardcodeado a `'0.0.0.0'` (correcto para Railway)

**Historial:** Commits muestran fixes previos:
- `c9ff860` fix(railway): ensure immediate listen and stable health endpoint
- `f1c8740` fix(deploy): listen on Railway PORT and fallback 8080

### ¿Qué rompe healthcheck?
**Estado actual:** Código tiene múltiples endpoints de health
- `/healthz` - Ultra mínimo, montado al inicio
- `/health` - Completo, montado antes de middlewares pesados
- Railway config apunta a `/healthz`

**Potenciales problemas:**
1. Railway config usa `/healthz` pero puede que no responda correctamente
2. El servidor hace `listen()` después de algunas inicializaciones (aunque el código muestra que se hace antes)

**Historial:** Commits muestran fixes previos:
- `04c959d` fix(healthcheck): remove duplicate /healthz endpoint
- `c973cb1` fix(railway): add /healthz alias for healthcheck
- `fbb210e` fix(health): mount /health before db/migrations and never crash

### ¿Qué parte es Railway config vs code?
**Railway Config:**
- Root Directory: debe ser `backend`
- Healthcheck Path: `/healthz` (configurado en railway.json)
- Start Command: `node dist/server.js` (configurado en railway.json)

**Code:**
- `listen()` usa `PORT` y `HOST` (constantes globales)
- `/healthz` y `/health` están montados
- Inicialización pesada (DB, migraciones) se hace DESPUÉS de `listen()`

---

## Siguiente Paso: FASE B (BISECT)

Para encontrar el commit exacto que rompió Railway, debemos ejecutar `git bisect` buscando un commit GOOD (donde Railway funcionaba) vs BAD (donde comenzó a fallar).

**Estrategia:**
1. Buscar commits antiguos donde el backend era más simple
2. Identificar commit GOOD (ej: antes de cambios recientes de Railway)
3. Usar commit actual como BAD
4. Ejecutar bisect para encontrar el commit culpable
