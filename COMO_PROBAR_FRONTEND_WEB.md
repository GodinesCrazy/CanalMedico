# 🧪 Cómo Probar el Frontend Web de CanalMedico

## 📋 Prerrequisitos

Antes de probar el frontend web, asegúrate de tener:

1. ✅ **Backend API corriendo**
   - Localmente en `http://localhost:3000`, O
   - En Railway en `https://canalmedico-production.up.railway.app`

2. ✅ **Node.js LTS** (v18.x o superior)
3. ✅ **npm 9.x** o superior

---

## 🚀 Paso a Paso para Probar

### Paso 1: Verificar que el Backend esté corriendo

**Opción A: Backend local**
```bash
# En una terminal, desde la raíz del proyecto:
cd backend
npm run dev
```

Verifica que esté corriendo:
```bash
curl http://localhost:3000/health
# Debe responder: {"status":"ok"}
```

**Opción B: Backend en Railway**
- Verifica que el servicio esté activo en Railway
- URL: `https://canalmedico-production.up.railway.app`
- Health check: `https://canalmedico-production.up.railway.app/health`
- Swagger: `https://canalmedico-production.up.railway.app/api-docs`

### Paso 2: Configurar variables de entorno

1. **Navega a la carpeta del frontend:**
   ```bash
   cd frontend-web
   ```

2. **Crea el archivo `.env`:**

   **Para desarrollo local:**
   ```env
   VITE_API_URL=http://localhost:3000
   ```

   **Para usar el backend de Railway:**
   ```env
   VITE_API_URL=https://canalmedico-production.up.railway.app
   ```

3. **Guarda el archivo** en `frontend-web/.env`

### Paso 3: Instalar dependencias (si no lo has hecho)

```bash
cd frontend-web
npm install
```

### Paso 4: Iniciar el servidor de desarrollo

```bash
cd frontend-web
npm run dev
```

Deberías ver algo como:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Paso 5: Abrir en el navegador

Abre tu navegador en:
```
http://localhost:5173
```

---

## 🔐 Crear Cuenta de Médico para Probar

Necesitas una cuenta de médico para probar el panel. Tienes varias opciones:

### Opción 1: Usar Swagger UI (Recomendado)

1. Ve a: `http://localhost:3000/api-docs` (o la URL de tu backend)
2. Busca el endpoint `POST /api/auth/register`
3. Click en "Try it out"
4. Ingresa estos datos:
   ```json
   {
     "email": "doctor@test.com",
     "password": "password123",
     "name": "Dr. Test",
     "role": "DOCTOR",
     "speciality": "Medicina General"
   }
   ```
5. Click en "Execute"
6. Deberías recibir una respuesta con el usuario creado

### Opción 2: Usar curl o Postman

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "password123",
    "name": "Dr. Test",
    "role": "DOCTOR",
    "speciality": "Medicina General"
  }'
```

### Opción 3: Usar la consola del navegador

1. Abre el frontend: `http://localhost:5173`
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña "Console"
4. Ejecuta:
   ```javascript
   fetch('http://localhost:3000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'doctor@test.com',
       password: 'password123',
       name: 'Dr. Test',
       role: 'DOCTOR',
       speciality: 'Medicina General'
     })
   }).then(r => r.json()).then(console.log)
   ```

---

## ✅ Funcionalidades a Probar

Una vez que hayas iniciado sesión, prueba estas funcionalidades:

### 1. **Dashboard** (`/`)
- ✅ Ver estadísticas (si ya tienes consultas creadas)
- ✅ Toggle de estado en línea/disponible (botón inferior)
- ✅ Ver consultas recientes
- ✅ Click en "Abrir Chat" para ir al chat de una consulta activa

### 2. **Consultas** (`/consultations`)
- ✅ Ver lista de todas las consultas
- ✅ Usar filtros por estado (dropdown en la esquina superior derecha)
- ✅ Paginación (si tienes muchas consultas)
- ✅ Click en "Chat" para abrir una consulta activa
- ✅ Click en "Cerrar" para cerrar una consulta

### 3. **Chat** (`/chat/:consultationId`)
- ✅ Ver mensajes (si existen)
- ✅ Enviar mensajes de texto
- ✅ **Subir archivos:**
  - Click en "Adjuntar archivo"
  - Selecciona una imagen (debería mostrar preview)
  - Selecciona un PDF
  - Selecciona un audio (MP3, WAV, etc.)
- ✅ Ver imágenes en el chat
- ✅ Ver PDFs (click en el enlace)
- ✅ Reproducir audios (player integrado)
- ✅ Cerrar consulta desde el chat

### 4. **Ingresos** (`/earnings`)
- ✅ Ver total de ingresos netos
- ✅ Ver historial de pagos (si hay pagos realizados)
- ✅ Ver comisiones descontadas

### 5. **Configuración** (`/settings`)
- ✅ Editar nombre y especialidad
- ✅ Configurar tarifas (consulta normal y urgencia)
- ✅ Activar/desactivar disponibilidad (checkbox)
- ✅ Guardar cambios

### 6. **Perfil** (`/profile`)
- ✅ Ver información del perfil
- ✅ Editar datos personales

---

## 🐛 Solución de Problemas

### ❌ "No se puede conectar al backend"

**Síntomas:** Errores de red en la consola del navegador, no carga datos

**Soluciones:**
1. Verifica que el backend esté corriendo:
   ```bash
   curl http://localhost:3000/health
   ```

2. Verifica el archivo `.env`:
   ```bash
   # Debe contener:
   VITE_API_URL=http://localhost:3000
   ```

3. **Importante:** Reinicia el servidor de desarrollo después de cambiar `.env`:
   ```bash
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo:
   npm run dev
   ```

4. Verifica CORS en el backend (si el backend está en Railway):
   - El backend debe permitir requests desde `http://localhost:5173`

### ❌ "Error 401: No autenticado"

**Síntomas:** No puedes iniciar sesión o te expulsa constantemente

**Soluciones:**
1. Verifica que tengas un usuario médico creado (ver sección anterior)
2. Verifica las credenciales (email y contraseña)
3. Limpia el localStorage:
   - Abre DevTools (F12)
   - Ve a Application > Local Storage
   - Elimina el item `auth-storage`
   - Recarga la página

### ❌ "Error al subir archivo"

**Síntomas:** No se pueden subir archivos en el chat

**Soluciones:**
1. Verifica que AWS S3 esté configurado en el backend
2. Verifica que el endpoint `/api/files/upload` funcione:
   ```bash
   # Usa Swagger o curl para probar el endpoint
   ```
3. Verifica los permisos del bucket S3 en AWS

### ❌ "Socket.io no conecta"

**Síntomas:** El chat no funciona en tiempo real

**Soluciones:**
1. Verifica que Socket.io esté configurado en el backend
2. Verifica que el token JWT sea válido
3. Revisa la consola del navegador (F12) para ver errores específicos
4. El chat tiene fallback a API REST, así que aún deberías poder enviar mensajes

### ❌ El servidor no inicia

**Síntomas:** `npm run dev` falla

**Soluciones:**
1. Verifica que tengas Node.js instalado:
   ```bash
   node --version
   # Debe ser v18.x o superior
   ```

2. Reinstala las dependencias:
   ```bash
   cd frontend-web
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Verifica que no haya otro proceso usando el puerto 5173:
   ```bash
   # Windows PowerShell:
   netstat -ano | findstr :5173
   ```

---

## 📝 Notas Importantes

1. **Variables de entorno:** Si cambias `.env`, **siempre reinicia el servidor** (`npm run dev`)

2. **Backend requerido:** El frontend **necesita** el backend corriendo para funcionar. No puede funcionar solo.

3. **Primera vez:** Si es la primera vez que pruebas:
   - Necesitas crear una cuenta de médico (ver sección anterior)
   - No tendrás consultas hasta que un paciente cree una
   - Para probar el chat, necesitas crear una consulta primero (desde la app móvil o manualmente)

4. **Datos de prueba:** Para probar completamente, necesitarás:
   - Una cuenta de médico creada
   - Al menos una consulta creada (desde la app móvil o manualmente)
   - Un paciente que haya iniciado la consulta

---

## 🎯 Próximos Pasos

Una vez que el frontend funcione:

1. ✅ Prueba todas las funcionalidades listadas arriba
2. ✅ Crea una consulta (desde la app móvil o manualmente)
3. ✅ Prueba el chat con archivos
4. ✅ Verifica que los pagos se reflejen en el panel de ingresos
5. ✅ Prueba cerrar y abrir consultas

---

## 📚 Recursos Adicionales

- [Documentación del Frontend Web](./frontend-web/README.md)
- [Documentación del Backend API](../backend/README.md)
- [Swagger UI](http://localhost:3000/api-docs) (cuando el backend esté corriendo)

---

## ✅ Checklist de Verificación

Antes de probar, verifica:

- [ ] Backend API está corriendo (local o Railway)
- [ ] Archivo `.env` existe en `frontend-web/`
- [ ] `VITE_API_URL` está configurado correctamente en `.env`
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor de desarrollo iniciado (`npm run dev`)
- [ ] Navegador abierto en `http://localhost:5173`
- [ ] Cuenta de médico creada (ver sección anterior)

---

**¿Problemas?** Revisa la sección "Solución de Problemas" arriba o consulta la documentación completa.

