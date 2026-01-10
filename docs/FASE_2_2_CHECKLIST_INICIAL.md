# FASE 2.2 - Checklist Inicial de Validación E2E

**Fecha:** 2024-11-23  
**Responsable:** QA Lead Senior + Product Owner + Auditor Técnico  
**Objetivo:** Verificar que el backend en Railway está operativo antes de ejecutar pruebas E2E

---

## ✅ PASO 1 — VERIFICACIÓN INICIAL

### 1.1 Backend Arranca Sin Errores

**Verificación:**
- [ ] Backend desplegado en Railway
- [ ] Logs de Railway muestran: `✅ Conexión a la base de datos establecida`
- [ ] Logs de Railway muestran: `🚀 Servidor escuchando en el puerto...`
- [ ] No hay errores críticos en los logs

**Estado:** ⏳ PENDIENTE DE VERIFICACIÓN  
**Evidencia:** Revisar logs de Railway en: `https://railway.app`

---

### 1.2 Migración Aplicada (price, startedAt, endedAt)

**Verificación SQL:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'consultations'
AND column_name IN ('price', 'startedAt', 'endedAt');
```

**Resultado Esperado:**
- `price`: INTEGER, NOT NULL, DEFAULT 0
- `startedAt`: TIMESTAMP(3), NULLABLE
- `endedAt`: TIMESTAMP(3), NULLABLE

**Estado:** ⏳ PENDIENTE DE VERIFICACIÓN  
**Evidencia:** Ejecutar query en PostgreSQL de Railway o verificar logs de migración

**Logs Esperados en Railway:**
```
🔄 Ejecutando migraciones de la base de datos...
✅ Schema sincronizado correctamente con db push
🔄 Regenerando Prisma Client...
✅ Prisma Client regenerado correctamente
```

---

### 1.3 Endpoint /health Responde OK

**Request:**
```bash
GET https://canalmedico-production.up.railway.app/health
```

**Respuesta Esperada:**
```json
{
  "status": "UP",
  "timestamp": "2024-11-23T..."
}
```

**Status Code Esperado:** `200 OK`

**Estado:** ⏳ PENDIENTE DE VERIFICACIÓN  
**Evidencia:** Ejecutar request y capturar respuesta

---

### 1.4 Endpoint POST /api/auth/login Responde

**Request:**
```bash
POST https://canalmedico-production.up.railway.app/api/auth/login
Content-Type: application/json

{
  "email": "admin@canalmedico.com",
  "password": "Admin123!"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@canalmedico.com",
      "role": "ADMIN"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Estado:** ⏳ PENDIENTE DE VERIFICACIÓN  
**Evidencia:** Ejecutar request y capturar respuesta

---

## 📊 RESUMEN DE CHECKLIST

| Item | Estado | Observaciones |
|------|--------|---------------|
| Backend arranca sin errores | ⏳ | Pendiente de verificación |
| Migración aplicada | ⏳ | Pendiente de verificación |
| /health responde OK | ⏳ | Pendiente de verificación |
| POST /api/auth/login responde | ⏳ | Pendiente de verificación |

---

## 🚨 BLOQUEANTES

Si alguno de estos checks falla, **NO proceder** con las pruebas E2E hasta resolver:

1. ❌ Backend no arranca → Verificar variables de entorno en Railway
2. ❌ Migración no aplicada → Verificar logs de `runMigrations()` en Railway
3. ❌ /health no responde → Backend no está funcionando
4. ❌ POST /api/auth/login no responde → Problema con autenticación

---

## 📝 PRÓXIMOS PASOS

Una vez que todos los checks pasen:

1. ✅ Crear usuarios de prueba (ADMIN, DOCTOR, PACIENTE)
2. ✅ Ejecutar pruebas E2E (Escenarios A-E)
3. ✅ Ejecutar tests negativos (RBAC)
4. ✅ Documentar hallazgos
5. ✅ Emitir veredicto GO/NO-GO

---

**Última actualización:** 2024-11-23  
**Estado general:** ⏳ PENDIENTE DE VERIFICACIÓN

