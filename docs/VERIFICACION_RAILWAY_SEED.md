# Verificación de Endpoint Seed en Railway

**Fecha:** 2024-11-23  
**Objetivo:** Validar que `/api/seed/test-data` está disponible en Railway

---

## ✅ CONFIRMACIONES DE CÓDIGO

### 1. Router Seed Montado

**Archivo:** `backend/src/server.ts` línea 151

```typescript
import seedRoutes from './modules/seed/seed.routes';
app.use('/api/seed', seedRoutes);
logger.info('[SEED] Seed routes mounted at /api/seed');
```

✅ Router montado correctamente  
✅ Log de validación agregado

---

### 2. Endpoint Health Check

**Archivo:** `backend/src/modules/seed/seed.routes.ts`

**Nuevo endpoint:** `GET /api/seed/health`

```typescript
router.get('/health', (_req: Request, res: Response): void => {
    logger.info('[SEED] GET /health called - Seed module is mounted');
    res.status(200).json({
        success: true,
        message: 'Seed module is mounted and available',
        endpoint: '/api/seed',
        routes: ['/health', '/test-data'],
        enableTestData: process.env.ENABLE_TEST_DATA === 'true',
    });
});
```

✅ Endpoint de validación creado

---

### 3. Logs de Validación

**En server.ts:**
- `[SEED] Seed routes mounted at /api/seed` → Al boot

**En seed.routes.ts:**
- `[SEED] GET /health called - Seed module is mounted` → Cuando se llama health
- `[SEED] POST /test-data called, ENABLE_TEST_DATA=...` → Cuando se llama test-data

✅ Logs agregados para validación en Railway

---

## 🔍 VERIFICACIÓN EN RAILWAY

### Paso 1: Verificar Logs de Boot

**En Railway Dashboard → Logs, buscar:**

```
[SEED] Seed routes mounted at /api/seed
```

**Si aparece:** ✅ Módulo seed está montado  
**Si NO aparece:** ❌ Problema de deploy o código no actualizado

---

### Paso 2: Probar Endpoint Health

**Comando:**
```bash
curl -X GET https://canalmedico-production.up.railway.app/api/seed/health
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Seed module is mounted and available",
  "endpoint": "/api/seed",
  "routes": ["/health", "/test-data"],
  "enableTestData": true
}
```

**Si devuelve 404:** ❌ Módulo seed NO está montado  
**Si devuelve 200:** ✅ Módulo seed está montado

**En Railway Logs debería aparecer:**
```
[SEED] GET /health called - Seed module is mounted
```

---

### Paso 3: Probar Endpoint Test-Data

**Comando:**
```bash
curl -X POST https://canalmedico-production.up.railway.app/api/seed/test-data \
  -H "Content-Type: application/json"
```

**Si `ENABLE_TEST_DATA=true` en Railway:**

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "message": "Usuarios de prueba creados/actualizados exitosamente",
  "credentials": {
    "ADMIN": { "email": "admin@canalmedico.com", ... },
    "DOCTOR": { "email": "doctor.test@canalmedico.com", ... },
    "PATIENT": { "email": "patient.test@canalmedico.com", ... }
  },
  "ids": {
    "doctorId": "...",
    "patientId": "...",
    "adminId": "..."
  }
}
```

**En Railway Logs debería aparecer:**
```
[SEED] POST /test-data called, ENABLE_TEST_DATA=true (true)
[TEST-DATA] Creando usuarios de prueba para E2E
[TEST-DATA] ✅ Doctor creado/actualizado: doctor.test@canalmedico.com
[TEST-DATA] ✅ Patient creado/actualizado: patient.test@canalmedico.com
[SEED] Test users created/updated successfully
```

**Si `ENABLE_TEST_DATA=false` o no está configurado:**

**Respuesta esperada (403 Forbidden):**
```json
{
  "success": false,
  "error": "Test data seed deshabilitado. Configure ENABLE_TEST_DATA=true para habilitarlo."
}
```

**En Railway Logs debería aparecer:**
```
[SEED] POST /test-data called, ENABLE_TEST_DATA=false (false)
[SEED] Test data seed deshabilitado - ENABLE_TEST_DATA !== true
```

---

## 🐛 TROUBLESHOOTING

### Problema: Health devuelve 404

**Causas posibles:**
1. Código no desplegado correctamente
2. Router no está montado (verificar server.ts)
3. Railway apunta a commit viejo

**Solución:**
1. Verificar que Railway está apuntando a `main` branch
2. Verificar que `root_dir = backend` en Railway
3. Verificar logs de boot para ver si aparece `[SEED] Seed routes mounted`
4. Forzar redeploy en Railway

---

### Problema: Health devuelve 200 pero Test-Data devuelve 404

**Causa:** Ruta incorrecta o handler no registrado

**Solución:**
1. Verificar que `router.post('/test-data', ...)` existe en `seed.routes.ts`
2. Verificar que `export default router;` está al final del archivo
3. Verificar logs de Railway para errores de importación

---

### Problema: Test-Data devuelve 403

**Causa:** `ENABLE_TEST_DATA !== 'true'` en Railway

**Solución:**
1. Ir a Railway Dashboard → Variables de Entorno
2. Agregar o actualizar: `ENABLE_TEST_DATA=true`
3. Reiniciar servicio

---

### Problema: No aparecen logs [SEED] en Railway

**Causa:** Código no desplegado o logs no configurados

**Solución:**
1. Verificar que el commit con los logs está en `main`
2. Verificar que Railway hizo deploy del commit correcto
3. Verificar nivel de logs en Railway (debe ser `info` o `debug`)

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Log `[SEED] Seed routes mounted at /api/seed` aparece en Railway logs al boot
- [ ] `GET /api/seed/health` devuelve 200 OK
- [ ] `POST /api/seed/test-data` devuelve 200 OK (si `ENABLE_TEST_DATA=true`)
- [ ] `POST /api/seed/test-data` devuelve 403 (si `ENABLE_TEST_DATA=false`)
- [ ] Logs `[SEED]` aparecen en Railway cuando se llaman los endpoints
- [ ] Variable de entorno `ENABLE_TEST_DATA=true` configurada en Railway

---

**Estado:** ✅ Código actualizado con logs y endpoint health  
**Próximo paso:** Verificar en Railway después del deploy

