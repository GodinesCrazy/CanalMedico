# Cómo Verificar los Logs de Railway

## 🔍 Guía Rápida para Verificar el Estado del Backend

Esta guía te ayudará a verificar que todo está funcionando correctamente en Railway después de implementar las migraciones automáticas.

## 📋 Pasos para Ver los Logs

### 1. **Acceder a Railway**

1. Ve a [https://railway.app](https://railway.app)
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto `CanalMedico`

### 2. **Ver Logs del Backend**

1. **Haz clic en el servicio `CanalMedico`** (el servicio del backend, NO el de PostgreSQL)
2. **Ve a la pestaña "Deployments"** o **"Deploy Logs"**
3. **Haz clic en el deployment más reciente** (el más arriba)
4. **Revisa los logs** del despliegue

## ✅ Qué Buscar en los Logs

### **1. Logs de Build (Construcción)**

Busca estos mensajes que indican que el build fue exitoso:

```
[ 6/10] RUN npm ci
[ 7/10] RUN npx prisma generate
[ 8/10] COPY . .
[ 9/10] RUN npm run build
Build time: XX.XX seconds
```

### **2. Logs de Migraciones (NUEVO)**

Busca estos mensajes que indican que las migraciones se ejecutaron correctamente:

```
🔄 Ejecutando migraciones de la base de datos...
```

Luego deberías ver uno de estos:

**Opción A (si hay migraciones):**
```
Prisma Migrate applied: migration_name
✅ Migraciones ejecutadas correctamente
```

**Opción B (si no hay migraciones, usará db push):**
```
⚠️ No se pudieron aplicar migraciones con migrate deploy, intentando db push...
💡 Esto sincronizará el schema directamente con la base de datos
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
✅ Schema sincronizado correctamente con db push
```

### **3. Logs de Conexión a la Base de Datos**

```
✅ Conexión a la base de datos establecida
```

### **4. Logs de Inicio del Servidor**

```
🚀 Servidor corriendo en puerto 8080
📚 Documentación API disponible en https://canalmedico-production.up.railway.app/api-docs
🌍 Ambiente: production
```

### **5. Healthcheck Exitoso**

```
[1/1] Healthcheck succeeded!
```

## 🔴 Errores Comunes y Qué Significan

### **Error 1: "Error al ejecutar migraciones"**

**Significa:** Las migraciones fallaron al ejecutarse.

**Soluciones:**
- Verifica que `DATABASE_URL` esté configurada correctamente en Railway
- Asegúrate de que el servicio PostgreSQL esté funcionando
- Revisa el error específico en los logs

### **Error 2: "Error al conectar a la base de datos"**

**Significa:** No se pudo conectar a PostgreSQL.

**Soluciones:**
- Verifica que el servicio PostgreSQL esté en ejecución
- Confirma que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que PostgreSQL esté en el mismo proyecto en Railway

### **Error 3: "PORT variable must be integer"**

**Significa:** La variable de entorno `PORT` no está configurada correctamente.

**Soluciones:**
- Railway asigna `PORT` automáticamente, no necesitas configurarla
- Si el problema persiste, verifica las variables de entorno en Railway

### **Error 4: "Healthcheck failed"**

**Significa:** El servidor no respondió a las peticiones de healthcheck.

**Soluciones:**
- Espera unos segundos más (el servidor puede tardar en iniciar)
- Revisa los logs para ver si hay errores al iniciar el servidor
- Verifica que el puerto esté configurado correctamente

## 📊 Ejemplo de Logs Exitosos

Cuando todo funciona correctamente, deberías ver algo así:

```
[Region: us-west1] ========================= Using Detected Dockerfile =========================
[ 1/10] FROM docker.io/library/node:18-alpine
[ 2/10] RUN apk add --no-cache libpq openssl openssl-dev
[ 3/10] WORKDIR /app
[ 4/10] COPY package*.json ./
[ 5/10] COPY prisma ./prisma/
[ 6/10] RUN npm ci
[ 7/10] RUN npx prisma generate
[ 8/10] COPY . .
[ 9/10] RUN npm run build
[10/10] RUN mkdir -p logs
Build time: 65.00 seconds

==================== Starting Healthcheck ====================
Path: /health
Retry window: 1m40s

2024-XX-XX XX:XX:XX [info]: 🔄 Ejecutando migraciones de la base de datos...
2024-XX-XX XX:XX:XX [info]: ⚠️ No se pudieron aplicar migraciones con migrate deploy, intentando db push...
2024-XX-XX XX:XX:XX [info]: 💡 Esto sincronizará el schema directamente con la base de datos
2024-XX-XX XX:XX:XX [info]: Prisma schema loaded from prisma/schema.prisma
2024-XX-XX XX:XX:XX [info]: Datasource "db": PostgreSQL database
2024-XX-XX XX:XX:XX [info]: ✅ Schema sincronizado correctamente con db push
2024-XX-XX XX:XX:XX [info]: ✅ Conexión a la base de datos establecida
2024-XX-XX XX:XX:XX [info]: 🚀 Servidor corriendo en puerto 8080
2024-XX-XX XX:XX:XX [info]: 📚 Documentación API disponible en https://canalmedico-production.up.railway.app/api-docs
2024-XX-XX XX:XX:XX [info]: 🌍 Ambiente: production

[1/1] Healthcheck succeeded!
```

## 🧪 Verificar que las Tablas Fueron Creadas

Para verificar que las tablas fueron creadas correctamente:

### **Opción 1: Usar Prisma Studio (Localmente)**

1. Conecta tu base de datos local a Railway (usa `DATABASE_URL` de Railway)
2. Ejecuta: `npx prisma studio`
3. Verifica que veas todas las tablas: `users`, `doctors`, `patients`, `consultations`, `messages`, `payments`, `notification_tokens`

### **Opción 2: Verificar en Railway Terminal**

1. Ve a Railway → Servicio `CanalMedico` → Terminal
2. Ejecuta:
   ```bash
   npx prisma studio
   ```
3. Esto abrirá Prisma Studio en el puerto que Railway asigne

### **Opción 3: Probar el API**

1. Ve a: `https://canalmedico-production.up.railway.app/api-docs`
2. Prueba registrar un usuario: `POST /api/auth/register`
3. Si funciona, significa que las tablas están creadas y funcionando

## 🆘 Si Algo Sale Mal

### **El servidor no inicia:**

1. **Revisa los logs** de Railway para ver el error específico
2. **Verifica las variables de entorno** en Railway:
   - `DATABASE_URL` debe estar configurada
   - `JWT_SECRET` y `JWT_REFRESH_SECRET` deben tener valores válidos
   - `API_URL` debe tener la URL correcta
3. **Verifica que PostgreSQL esté funcionando:**
   - Ve a Railway → Servicio PostgreSQL
   - Revisa que esté en estado "Active"

### **Las migraciones no se ejecutan:**

1. Verifica que `DATABASE_URL` esté correctamente configurada
2. Revisa que el servicio PostgreSQL esté en ejecución
3. Si el error persiste, comparte los logs específicos

### **Healthcheck falla:**

1. Espera unos minutos (el primer despliegue puede tardar más)
2. Verifica que el servidor haya iniciado correctamente
3. Revisa los logs para ver si hay errores

## 📝 Checklist de Verificación

Usa este checklist para asegurarte de que todo está funcionando:

- [ ] Build completado exitosamente
- [ ] Migraciones ejecutadas correctamente
- [ ] Conexión a la base de datos establecida
- [ ] Servidor corriendo en el puerto correcto
- [ ] Healthcheck exitoso
- [ ] Tablas creadas en la base de datos
- [ ] API respondiendo en `/api-docs`

## ✅ Siguiente Paso

Una vez que todo esté funcionando:

1. **Prueba el API:**
   - Ve a `https://canalmedico-production.up.railway.app/api-docs`
   - Prueba registrar un usuario
   - Prueba hacer login

2. **Verifica las tablas:**
   - Usa Prisma Studio o conecta directamente a PostgreSQL
   - Confirma que todas las tablas existan

3. **Configura variables de producción:**
   - Reemplaza las variables temporales de Stripe y AWS
   - Configura las URLs reales del frontend

---

**¿Necesitas ayuda?** Comparte los logs específicos y te ayudaré a diagnosticar el problema.

