# 🔧 Solución: Tabla `users` No Existe

## 🔍 Problema Identificado

Los logs muestran:
```
The table `public.users` does not exist in the current database.
```

Esto significa que **las migraciones no crearon las tablas** en la base de datos.

---

## ✅ Solución: Ejecutar Migraciones Manualmente

Aunque el backend intenta ejecutar migraciones automáticamente, en algunos casos es necesario ejecutarlas manualmente.

### Opción 1: Usando el Endpoint de Migración (Recomendado)

1. **Ve a Swagger:**
   ```
   https://canalmedico-production.up.railway.app/api-docs
   ```

2. **Busca:** `POST /api/seed/migrate`

3. **Haz clic en "Try it out" → "Execute"**

4. **Debería ejecutar:** `npx prisma db push --accept-data-loss`

5. **Esto creará todas las tablas** en la base de datos

---

### Opción 2: Desde Railway Terminal

1. **Ve a Railway** → Servicio `CanalMedico` (backend)

2. **Ve a "Deployments"** → Haz clic en el deployment más reciente

3. **Haz clic en "View logs"** o abre la terminal

4. **Ejecuta:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

5. **Esto creará todas las tablas** en la base de datos

---

### Opción 3: Ejecutar Prisma Migrate (Si hay migraciones creadas)

Si hay migraciones creadas localmente:

1. **En Railway Terminal:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Si no hay migraciones, usa db push:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

---

## 🔄 Después de Crear las Tablas

### 1. Crear Usuarios de Prueba

Una vez que las tablas estén creadas, crea los usuarios:

1. **Ve a Swagger:**
   ```
   https://canalmedico-production.up.railway.app/api-docs
   ```

2. **Ejecuta:** `POST /api/seed`

3. **Esto creará:**
   - Usuario Doctor: `doctor1@ejemplo.com` / `doctor123`
   - Usuario Admin: `admin@canalmedico.com` / `admin123`
   - Usuario Paciente: `paciente1@ejemplo.com` / `patient123`

### 2. Probar el Login

Después de crear las tablas y los usuarios:

1. **Ve al frontend:**
   ```
   https://canalmedico-web-production.up.railway.app/login
   ```

2. **Ingresa:**
   - Email: `doctor1@ejemplo.com`
   - Password: `doctor123`

3. **Debería funcionar ahora** ✅

---

## 🐛 Problemas Comunes

### Error: "Cannot connect to database"

**Solución:**
- Verifica que `DATABASE_URL` esté configurada en Railway
- Verifica que el servicio Postgres esté corriendo
- Verifica la conexión a la base de datos

### Error: "Migration not found"

**Solución:**
- Usa `db push` en lugar de `migrate deploy`:
  ```bash
  npx prisma db push --accept-data-loss
  ```

### Las tablas siguen sin existir después de ejecutar

**Solución:**
1. Verifica que `DATABASE_URL` esté correcta
2. Verifica los logs del comando para ver si hay errores
3. Intenta ejecutar desde Railway Terminal para ver el output completo

---

## 📝 Notas

- `db push` sincroniza el schema directamente sin crear archivos de migración
- `migrate deploy` solo aplica migraciones que ya existen
- Si no hay migraciones creadas, `db push` es la mejor opción
- El backend ahora tiene mejor logging para diagnosticar problemas de migraciones

---

## ✅ Checklist

Después de ejecutar las migraciones:

- [ ] Las tablas fueron creadas (`users`, `doctors`, `patients`, etc.)
- [ ] Los usuarios de prueba fueron creados (`POST /api/seed`)
- [ ] El login funciona correctamente
- [ ] El error 500 desapareció

