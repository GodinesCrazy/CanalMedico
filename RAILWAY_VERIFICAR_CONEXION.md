# 🔍 Verificar Conexión a la Base de Datos

## ✅ PostgreSQL Está Funcionando Correctamente

Los logs muestran que PostgreSQL está listo:
```
database system is ready to accept connections
```

## ❌ El Error "502 Bad Gateway" es Normal

El error en `postgres-production-c571.up.railway.app` es **normal** porque:
- **PostgreSQL no es un servicio web** - No responde a HTTP
- **PostgreSQL solo acepta conexiones de base de datos** - No puedes acceder con un navegador
- **El backend se conecta internamente** - No necesitas la URL pública

## 🔍 Lo que Necesitas Verificar

### 1. Verificar DATABASE_URL en el Backend

1. **Ve al servicio `CanalMedico`** (el backend, NO PostgreSQL)
2. Haz clic en **"Variables"**
3. Busca la variable **`DATABASE_URL`**
4. **Debe estar configurada como:**
   - `${{Postgres.DATABASE_URL}}` (recomendado - Reference Variable)
   - O una URL completa de PostgreSQL

**Si NO está o está vacía:**
1. Haz clic en **"+ New Variable"**
2. Nombre: `DATABASE_URL`
3. Valor: Haz clic en **"Reference Variable"** → Selecciona `${{Postgres.DATABASE_URL}}`
4. Guarda

### 2. Verificar Logs del Backend

1. **Ve al servicio `CanalMedico`** (backend)
2. Haz clic en **"Logs"** o **"Deploy Logs"**
3. Busca estos mensajes:

**✅ Si está conectado:**
```
✅ Conexión a la base de datos establecida
```

**❌ Si hay error:**
```
⚠️ Advertencia: No se pudo conectar a la base de datos: ...
```

### 3. Verificar el Endpoint Correcto

**NO uses la URL de PostgreSQL** para acceder al API.

**Usa la URL del BACKEND:**
- `https://canalmedico-production.up.railway.app/`
- `https://canalmedico-production.up.railway.app/health`

**Prueba estos endpoints:**
1. `GET /` → Debe responder con JSON del API
2. `GET /health` → Debe responder con `{"status":"ok"}`

## 📋 Checklist

- [x] PostgreSQL está funcionando (✓ ya verificado en logs)
- [ ] `DATABASE_URL` está configurada en Variables del **backend** (`CanalMedico`)
- [ ] `DATABASE_URL` usa `${{Postgres.DATABASE_URL}}`
- [ ] Los logs del **backend** muestran "✅ Conexión a la base de datos establecida"
- [ ] El endpoint `/health` del **backend** responde correctamente
- [ ] El endpoint `/` del **backend** responde correctamente

## 🔧 Pasos para Conectar DATABASE_URL

### Paso 1: Ir al Backend

1. En Railway, ve al servicio **`CanalMedico`** (el que tiene el ícono de GitHub)
2. **NO** vayas a `Postgres` (ese es solo la base de datos)

### Paso 2: Configurar DATABASE_URL

1. En el servicio `CanalMedico`, haz clic en **"Variables"**
2. Busca `DATABASE_URL`
3. **Si no está:**
   - Haz clic en **"+ New Variable"**
   - Nombre: `DATABASE_URL`
4. **Configurar el valor:**
   - Haz clic en el campo de valor
   - Haz clic en **"Reference Variable"** (o similar)
   - Selecciona `${{Postgres.DATABASE_URL}}`
   - O escribe directamente: `${{Postgres.DATABASE_URL}}`
5. **Guarda**

### Paso 3: Verificar el Deployment

1. Después de guardar, Railway hará un deployment automático
2. Ve a **"Deployments"** del servicio `CanalMedico`
3. Espera a que el deployment termine
4. Ve a **"Logs"** y busca:
   ```
   ✅ Conexión a la base de datos establecida
   ```

## ⚠️ Notas Importantes

1. **No intentes acceder a PostgreSQL con el navegador** - Es una base de datos, no un sitio web
2. **El backend se conecta a PostgreSQL automáticamente** si `DATABASE_URL` está configurada
3. **Railway conecta los servicios** si están en el mismo proyecto y usas Reference Variables

## 🚀 Después de Configurar DATABASE_URL

Una vez configurada `DATABASE_URL`:

1. Railway hará un deployment automático
2. Los logs del backend mostrarán: `✅ Conexión a la base de datos establecida`
3. El endpoint `/health` debería responder correctamente
4. El endpoint `/` debería responder con información del API

---

**Siguiente paso**: Ve al servicio **`CanalMedico`** (backend) → Variables → Configura `DATABASE_URL` con `${{Postgres.DATABASE_URL}}` y verifica los logs del backend.

