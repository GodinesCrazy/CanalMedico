# 🗄️ Cómo Crear la Base de Datos PostgreSQL en Railway

## ✅ Respuesta Corta

**SÍ, necesitas crear una base de datos PostgreSQL en Railway.**

## 📋 Pasos para Crear PostgreSQL en Railway

### Paso 1: Crear el Servicio PostgreSQL

1. **En Railway**, ve a tu proyecto (por ejemplo: `athletic-curiosity`)
2. En la parte superior, haz clic en **"+ New"** (botón púrpura)
3. Se abrirá un menú con opciones
4. Selecciona **"Database"**
5. Selecciona **"PostgreSQL"**
6. Railway creará automáticamente una base de datos PostgreSQL para ti

### Paso 2: Railway Configura Automáticamente

Después de crear PostgreSQL:
- Railway crea automáticamente la base de datos
- Railway asigna la variable `DATABASE_URL` automáticamente
- Railway crea el servicio PostgreSQL en tu proyecto

### Paso 3: Conectar PostgreSQL al Backend

**IMPORTANTE**: Necesitas conectar la base de datos al servicio backend.

#### Opción A: Railway lo hace automáticamente (a veces)

Railway puede agregar automáticamente `DATABASE_URL` al servicio backend si están en el mismo proyecto.

#### Opción B: Conectar manualmente

1. **Ve al servicio backend** (`CanalMedico`)
2. Haz clic en la pestaña **"Variables"**
3. Busca la variable `DATABASE_URL`
4. Si no está o está vacía:
   - Haz clic en **"+ New Variable"**
   - Nombre: `DATABASE_URL`
   - Valor: Haz clic en **"Reference Variable"** o escribe: `${{Postgres.DATABASE_URL}}`
   - O simplemente escribe: `${{Postgres.DATABASE_URL}}`
5. Guarda

### Paso 4: Verificar que DATABASE_URL está Configurada

1. **En Railway → Variables del backend**
2. Deberías ver `DATABASE_URL` con un valor como:
   ```
   postgresql://postgres:password@host:port/database
   ```
   O simplemente la referencia: `${{Postgres.DATABASE_URL}}`

### Paso 5: Ejecutar Migraciones

Después de configurar `DATABASE_URL`:

1. **Railway ejecutará un nuevo deployment** automáticamente
2. O manualmente:
   - Ve al servicio backend
   - Haz clic en la pestaña **"Settings"**
   - Busca "Deploy" o ve a "Deployments"
   - Haz clic en **"Redeploy"**

3. **Las migraciones se ejecutarán automáticamente** si están configuradas en el build
4. O manualmente:
   - Ve a la terminal de Railway (icono de terminal en el servicio)
   - Ejecuta: `npx prisma migrate deploy`

## 🔍 Verificar que Funciona

Después de crear PostgreSQL y conectar DATABASE_URL:

1. **Revisa los logs del backend**
2. Deberías ver:
   ```
   ✅ Conexión a la base de datos establecida
   ```
3. **Si ves errores de conexión**, verifica que:
   - El servicio PostgreSQL esté activo (debería estar corriendo)
   - `DATABASE_URL` esté correctamente configurada en Variables
   - La URL de conexión sea válida

## 📝 Estructura del Proyecto en Railway

Después de crear PostgreSQL, deberías tener:

```
Tu Proyecto (athletic-curiosity)
├── CanalMedico (Backend Service)
│   ├── Variables
│   │   └── DATABASE_URL = ${{Postgres.DATABASE_URL}}
│   └── Deployments
└── Postgres (Database Service)
    └── Variables
        └── DATABASE_URL = postgresql://...
```

## ⚠️ Problemas Comunes

### Problema: "DATABASE_URL no está configurada"
**Solución**: 
- Verifica que PostgreSQL esté creado
- Conecta `DATABASE_URL` al backend usando "Reference Variable"

### Problema: "Connection refused"
**Solución**:
- Verifica que el servicio PostgreSQL esté activo
- Verifica que `DATABASE_URL` tenga el formato correcto
- Asegúrate de usar `${{Postgres.DATABASE_URL}}` si están en el mismo proyecto

### Problema: "Database does not exist"
**Solución**:
- Railway crea la base de datos automáticamente
- Ejecuta las migraciones: `npx prisma migrate deploy`

## ✅ Checklist

- [ ] PostgreSQL creado en Railway
- [ ] `DATABASE_URL` configurada en el backend (usando Reference Variable)
- [ ] Servicio PostgreSQL está activo
- [ ] Migraciones ejecutadas
- [ ] Logs muestran "✅ Conexión a la base de datos establecida"

## 🚀 Después de Configurar

Una vez configurada la base de datos:

1. **Railway hará un deployment automático**
2. **El servidor debería poder conectarse a la base de datos**
3. **Los endpoints deberían funcionar correctamente**
4. **El healthcheck debería pasar**

---

**Importante**: La base de datos PostgreSQL es CRÍTICA para que la aplicación funcione. Sin ella, el servidor no puede guardar ni leer datos.

