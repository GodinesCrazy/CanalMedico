# 🔐 Bootstrap Admin - Instrucciones de Uso

## 📋 Resumen

El sistema ahora incluye un **bootstrap automático** que crea el usuario ADMIN de pruebas al iniciar el servidor, sin necesidad de scripts manuales ni shells interactivos.

## 🎯 Funcionamiento

### Cuándo se Ejecuta

El bootstrap se ejecuta **automáticamente** al iniciar el servidor, **antes** de que el servidor empiece a escuchar requests.

### Condiciones

El bootstrap **solo se ejecuta** si:
- ✅ `ENABLE_TEST_ADMIN=true` está configurado en las variables de entorno
- ✅ La base de datos está conectada

### Qué Hace

1. **Verifica** si existe el usuario `admin@canalmedico.test`
2. **Si existe:**
   - Verifica que el rol sea ADMIN
   - Si no es ADMIN, lo actualiza a ADMIN
   - Log: `[BOOTSTRAP] Admin de pruebas ya existe`
3. **Si NO existe:**
   - Crea el usuario con:
     - Email: `admin@canalmedico.test`
     - Password: `Admin123!` (hasheada con bcrypt)
     - Role: `ADMIN`
   - Log: `[BOOTSTRAP] Admin creado correctamente`

## ⚙️ Configuración en Railway

### Paso 1: Agregar Variable de Entorno

1. Ve a tu proyecto en Railway: https://railway.app
2. Selecciona el servicio **backend**
3. Ve a la pestaña **"Variables"**
4. Agrega una nueva variable:
   - **Nombre**: `ENABLE_TEST_ADMIN`
   - **Valor**: `true`
5. Guarda los cambios

### Paso 2: Deploy

Railway detectará el cambio y hará un nuevo deploy automáticamente.

### Paso 3: Verificar Logs

Después del deploy, revisa los logs del servicio backend. Deberías ver:

```
[BOOTSTRAP] Verificando admin de pruebas...
[BOOTSTRAP] Admin creado correctamente
[BOOTSTRAP] Email: admin@canalmedico.test
[BOOTSTRAP] ID: clx...
[BOOTSTRAP] ✅ Admin de pruebas listo para uso
```

O si ya existe:

```
[BOOTSTRAP] Verificando admin de pruebas...
[BOOTSTRAP] Admin de pruebas ya existe
```

## 🔑 Credenciales de Acceso

Una vez que el bootstrap se ejecute exitosamente, podrás iniciar sesión con:

- **URL**: https://canalmedico-web-production.up.railway.app/login
- **Email**: `admin@canalmedico.test`
- **Password**: `Admin123!`
- **Rol**: `ADMIN`

## 🧪 Cómo Verificar en Logs

### En Railway Dashboard:

1. Ve a tu servicio backend
2. Haz clic en la pestaña **"Logs"**
3. Busca líneas que contengan `[BOOTSTRAP]`

### Logs Esperados:

**Si el admin se crea:**
```
[BOOTSTRAP] Verificando admin de pruebas...
[BOOTSTRAP] Creando admin de pruebas...
[BOOTSTRAP] Admin creado correctamente
[BOOTSTRAP] Email: admin@canalmedico.test
[BOOTSTRAP] ID: clx1234567890
[BOOTSTRAP] ✅ Admin de pruebas listo para uso
```

**Si el admin ya existe:**
```
[BOOTSTRAP] Verificando admin de pruebas...
[BOOTSTRAP] Admin de pruebas ya existe
```

**Si está deshabilitado:**
```
[BOOTSTRAP] Admin de pruebas deshabilitado (ENABLE_TEST_ADMIN=false)
```

## ✅ Confirmación de que el Login Admin Funciona

### Prueba Manual:

1. Abre: https://canalmedico-web-production.up.railway.app/login
2. Ingresa:
   - Email: `admin@canalmedico.test`
   - Password: `Admin123!`
3. Haz clic en "Iniciar sesión"
4. **Resultado esperado:**
   - ✅ Redirección al Dashboard
   - ✅ Menú lateral muestra opciones de ADMIN:
     - Dashboard
     - Consultas
     - **Comisiones** (solo ADMIN)
     - **Solicitudes de Registro** (solo ADMIN)
     - Configuración
     - Perfil

### Verificación en Backend:

Puedes verificar que el usuario existe ejecutando:

```bash
# En Railway Shell (si tienes acceso):
npx prisma studio
```

O consultando directamente la base de datos.

## 🔒 Seguridad

### Protecciones Implementadas:

1. ✅ **Flag de habilitación**: Solo se ejecuta si `ENABLE_TEST_ADMIN=true`
2. ✅ **Contraseña hasheada**: Usa el mismo método que el login (`hashPassword`)
3. ✅ **Idempotente**: No falla si el usuario ya existe
4. ✅ **No bloquea el servidor**: Si falla, el servidor continúa iniciando
5. ✅ **Logs claros**: Fácil de rastrear y depurar

### Recomendaciones:

- ⚠️ **Solo para pruebas**: Estas credenciales son para entorno de pruebas
- ⚠️ **Cambiar en producción real**: En producción real, desactivar `ENABLE_TEST_ADMIN=false`
- ⚠️ **No documentar públicamente**: No incluir estas credenciales en documentación pública

## 🛠️ Troubleshooting

### El admin no se crea

**Verificar:**
1. ¿`ENABLE_TEST_ADMIN=true` está configurado?
2. ¿La base de datos está conectada?
3. ¿Hay errores en los logs?

**Solución:**
- Revisa los logs para ver el error específico
- Verifica que `DATABASE_URL` esté configurada correctamente
- Asegúrate de que el flag esté en `true` (no `"true"` como string)

### El login devuelve 401

**Verificar:**
1. ¿El usuario fue creado? (revisar logs)
2. ¿La contraseña es correcta? (`Admin123!`)
3. ¿El email es exacto? (`admin@canalmedico.test`)

**Solución:**
- Verifica los logs del bootstrap
- Intenta resetear la contraseña ejecutando el seed manualmente (si es necesario)

### El admin existe pero no puede acceder a rutas ADMIN

**Verificar:**
1. ¿El rol es `ADMIN`? (revisar en base de datos)
2. ¿El token JWT incluye el rol correcto?

**Solución:**
- El bootstrap actualiza el rol automáticamente si no es ADMIN
- Cierra sesión y vuelve a iniciar sesión para obtener un nuevo token

## 📝 Archivos Modificados

- `backend/src/bootstrap/admin.ts` - Lógica del bootstrap
- `backend/src/server.ts` - Integración del bootstrap al inicio
- `backend/src/config/env.ts` - Variable `ENABLE_TEST_ADMIN`

## 🎯 Resultado Final

Tras configurar `ENABLE_TEST_ADMIN=true` y hacer deploy:

✅ El backend arranca  
✅ El bootstrap se ejecuta automáticamente  
✅ El admin se crea (si no existe) o se verifica (si existe)  
✅ Se puede iniciar sesión con las credenciales de prueba  
✅ El login admin funciona correctamente  

---

**Última actualización**: Enero 2025

