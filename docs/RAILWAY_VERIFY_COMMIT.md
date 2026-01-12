# FASE 2 — VERIFICAR SI RAILWAY DESPLIEGA EL COMMIT CORRECTO

**Objetivo:** Verificar que Railway está desplegando el commit correcto y no una versión cacheada.

---

## 🔍 PROBLEMA POTENCIAL

Railway puede NO estar leyendo el commit correcto si:
- Root Directory está mal configurado
- Branch incorrecto
- Caching / stale deployment
- Railway no detecta el nuevo commit

---

## ✅ MÉTODO A: VERIFICAR COMMIT EN RAILWAY LOGS

### Paso 1: Acceder a Railway Logs

1. Ve a [Railway Dashboard](https://railway.app/dashboard)
2. Selecciona el proyecto **CanalMedico**
3. Selecciona el servicio **backend**
4. Haz clic en la pestaña **"Logs"**

### Paso 2: Buscar Logs [DEPLOY]

En los logs, busca las siguientes líneas (deben aparecer al inicio del servidor):

```
============================================================
[BOOT] Starting CanalMedico backend...
[BOOT] NODE_ENV: production
[BOOT] env PORT = <port>
[BOOT] Using PORT = <port>
[BOOT] Using HOST = 0.0.0.0
[DEPLOY] Version: 1.0.1
[DEPLOY] Commit: <commit-hash>
[DEPLOY] NODE_ENV: production
[BOOT] Health route mounted at /health
============================================================
```

### Paso 3: Comparar Commit Hash

**Commit esperado (último push):**
```bash
# Ejecutar localmente para obtener el commit esperado
git rev-parse HEAD
```

**Ejemplo:**
- **Commit esperado:** `fda7f6b` (o los 7 primeros caracteres del hash completo)
- **Commit en Railway logs:** Debe coincidir con `fda7f6b`

### Paso 4: Interpretar Resultados

**✅ SI COINCIDE:**
- Railway está desplegando el commit correcto
- El problema NO es caching/stale deployment
- Proceder a verificar healthcheck (FASE 3)

**❌ SI NO COINCIDE:**
- Railway está desplegando un commit antiguo
- Posibles causas:
  - Root Directory incorrecto
  - Branch incorrecto
  - Railway no detectó el nuevo commit
  - Caching/stale deployment

**Acción si NO coincide:**
1. Verificar Root Directory en Railway Dashboard (debe ser `backend`)
2. Verificar Branch en Railway Dashboard (debe ser `main`)
3. Forzar redeploy manual desde Railway Dashboard
4. Si persiste, verificar conexión GitHub → Railway

---

## ✅ MÉTODO B: VERIFICAR COMMIT VÍA ENDPOINT /deploy-info

### Paso 1: Obtener URL Pública del Backend

1. Ve a Railway Dashboard → Servicio backend
2. Ve a la pestaña **"Settings"**
3. Busca **"Domains"** o **"Public Domain"**
4. Copia la URL pública (ej: `https://canalmedico-production.up.railway.app`)

### Paso 2: Hacer Request a /deploy-info

**En PowerShell:**
```powershell
# Reemplazar <RAILWAY_URL> con la URL pública del backend
$url = "https://<RAILWAY_URL>/deploy-info"
Invoke-RestMethod -Uri $url -Method Get | ConvertTo-Json
```

**En Bash/curl:**
```bash
curl https://<RAILWAY_URL>/deploy-info
```

### Paso 3: Analizar Respuesta

**Respuesta esperada:**
```json
{
  "ok": true,
  "version": "1.0.1",
  "commit": "fda7f6b",
  "timestamp": "2024-11-23T12:00:00.000Z",
  "port": "8080",
  "node": "v18.17.0"
}
```

### Paso 4: Comparar Commit

**Commit esperado (local):**
```powershell
# Obtener commit local
git rev-parse HEAD
# Resultado ejemplo: fda7f6b402de5f5bc7801ac378db82529016ffd5
# Primeros 7 caracteres: fda7f6b
```

**Commit en respuesta /deploy-info:**
- Debe coincidir con los primeros 7 caracteres del commit local

### Paso 5: Interpretar Resultados

**✅ SI COINCIDE:**
- Railway está desplegando el commit correcto
- El endpoint /deploy-info funciona correctamente
- Proceder a verificar healthcheck (FASE 3)

**❌ SI NO COINCIDE:**
- Railway está desplegando un commit antiguo
- Verificar Root Directory, Branch, y forzar redeploy (ver MÉTODO A, Paso 4)

**❌ SI EL ENDPOINT NO RESPONDE:**
- El servidor no está escuchando
- Verificar logs Railway para ver si hay crash
- Verificar que el servidor está corriendo
- Proceder a FASE 3 (resolver healthcheck)

---

## 🔧 SOLUCIÓN: FORZAR REDEPLOY SI COMMIT NO COINCIDE

### Opción 1: Redeploy desde Railway Dashboard (Recomendado)

1. Ve a Railway Dashboard → Servicio backend
2. Ve a la pestaña **"Deployments"**
3. Haz clic en **"Redeploy"** del último commit (o del commit que quieres desplegar)
4. Espera a que termine el deployment
5. Verificar logs nuevamente (MÉTODO A)

### Opción 2: Cambiar Start Command (Forzar Redeploy)

1. Ve a Railway Dashboard → Servicio backend
2. Ve a **"Settings"** → **"Deploy"**
3. Busca **"Start Command"**
4. Cambia temporalmente a: `node dist/server.js # force-redeploy`
5. Guarda
6. Cambia de vuelta a: `node dist/server.js`
7. Guarda (esto fuerza redeploy)
8. Verificar logs nuevamente (MÉTODO A)

### Opción 3: Push Empty Commit (Forzar desde Git)

```powershell
# En el directorio raíz del proyecto
git commit --allow-empty -m "chore: force railway redeploy"
git push origin main
```

Espera a que Railway detecte el nuevo commit y despliegue automáticamente.

---

## 📋 CHECKLIST DE VERIFICACIÓN

Usa este checklist para confirmar que Railway está desplegando el commit correcto:

- [ ] Commit local obtenido: `git rev-parse HEAD`
- [ ] Railway logs muestran `[DEPLOY] Commit: <hash>`
- [ ] Commit en logs coincide con commit local (primeros 7 caracteres)
- [ ] Endpoint /deploy-info responde correctamente
- [ ] Commit en /deploy-info coincide con commit local
- [ ] Root Directory en Railway está configurado como `backend`
- [ ] Branch en Railway está configurado como `main`

---

## 🎯 SIGUIENTE FASE

Si el commit COINCIDE:
- ✅ Railway está desplegando el commit correcto
- ➡️ Proceder a **FASE 3**: Resolver healthcheck fail

Si el commit NO COINCIDE:
- ❌ Railway no está desplegando el commit correcto
- 🔧 Aplicar soluciones de "FORZAR REDEPLOY"
- 🔄 Repetir verificación hasta que coincida
- ➡️ Luego proceder a **FASE 3**: Resolver healthcheck fail

---

**Última actualización:** 2024-11-23  
**Commit de referencia:** fda7f6b (feat(deploy): add deploy-info evidence endpoint + logs)

