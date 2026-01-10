# Credenciales de Prueba - FASE 2.2 E2E Validation

**Fecha:** 2024-11-23  
**Propósito:** Credenciales de prueba para validación End-to-End de FASE 2  
**⚠️ SOLO USAR EN ENTORNOS DE TEST**

---

## 🔐 CREDENCIALES DE PRUEBA

### ADMIN

**Email:** `admin@canalmedico.com`  
**Password:** `Admin123!`  
**Role:** `ADMIN`

**Nota:** Este usuario es creado automáticamente por `bootstrapTestAdmin()` si `ENABLE_TEST_ADMIN=true`

---

### DOCTOR

**Email:** `doctor.test@canalmedico.com`  
**Password:** `DoctorTest123!`  
**Role:** `DOCTOR`

**Perfil Doctor:**
- **Nombre:** Dr. Test User
- **Especialidad:** Medicina General
- **Tarifa Consulta:** $15,000 CLP
- **Tarifa Urgencia:** $25,000 CLP

**Crear con:**
```bash
POST https://canalmedico-production.up.railway.app/api/seed/test-data
# Requiere: ENABLE_TEST_DATA=true
```

---

### PATIENT

**Email:** `patient.test@canalmedico.com`  
**Password:** `PatientTest123!`  
**Role:** `PATIENT`

**Perfil Paciente:**
- **Nombre:** Paciente Test User
- **Edad:** 30 años

**Crear con:**
```bash
POST https://canalmedico-production.up.railway.app/api/seed/test-data
# Requiere: ENABLE_TEST_DATA=true
```

---

## 🚀 CREAR USUARIOS DE PRUEBA

### Opción 1: API Endpoint (Recomendado)

**Endpoint:** `POST /api/seed/test-data`

**Prerrequisito:**
- Configurar variable de entorno: `ENABLE_TEST_DATA=true` en Railway

**Request:**
```bash
curl -X POST https://canalmedico-production.up.railway.app/api/seed/test-data \
  -H "Content-Type: application/json"
```

**Respuesta Esperada (200 OK):**
```json
{
  "success": true,
  "message": "Usuarios de prueba creados/actualizados exitosamente",
  "credentials": {
    "ADMIN": {
      "email": "admin@canalmedico.com",
      "password": "Admin123!",
      "role": "ADMIN"
    },
    "DOCTOR": {
      "email": "doctor.test@canalmedico.com",
      "password": "DoctorTest123!",
      "role": "DOCTOR",
      "name": "Dr. Test User",
      "speciality": "Medicina General",
      "tarifaConsulta": 15000,
      "tarifaUrgencia": 25000
    },
    "PATIENT": {
      "email": "patient.test@canalmedico.com",
      "password": "PatientTest123!",
      "role": "PATIENT",
      "name": "Paciente Test User",
      "age": 30
    }
  },
  "ids": {
    "doctorId": "...",
    "patientId": "...",
    "adminId": "..."
  }
}
```

**Si ENABLE_TEST_DATA no está configurado:**
```json
{
  "success": false,
  "error": "Test data seed deshabilitado. Configure ENABLE_TEST_DATA=true para habilitarlo."
}
```

---

### Opción 2: Seed Manual (Legacy)

**Endpoint:** `POST /api/seed`

**Credenciales Legacy:**
- **Doctor:** `doctor1@ejemplo.com` / `doctor123`
- **Admin:** `admin@canalmedico.com` / `admin123`
- **Patient:** `paciente1@ejemplo.com` / `patient123`

**⚠️ NOTA:** Este endpoint crea usuarios con credenciales diferentes. Se recomienda usar `/api/seed/test-data` para FASE 2.2.

---

## 🔒 SEGURIDAD

### Variables de Entorno Requeridas

**Para habilitar creación de usuarios de prueba:**
```
ENABLE_TEST_DATA=true
```

**Para habilitar creación de admin de prueba:**
```
ENABLE_TEST_ADMIN=true
```

**⚠️ IMPORTANTE:**
- Estos flags NO deben estar activados en producción real (solo en staging/test)
- Los usuarios de prueba son idempotentes (pueden ejecutarse múltiples veces)
- Las contraseñas se resetean cada vez que se ejecuta el seed

---

## 📋 USO EN PRUEBAS E2E

### Escenario A: Login como PACIENTE

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient.test@canalmedico.com",
    "password": "PatientTest123!"
  }'
```

### Escenario B: Login como DOCTOR

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor.test@canalmedico.com",
    "password": "DoctorTest123!"
  }'
```

### Escenario C: Login como ADMIN

```bash
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@canalmedico.com",
    "password": "Admin123!"
  }'
```

---

## 🔄 RESETEAR USUARIOS DE PRUEBA

Si necesitas resetear los usuarios de prueba (por ejemplo, después de ejecutar pruebas):

```bash
# Ejecutar nuevamente el seed (idempotente)
curl -X POST https://canalmedico-production.up.railway.app/api/seed/test-data
```

Esto actualizará las contraseñas y asegurará que los usuarios existan con los datos correctos.

---

## ✅ VERIFICACIÓN

### Verificar que los usuarios existen

**Opción 1: Intentar login**
```bash
# Cada login debe retornar 200 OK con accessToken
```

**Opción 2: Verificar en base de datos (si tienes acceso)**
```sql
SELECT email, role FROM users 
WHERE email IN (
  'admin@canalmedico.com',
  'doctor.test@canalmedico.com',
  'patient.test@canalmedico.com'
);
```

---

**Última actualización:** 2024-11-23  
**Estado:** ✅ Credenciales definidas y documentadas

