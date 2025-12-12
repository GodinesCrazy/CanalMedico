# ?? Gu�a de Pruebas - Sistema de Validaci�n de M�dicos

**Versi�n:** 1.3.0  
**Fecha:** Enero 2025

---

## ?? PRUEBAS MANUALES

### 1. Prueba de Validaci�n de Identidad

**Endpoint:** `POST /api/medicos/validar-identidad`

**Request:**
```json
{
  "rut": "12345678-9",
  "name": "Juan P�rez Gonz�lez",
  "birthDate": "1980-01-15"
}
```

**Escenarios a probar:**
- ? RUN v�lido con nombre que coincide
- ? RUN v�lido con nombre que NO coincide
- ? RUN inv�lido (DV incorrecto)
- ?? Timeout (si Floid no responde)

### 2. Prueba de Validaci�n RNPI

**Endpoint:** `POST /api/medicos/validar-rnpi`

**Request:**
```json
{
  "rut": "12345678-9",
  "name": "Dr. Juan P�rez",
  "specialty": "Medicina General"
}
```

**Escenarios a probar:**
- ? M�dico habilitado ? `RNPI_OK`
- ? No es m�dico ? `RNPI_PROFESION_INVALIDA`
- ? M�dico suspendido ? `RNPI_NO_HABILITADO`
- ? No existe en RNPI ? `RNPI_NO_EXISTE`
- ?? Inconsistencias de nombre ? `RNPI_INCONSISTENCIA_NOMBRE`

### 3. Prueba de Verificaci�n Completa

**Endpoint:** `POST /api/medicos/validacion-completa`  
**Requiere:** Autenticaci�n (JWT de m�dico)

**Request:**
```json
{
  "rut": "12345678-9",
  "name": "Dr. Juan P�rez Gonz�lez",
  "birthDate": "1980-01-15",
  "specialty": "Medicina General"
}
```

**Escenarios:**
1. **Todo OK:**
   - Identidad: `IDENTIDAD_VERIFICADA`
   - RNPI: `RNPI_OK`
   - Resultado: `VERIFICADO`

2. **RUN Inv�lido:**
   - Identidad: `RUN_INVALIDO`
   - Resultado: `RECHAZADO_EN_IDENTIDAD`

3. **No es M�dico:**
   - Identidad: `IDENTIDAD_VERIFICADA`
   - RNPI: `RNPI_PROFESION_INVALIDA`
   - Resultado: `RECHAZADO_EN_RNPI`

4. **Inconsistencias:**
   - Identidad: `IDENTIDAD_VERIFICADA`
   - RNPI: `RNPI_INCONSISTENCIA_NOMBRE`
   - Resultado: `REVISION_MANUAL`

### 4. Consultar Estado de Verificaci�n

**Endpoint:** `GET /api/medicos/:id/estado-validacion`  
**Requiere:** Autenticaci�n

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "doctorId": "...",
    "identidadValidada": true,
    "profesionValidada": true,
    "rnpiEstado": "HABILITADO",
    "rnpiProfesion": "M�dico Cirujano",
    "estadoFinal": "VERIFICADO",
    "ultimaVerificacion": "2025-01-15T10:30:00Z",
    "errores": [],
    "logs": { ... }
  }
}
```

### 5. Re-verificar M�dico (Admin)

**Endpoint:** `POST /api/admin/revalidar-medico/:id`  
**Requiere:** Autenticaci�n + Rol ADMIN

**Escenarios:**
- ? Re-verificar m�dico existente
- ? Intentar re-verificar sin ser admin
- ? M�dico no encontrado

---

## ?? PRUEBAS AUTOM�TICAS

### Ejecutar Pruebas

```bash
cd backend
npm test
```

### Pruebas Unitarias

- `tests/doctorVerification/identity-verification.test.ts`
- `tests/doctorVerification/rnpi-verification.test.ts`
- `tests/doctorVerification/doctor-verification-pipeline.test.ts`

### Cobertura

```bash
npm run test:coverage
```

---

## ?? CHECKLIST DE PRUEBAS

### Backend
- [x] Endpoints responden correctamente
- [x] Validaci�n de RUT funciona
- [x] Manejo de errores robusto
- [x] Logs se guardan correctamente
- [ ] Pruebas unitarias pasan
- [ ] Pruebas de integraci�n pasan

### Integraci�n
- [ ] Floid responde correctamente (con credenciales)
- [ ] RNPI responde correctamente (con API disponible)
- [ ] Fallbacks funcionan si servicios externos fallan
- [ ] Datos se guardan en BD correctamente

### Seguridad
- [ ] Solo m�dicos pueden verificar su propia cuenta
- [ ] Solo admins pueden re-verificar
- [ ] Datos sensibles no se exponen
- [ ] Rate limiting funciona

---

## ?? DEBUGGING

### Ver Logs

```bash
# En Railway o servidor
tail -f logs/app.log | grep "verificacion"
```

### Probar sin APIs Externas

Si Floid o RNPI no est�n disponibles, el sistema:
- Marca para `REVISION_MANUAL` si RC no responde
- Marca para `REVISION_MANUAL` si RNPI no responde
- Guarda errores en `verificationErrors`

---

**Gu�a de pruebas completada.** ?
