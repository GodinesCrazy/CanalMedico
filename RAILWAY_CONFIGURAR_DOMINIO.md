# 🌐 Cómo Configurar el Dominio en Railway

## ❌ Problema

No encuentras "Networking" y "Generate Domain" en Project Settings.

## ✅ Solución: Configurar el Dominio en el Servicio

El dominio se configura **por servicio**, no en la configuración del proyecto. Sigue estos pasos:

### Paso 1: Ir al Servicio Backend

1. **Desde la página de Project Settings** (donde estás ahora):
   - En la barra superior, haz clic en **"Architecture"** (o en el nombre de tu servicio backend)
   - O vuelve al dashboard principal del proyecto

2. **En la vista "Architecture"** o dashboard:
   - Verás tus servicios listados (PostgreSQL, Backend, etc.)
   - Haz clic en el servicio **"backend"** (o el nombre que le hayas dado)
   - NO hagas clic en "Settings" del proyecto, sino en el servicio mismo

### Paso 2: Acceder a la Configuración del Servicio

Una vez dentro del servicio backend:

1. **Verás varias pestañas** en la parte superior del servicio:
   - "Deployments"
   - "Metrics"
   - "Logs"
   - **"Settings"** ← Haz clic aquí

2. **Dentro de "Settings" del servicio**, verás opciones como:
   - Service Info
   - Build & Deploy
   - **Networking** ← Esta es la que necesitas
   - Health Check
   - Variables
   - Etc.

### Paso 3: Configurar el Dominio

1. **Haz clic en "Networking"** (dentro de Settings del servicio)
2. **Verás opciones de dominio**:
   - **"Generate Domain"** - Para generar una URL automática de Railway
   - **"Custom Domain"** - Para usar tu propio dominio
3. **Haz clic en "Generate Domain"**
4. Railway generará una URL como: `https://tu-backend-production.up.railway.app`
5. **Copia esta URL**

### Paso 4: Actualizar API_URL

1. **Ve a la pestaña "Variables"** (también dentro de Settings del servicio)
2. **Busca o crea la variable** `API_URL`
3. **Pega la URL** que copiaste (ejemplo: `https://tu-backend-production.up.railway.app`)
4. **Guarda los cambios**

## 📍 Navegación Visual

```
Railway Dashboard
  └── Tu Proyecto (athletic-curiosity)
      └── Architecture / Services
          └── [Backend Service] ← Haz clic aquí
              └── Settings (pestaña superior)
                  └── Networking ← Aquí está "Generate Domain"
                  └── Variables ← Aquí configuras API_URL
```

## 🔄 Si Aún No Lo Encuentras

### Alternativa 1: Desde la Vista Architecture

1. Ve a la pestaña **"Architecture"** en la barra superior
2. Verás todos tus servicios como cajas/rectángulos
3. **Haz clic directamente en el servicio backend** (no en los 3 puntos, sino en el servicio)
4. Esto te llevará a la página del servicio
5. Luego ve a **Settings → Networking**

### Alternativa 2: Buscar en el Menú Lateral

1. Dentro del servicio backend
2. En el **menú lateral izquierdo**, busca:
   - "Networking"
   - O "Domain"
   - O "Public URL"

### Alternativa 3: Usar la URL del Deploy

Si ya tienes un deployment activo:

1. Ve a la pestaña **"Deployments"** del servicio
2. Haz clic en un deployment exitoso
3. Verás la **"Public URL"** o **"Domain"** asignada
4. Copia esa URL para usar en `API_URL`

## ⚠️ Nota Importante

**El dominio se configura por servicio**, así que:
- Cada servicio (backend, frontend-web, etc.) tiene su propio dominio
- El backend necesita su dominio para configurar `API_URL`
- El frontend-web necesitará su propio dominio más adelante

## 🎯 Resumen Rápido

1. Ve a **Architecture** o dashboard del proyecto
2. Haz clic en el **servicio backend** (no en Project Settings)
3. Ve a **Settings** del servicio (pestaña superior)
4. Haz clic en **Networking**
5. Haz clic en **Generate Domain**
6. Copia la URL generada
7. Ve a **Variables** del servicio
8. Agrega/actualiza `API_URL` con la URL copiada

## 🆘 Si Necesitas Más Ayuda

Si después de seguir estos pasos aún no encuentras "Networking", verifica:

1. **¿Estás dentro del servicio correcto?**
   - Debe ser el servicio del backend, no PostgreSQL
   - No debe ser Project Settings

2. **¿El servicio ya fue desplegado?**
   - Railway puede mostrar opciones diferentes si el servicio no ha sido desplegado aún

3. **¿Usas la versión web o móvil?**
   - En la versión web completa de Railway deberías ver todas las opciones

---

**Pista**: El dominio suele aparecer también en la vista "Architecture" como una pequeña etiqueta en la esquina del servicio, o en la parte superior de la página del servicio.

