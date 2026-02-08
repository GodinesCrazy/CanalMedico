# Railway UI Port/Healthcheck Mismatch - Troubleshooting

**Fecha:** 2025-01-26  
**Escenario:** Código funciona (curl /health → 200 OK) pero Railway healthcheck falla  
**Estado:** 🔄 **GUÍA DE TROUBLESHOOTING**

---

## 🎯 CUANDO USAR ESTA GUÍA

**Usa esta guía SI:**
- ✅ `curl https://canalmedico-production.up.railway.app/health` → 200 OK
- ✅ Build OK + Deploy OK
- ❌ Railway healthcheck sigue fallando
- ❌ Railway muestra: "Deployment failed during network process" → "Network > Healthcheck failure"

**Esto indica:** Problema de configuración Railway UI, NO del código.

---

## 🔍 DIAGNÓSTICO PASO A PASO

### Paso 1: Verificar que curl sigue funcionando

```bash
curl -v https://canalmedico-production.up.railway.app/health
```

**Respuesta esperada:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok": true,
  "status": "ok",
  "timestamp": "...",
  ...
}
```

**Si curl funciona:**
- ✅ El servidor está escuchando
- ✅ /health endpoint funciona
- ✅ El código está correcto
- ❌ El problema es configuración Railway UI

---

### Paso 2: Verificar Logs Railway

**Ruta:** Railway Dashboard → Servicio "CanalMedico" → Logs

**Buscar estos logs críticos:**
```
[BOOT] PORT env=xxxxx
[BOOT] Starting HTTP server...
[BOOT] Listening on 0.0.0.0:xxxxx
[BOOT] Health endpoint ready: /health
```

**Si aparecen estos logs:**
- ✅ El servidor inició correctamente
- ✅ El servidor está escuchando en puerto correcto
- ✅ /health está disponible

**Si NO aparecen estos logs:**
- ❌ El servidor no inició correctamente
- ❌ Revisar logs anteriores para errores
- ❌ Puede ser problema de código (pero curl funciona, así que es poco probable)

---

### Paso 3: Verificar Configuración Railway UI

**Seguir checklist completo en:** `docs/RAILWAY_DEPLOY_CHECKLIST.md`

**Configuraciones críticas a verificar:**

1. **Root Directory:**
   - Debe ser: `backend` (sin / ni \)
   - Ruta: Settings → Root Directory

2. **Healthcheck Path:**
   - Debe ser: `/health`
   - Ruta: Settings → Healthcheck → Path

3. **Healthcheck Timeout:**
   - Debe ser: `120` (o más)
   - Ruta: Settings → Healthcheck → Timeout

4. **Port Assignment:**
   - Debe ser: Asignado dinámicamente
   - NO debe haber variable PORT en Variables

---

### Paso 4: Verificar Networking/Proxy

**Problema común:** Railway healthcheck usa proxy interno que puede estar mal configurado.

**Síntomas:**
- curl externo funciona (200 OK)
- Railway healthcheck falla
- Logs muestran que servidor está escuchando

**Solución:**
1. Verificar que no hay configuración de proxy personalizada
2. Verificar que Networking → Port está asignado dinámicamente
3. Verificar que no hay reglas de firewall que bloqueen healthcheck interno

---

### Paso 5: Forzar Redeploy

**Si configuración está correcta pero healthcheck sigue fallando:**

1. **Forzar redeploy:**
   - Railway Dashboard → Deployments
   - Click en "Redeploy" del último commit
   - O hacer commit vacío:
     ```bash
     git commit --allow-empty -m "chore: force railway redeploy"
     git push origin main
     ```

2. **Esperar nuevo deployment:**
   - Verificar logs del nuevo deployment
   - Buscar logs `[BOOT] Listening on 0.0.0.0:xxxxx`
   - Verificar healthcheck status

---

### Paso 6: Recreate Service (Último Recurso)

**Solo si todo lo demás falla:**

1. **Crear nuevo servicio Railway:**
   - Railway Dashboard → New Service
   - Seleccionar "GitHub Repo"
   - Seleccionar repositorio "CanalMedico"
   - Root Directory: `backend`

2. **Configurar desde cero:**
   - Root Directory: `backend`
   - Healthcheck Path: `/health`
   - Healthcheck Timeout: `120`
   - Healthcheck Interval: `10`
   - Start Command: (vacío, usa Procfile)

3. **Conectar a mismo Postgres:**
   - En nuevo servicio, agregar "Postgres" service
   - O conectar a Postgres existente via Variables
   - Configurar `DATABASE_URL`

4. **Configurar Variables:**
   - Copiar todas las variables del servicio anterior
   - Verificar que NO existe variable PORT

5. **Deploy:**
   - Railway hará deploy automático
   - Verificar logs
   - Verificar healthcheck

---

## 📊 EVIDENCIA A RECOPILAR

**Si el problema persiste, recopilar:**

1. **Screenshots de Railway UI:**
   - Settings → Root Directory
   - Settings → Healthcheck (Path, Timeout, Interval)
   - Settings → Networking → Port
   - Settings → Variables (mostrar todas, especialmente si existe PORT)

2. **Logs Railway:**
   - Últimos 100 líneas de logs
   - Buscar logs `[BOOT]`
   - Buscar errores relacionados con healthcheck

3. **Resultado de curl:**
   ```bash
   curl -v https://canalmedico-production.up.railway.app/health
   ```
   - Guardar output completo

4. **Estado de Deployment:**
   - Screenshot de Railway Dashboard → Deployments
   - Estado del último deployment
   - Mensaje de error (si existe)

---

## 🔄 WORKAROUND TEMPORAL

**Si healthcheck falla pero el servidor funciona (curl → 200 OK):**

**Opción 1: Deshabilitar healthcheck temporalmente**
- Railway Dashboard → Settings → Healthcheck
- Deshabilitar healthcheck (si es posible)
- **⚠️ NO recomendado para producción**

**Opción 2: Aumentar timeout drásticamente**
- Healthcheck Timeout: `300` (5 minutos)
- Healthcheck Interval: `30`
- Esto da más tiempo al servidor para iniciar
- **⚠️ Workaround temporal, no solución permanente**

**Opción 3: Usar otro endpoint temporalmente**
- Si Railway permite cambiar healthcheck path
- Probar con `/` (root endpoint)
- O crear `/healthz` mínimo
- **⚠️ Solo para diagnóstico**

---

## ✅ CHECKLIST DE TROUBLESHOOTING

- [ ] curl /health → 200 OK (confirma que código funciona)
- [ ] Logs Railway muestran `[BOOT] Listening on 0.0.0.0:xxxxx`
- [ ] Root Directory = `backend` (verificado en UI)
- [ ] Healthcheck Path = `/health` (verificado en UI)
- [ ] Healthcheck Timeout = `120` (o más, verificado en UI)
- [ ] Port asignado dinámicamente (verificado en UI)
- [ ] NO existe variable PORT (verificado en Variables)
- [ ] Forzar redeploy intentado
- [ ] Recreate service intentado (último recurso)

---

## 📝 NOTAS FINALES

**Si después de seguir esta guía el problema persiste:**

1. **El código está correcto** (evidencia: curl funciona)
2. **El problema es configuración Railway UI o networking**
3. **Considerar contactar soporte Railway** con:
   - Screenshots de configuración
   - Logs Railway
   - Evidencia de que curl funciona
   - Descripción del problema

---

**Última actualización:** 2025-01-26  
**Propósito:** Guía de troubleshooting para UI mismatch Railway

