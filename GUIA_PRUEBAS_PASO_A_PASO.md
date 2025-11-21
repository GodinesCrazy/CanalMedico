# 🧪 Guía de Pruebas Paso a Paso - CanalMedico

Esta guía te ayudará a probar cada componente del sistema de forma ordenada y detallada.

---

## 📋 Índice

1. [Backend API](#1-backend-api)
2. [Frontend Web](#2-frontend-web)
3. [App Móvil](#3-app-móvil)

---

## 1. Backend API

### Paso 1: Verificar que el Backend esté corriendo

**En Railway:**
1. Ve a tu proyecto en Railway: https://railway.app
2. Abre el servicio `CanalMedico` (backend)
3. Ve a la pestaña "Deploy Logs"
4. Verifica que el servicio esté corriendo sin errores
5. Anota la URL del servicio (ejemplo: `https://canalmedico-production.up.railway.app`)

**Localmente (alternativa):**
```bash
cd backend
npm install
npm run dev
```

### Paso 2: Verificar Health Check

Abre tu navegador o usa curl:

```bash
curl https://canalmedico-production.up.railway.app/health
```

**Deberías ver:**
```json
{"status":"ok"}
```

### Paso 3: Verificar Swagger UI

Abre en tu navegador:
```
https://canalmedico-production.up.railway.app/api-docs
```

**Deberías ver:**
- La interfaz de Swagger UI
- Lista de endpoints documentados
- Botones "Try it out" en cada endpoint

### Paso 4: Probar Autenticación

#### 4.1. Registrar un Doctor

1. En Swagger UI, busca el endpoint: `POST /api/auth/register`
2. Click en "Try it out"
3. Click en "Execute"
4. Modifica el body JSON con estos datos:
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
6. **Resultado esperado:**
   - Status: `200 OK`
   - Respuesta con el usuario creado (sin password)
   - Campos: `id`, `email`, `name`, `role`, `createdAt`

#### 4.2. Login del Doctor

1. En Swagger UI, busca: `POST /api/auth/login`
2. Click en "Try it out"
3. Click en "Execute"
4. Modifica el body JSON:
```json
{
  "email": "doctor@test.com",
  "password": "password123"
}
```
5. Click en "Execute"
6. **Resultado esperado:**
   - Status: `200 OK`
   - Respuesta con `accessToken` y `refreshToken`
   - **IMPORTANTE:** Copia el `accessToken` para usarlo en las siguientes pruebas

#### 4.3. Obtener Perfil (Autenticado)

1. En Swagger UI, busca: `GET /api/users/profile`
2. Click en "Try it out"
3. Arriba, click en "Authorize"
4. En el campo "Value", pega el `accessToken` que copiaste antes
5. Click en "Authorize" y luego "Close"
6. Click en "Execute"
7. **Resultado esperado:**
   - Status: `200 OK`
   - Respuesta con el perfil del usuario autenticado
   - Incluye información del doctor (si es DOCTOR) o paciente (si es PATIENT)

### Paso 5: Probar Endpoints de Doctores

#### 5.1. Obtener Doctores en Línea

1. En Swagger UI, busca: `GET /api/doctors/online`
2. Click en "Try it out"
3. Click en "Execute"
4. **Resultado esperado:**
   - Status: `200 OK`
   - Lista de doctores con `estadoOnline: true`

#### 5.2. Obtener Todos los Doctores

1. En Swagger UI, busca: `GET /api/doctors`
2. Click en "Try it out"
3. Click en "Execute"
4. **Resultado esperado:**
   - Status: `200 OK`
   - Lista de todos los doctores (en línea y fuera de línea)

#### 5.3. Obtener Doctor por ID

1. Primero, obtén un ID de doctor de la respuesta anterior
2. En Swagger UI, busca: `GET /api/doctors/{id}`
3. Click en "Try it out"
4. En el parámetro `id`, pega el ID del doctor
5. Click en "Execute"
6. **Resultado esperado:**
   - Status: `200 OK`
   - Información completa del doctor
   - Incluye tarifas, especialidad, estado en línea

### Paso 6: Registrar un Paciente

1. En Swagger UI, busca: `POST /api/auth/register`
2. Click en "Try it out"
3. Click en "Execute"
4. Modifica el body JSON:
```json
{
  "email": "paciente@test.com",
  "password": "password123",
  "name": "Paciente Test",
  "role": "PATIENT",
  "age": 30
}
```
5. Click en "Execute"
6. **Resultado esperado:**
   - Status: `200 OK`
   - Usuario creado con `role: "PATIENT"`
7. **IMPORTANTE:** Guarda el `id` del paciente para las siguientes pruebas

### Paso 7: Crear una Consulta

1. Primero, necesitas:
   - ID del doctor (del Paso 5.3)
   - ID del paciente (del Paso 6)
2. En Swagger UI, busca: `POST /api/consultations`
3. Click en "Try it out"
4. **Asegúrate de estar autenticado** (Click en "Authorize" y pega un token válido)
5. Modifica el body JSON:
```json
{
  "doctorId": "ID_DEL_DOCTOR",
  "patientId": "ID_DEL_PACIENTE",
  "type": "NORMAL"
}
```
6. Click en "Execute"
7. **Resultado esperado:**
   - Status: `201 Created`
   - Consulta creada con `status: "PENDING"`
   - Incluye información del doctor y paciente
   - **IMPORTANTE:** Guarda el `id` de la consulta

### Paso 8: Probar Chat/Mensajes

#### 8.1. Enviar un Mensaje

1. Necesitas el ID de la consulta del Paso 7
2. En Swagger UI, busca: `POST /api/messages`
3. Click en "Try it out"
4. **Asegúrate de estar autenticado**
5. Modifica el body JSON:
```json
{
  "consultationId": "ID_DE_LA_CONSULTA",
  "senderId": "ID_DEL_PACIENTE",
  "text": "Hola doctor, tengo una pregunta"
}
```
6. Click en "Execute"
7. **Resultado esperado:**
   - Status: `201 Created`
   - Mensaje creado con timestamp

#### 8.2. Obtener Mensajes de una Consulta

1. En Swagger UI, busca: `GET /api/messages/consultation/{consultationId}`
2. Click en "Try it out"
3. En el parámetro `consultationId`, pega el ID de la consulta
4. **Asegúrate de estar autenticado**
5. Click en "Execute"
6. **Resultado esperado:**
   - Status: `200 OK`
   - Lista de mensajes de la consulta
   - Incluye el mensaje que enviaste en el paso anterior

---

## 2. Frontend Web

### Paso 1: Instalar Dependencias

```bash
cd frontend-web
npm install
```

### Paso 2: Configurar Variables de Entorno

1. Crea un archivo `.env` en la carpeta `frontend-web/`:

```env
VITE_API_URL=https://canalmedico-production.up.railway.app
```

**O si el backend está local:**
```env
VITE_API_URL=http://localhost:3000
```

### Paso 3: Iniciar el Servidor de Desarrollo

```bash
cd frontend-web
npm run dev
```

**Deberías ver:**
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Paso 4: Abrir en el Navegador

Abre tu navegador en:
```
http://localhost:5173
```

### Paso 5: Probar Login

1. Deberías ver la pantalla de Login
2. Ingresa las credenciales del doctor que creaste en el Paso 4.1 del Backend:
   - Email: `doctor@test.com`
   - Password: `password123`
3. Click en "Iniciar Sesión"
4. **Resultado esperado:**
   - Redirección al Dashboard
   - Verás tu nombre y email en la parte superior
   - Verás estadísticas (pueden estar en 0 si no tienes consultas)

### Paso 6: Probar el Dashboard

1. En el Dashboard deberías ver:
   - **Consultas Totales:** Número de consultas
   - **Consultas Activas:** Consultas con status ACTIVE
   - **Ingresos Totales:** Suma de todos los pagos
   - **Ingresos del Mes:** Pagos del mes actual
   - **Lista de Consultas Recientes:** Últimas consultas
   - **Toggle de Estado Online:** Botón para activar/desactivar disponibilidad

2. Prueba el toggle de estado online:
   - Click en el toggle
   - Deberías ver un mensaje de confirmación
   - El estado debería cambiar visualmente

### Paso 7: Probar Consultas

1. En el menú lateral, click en "Consultas"
2. **Resultado esperado:**
   - Lista de todas tus consultas
   - Filtros por estado (PENDING, PAID, ACTIVE, CLOSED)
   - Paginación (si tienes muchas consultas)

3. Si tienes una consulta con status "ACTIVE":
   - Click en el botón "Chat"
   - Deberías ir a la pantalla de Chat

### Paso 8: Probar Chat

1. Si tienes una consulta activa, abre el chat
2. En el chat deberías ver:
   - Mensajes anteriores (si existen)
   - Campo de texto para escribir
   - Botones para adjuntar archivos (imagen, PDF, audio)

3. **Enviar un Mensaje de Texto:**
   - Escribe un mensaje en el campo de texto
   - Click en el botón de enviar (o presiona Enter)
   - **Resultado esperado:**
     - El mensaje aparece inmediatamente en el chat
     - Se muestra del lado derecho (tus mensajes)

4. **Subir una Imagen:**
   - Click en el botón "Adjuntar Archivo"
   - Selecciona una imagen de tu computadora
   - Deberías ver un preview de la imagen
   - Click en "Enviar" o presiona Enter
   - **Resultado esperado:**
     - La imagen se sube a S3
     - Aparece en el chat como imagen (preview)

5. **Subir un PDF:**
   - Click en el botón "Adjuntar Archivo"
   - Selecciona un archivo PDF
   - Deberías ver un icono de PDF
   - Click en "Enviar"
   - **Resultado esperado:**
     - El PDF se sube a S3
     - Aparece en el chat como enlace descargable

6. **Subir un Audio:**
   - Click en el botón "Adjuntar Archivo"
   - Selecciona un archivo de audio (MP3, WAV, etc.)
   - Deberías ver un icono de audio
   - Click en "Enviar"
   - **Resultado esperado:**
     - El audio se sube a S3
     - Aparece en el chat con un reproductor

### Paso 9: Probar Configuración

1. En el menú lateral, click en "Configuración"
2. Deberías ver:
   - Nombre del doctor
   - Especialidad
   - Tarifa de consulta normal
   - Tarifa de consulta de urgencia
   - Checkbox de disponibilidad online

3. **Editar Información:**
   - Cambia el nombre o especialidad
   - Cambia las tarifas
   - Toggle la disponibilidad online
   - Click en "Guardar Cambios"
   - **Resultado esperado:**
     - Mensaje de confirmación
     - Los cambios se guardan

### Paso 10: Probar Ingresos

1. En el menú lateral, click en "Ingresos"
2. Deberías ver:
   - **Ingresos Totales:** Suma de todos los pagos recibidos
   - **Historial de Pagos:** Lista de pagos individuales
   - Cada pago muestra:
     - Fecha
     - Monto
     - Comisión descontada
     - Monto neto

3. Si no tienes pagos, verás un mensaje indicando que no hay ingresos aún

### Paso 11: Probar Perfil

1. En el menú lateral, click en "Perfil"
2. Deberías ver:
   - Tu nombre
   - Email
   - Especialidad
   - Opciones para editar

3. **Editar Perfil:**
   - Cambia el nombre o especialidad
   - Click en "Guardar Cambios"
   - **Resultado esperado:**
     - Mensaje de confirmación
     - Los cambios se reflejan

---

## 3. App Móvil

### Paso 1: Instalar Dependencias

```bash
cd app-mobile
npm install
```

### Paso 2: Configurar Variables de Entorno

1. Verifica que el archivo `app.json` tenga configurado:
   - `expo.extra.apiUrl` apuntando a tu backend de Railway

2. O crea un archivo `.env` en `app-mobile/` (si está configurado):
```env
EXPO_PUBLIC_API_URL=https://canalmedico-production.up.railway.app
```

### Paso 3: Iniciar Expo

```bash
cd app-mobile
npx expo start
```

**Deberías ver:**
- Un QR code en la terminal
- Opciones para abrir en:
  - iOS Simulator
  - Android Emulator
  - Dispositivo físico (usando Expo Go app)

### Paso 4: Abrir en Dispositivo o Simulador

**Opción A: Dispositivo Físico (Recomendado para pruebas completas)**
1. Instala la app "Expo Go" en tu teléfono (iOS o Android)
2. Escanea el QR code con la cámara (iOS) o la app Expo Go (Android)
3. La app se abrirá en tu teléfono

**Opción B: Simulador**
- iOS: Presiona `i` en la terminal
- Android: Presiona `a` en la terminal

### Paso 5: Probar Registro de Paciente

1. En la app, deberías ver la pantalla de Login
2. Click en "Registrarse" o "Crear cuenta"
3. Llena el formulario:
   - Nombre: `Paciente Móvil Test`
   - Email: `pacientemovil@test.com`
   - Contraseña: `password123`
   - Edad: `25` (opcional)
4. Click en "Registrarse"
5. **Resultado esperado:**
   - Mensaje de éxito
   - Redirección automática al Login

### Paso 6: Probar Login

1. En la pantalla de Login, ingresa:
   - Email: `pacientemovil@test.com`
   - Password: `password123`
2. Click en "Iniciar Sesión"
3. **Resultado esperado:**
   - Redirección a la pantalla Home
   - Verás la lista de médicos en línea

### Paso 7: Probar Home (Lista de Médicos)

1. En la pantalla Home deberías ver:
   - **Título:** "Médicos Disponibles"
   - **Botones:**
     - "Buscar Médico"
     - "Escanear Código QR"
   - **Lista de Médicos en Línea:**
     - Cards con avatar, nombre, especialidad
     - Indicador de estado en línea (punto verde)

2. Si no hay médicos en línea:
   - Verás un mensaje: "No hay médicos disponibles"

### Paso 8: Probar Búsqueda de Médico

1. En Home, click en "Buscar Médico"
2. Deberías ver:
   - Barra de búsqueda en la parte superior
   - Lista de todos los médicos (no solo en línea)

3. **Buscar por Nombre:**
   - Escribe en la barra de búsqueda: `Dr. Test`
   - **Resultado esperado:**
     - La lista se filtra mostrando solo el médico que coincide

4. **Seleccionar un Médico:**
   - Click en un médico de la lista
   - **Resultado esperado:**
     - Redirección a la pantalla de detalle del médico
     - Verás:
       - Avatar, nombre, especialidad
       - Estado en línea
       - Tarifas (consulta normal y urgencia)
       - Selector de tipo de consulta
       - Botón "Crear Consulta"

### Paso 9: Crear una Consulta desde la App

1. En la pantalla de detalle del médico:
   - Selecciona tipo de consulta: "Normal" o "Urgencia"
   - Click en "Crear Consulta"
2. **Resultado esperado:**
   - Mensaje de confirmación
   - Redirección automática a la pantalla de Pago
   - Verás el monto a pagar

### Paso 10: Probar Pago

1. En la pantalla de Pago deberías ver:
   - Icono de tarjeta
   - Título: "Procesar Pago"
   - Monto a pagar (grande)
   - Botón o mensaje indicando que se abrirá el navegador

2. **Procesar el Pago:**
   - La app debería abrir el navegador con la página de pago de Stripe
   - **Nota:** Si Stripe no está configurado, verás un error
   - En desarrollo, puedes usar tarjetas de prueba de Stripe

3. **Después del Pago:**
   - El navegador te redirigirá de vuelta a la app
   - **Resultado esperado:**
     - Consulta actualizada a status "PAID" o "ACTIVE"
     - Redirección a la pantalla de detalle de consulta o chat

### Paso 11: Probar Chat desde la App

1. Si tienes una consulta activa:
   - En la pantalla de detalle de consulta, click en "Abrir Chat"
   - O desde la lista de consultas, click en una consulta activa

2. En el chat deberías ver:
   - Mensajes anteriores (si existen)
   - Campo de texto para escribir
   - **Botones de adjuntar:**
     - Imagen (ícono de cámara/foto)
     - PDF (ícono de documento)
     - Audio (ícono de micrófono)

3. **Enviar un Mensaje de Texto:**
   - Escribe un mensaje
   - Click en el botón de enviar
   - **Resultado esperado:**
     - El mensaje aparece inmediatamente en el chat
     - Se muestra del lado derecho (tus mensajes)

4. **Subir una Imagen desde Galería:**
   - Click en el botón de imagen
   - En iOS: verás un ActionSheet con opciones
   - En Android: verás un Alert con opciones
   - Selecciona "Elegir de Galería"
   - Selecciona una imagen de tu galería
   - **Resultado esperado:**
     - La imagen se sube a S3
     - Aparece en el chat como imagen (preview)
     - Puedes hacer click para verla en tamaño completo

5. **Tomar Foto con Cámara:**
   - Click en el botón de imagen
   - Selecciona "Tomar Foto"
   - Toma una foto
   - Confirma la foto
   - **Resultado esperado:**
     - La foto se sube a S3
     - Aparece en el chat

6. **Subir un PDF:**
   - Click en el botón de documento (PDF)
   - Selecciona un PDF de tu dispositivo
   - **Resultado esperado:**
     - El PDF se sube a S3
     - Aparece en el chat como enlace
     - Puedes hacer click para abrirlo en el navegador

7. **Grabar y Enviar Audio:**
   - Click en el botón de micrófono
   - **Resultado esperado:**
     - Aparece un botón rojo indicando "Grabando... Toca para detener"
     - Indicador visual de grabación
   - Habla al micrófono
   - Click en el botón de nuevo para detener
   - **Resultado esperado:**
     - El audio se sube a S3
     - Aparece en el chat con un reproductor
     - Puedes hacer click para reproducirlo

8. **Reproducir Audio:**
   - Si recibes un mensaje con audio, verás un botón de play
   - Click en el botón de play
   - **Resultado esperado:**
     - El audio se reproduce
     - El botón cambia a pause
     - Puedes detener la reproducción clickeando de nuevo

### Paso 12: Probar Escáner QR

1. En Home, click en "Escanear Código QR"
2. **Dar Permisos:**
   - La app pedirá permisos de cámara
   - Acepta los permisos
3. **Resultado esperado:**
   - Verás la vista de la cámara
   - Área de escaneo en el centro
4. **Escanear un Código QR:**
   - Apunta la cámara a un código QR que contenga:
     - `canalmedico://doctor/ID_DEL_DOCTOR`
   - **Resultado esperado:**
     - La app detecta el código
     - Redirección automática a la pantalla del doctor
     - O navegación a la búsqueda con el ID del doctor

### Paso 13: Probar Consultas (Tab de Consultas)

1. En la barra inferior, click en el tab "Consultas"
2. Deberías ver:
   - Lista de todas tus consultas
   - Cards con información del doctor
   - Badges de estado (PENDING, PAID, ACTIVE, CLOSED)
   - Fecha de creación
   - Tipo de consulta

3. **Refrescar:**
   - Desliza hacia abajo para refrescar
   - **Resultado esperado:**
     - La lista se actualiza

4. **Abrir Detalle de Consulta:**
   - Click en una consulta
   - **Resultado esperado:**
     - Redirección a la pantalla de detalle
     - Verás toda la información de la consulta
     - Botones de acción según el estado

### Paso 14: Probar Historial

1. En la barra inferior, click en el tab "Historial"
2. **Resultado esperado:**
   - Verás la misma lista de consultas
   - Filtradas o mostradas todas (depende de la implementación)

### Paso 15: Probar Perfil

1. En la barra inferior, click en el tab "Perfil"
2. Deberías ver:
   - Tu avatar con iniciales
   - Tu nombre
   - Tu email
   - Tu edad (si la proporcionaste)

3. **Opciones del Menú:**
   - Editar Perfil (preparado)
   - Notificaciones (preparado)
   - Ayuda y Soporte (preparado)
   - Acerca de (preparado)

4. **Cerrar Sesión:**
   - Click en "Cerrar Sesión"
   - Confirma la acción
   - **Resultado esperado:**
     - Redirección a la pantalla de Login
     - Los tokens se eliminan

---

## 🔍 Problemas Comunes y Soluciones

### Backend no responde

**Síntoma:** Error 502 o "Connection refused"

**Solución:**
1. Verifica que el backend esté corriendo en Railway
2. Revisa los logs en Railway para ver errores
3. Verifica que las variables de entorno estén configuradas

### Error de autenticación en Frontend Web

**Síntoma:** No puedes iniciar sesión

**Solución:**
1. Verifica que el backend esté corriendo
2. Verifica que `VITE_API_URL` en `.env` sea correcta
3. Revisa la consola del navegador (F12) para ver errores
4. Asegúrate de tener un usuario médico creado

### La app móvil no se conecta al backend

**Síntoma:** Errores de red en la app

**Solución:**
1. Verifica que `EXPO_PUBLIC_API_URL` esté configurada
2. Verifica que el backend esté accesible desde internet
3. Si estás usando un simulador, asegúrate de usar la IP correcta
4. Revisa los logs de Expo para ver errores específicos

### No puedo subir archivos

**Síntoma:** Error al subir imágenes/PDFs/audios

**Solución:**
1. Verifica que AWS S3 esté configurado en el backend
2. Verifica que las variables de entorno de AWS estén en Railway
3. Verifica que el bucket S3 tenga los permisos correctos
4. Revisa los logs del backend para ver errores específicos

### Socket.io no funciona

**Síntoma:** El chat no es en tiempo real

**Solución:**
1. Verifica que Socket.io esté configurado en el backend
2. Verifica que el token JWT sea válido
3. Revisa la consola del navegador/app para errores de WebSocket
4. El chat tiene fallback a API REST, así que deberías poder enviar mensajes de todos modos

---

## ✅ Checklist de Verificación

### Backend:
- [ ] Health check responde correctamente
- [ ] Swagger UI carga y muestra endpoints
- [ ] Puedo registrar un doctor
- [ ] Puedo hacer login
- [ ] Puedo obtener mi perfil
- [ ] Puedo ver doctores en línea
- [ ] Puedo crear una consulta
- [ ] Puedo enviar y recibir mensajes

### Frontend Web:
- [ ] Puedo iniciar sesión como doctor
- [ ] El dashboard carga y muestra datos
- [ ] Puedo ver la lista de consultas
- [ ] Puedo abrir un chat
- [ ] Puedo enviar mensajes de texto
- [ ] Puedo subir imágenes
- [ ] Puedo subir PDFs
- [ ] Puedo subir audios
- [ ] Puedo editar mi configuración
- [ ] Puedo ver mis ingresos

### App Móvil:
- [ ] Puedo registrar un paciente
- [ ] Puedo iniciar sesión
- [ ] Veo la lista de médicos en línea
- [ ] Puedo buscar médicos
- [ ] Puedo escanear código QR
- [ ] Puedo crear una consulta
- [ ] Puedo procesar un pago
- [ ] Puedo abrir un chat
- [ ] Puedo enviar mensajes de texto
- [ ] Puedo subir imágenes (galería y cámara)
- [ ] Puedo subir PDFs
- [ ] Puedo grabar y enviar audios
- [ ] Puedo reproducir audios
- [ ] Puedo ver mi historial de consultas
- [ ] Puedo ver mi perfil

---

**¡Listo para probar!** Sigue los pasos en orden y verifica cada funcionalidad. Si encuentras algún problema, revisa la sección "Problemas Comunes" o revisa los logs del servidor.

