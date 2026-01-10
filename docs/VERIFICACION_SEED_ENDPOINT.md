# Verificación de Endpoint /api/seed/test-data

**Fecha:** 2024-11-23  
**Objetivo:** Confirmar que el endpoint está correctamente implementado y registrado

---

## ✅ CONFIRMACIONES

### 1. Endpoint Implementado

**Archivo:** `backend/src/modules/seed/seed.routes.ts`

**Ruta:** `POST /api/seed/test-data`

**Líneas relevantes:**
```typescript
router.post('/test-data', async (_req: Request, res: Response): Promise<void> => {
    try {
        const result = await createTestUsers();
        if (!result) {
            res.status(403).json({
                success: false,
                error: 'Test data seed deshabilitado. Configure ENABLE_TEST_DATA=true para habilitarlo.',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Usuarios de prueba creados/actualizados exitosamente',
            credentials: TEST_CREDENTIALS,
            ids: result,
        });
    } catch (error: any) {
        logger.error('Error al crear usuarios de prueba:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear usuarios de prueba',
            details: error?.message || 'Error desconocido',
        });
    }
});
```

---

### 2. Router Exportado

**Archivo:** `backend/src/modules/seed/seed.routes.ts`

**Línea 329:**
```typescript
export default router;
```

✅ Router exportado correctamente

---

### 3. Router Registrado en server.ts

**Archivo:** `backend/src/server.ts`

**Líneas 150-151:**
```typescript
import seedRoutes from './modules/seed/seed.routes';
app.use('/api/seed', seedRoutes);
```

✅ Router registrado correctamente con ruta base `/api/seed`

**Ruta final completa:** `POST /api/seed/test-data`

---

### 4. Protección por Flag

**Archivo:** `backend/src/modules/seed/test-data.seed.ts`

**Línea 17:**
```typescript
const ENABLE_TEST_DATA = process.env.ENABLE_TEST_DATA === 'true';
```

**Líneas 49-53:**
```typescript
export async function createTestUsers(): Promise<{ doctorId?: string; patientId?: string; adminId?: string } | null> {
  if (!ENABLE_TEST_DATA) {
    logger.debug('[TEST-DATA] Seed de datos de prueba deshabilitado (ENABLE_TEST_DATA !== true)');
    return null;
  }
```

✅ Endpoint protegido por flag `ENABLE_TEST_DATA`

**Comportamiento:**
- Si `ENABLE_TEST_DATA !== 'true'` → Retorna `403 Forbidden` con mensaje explicativo
- Si `ENABLE_TEST_DATA === 'true'` → Ejecuta creación de usuarios y retorna `200 OK`

---

## 🔍 VERIFICACIÓN EN RAILWAY

### Para verificar que el endpoint esté disponible:

1. **Verificar variable de entorno en Railway:**
   - Ir a Railway Dashboard → Variables de Entorno
   - Buscar `ENABLE_TEST_DATA`
   - Debe estar configurado como `true` para que el endpoint funcione

2. **Probar endpoint manualmente:**
   ```bash
   curl -X POST https://canalmedico-production.up.railway.app/api/seed/test-data \
     -H "Content-Type: application/json"
   ```

   **Respuesta esperada si `ENABLE_TEST_DATA=true`:**
   ```json
   {
     "success": true,
     "message": "Usuarios de prueba creados/actualizados exitosamente",
     "credentials": {
       "ADMIN": { "email": "admin@canalmedico.com", "password": "Admin123!", "role": "ADMIN" },
       "DOCTOR": { "email": "doctor.test@canalmedico.com", "password": "DoctorTest123!", "role": "DOCTOR", ... },
       "PATIENT": { "email": "patient.test@canalmedico.com", "password": "PatientTest123!", "role": "PATIENT", ... }
     },
     "ids": {
       "doctorId": "...",
       "patientId": "...",
       "adminId": "..."
     }
   }
   ```

   **Respuesta esperada si `ENABLE_TEST_DATA=false`:**
   ```json
   {
     "success": false,
     "error": "Test data seed deshabilitado. Configure ENABLE_TEST_DATA=true para habilitarlo."
   }
   ```
   Status: `403 Forbidden`

---

## 🐛 POSIBLES CAUSAS DE 404

Si el endpoint devuelve `404 Not Found`, verificar:

1. **✅ Router registrado correctamente** (confirmado en líneas 150-151 de server.ts)
2. **✅ Ruta base correcta** (`/api/seed`)
3. **✅ Ruta del endpoint correcta** (`/test-data`)
4. **✅ Export default del router** (confirmado en línea 329 de seed.routes.ts)

**Si sigue dando 404:**
- Verificar que el código desplegado en Railway incluya estos archivos
- Verificar logs de Railway para errores de importación
- Verificar que `npm run build` compile correctamente sin errores

---

## 📝 NOTAS

- El endpoint está correctamente implementado y registrado en el código
- El problema de 404 podría ser:
  1. Código no desplegado correctamente en Railway
  2. Variable de entorno `ENABLE_TEST_DATA` no configurada en Railway
  3. Error de compilación/build que impide que el endpoint esté disponible

---

**Estado:** ✅ Endpoint implementado y registrado correctamente en código  
**Acción requerida:** Verificar despliegue en Railway y variable de entorno `ENABLE_TEST_DATA`

