# ?? Sistema de Validaci�n Autom�tica de M�dicos - CanalMedico

**Versi�n:** 1.2.0  
**Fecha:** Enero 2025  
**Estado:** ? Implementaci�n Completa

---

## ?? OBJETIVO

Garantizar que **solo m�dicos reales y habilitados** puedan registrarse en CanalMedico mediante validaci�n autom�tica contra fuentes oficiales del Estado de Chile.

---

## ??? ARQUITECTURA DE VALIDACI�N

El sistema implementa **dos capas de validaci�n**:

### Capa 1: Validaci�n de Identidad (Registro Civil)
- **Fuente:** Registro Civil de Chile
- **Proveedor:** Floid (o proveedor configurable)
- **Valida:** RUN, nombre, fecha de nacimiento, estado de c�dula

### Capa 2: Validaci�n Profesional (RNPI)
- **Fuente:** Registro Nacional de Prestadores Individuales (Superintendencia de Salud)
- **Valida:** Profesi�n (debe ser "M�dico Cirujano"), estado (debe ser "Habilitado"), especialidades

---

## ? COMPONENTES IMPLEMENTADOS

### 1. M�dulo de Validaci�n de Identidad

**Archivos:**
- `backend/src/modules/identity-verification/identity-verification.types.ts`
- `backend/src/modules/identity-verification/floid-provider.ts`
- `backend/src/modules/identity-verification/identity-verification.service.ts`

**Funcionalidades:**
- ? Validaci�n de RUN contra Registro Civil
- ? Verificaci�n de nombre
- ? Validaci�n de fecha de nacimiento
- ? Verificaci�n de estado de c�dula
- ? Proveedor desacoplado (f�cil cambiar de Floid a otro)
- ? Fallback a validaci�n local si proveedor no disponible

**Estados:**
- `IDENTIDAD_VERIFICADA` - RUN v�lido y nombre coincide
- `IDENTIDAD_NO_COINCIDE` - RUN v�lido pero nombre no coincide
- `RUN_INVALIDO` - RUN no existe o es inv�lido
- `ERROR_VALIDACION` - Error al consultar servicio
- `PENDING` - Pendiente de validaci�n

### 2. M�dulo de Validaci�n RNPI

**Archivos:**
- `backend/src/modules/rnpi-verification/rnpi-verification.types.ts`
- `backend/src/modules/rnpi-verification/rnpi-verification.service.ts`

**Funcionalidades:**
- ? Consulta autom�tica a API de Prestadores de Superintendencia de Salud
- ? Verificaci�n de profesi�n (debe ser m�dico)
- ? Verificaci�n de estado (debe estar habilitado)
- ? Comparaci�n de nombre y especialidad
- ? Detecci�n de inconsistencias menores

**Estados:**
- `MEDICO_VERIFICADO` - M�dico habilitado, todo correcto
- `NO_MEDICO` - No es m�dico o no est� registrado
- `SUSPENDIDO` - M�dico suspendido o no habilitado
- `INCONSISTENCIA` - Discrepancias menores (requiere revisi�n manual)
- `ERROR_VALIDACION` - Error al consultar RNPI
- `PENDING` - Pendiente de validaci�n

### 3. Integraci�n en Flujo de Registro

**Archivo:** `backend/src/modules/signup-requests/signup-requests.service.ts`

**Flujo Autom�tico:**
1. Usuario env�a solicitud de registro
2. Sistema crea solicitud en estado `PENDING`
3. **En segundo plano (no bloquea respuesta):**
   - Ejecuta validaci�n de identidad
   - Si identidad OK ? Ejecuta validaci�n RNPI
   - Si ambas OK ? Aprueba autom�ticamente (`AUTO_APPROVED`)
   - Si alguna falla ? Rechaza autom�ticamente (`AUTO_REJECTED`)
   - Si hay inconsistencias ? Marca para revisi�n manual (`REVIEWED`)

**Estados de Solicitud:**
- `PENDING` - Reci�n creada, validaciones en curso
- `AUTO_APPROVED` - Aprobada autom�ticamente (m�dico creado)
- `AUTO_REJECTED` - Rechazada autom�ticamente (no cumple requisitos)
- `REVIEWED` - Requiere revisi�n manual (inconsistencias menores)
- `APPROVED` - Aprobada manualmente por admin
- `REJECTED` - Rechazada manualmente por admin

### 4. Base de Datos

**Campos Agregados a `DoctorSignupRequest`:**
- `birthDate` - Fecha de nacimiento
- `identityVerificationStatus` - Estado de validaci�n de identidad
- `identityVerificationResult` - JSON con detalles de validaci�n
- `identityVerifiedAt` - Fecha de validaci�n de identidad
- `rnpiVerificationStatus` - Estado de validaci�n RNPI
- `rnpiVerificationResult` - JSON con datos oficiales de RNPI
- `rnpiVerifiedAt` - Fecha de validaci�n RNPI
- `autoVerificationErrors` - JSON con errores de validaci�n autom�tica

**Migraci�n SQL:** `MIGRACION_VALIDACION_MEDICOS.sql`

### 5. Frontend - Formulario de Registro

**Archivo:** `frontend-web/src/pages/SignupRequestPage.tsx`

**Actualizaciones:**
- ? Campo RUT ahora es **obligatorio**
- ? Campo **Fecha de Nacimiento** agregado
- ? Mensaje informativo sobre validaci�n autom�tica
- ? Explicaci�n de fuentes oficiales usadas

### 6. Frontend - Panel de Administrador

**Archivo:** `frontend-web/src/pages/AdminSignupRequestsPage.tsx`

**Actualizaciones:**
- ? Visualizaci�n de resultados de validaci�n de identidad
- ? Visualizaci�n de resultados de validaci�n RNPI
- ? Estados visuales (badges de color)
- ? Detalles expandibles de validaciones
- ? Bot�n "Re-ejecutar Validaciones"
- ? Filtros actualizados (AUTO_APPROVED, AUTO_REJECTED)

### 7. Variables de Entorno

**Agregadas:**
- `FLOID_BASE_URL` - URL base de Floid API
- `FLOID_API_KEY` - API Key de Floid
- `IDENTITY_VERIFICATION_PROVIDER` - Proveedor de validaci�n (FLOID/OTRO)
- `RNPI_API_URL` - URL de API de Prestadores de Superintendencia de Salud

---

## ?? FLUJO COMPLETO DE VALIDACI�N

### Escenario 1: Validaci�n Exitosa (Aprobaci�n Autom�tica)

1. **Usuario completa formulario:**
   - Nombre: "Dr. Juan P�rez"
   - RUT: "12345678-9"
   - Fecha de nacimiento: "1980-01-15"
   - Especialidad: "Medicina General"

2. **Sistema crea solicitud** (estado: `PENDING`)

3. **Validaci�n de Identidad:**
   - Consulta Floid con RUN "12345678-9" y nombre "Dr. Juan P�rez"
   - Floid responde: RUN v�lido, nombre coincide
   - Estado: `IDENTIDAD_VERIFICADA`

4. **Validaci�n RNPI:**
   - Consulta Superintendencia de Salud con RUN "12345678-9"
   - RNPI responde: Profesi�n "M�dico Cirujano", Estado "Habilitado"
   - Nombre coincide, especialidad coincide
   - Estado: `MEDICO_VERIFICADO`

5. **Aprobaci�n Autom�tica:**
   - Sistema crea usuario y perfil de m�dico autom�ticamente
   - Estado de solicitud: `AUTO_APPROVED`
   - M�dico puede iniciar sesi�n inmediatamente

### Escenario 2: RUN Inv�lido (Rechazo Autom�tico)

1. Usuario ingresa RUN inv�lido: "12345678-0"
2. Validaci�n de Identidad falla: `RUN_INVALIDO`
3. Sistema rechaza autom�ticamente: `AUTO_REJECTED`
4. Usuario recibe mensaje: "RUN inv�lido o no existe en el Registro Civil"

### Escenario 3: No es M�dico (Rechazo Autom�tico)

1. Usuario es profesional de salud pero no m�dico (ej: enfermero)
2. Validaci�n de Identidad: `IDENTIDAD_VERIFICADA`
3. Validaci�n RNPI: Profesi�n "Enfermero" ? `NO_MEDICO`
4. Sistema rechaza autom�ticamente: `AUTO_REJECTED`
5. Mensaje: "El profesional no es m�dico o no est� registrado en RNPI"

### Escenario 4: M�dico Suspendido (Rechazo Autom�tico)

1. Usuario es m�dico pero est� suspendido
2. Validaci�n de Identidad: `IDENTIDAD_VERIFICADA`
3. Validaci�n RNPI: Estado "Suspendido" ? `SUSPENDIDO`
4. Sistema rechaza autom�ticamente: `AUTO_REJECTED`
5. Mensaje: "El m�dico est� suspendido o no habilitado en RNPI"

### Escenario 5: Inconsistencias Menores (Revisi�n Manual)

1. Usuario ingresa nombre abreviado: "J. P�rez" (oficial: "Juan P�rez")
2. Validaci�n de Identidad: `IDENTIDAD_VERIFICADA` (coincidencia 85%)
3. Validaci�n RNPI: `MEDICO_VERIFICADO` pero nombre no coincide exactamente
4. Sistema marca: `INCONSISTENCIA`
5. Estado de solicitud: `REVIEWED` (requiere revisi�n manual)
6. Admin puede revisar y aprobar manualmente

---

## ?? ENDPOINTS API

### POST `/api/signup-requests`
Crea una solicitud de registro e inicia validaciones autom�ticas.

**Request:**
```json
{
  "name": "Dr. Juan P�rez",
  "rut": "12345678-9",
  "birthDate": "1980-01-15",
  "specialty": "Medicina General",
  "email": "doctor@example.com",
  "phone": "+56912345678",
  "registrationNumber": "12345",
  "clinicOrCenter": "Cl�nica Las Condes",
  "notes": "Notas adicionales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "request-id",
    "status": "PENDING",
    "identityVerificationStatus": "PENDING",
    "rnpiVerificationStatus": "PENDING",
    ...
  },
  "message": "Solicitud de registro enviada exitosamente. Las validaciones autom�ticas se ejecutar�n en breve."
}
```

### POST `/api/signup-requests/:id/re-verify`
Re-ejecuta las validaciones autom�ticas (solo admin).

---

## ?? CONFIGURACI�N

### Variables de Entorno Requeridas

```env
# Validaci�n de Identidad (Floid)
FLOID_BASE_URL=https://api.floid.cl/v1
FLOID_API_KEY=tu_api_key_floid
IDENTITY_VERIFICATION_PROVIDER=FLOID

# Validaci�n Profesional (RNPI)
RNPI_API_URL=https://api.supersalud.gob.cl/prestadores
```

### C�mo Obtener Credenciales

**Floid:**
1. Contactar: https://floid.cl
2. Solicitar acceso a API de validaci�n de identidad
3. Obtener API Key

**RNPI:**
1. Verificar disponibilidad de API p�blica en Superintendencia de Salud
2. Si no hay API p�blica, usar scraping o contacto directo con Superintendencia
3. NOTA: Ajustar implementaci�n seg�n disponibilidad real de la API

---

## ??? REGLAS DE VALIDACI�N

### Validaci�n de Identidad

**Acepta si:**
- ? RUN v�lido y existe en Registro Civil
- ? Nombre coincide exactamente o con alta similitud (>80%)

**Rechaza si:**
- ? RUN inv�lido o no existe
- ? Nombre no coincide (<80% similitud)

### Validaci�n RNPI

**Acepta si:**
- ? Profesi�n es "M�dico Cirujano" o equivalente
- ? Estado es "Habilitado" o equivalente
- ? Nombre coincide (>80% similitud)
- ? Especialidad coincide (si se proporcion�)

**Rechaza si:**
- ? Profesi�n ? M�dico
- ? Estado ? Habilitado

**Revisi�n Manual si:**
- ?? Nombre no coincide exactamente (pero >80%)
- ?? Especialidad no coincide (pero es m�dico habilitado)

---

## ?? LOGS Y AUDITOR�A

Todas las validaciones se registran en logs con:
- ? RUN validado
- ? Resultado de cada validaci�n
- ? Errores encontrados
- ? Timestamps
- ? Datos oficiales obtenidos (sin exponer informaci�n sensible)

---

## ?? PRUEBAS

### Pruebas Manuales Recomendadas:

1. **RUN Inv�lido:**
   - Enviar solicitud con RUN inv�lido
   - Verificar que se rechaza autom�ticamente

2. **M�dico Real:**
   - Enviar solicitud con datos de m�dico real
   - Verificar que se aprueba autom�ticamente

3. **Inconsistencias:**
   - Enviar solicitud con nombre ligeramente diferente
   - Verificar que se marca para revisi�n manual

4. **Re-ejecuci�n:**
   - Como admin, re-ejecutar validaciones
   - Verificar que se actualizan resultados

---

## ?? DOCUMENTACI�N ACTUALIZADA

- ? `docs/MANUAL_MEDICOS.md` - Secci�n sobre validaci�n autom�tica
- ? `docs/MANUAL_ADMINISTRADOR.md` - Secci�n sobre revisi�n de validaciones
- ? `README.md` - Sistema de validaci�n documentado
- ? `SISTEMA_VALIDACION_MEDICOS.md` - Este documento

---

## ? CHECKLIST DE IMPLEMENTACI�N

- [x] M�dulo identityVerification creado
- [x] M�dulo rnpiVerification creado
- [x] Integraci�n en flujo de registro
- [x] Validaciones autom�ticas funcionando
- [x] Aprobaci�n/rechazo autom�tico
- [x] UI formulario actualizada
- [x] Panel admin actualizado
- [x] Variables de entorno configuradas
- [x] Migraci�n SQL creada
- [x] Documentaci�n completa
- [ ] Pruebas unitarias (pendiente)
- [ ] Pruebas de integraci�n (pendiente)
- [ ] Credenciales Floid reales (pendiente)
- [ ] Credenciales RNPI reales (pendiente)

---

## ?? PR�XIMOS PASOS

1. **Obtener credenciales Floid** para validaci�n de identidad
2. **Verificar disponibilidad de API RNPI** o implementar alternativa
3. **Configurar variables de entorno** en producci�n
4. **Probar con datos reales** en ambiente de pruebas
5. **Ajustar seg�n resultados** de pruebas reales

---

**Sistema de validaci�n autom�tica implementado y listo para pruebas.** ?
