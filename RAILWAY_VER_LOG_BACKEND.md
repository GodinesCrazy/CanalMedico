# 🔍 Cómo Ver los Logs del Backend en Railway

## ❌ Problema Común

Estás viendo los logs de **PostgreSQL**, pero necesitas ver los logs del **BACKEND** (`CanalMedico`).

## ✅ Cómo Ver los Logs Correctos

### Paso 1: Ir al Servicio Backend

1. **En Railway**, ve a tu proyecto
2. **NO vayas a `Postgres`** (ese es solo la base de datos)
3. **Ve al servicio `CanalMedico`** (el que tiene el ícono de GitHub 🐙)

### Paso 2: Ver los Logs del Backend

1. **Dentro del servicio `CanalMedico`**, busca las pestañas en la parte superior:
   - "Deployments"
   - "Variables"
   - **"Logs"** ← Haz clic aquí
   - "Metrics"
   - "Settings"

2. **O ve a "Deployments"**:
   - Haz clic en el deployment más reciente
   - Verás pestañas: "Details", **"Build Logs"**, **"Deploy Logs"**, "HTTP Logs"
   - Haz clic en **"Deploy Logs"** para ver los logs en tiempo real del servidor

### Paso 3: Buscar Errores

En los logs del backend, busca:

**✅ Si está funcionando:**
```
🚀 Servidor corriendo en puerto XXXX
📚 Documentación API disponible en ...
🌍 Ambiente: production
✅ Conexión a la base de datos establecida
```

**❌ Si hay errores:**
```
❌ Error de configuración de variables de entorno: ...
Error: Cannot find module ...
⚠️ Advertencia: No se pudo conectar a la base de datos: ...
```

## 📋 Qué Buscar Específicamente

### Errores de Variables de Entorno
```
❌ Error de configuración de variables de entorno:
  - VARIABLE_NAME: Required
  - VARIABLE_NAME: String must contain at least 1 character(s)
```

### Errores de Conexión a la Base de Datos
```
⚠️ Advertencia: No se pudo conectar a la base de datos: ...
Error: connect ECONNREFUSED ...
```

### Errores de Módulos
```
Error: Cannot find module '@/config/env'
Error: Cannot find module '@/database/prisma'
```

### Errores de Puerto
```
Error: Port XXXX is already in use
Error: listen EADDRINUSE: address already in use :::XXXX
```

## 🔄 Diferencia Entre Logs

### Logs de PostgreSQL (Postgres)
- Son de la **base de datos**
- Muestran mensajes como: "database system is ready to accept connections"
- **NO muestran errores del servidor backend**

### Logs del Backend (CanalMedico)
- Son del **servidor Node.js/Express**
- Muestran mensajes como: "🚀 Servidor corriendo en puerto XXXX"
- **Estos son los logs que necesitas para diagnosticar**

## ✅ Pasos Correctos

1. ✅ **Ve al servicio `CanalMedico`** (backend, NO PostgreSQL)
2. ✅ **Haz clic en "Logs"** o **"Deploy Logs"**
3. ✅ **Copia los últimos 50-100 líneas** de los logs
4. ✅ **Comparte los logs** para diagnosticar el problema

---

**Importante**: Los logs que compartiste son de PostgreSQL (que está funcionando bien). Necesito ver los logs del **BACKEND** (`CanalMedico`) para diagnosticar por qué el servidor no responde.

