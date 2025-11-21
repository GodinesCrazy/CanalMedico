# 🚀 Guía Paso a Paso: Desplegar Frontend Web en Railway

El backend está funcionando correctamente ✅. Ahora necesitas desplegar el frontend web como un **segundo servicio** en Railway.

---

## 📋 Paso 1: Crear Nuevo Servicio para Frontend Web

### 1.1. Ir a tu Proyecto en Railway

1. Ve a [Railway](https://railway.app/)
2. Inicia sesión
3. Haz clic en tu proyecto (el que tiene el backend `CanalMedico`)

### 1.2. Agregar Nuevo Servicio

1. En tu proyecto, haz clic en el botón **"+ New"** (arriba a la derecha)
2. Selecciona **"GitHub Repo"**
3. Si aparece una lista, selecciona tu repositorio: `GodinesCrazy/CanalMedico`
4. Si no aparece, haz clic en **"Configure GitHub App"** y conecta tu repositorio

### 1.3. Configurar Root Directory (MUY IMPORTANTE ⚠️)

1. Después de seleccionar el repositorio, **NO hagas clic en "Deploy" todavía**
2. Ve a la pestaña **"Settings"** (si no la ves, espera a que aparezca)
3. Busca la sección **"Root Directory"** o **"Source"**
4. **Configura el Root Directory como:** `frontend-web`
   - Debe ser exactamente `frontend-web` (sin espacios, sin barras)
5. Haz clic en **"Save"** o **"Deploy"**

**⚠️ CRÍTICO:** Si no configuras el Root Directory, Railway intentará construir todo el repositorio y fallará.

---

## 📋 Paso 2: Configurar Variables de Entorno

### 2.1. Ir a Variables

1. Una vez que el servicio esté creado, haz clic en el servicio (debería llamarse algo como `CanalMedico` o similar)
2. Ve a la pestaña **"Variables"**

### 2.2. Agregar Variables

Agrega las siguientes variables:

**Variable 1: VITE_API_URL**
- **Nombre:** `VITE_API_URL`
- **Valor:** `https://canalmedico-production.up.railway.app`
- **Descripción:** URL del backend API

**Variable 2: VITE_STRIPE_PUBLISHABLE_KEY (Opcional por ahora)**
- **Nombre:** `VITE_STRIPE_PUBLISHABLE_KEY`
- **Valor:** (déjalo vacío o usa `pk_test_...` si tienes Stripe configurado)
- **Descripción:** Clave pública de Stripe

**Variable 3: Variables de Firebase (Opcional por ahora)**
- Puedes dejarlas vacías por ahora si no tienes Firebase configurado

**Nota:** Las variables que empiezan con `VITE_` son las que Vite expone al frontend. Todas las demás se ignoran.

---

## 📋 Paso 3: Verificar Configuración de Build

### 3.1. Ir a Settings

1. En el servicio del frontend, ve a **"Settings"**
2. Haz clic en **"Build & Deploy"**

### 3.2. Verificar Comandos

Verifica que estén configurados así:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run preview
```

**Output Directory:**
```
dist
```

**Root Directory:**
```
frontend-web
```

Si alguno de estos no coincide, cámbialo manualmente.

---

## 📋 Paso 4: Esperar el Build

### 4.1. Monitorear el Build

1. Ve a la pestaña **"Deployments"** o **"Deploy Logs"**
2. Verás el proceso de build en tiempo real
3. Espera a que termine (puede tardar 2-5 minutos la primera vez)

### 4.2. Verificar que el Build sea Exitoso

**Deberías ver:**
- ✅ `npm install` ejecutándose
- ✅ `npm run build` ejecutándose
- ✅ `vite build` completándose
- ✅ Build exitoso

**Si hay errores:**
- Revisa los logs
- Verifica que el Root Directory esté configurado como `frontend-web`
- Verifica que las variables de entorno estén correctas

---

## 📋 Paso 5: Generar Dominio

### 5.1. Ir a Networking

1. En el servicio del frontend, ve a **"Settings"**
2. Haz clic en **"Networking"**

### 5.2. Generar Dominio

1. Haz clic en **"Generate Domain"**
2. Railway generará una URL automática (ejemplo: `https://frontend-web-production-xxxx.up.railway.app`)
3. **Copia esta URL** - la necesitarás en el siguiente paso

---

## 📋 Paso 6: Actualizar Variables del Backend

### 6.1. Ir al Backend

1. En Railway, vuelve a tu proyecto
2. Haz clic en el servicio del **backend** (el primero que creaste)

### 6.2. Actualizar FRONTEND_WEB_URL

1. Ve a la pestaña **"Variables"**
2. Busca la variable `FRONTEND_WEB_URL`
3. **Actualiza su valor** con la URL del frontend que copiaste en el Paso 5.2
   - Ejemplo: `https://frontend-web-production-xxxx.up.railway.app`
4. Haz clic en **"Save"**

**⚠️ IMPORTANTE:** Esto actualiza el CORS del backend para permitir requests desde el frontend.

---

## 📋 Paso 7: Verificar que Todo Funcione

### 7.1. Abrir el Frontend en el Navegador

1. Abre tu navegador
2. Ve a la URL del frontend que copiaste (ejemplo: `https://frontend-web-production-xxxx.up.railway.app`)
3. Deberías ver la pantalla de Login del frontend web

### 7.2. Probar Login

1. Ingresa las credenciales del doctor que creaste antes:
   - Email: `doctor@test.com`
   - Password: `password123`
2. Haz clic en "Iniciar Sesión"
3. **Resultado esperado:**
   - Redirección al Dashboard
   - Verás tu nombre y email
   - Verás estadísticas (pueden estar en 0 si no tienes consultas)

---

## ✅ Checklist de Verificación

Antes de considerar que el frontend está desplegado correctamente:

- [ ] Servicio del frontend creado en Railway
- [ ] Root Directory configurado como `frontend-web`
- [ ] Variable `VITE_API_URL` configurada con la URL del backend
- [ ] Build completado exitosamente
- [ ] Dominio generado para el frontend
- [ ] Variable `FRONTEND_WEB_URL` actualizada en el backend
- [ ] Puedo acceder al frontend en el navegador
- [ ] Puedo ver la pantalla de Login
- [ ] Puedo iniciar sesión con credenciales válidas
- [ ] Puedo ver el Dashboard después del login

---

## 🐛 Problemas Comunes

### ❌ Error: "Nixpacks was unable to generate a build plan"

**Causa:** El Root Directory no está configurado correctamente.

**Solución:**
1. Ve a Settings → Root Directory
2. Configura exactamente: `frontend-web`
3. Guarda y vuelve a desplegar

### ❌ Error: "Cannot find module 'vite'"

**Causa:** Las dependencias no se instalaron correctamente.

**Solución:**
1. Verifica que el Root Directory esté configurado
2. Elimina el servicio y créalo de nuevo
3. Asegúrate de configurar el Root Directory ANTES del primer deploy

### ❌ Error: 502 Bad Gateway o "Application failed to respond"

**Causa:** El comando de inicio no está configurado correctamente.

**Solución:**
1. Ve a Settings → Build & Deploy
2. Verifica que el Start Command sea: `npm run preview`
3. Verifica que el Output Directory sea: `dist`

### ❌ No puedo iniciar sesión: "Error de red"

**Causa:** La variable `VITE_API_URL` no está configurada o es incorrecta.

**Solución:**
1. Ve a Variables del frontend
2. Verifica que `VITE_API_URL` tenga el valor correcto del backend
3. Reinicia el servicio (Stop → Start) para que tome los cambios

### ❌ Error de CORS en el navegador

**Causa:** El backend no tiene configurada la URL del frontend.

**Solución:**
1. Ve al backend → Variables
2. Actualiza `FRONTEND_WEB_URL` con la URL del frontend
3. Reinicia el backend (Stop → Start)

---

## 📝 Notas Importantes

1. **El frontend y el backend son servicios SEPARADOS** en Railway
   - Cada uno tiene su propio dominio
   - Cada uno tiene sus propias variables de entorno
   - Cada uno necesita su Root Directory configurado

2. **Las variables de entorno del frontend empiezan con `VITE_`**
   - Solo las variables que empiezan con `VITE_` se exponen al código del frontend
   - Las demás se ignoran por seguridad

3. **El backend necesita saber la URL del frontend**
   - Para configurar CORS correctamente
   - Actualiza `FRONTEND_WEB_URL` en el backend después de desplegar el frontend

4. **Si cambias variables de entorno, reinicia el servicio**
   - Stop → Start para que tome los cambios

---

## 🎯 Próximos Pasos

Una vez que el frontend esté desplegado:

1. ✅ Prueba el Login (Paso 7.2)
2. ✅ Prueba el Dashboard
3. ✅ Prueba el Chat
4. ✅ Prueba subir archivos
5. ✅ Prueba todas las funcionalidades según la guía de pruebas

---

**¡Listo!** Sigue estos pasos en orden y tendrás el frontend web funcionando en Railway. Si encuentras algún problema, revisa la sección "Problemas Comunes" o los logs en Railway.

