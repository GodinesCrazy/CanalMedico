# 📍 Cómo Configurar Root Directory en Railway - Guía Paso a Paso

## 🎯 Objetivo
Configurar el Root Directory del servicio backend en Railway para que apunte a la carpeta `backend` de tu repositorio.

---

## 📋 PASO 1: Configurar Root Directory del Backend

### Método 1: Desde Settings (Recomendado)

#### Paso 1.1: Abrir Settings del Servicio
1. Ve a tu proyecto en Railway
2. Haz clic en el servicio **"CanalMedico"** (el que está fallando)
3. En la parte superior del servicio, haz clic en la pestaña **"Settings"**

#### Paso 1.2: Buscar Root Directory
1. En Settings, desplázate hacia abajo
2. Busca la sección **"Source"** o **"Build & Deploy"**
3. Dentro de esa sección, busca el campo **"Root Directory"** o **"Source Root"**

#### Paso 1.3: Configurar Root Directory
1. En el campo "Root Directory", debería estar vacío o mostrar `.` o `/`
2. **Escribe exactamente**: `backend`
3. Haz clic en **"Save Changes"** o **"Update"** (botón en la parte inferior o superior derecha)

#### Paso 1.4: Verificar
1. Después de guardar, Railway debería hacer un nuevo build automáticamente
2. Si no lo hace automáticamente, ve a la pestaña **"Deployments"**
3. Haz clic en **"Deploy"** o en el botón de redeploy

---

### Método 2: Recrear el Servicio (Si no encuentras la opción)

#### Paso 1.1: Eliminar Servicio Actual
1. Ve al servicio "CanalMedico"
2. Haz clic en **"Settings"**
3. Desplázate hasta el final
4. Haz clic en **"Delete Service"** o **"Remove"**
5. Confirma la eliminación

#### Paso 1.2: Crear Nuevo Servicio
1. En tu proyecto Railway, haz clic en **"+ New"** (botón verde en la parte superior)
2. Selecciona **"GitHub Repo"**
3. Si no aparece tu repositorio, haz clic en **"Configure GitHub App"** y conecta tu cuenta
4. Busca y selecciona: **`GodinesCrazy/CanalMedico`**

#### Paso 1.3: Configurar Root Directory
1. Después de seleccionar el repositorio, deberías ver opciones de configuración
2. Busca el campo **"Root Directory"** o **"Source Root"**
3. **Escribe exactamente**: `backend`
4. Haz clic en **"Deploy"** o **"Create Service"**

---

### Método 3: Desde Deployments (Alternativa)

#### Paso 1.1: Abrir Deployments
1. Ve al servicio "CanalMedico"
2. Haz clic en la pestaña **"Deployments"**

#### Paso 1.2: Configurar Build
1. Busca el deployment más reciente o haz clic en **"New Deployment"**
2. Busca la sección de configuración de build
3. Busca **"Root Directory"** o **"Source Root"**
4. **Escribe exactamente**: `backend`
5. Guarda y haz redeploy

---

## ✅ Verificación

Después de configurar el Root Directory:

1. **Ve a "Settings" → "Source" o "Build & Deploy"**
2. **Verifica que "Root Directory" muestre**: `backend`
3. **Ve a "Deployments"** y espera el nuevo build
4. **El build debería mostrar**: 
   - ✅ Detectando Node.js
   - ✅ Instalando dependencias desde `backend/package.json`
   - ✅ Compilando TypeScript
   - ✅ Generando Prisma Client

---

## 🐛 Si Aún No Funciona

### Verifica que estás en el servicio correcto:
- El servicio debe llamarse algo como "CanalMedico" o "Backend"
- Debe estar conectado a tu repositorio de GitHub

### Verifica que el Root Directory esté configurado:
- Debe mostrar exactamente: `backend` (sin barras al inicio o final)
- No debe estar vacío
- No debe mostrar `.` o `/`

### Si no encuentras la opción "Root Directory":
1. Puede estar en una versión diferente de Railway
2. Intenta el Método 2 (recrear el servicio)
3. O contacta a soporte de Railway

---

## 📸 Qué Deberías Ver

Después de configurar correctamente el Root Directory, en el build deberías ver:

```
📦 Building from directory: backend
📦 Detected Node.js project
📦 Installing dependencies...
📦 Running npm ci
📦 Generating Prisma Client...
📦 Building TypeScript...
✅ Build successful
```

---

## 🎯 Siguiente Paso

Una vez que el Root Directory esté configurado y el build funcione, continúa con:
- **PASO 2**: Agregar PostgreSQL como servicio
- **PASO 3**: Configurar variables de entorno

---

**¿Necesitas ayuda con algo más específico?** Avísame si encuentras algún problema o si el Root Directory no aparece en tu versión de Railway.

