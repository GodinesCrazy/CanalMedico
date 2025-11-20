# 🔍 Verificar Conexión a la Base de Datos

## ❌ Problema

Estás viendo "502 Bad Gateway" en la URL de PostgreSQL, pero **eso es normal**. PostgreSQL no es un servicio web, es una base de datos.

## ✅ Lo que Necesitas Hacer

### Paso 1: Verificar DATABASE_URL en el Backend

1. **Ve al servicio backend** (`CanalMedico`) en Railway
2. Haz clic en la pestaña **"Variables"**
3. Busca la variable `DATABASE_URL`
4. **Debe ser**: `${{Postgres.DATABASE_URL}}` o una URL completa

**Si NO está configurada o está vacía:**
1. Haz clic en **"+ New Variable"**
2. Nombre: `DATABASE_URL`
3. Valor: Haz clic en **"Reference Variable"** o escribe: `${{Postgres.DATABASE_URL}}`
4. Guarda

### Paso 2: Verificar Logs del Backend

1. **Ve al servicio backend** (`CanalMedico`) en Railway
2. Haz clic en la pestaña **"Logs"** o **"Deploy Logs"**
3. Busca estos mensajes:

**✅ Si está conectado correctamente:**
```
✅ Conexión a la base de datos establecida
```

**❌ Si hay errores de conexión:**
```
⚠️ Advertencia: No se pudo conectar a la base de datos: ...
```

### Paso 3: Verificar el Endpoint del Backend

**La URL del backend debe ser:**
- `https://canalmedico-production.up.railway.app/`
- **NO** `https://postgres-production-c571.up.railway.app/` (esa es la base de datos)

**Prueba estos endpoints:**
1. `GET https://canalmedico-production.up.railway.app/` - Debe responder con JSON
2. `GET https://canalmedico-production.up.railway.app/health` - Debe responder con `{"status":"ok"}`

## 📋 Checklist de Verificación

- [ ] PostgreSQL está activo y funcionando (✓ ya verificado en los logs)
- [ ] `DATABASE_URL` está configurada en Variables del backend
- [ ] `DATABASE_URL` usa `${{Postgres.DATABASE_URL}}` o una URL completa
- [ ] Los logs del backend muestran "✅ Conexión a la base de datos establecida"
- [ ] El endpoint `/health` del backend responde correctamente
- [ ] El endpoint `/` del backend responde correctamente

## 🔧 Si DATABASE_URL No Está Configurada

### Opción A: Usar Reference Variable (Recomendado)

1. En el servicio backend → Variables
2. "+ New Variable"
3. Nombre: `DATABASE_URL`
4. Haz clic en **"Reference Variable"** o **"Connect Variable"**
5. Selecciona `${{Postgres.DATABASE_URL}}`
6. Guarda

### Opción B: Copiar la URL Manualmente

1. Ve al servicio **Postgres** → Variables
2. Busca `DATABASE_URL`
3. Copia el valor completo
4. Ve al servicio **Backend** → Variables
5. Agrega o edita `DATABASE_URL`
6. Pega la URL copiada
7. Guarda

## ⚠️ Notas Importantes

1. **No intentes acceder a PostgreSQL a través del navegador** - Es una base de datos, no un sitio web
2. **El backend se conecta a PostgreSQL internamente** - No necesitas la URL pública de PostgreSQL
3. **Railway conecta los servicios automáticamente** si están en el mismo proyecto y usas Reference Variables

## 🚀 Después de Configurar DATABASE_URL

1. **Railway hará un deployment automático** del backend
2. **Revisa los logs del backend** para confirmar la conexión
3. **Prueba los endpoints** `/` y `/health` del backend

---

**Siguiente paso**: Verifica que `DATABASE_URL` esté configurada en Variables del backend y revisa los logs del backend para confirmar la conexión.

