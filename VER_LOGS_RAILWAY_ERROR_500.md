# 🔍 Ver Logs del Backend para Error 500

## 📋 Pasos para Ver el Error Exacto

El error 500 indica que hay un problema en el servidor backend. Necesitamos ver los logs para identificar qué está fallando.

### Paso 1: Acceder a los Logs del Backend en Railway

**Opción A - Desde Logs (Recomendado):**
1. Ve a **Railway**: https://railway.app
2. Selecciona tu proyecto **CanalMedico**
3. Haz clic en el servicio **CanalMedico** (backend, no el frontend)
4. Ve a la pestaña **"Logs"** en la parte superior
5. **Los logs aparecerán en tiempo real**

**Opción B - Desde Deployments:**
1. Ve a **Railway** → Servicio **CanalMedico** (backend)
2. Ve a la pestaña **"Deployments"**
3. Haz clic en el deployment más reciente (el que está marcado como "ACTIVE")
4. Haz clic en **"View logs"** o en el icono de terminal 📟

---

### Paso 2: Reproducir el Error

**Mientras tienes los logs abiertos:**
1. **Intenta hacer login** desde el frontend:
   - Ve a: `https://canalmedico-web-production.up.railway.app/login`
   - Ingresa: `doctor1@ejemplo.com` / `doctor123`
   - Haz clic en "Iniciar sesión"

2. **O prueba desde Swagger:**
   - Ve a: `https://canalmedico-production.up.railway.app/api-docs`
   - Busca: `POST /api/auth/login`
   - Haz clic en "Try it out"
   - Ingresa las credenciales
   - Haz clic en "Execute"

3. **Vuelve a los logs** y verás el error aparecer en tiempo real

---

### Paso 3: Buscar el Error en los Logs

**Busca líneas que contengan:**
- `ERROR`
- `Error en login`
- `500`
- Stack traces (errores con líneas de código)
- Mensajes de error completos

**El error probablemente dirá algo como:**
- `JWT_SECRET is not defined` → Falta configurar JWT_SECRET
- `Cannot connect to database` → Problema con DATABASE_URL
- `PrismaClientInitializationError` → Problema de conexión a la base de datos
- `User not found` → Los usuarios no se crearon (ejecuta seed)
- Cualquier stack trace con detalles del error

---

### Paso 4: Copiar el Error Completo

**Cuando veas el error en los logs:**
1. **Selecciona todo el error** (el mensaje y el stack trace)
2. **Copia el error completo**
3. **Compártelo** para poder ayudarte a resolverlo

---

## 🔍 Errores Comunes y Soluciones

### Error: "JWT_SECRET is not defined"
**Solución:**
- Ve a Railway → Backend → Variables
- Agrega `JWT_SECRET` con un valor de al menos 32 caracteres
- Agrega `JWT_REFRESH_SECRET` con un valor de al menos 32 caracteres
- Haz redeploy

### Error: "Cannot connect to database"
**Solución:**
- Verifica que `DATABASE_URL` esté configurada
- Verifica que el servicio Postgres esté corriendo
- Verifica que las migraciones se hayan ejecutado

### Error: "User not found" o similar
**Solución:**
- Ejecuta `POST /api/seed` para crear los usuarios
- Verifica que el email y password sean correctos

### Error: Stack trace de Prisma
**Solución:**
- Verifica que las migraciones estén ejecutadas
- Revisa la conexión a la base de datos

---

## 📸 Cómo Compartir los Logs

**Si quieres compartir los logs:**
1. **Toma una captura de pantalla** de la parte relevante del error
2. **O copia y pega** el texto del error completo
3. **Incluye:**
   - El mensaje de error
   - El stack trace (si lo hay)
   - La hora/timestamp del error (para buscarlo más fácil)

---

## ✅ Qué Hacer Después

Una vez que identifiques el error:

1. **Si es un problema de variables:** Agrégalas y haz redeploy
2. **Si es un problema de base de datos:** Ejecuta las migraciones
3. **Si es un problema de usuarios:** Ejecuta el seed
4. **Si es otro error:** Comparte el error completo para ayudarte

---

## 🆘 Si No Puedes Ver los Logs

**Alternativas:**
1. **Prueba el endpoint directamente** en Swagger y revisa la respuesta de error
2. **Verifica que el backend esté funcionando:**
   - `https://canalmedico-production.up.railway.app/health`
   - Debería retornar: `{"status":"ok",...}`
3. **Verifica las variables de entorno** en Railway
4. **Haz un redeploy** del backend para ver si se soluciona

