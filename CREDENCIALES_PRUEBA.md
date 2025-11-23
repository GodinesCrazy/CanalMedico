# 🔐 Credenciales de Prueba - CanalMedico

## 📋 Usuarios de Prueba

Estas credenciales son creadas automáticamente por el sistema de seed. Si los usuarios no existen, puedes crearlos ejecutando el seed.

### 👨‍⚕️ **MÉDICO (Doctor)**

```
Email:    doctor1@ejemplo.com
Password: doctor123
```

**Perfil:**
- Nombre: Dr. Juan Pérez
- RUT: 12345678-9
- Especialidad: Medicina General
- Tarifa Consulta: $15,000 CLP
- Tarifa Urgencia: $25,000 CLP
- Estado Online: false (inicialmente)

---

### 👤 **ADMINISTRADOR (Admin)**

```
Email:    admin@canalmedico.com
Password: admin123
```

**Perfil:**
- Rol: ADMIN
- Acceso completo al sistema

---

### 🏥 **PACIENTE (Patient)**

```
Email:    paciente1@ejemplo.com
Password: patient123
```

**Perfil:**
- Nombre: María González
- Edad: 30 años

---

## 🚀 Cómo Crear/Actualizar los Usuarios de Prueba

### Opción 1: Endpoint API (Recomendado en Producción)

```bash
POST https://canalmedico-production.up.railway.app/api/seed
```

Este endpoint crea o actualiza los usuarios de prueba en la base de datos.

**Respuesta:**
```json
{
  "success": true,
  "message": "Base de datos poblada exitosamente",
  "users": [
    { "email": "doctor1@ejemplo.com", "password": "doctor123", "role": "DOCTOR" },
    { "email": "admin@canalmedico.com", "password": "admin123", "role": "ADMIN" },
    { "email": "paciente1@ejemplo.com", "password": "patient123", "role": "PATIENT" }
  ]
}
```

### Opción 2: Comando Local (Desarrollo)

Desde la carpeta `backend`:

```bash
npx prisma db seed
```

O directamente:

```bash
npx ts-node prisma/seed.ts
```

---

## 🔗 URLs de Acceso

### Frontend Web (Panel de Médicos)
```
https://canalmedico-web-production.up.railway.app
```

### Backend API (Swagger Docs)
```
https://canalmedico-production.up.railway.app/api-docs
```

---

## 📝 Notas Importantes

1. **Estas credenciales son solo para pruebas** - NO uses estas contraseñas en producción real
2. **Los usuarios se crean con `upsert`** - Si ya existen, se actualizarán (pero las contraseñas se mantendrán iguales)
3. **El seed es idempotente** - Puedes ejecutarlo múltiples veces sin crear duplicados
4. **Las contraseñas están hasheadas** con bcrypt usando 10 salt rounds

---

## 🧪 Probar el Login

### Usando cURL:

```bash
# Login como Doctor
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor1@ejemplo.com",
    "password": "doctor123"
  }'

# Login como Admin
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@canalmedico.com",
    "password": "admin123"
  }'

# Login como Paciente
curl -X POST https://canalmedico-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente1@ejemplo.com",
    "password": "patient123"
  }'
```

### Usando Swagger UI:

1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca el endpoint `POST /api/auth/login`
3. Haz clic en "Try it out"
4. Ingresa las credenciales en el body JSON
5. Haz clic en "Execute"

---

## ⚠️ Seguridad

- En producción, considera eliminar o proteger el endpoint `/api/seed` con autenticación adicional
- No compartas estas credenciales públicamente
- Usa contraseñas seguras para usuarios reales en producción

