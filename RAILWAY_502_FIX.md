# 🔧 Fix: Error 502 Bad Gateway - Puertos Incorrectos

## ❌ Problema

Todos los endpoints dan error **502 Bad Gateway**, aunque los logs muestran que el servidor está funcionando:

```
🚀 Servidor corriendo en puerto 8080
✅ Conexión a la base de datos establecida
```

## 🔍 Causa

El servidor está escuchando en el puerto **8080**, pero Railway está esperando que el servidor escuche en el puerto que Railway asigna automáticamente (típicamente **3000** o el valor de `process.env.PORT`).

**Problema de configuración:**
- Railway asigna `PORT` automáticamente en `process.env.PORT`
- El servidor debería usar `process.env.PORT` como prioridad
- Si `process.env.PORT` no está disponible, usar el valor por defecto de `env.PORT` (3000)

## ✅ Solución: Verificar Configuración de Networking en Railway

### Paso 1: Verificar Puerto en Railway

1. **Ve a Railway** → Servicio `CanalMedico` → **Settings**
2. **Haz clic en "Networking"**
3. **Busca la sección "Public Networking"**
4. **Verifica el puerto configurado:**
   - Debería mostrar algo como: `Port 8080 - Metal Edge` o `Port 3000 - Metal Edge`

### Paso 2: Configurar Puerto Correcto

**Opción A: Cambiar el puerto en Railway para que coincida con 8080**

1. En **Networking** → **Public Networking**
2. En el campo "Enter the port your app is listening on"
3. **Asegúrate de que sea `8080`** (el puerto que el servidor está usando)
4. **O cambia a `3000`** y ajusta el código para usar 3000

**Opción B: Asegurar que el servidor use `process.env.PORT`**

El código ya debería estar usando `process.env.PORT`, pero vamos a verificar que funcione correctamente.

### Paso 3: Verificar Variables de Entorno

En Railway → Servicio `CanalMedico` → Variables:

1. **NO deberías tener** una variable `PORT` manual configurada
2. Railway asigna `PORT` automáticamente en `process.env.PORT`
3. Si tienes una variable `PORT` manual, **elimínala** para que Railway la asigne automáticamente

## 🔧 Alternativa: Forzar el Servidor a Usar el Puerto de Railway

Si el problema persiste, podemos forzar el servidor a usar solo `process.env.PORT`:

### Solución Rápida: Cambiar Puerto en Railway

1. **Ve a Railway** → Servicio `CanalMedico` → **Settings** → **Networking**
2. **En "Public Networking"**, busca el campo de puerto
3. **Cambia el puerto a `8080`** (el que el servidor está usando según los logs)
4. **Guarda** y espera el redeployment

## 📋 Verificación

Después de ajustar el puerto:

1. **Espera el deployment** (Railway redeployará automáticamente)
2. **Revisa los logs** - Deberías ver que el servidor inicia correctamente
3. **Prueba los endpoints:**
   - `GET /` → Debe responder con JSON
   - `GET /health` → Debe responder con `{"status":"ok"}`
   - `GET /api-docs` → Debe mostrar Swagger UI

## ⚠️ Nota Importante

El servidor **SÍ está funcionando correctamente** según los logs. El problema es solo de **configuración de puertos** entre Railway y el servidor.

---

**Siguiente paso**: Ve a Railway → Servicio `CanalMedico` → Settings → Networking y verifica/ajusta el puerto a `8080`.

