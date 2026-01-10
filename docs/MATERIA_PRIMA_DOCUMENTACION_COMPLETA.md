# MATERIA PRIMA - DOCUMENTACIÓN COMPLETA CANALMEDICO

**Estado:** GO aprobado para producción  
**Fecha:** 2025-01-XX  
**Versión:** 1.0.0

---

## ÍNDICE

1. [ROL 1 - MÉDICO: Flujo Completo](#rol-1---médico)
2. [ROL 2 - PACIENTE: Flujo Completo](#rol-2---paciente)
3. [ROL 3 - ADMINISTRADOR: Flujo Completo](#rol-3---administrador)
4. [Guía Funcional Global](#guía-funcional-global)
5. [Documentación de Producción](#documentación-de-producción)
6. [Estructura Propuesta para GitHub](#estructura-propuesta)

---

# ROL 1 - MÉDICO: Flujo Completo

## 1.1 REGISTRO Y VALIDACIÓN PROFESIONAL

### Pantalla: Solicitud de Registro de Médico

**Qué ve el médico:**
- Formulario con campos:
  - Nombre completo (obligatorio)
  - RUT (obligatorio, formato: 12345678-9)
  - Fecha de nacimiento (opcional, pero recomendado)
  - Especialidad médica (obligatorio, texto libre)
  - Número de registro profesional (opcional)
  - Email (obligatorio, debe ser único)
  - Teléfono (opcional)
  - Clínica o centro (opcional)
  - Notas adicionales (opcional)

**Qué puede hacer:**
- Enviar solicitud de registro
- Ver validación en tiempo real del RUT
- Recibir confirmación de envío

**Qué NO puede hacer:**
- Enviar RUT inválido o ya registrado
- Enviar email duplicado
- Continuar sin RUT

**Qué errores puede encontrar:**
- `400`: "El RUT es obligatorio para el registro de médicos"
- `400`: "Formato de RUT inválido. Use formato: 12345678-9"
- `409`: "Ya existe una solicitud pendiente con este correo electrónico"
- `409`: "Ya existe un usuario registrado con este correo electrónico"

**Backend:** `POST /api/signup-requests/doctor`

---

## 1.2 PROCESO DE VALIDACIÓN AUTOMÁTICA

### Automático (sin intervención del médico)

**Paso 1: Validación de Identidad (Registro Civil vía Floid)**
- Sistema consulta Registro Civil con RUT, nombre y fecha de nacimiento
- **Resultados posibles:**
  - ✅ `IDENTIDAD_VERIFICADA`: Nombre y RUT coinciden
  - ❌ `RUN_INVALIDO`: RUT no existe
  - ❌ `IDENTIDAD_NO_COINCIDE`: Nombre no coincide con RUT
  - ⚠️ `RC_NO_RESPONDE`: Timeout, requiere revisión manual
  - ⚠️ `ERROR_VALIDACION`: Error técnico, requiere revisión manual

**Paso 2: Validación Profesional (RNPI - Superintendencia de Salud)**
- Solo si Paso 1 = ✅ `IDENTIDAD_VERIFICADA`
- Sistema consulta RNPI con RUT, nombre y especialidad
- **Resultados posibles:**
  - ✅ `MEDICO_VERIFICADO` o `RNPI_OK`: Médico habilitado
  - ❌ `NO_MEDICO` o `RNPI_NO_EXISTE`: No es médico registrado
  - ❌ `RNPI_PROFESION_INVALIDA`: Profesión no coincide con especialidad
  - ❌ `SUSPENDIDO` o `RNPI_NO_HABILITADO`: Médico suspendido
  - ⚠️ `INCONSISTENCIA` o `RNPI_INCONSISTENCIA_NOMBRE`: Diferencia menor en nombre
  - ⚠️ `ERROR_VALIDACION` o `RNPI_API_ERROR`: Error técnico

**Decisiones automáticas:**
- **APROBACIÓN AUTOMÁTICA**: Si identidad ✅ Y RNPI ✅
  - Sistema crea usuario y cuenta de médico
  - Genera contraseña temporal (12 caracteres alfanuméricos)
  - Envía notificación push/email con credenciales
  - Estado final: `AUTO_APPROVED`
- **RECHAZO AUTOMÁTICO**: Si identidad ❌ O RNPI ❌ (excepto inconsistencias menores)
  - Estado final: `AUTO_REJECTED`
  - Se guardan errores para referencia
- **REVISIÓN MANUAL**: Si hay errores técnicos o inconsistencias menores
  - Estado final: `REVIEWED`
  - Requiere intervención de admin

**Backend:** Proceso automático iniciado al crear `DoctorSignupRequest`

---

## 1.3 APROBACIÓN / VERIFICACIÓN (si requiere revisión manual)

### Vista del Administrador

**El admin ve:**
- Lista de solicitudes con estado: `PENDING`, `REVIEWED`, `APPROVED`, `REJECTED`, `AUTO_APPROVED`, `AUTO_REJECTED`
- Detalles de cada solicitud:
  - Datos ingresados por el médico
  - Resultado de validación de identidad (JSON completo)
  - Resultado de validación RNPI (JSON completo)
  - Errores de validación automática (si los hay)
  - Fechas de verificación

**El admin puede:**
- Ver detalles completos de validación (`GET /api/admin/signup-requests/:id`)
- Aprobar manualmente (`PATCH /api/admin/signup-requests/:id/approve`)
- Rechazar manualmente (`PATCH /api/admin/signup-requests/:id/reject`)
- Re-ejecutar validaciones (`POST /api/admin/signup-requests/:id/re-run-verifications`)

**Backend:** 
- `GET /api/admin/signup-requests` (solo ADMIN)
- `GET /api/admin/signup-requests/:id` (solo ADMIN)
- `PATCH /api/admin/signup-requests/:id/approve` (solo ADMIN)
- `PATCH /api/admin/signup-requests/:id/reject` (solo ADMIN)
- `POST /api/admin/signup-requests/:id/re-run-verifications` (solo ADMIN)

---

## 1.4 PRIMER ACCESO AL PANEL

### Pantalla: Login

**Qué ve el médico:**
- Campos: Email y Contraseña
- Botón "Iniciar sesión"
- Link "¿Olvidaste tu contraseña?" (si implementado)

**Qué puede hacer:**
- Iniciar sesión con email y contraseña temporal (o cambiada)
- Recibir tokens JWT (accessToken y refreshToken)

**Qué NO puede hacer:**
- Iniciar sesión con credenciales incorrectas
- Acceder sin estar aprobado

**Qué errores puede encontrar:**
- `401`: "Email o contraseña incorrectos"
- `401`: "Token inválido o expirado"

**Backend:** `POST /api/auth/login`

### Pantalla: Dashboard del Médico (Panel Web)

**Qué ve el médico al ingresar:**
- Resumen de consultas activas (contador)
- Consultas pendientes (contador)
- Ingresos del mes (monto)
- Próximas consultas (lista)
- Estadísticas rápidas:
  - Total de consultas (todas)
  - Consultas completadas este mes
  - Rating promedio (si implementado)

**Qué puede hacer:**
- Ver lista completa de consultas (`GET /api/consultations/doctor/:doctorId`)
- Filtrar por estado: `PENDING`, `PAID`, `ACTIVE`, `CLOSED`
- Ver detalles de una consulta específica
- Cambiar estado online/offline

**Backend:** 
- `GET /api/users/profile` (retorna usuario con perfil doctor)
- `GET /api/consultations/doctor/:doctorId`
- `GET /api/doctors/:id/statistics`

---

## 1.5 GESTIÓN DE CONSULTAS

### Pantalla: Lista de Consultas

**Qué ve el médico:**
- Lista paginada de consultas propias
- Cada consulta muestra:
  - ID de consulta
  - Nombre del paciente
  - Tipo: `NORMAL` o `URGENCIA`
  - Estado: `PENDING`, `PAID`, `ACTIVE`, `CLOSED`
  - Fecha de creación
  - Monto de la consulta
  - Último mensaje (preview)

**Qué puede hacer:**
- Filtrar por estado
- Ver detalles completos de una consulta
- Abrir chat de una consulta activa
- Cerrar una consulta activa
- Ver historial de mensajes

**Qué NO puede hacer:**
- Ver consultas de otros médicos (IDOR protegido)
- Cerrar consultas que no son suyas (IDOR protegido)
- Ver mensajes de consultas ajenas (IDOR protegido)

**Estados posibles:**
- `PENDING`: Consulta creada, esperando pago
- `PAID`: Pago completado, esperando activación automática
- `ACTIVE`: Consulta activa, chat disponible
- `CLOSED`: Consulta cerrada por el médico

**Backend:** 
- `GET /api/consultations/doctor/:doctorId?status=ACTIVE&page=1&limit=10`
- `GET /api/consultations/:id` (protegido por ownership middleware)

### Pantalla: Detalle de Consulta

**Qué ve el médico:**
- Información completa de la consulta:
  - Datos del paciente (nombre, edad, RUT si disponible)
  - Tipo de consulta (`NORMAL` o `URGENCIA`)
  - Estado actual
  - Fechas: creación, activación, cierre
  - Información de pago (si aplica)
  - Lista completa de mensajes
- Botones/acciones:
  - "Abrir Chat" (si estado = `ACTIVE`)
  - "Cerrar Consulta" (si estado = `ACTIVE`, solo el médico puede)
  - "Ver Recetas" (si hay recetas asociadas)

**Backend:** `GET /api/consultations/:id` (protegido por ownership)

---

## 1.6 MENSAJERÍA CON PACIENTES

### Pantalla: Chat de Consulta

**Qué ve el médico:**
- Historial completo de mensajes (ordenado por fecha ascendente)
- Cada mensaje muestra:
  - Remitente (doctor o paciente)
  - Contenido: texto, imagen, PDF, audio
  - Fecha y hora de envío
  - Indicador de lectura (si implementado)
- Input para escribir nuevo mensaje
- Botones para adjuntar:
  - Imagen (desde archivo o cámara)
  - PDF
  - Audio (grabación)

**Qué puede hacer:**
- Enviar mensaje de texto
- Adjuntar imagen (formato: JPG, PNG, máximo tamaño según configuración)
- Adjuntar PDF (máximo tamaño según configuración)
- Enviar grabación de audio
- Ver archivos adjuntos en pantalla completa
- Descargar archivos (PDFs, audios)

**Qué NO puede hacer:**
- Enviar mensajes en consultas cerradas o pendientes
- Enviar mensajes en consultas ajenas (IDOR protegido)
- Enviar mensajes como otro usuario (IDOR protegido)

**Validaciones:**
- Solo puede enviar mensajes si `consultation.status === 'ACTIVE'` o `'PAID'`
- Solo puede enviar mensajes si es el doctor o paciente de la consulta
- `senderId` debe coincidir con `doctorId` o `patientId` de la consulta

**Errores posibles:**
- `400`: "La consulta no está activa"
- `403`: "No tienes permiso para enviar mensajes en esta consulta"
- `403`: "No tienes permiso para enviar mensajes como este usuario" (IDOR)
- `404`: "Consulta no encontrada"

**Backend:** 
- `POST /api/messages` (protegido por `requireConsultationOwnership` y `requireSenderOwnership`)
- `GET /api/messages/consultation/:consultationId` (protegido por ownership)
- `GET /api/messages/:id` (protegido por `requireMessageOwnership`)

### Proceso de Subida de Archivos

**Flujo:**
1. Usuario selecciona archivo (imagen/PDF/audio)
2. Frontend sube archivo a `POST /api/files/upload`
3. Backend valida tipo y tamaño
4. Backend sube a AWS S3
5. Backend retorna URL firmada (signed URL)
6. Frontend envía mensaje con `fileUrl`, `pdfUrl` o `audioUrl`
7. Backend guarda mensaje con URL del archivo

**Backend:** `POST /api/files/upload` (retorna signed URL de S3)

---

## 1.7 EMISIÓN DE RECETAS ELECTRÓNICAS (SNRE)

### Pantalla: Crear Receta

**Qué ve el médico:**
- Información de la consulta asociada
- Datos del paciente (nombre, RUT, fecha de nacimiento, género)
- Formulario para agregar medicamentos:
  - Nombre del medicamento (obligatorio)
  - Código TFC (opcional, Terminología Farmacéutica Chilena)
  - Código SNOMED-CT (opcional)
  - Presentación (ej: "Tabletas 500mg")
  - Forma farmacéutica
  - Dosis (ej: "1 tableta")
  - Frecuencia (ej: "cada 8 horas")
  - Duración (ej: "7 días")
  - Cantidad total a dispensar
  - Instrucciones adicionales
- Tipo de receta: `simple` o `magistral`
- Notas adicionales (opcional)
- Botón "Emitir Receta"

**Qué puede hacer:**
- Agregar múltiples medicamentos
- Eliminar medicamentos antes de emitir
- Editar medicamentos antes de emitir
- Emitir receta electrónica

**Qué NO puede hacer:**
- Emitir receta sin RUT del paciente (obligatorio para SNRE)
- Emitir receta sin RUT del médico (obligatorio para SNRE)
- Emitir receta en consultas pendientes o cerradas (solo `ACTIVE` o `CLOSED`)
- Emitir receta para consultas de otros médicos (IDOR protegido)
- Emitir receta sin al menos un medicamento

**Validaciones:**
- Consulta debe existir y pertenecer al médico
- Consulta debe estar en estado `ACTIVE` o `CLOSED`
- Paciente debe tener RUT registrado
- Médico debe tener RUT registrado
- Debe haber al menos un medicamento

**Proceso automático al emitir:**
1. Sistema valida todos los requisitos
2. Sistema crea Bundle FHIR R4 según Guía de Implementación MINSAL
3. Sistema crea registro local con estado `PENDIENTE_ENVIO_SNRE`
4. Sistema envía Bundle al SNRE
5. Si éxito: actualiza estado a `ENVIADA_SNRE` y guarda `snreId`, `snreCode`, `snreBundleId`
6. Si error: actualiza estado a `ERROR_SNRE` y guarda `errorMessage`, `errorDetails`

**Errores posibles:**
- `400`: "El paciente debe tener RUT registrado para emitir recetas SNRE"
- `400`: "El médico debe tener RUT registrado para emitir recetas SNRE"
- `400`: "Solo se pueden emitir recetas en consultas activas o cerradas"
- `403`: "No tienes permiso para emitir recetas en esta consulta" (IDOR)
- `404`: "Consulta no encontrada"
- `400`: Error de validación FHIR o SNRE (mensaje específico)
- `500`: Error de comunicación con SNRE

**Backend:** 
- `POST /api/prescriptions` (protegido por `requireConsultationOwnership`, solo DOCTOR)
- `GET /api/prescriptions/:id` (protegido por `requirePrescriptionOwnership`)
- `GET /api/consultations/:consultationId/prescriptions` (protegido por ownership)

### Pantalla: Lista de Recetas Emitidas

**Qué ve el médico:**
- Lista de todas las recetas emitidas (por consulta o todas)
- Cada receta muestra:
  - ID de receta
  - Paciente
  - Fecha de emisión
  - Estado: `PENDIENTE_ENVIO_SNRE`, `ENVIADA_SNRE`, `ERROR_SNRE`, `ANULADA_SNRE`
  - Código SNRE (si aplica)
  - Medicamentos (lista)

**Qué puede hacer:**
- Ver detalles completos de una receta
- Ver Bundle FHIR original (para auditoría)
- Ver errores si hubo fallo en envío

---

## 1.8 CIERRE DE CONSULTAS

### Acción: Cerrar Consulta

**Qué ve el médico:**
- Botón "Cerrar Consulta" en el detalle de consulta activa

**Qué puede hacer:**
- Cerrar una consulta activa
- Ver confirmación de cierre

**Qué NO puede hacer:**
- Cerrar consultas de otros médicos (IDOR protegido)
- Cerrar consultas que no están activas

**Proceso:**
1. Médico hace clic en "Cerrar Consulta"
2. Sistema valida que es el doctor de la consulta
3. Sistema cambia `status` a `CLOSED`
4. Sistema guarda `closedAt` (timestamp)
5. Sistema puede enviar notificación al paciente

**Errores posibles:**
- `403`: "No tienes permiso para acceder a esta consulta" (IDOR)
- `400`: "Solo se pueden cerrar consultas activas"

**Backend:** `PATCH /api/consultations/:id/close` (protegido por `requireRole('DOCTOR')` y `requireConsultationOwnership`)

---

## 1.9 LIQUIDACIONES Y PAGOS

### Pantalla: Panel de Ingresos (Earnings)

**Qué ve el médico:**
- Resumen financiero:
  - Ingresos totales (suma de `netAmount` de todos los pagos `PAID`)
  - Saldo pendiente de liquidación (`netAmount` de pagos con `payoutStatus = 'PENDING'`)
  - Monto ya liquidado (`netAmount` de pagos con `payoutStatus = 'PAID_OUT'`)
  - Cantidad de pagos por estado de liquidación
- Lista de pagos:
  - Cada pago muestra:
    - ID de consulta
    - Paciente
    - Monto bruto (`amount`)
    - Comisión (`fee`)
    - Monto neto (`netAmount`)
    - Estado del pago: `PENDING`, `PAID`, `FAILED`
    - Estado de liquidación: `PENDING`, `SCHEDULED`, `PAID_OUT`
    - Fecha de pago (`paidAt`)
    - Fecha de liquidación (`payoutDate`, si aplica)

**Qué puede hacer:**
- Ver detalles de un pago específico
- Ver liquidaciones mensuales (si `payoutMode = 'MONTHLY'`)
- Ver estadísticas de ingresos por período

**Modos de liquidación:**
- **INMEDIATO** (`payoutMode = 'IMMEDIATE'`):
  - Al aprobarse el pago, `payoutStatus = 'PAID_OUT'` y `payoutDate = fecha actual`
  - No se agrupa en lotes
- **MENSUAL** (`payoutMode = 'MONTHLY'`):
  - Los pagos se acumulan con `payoutStatus = 'PENDING'`
  - El día configurado (`payoutDay`, default: día 5) se procesan automáticamente
  - Se crea un `PayoutBatch` con todos los pagos pendientes
  - Se marca cada pago con `payoutStatus = 'PAID_OUT'`, `payoutDate` y `payoutBatchId`

**Backend:** 
- `GET /api/payments/doctor/:doctorId` (protegido por `requireRole('DOCTOR')`)
- `GET /api/payouts/my-payouts` (protegido por `requireRole('DOCTOR')`)
- `GET /api/payouts/my-stats` (protegido por `requireRole('DOCTOR')`)
- `GET /api/payouts/:batchId` (protegido por `requirePayoutOwnership`)

### Pantalla: Detalle de Liquidación (PayoutBatch)

**Qué ve el médico:**
- Información del lote:
  - Período (formato: `YYYY-MM`)
  - Monto total
  - Cantidad de pagos incluidos
  - Estado: `PENDING`, `PROCESSED`, `PAID`
  - Fecha de procesamiento
- Lista detallada de pagos incluidos:
  - ID de pago
  - Consulta asociada
  - Paciente
  - Monto neto
  - Fecha de pago original

**Backend:** `GET /api/payouts/:batchId` (protegido por ownership)

---

## 1.10 CONFIGURACIÓN DEL PERFIL MÉDICO

### Pantalla: Configuración / Perfil

**Qué ve el médico:**
- Información personal:
  - Nombre (editable)
  - RUT (solo lectura, no editable)
  - Email (editable, pero requiere validación)
- Información profesional:
  - Especialidad (editable)
  - Horarios de atención (editable, texto libre o JSON estructurado)
- Configuración de disponibilidad:
  - Modo: `MANUAL` o `AUTOMATICO`
  - Si `MANUAL`: toggle de estado online/offline
  - Si `AUTOMATICO`: configuración de horarios (JSON)
- Configuración de tarifas:
  - Tarifa consulta normal (`tarifaConsulta`, en CLP)
  - Tarifa consulta urgencia (`tarifaUrgencia`, en CLP)
- Configuración de liquidaciones:
  - Modo: `IMMEDIATE` o `MONTHLY`
  - Si `MONTHLY`: día del mes (1-28)
  - Información bancaria (JSON encriptado, si implementado)
- Estado de verificación:
  - Identidad validada: ✅/❌
  - Profesión validada: ✅/❌
  - Estado final: `PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `REVISION_MANUAL`
  - Fecha de última verificación

**Qué puede hacer:**
- Actualizar nombre, especialidad, horarios
- Cambiar tarifas (afecta nuevas consultas)
- Configurar disponibilidad (manual o automático)
- Cambiar modo de liquidación
- Ver estado de verificación (solo lectura)

**Qué NO puede hacer:**
- Cambiar RUT (inmutable)
- Cambiar estado de verificación (solo admin)
- Ver información de otros médicos

**Backend:** 
- `GET /api/users/profile` (retorna perfil completo)
- `PUT /api/users/profile` (actualiza perfil)
- `PUT /api/doctors/:id/availability-settings` (actualiza disponibilidad)
- `PUT /api/doctors/:id` (actualiza tarifas y otros datos)

---

# ROL 2 - PACIENTE: Flujo Completo

## 2.1 REGISTRO Y LOGIN

### Pantalla: Registro de Paciente (App Móvil)

**Qué ve el paciente:**
- Formulario con campos:
  - Nombre completo (obligatorio)
  - Email (obligatorio, debe ser único)
  - Contraseña (mínimo 8 caracteres)
  - Confirmar contraseña
  - Edad (opcional)
- Checkbox: "Acepto términos y condiciones"
- Botón "Registrarse"

**Qué puede hacer:**
- Crear cuenta como paciente
- Recibir tokens JWT automáticamente (accessToken y refreshToken)
- Ser redirigido automáticamente al home después del registro

**Qué NO puede hacer:**
- Registrarse con email duplicado
- Usar contraseña menor a 8 caracteres
- Registrarse sin aceptar términos (si implementado)

**Errores posibles:**
- `409`: "El email ya está registrado"
- `400`: "La contraseña debe tener al menos 8 caracteres"
- `400`: "Email inválido"

**Backend:** `POST /api/auth/register` (con `role: 'PATIENT'`)

### Pantalla: Login (App Móvil)

**Qué ve el paciente:**
- Campos: Email y Contraseña
- Botón "Iniciar sesión"
- Link "¿Olvidaste tu contraseña?" (si implementado)
- Link "¿No tienes cuenta? Regístrate"

**Qué puede hacer:**
- Iniciar sesión con email y contraseña
- Ser redirigido automáticamente al home
- Recibir tokens JWT

**Errores posibles:**
- `401`: "Email o contraseña incorrectos"

**Backend:** `POST /api/auth/login`

---

## 2.2 HOME / DASHBOARD DEL PACIENTE

### Pantalla: Home (App Móvil - Tab Principal)

**Qué ve el paciente:**
- Bienvenida personalizada con su nombre
- Accesos rápidos:
  - "Buscar Doctor" (botón grande)
  - "Escanear Código QR" (botón grande, si el doctor tiene QR)
  - "Mis Consultas" (botón)
- Consultas activas (preview):
  - Lista de consultas con estado `ACTIVE`
  - Nombre del doctor
  - Tipo de consulta
  - Fecha de creación
  - Indicador de mensajes nuevos (si implementado)
- Notificaciones recientes (si hay)

**Qué puede hacer:**
- Navegar a búsqueda de doctores
- Navegar a escanear código QR
- Ver lista completa de consultas
- Abrir una consulta activa directamente

**Backend:** 
- `GET /api/users/profile` (retorna perfil paciente)
- `GET /api/consultations/patient/:patientId?status=ACTIVE` (protegido por ownership)

---

## 2.3 CREACIÓN DE CONSULTA

### Pantalla: Búsqueda de Doctor

**Qué ve el paciente:**
- Campo de búsqueda (por nombre o especialidad)
- Lista de doctores disponibles:
  - Nombre
  - Especialidad
  - Tarifa consulta normal (CLP)
  - Tarifa consulta urgencia (CLP)
  - Indicador de disponibilidad (online/offline)
  - Botón "Seleccionar" o card clickeable
- Filtros (si implementados):
  - Por especialidad
  - Solo disponibles (online)
  - Por rango de tarifa

**Qué puede hacer:**
- Buscar doctores
- Ver detalles de un doctor
- Seleccionar un doctor para crear consulta

**Backend:** 
- `GET /api/doctors?page=1&limit=20`
- `GET /api/doctors/online` (solo doctores disponibles)
- `GET /api/doctors/:id` (detalle de doctor)

### Pantalla: Escanear Código QR

**Qué ve el paciente:**
- Vista de cámara para escanear código QR
- Instrucciones: "Apunta la cámara al código QR del doctor"
- Botón "Cancelar"

**Qué puede hacer:**
- Escanear código QR del doctor
- Ser redirigido automáticamente a creación de consulta con ese doctor

**Código QR contiene:**
- Deep link: `canalmedico://doctor/{doctorId}?openChat=true`
- O URL: `https://canalmedico.cl/doctor/{doctorId}`

**Backend:** No requiere backend, solo procesamiento de QR en frontend

### Pantalla: Crear Consulta

**Qué ve el paciente:**
- Información del doctor seleccionado:
  - Nombre
  - Especialidad
  - Tarifas (normal y urgencia)
- Selector de tipo de consulta:
  - Radio button: "Normal" (muestra `tarifaConsulta`)
  - Radio button: "Urgencia" (muestra `tarifaUrgencia`)
- Resumen de costo:
  - Tarifa seleccionada
  - Comisión de la plataforma (15% por defecto)
  - **Total a pagar** (resaltado)
- Botón "Crear Consulta y Pagar"

**Qué puede hacer:**
- Seleccionar tipo de consulta
- Ver monto total antes de crear
- Crear la consulta (que lo lleva al pago)

**Qué NO puede hacer:**
- Crear consulta para otro paciente (IDOR protegido)
- Crear consulta si ya tiene una activa con ese doctor

**Validaciones:**
- `patientId` debe coincidir con el paciente autenticado
- No puede haber consulta activa (`PENDING`, `PAID`, `ACTIVE`) con ese doctor
- Doctor debe existir

**Errores posibles:**
- `404`: "Doctor no encontrado"
- `404`: "Paciente no encontrado"
- `409`: "Ya existe una consulta activa con este doctor"
- `403`: "No tienes permiso para crear consulta para otro paciente" (IDOR)

**Backend:** `POST /api/consultations` (protegido por autenticación, `patientId` viene del token)

**Proceso:**
1. Paciente crea consulta
2. Sistema crea registro con `status = 'PENDING'`
3. Sistema redirige automáticamente a pantalla de pago

---

## 2.4 PAGO DE CONSULTA

### Pantalla: Pago

**Qué ve el paciente:**
- Resumen de la consulta:
  - Doctor
  - Tipo de consulta
  - Monto a pagar (resaltado)
- Botón "Pagar con MercadoPago" (o similar)
- Información de seguridad: "Pago seguro procesado por MercadoPago"

**Qué puede hacer:**
- Iniciar proceso de pago
- Ser redirigido a MercadoPago (en navegador o app nativa)
- Completar pago en MercadoPago
- Ser redirigido automáticamente de vuelta a la app

**Proceso de pago:**
1. Paciente hace clic en "Pagar"
2. Frontend llama `POST /api/payments/session` con `consultationId`
3. Backend calcula monto:
   - `amount = tarifaConsulta` o `tarifaUrgencia` (según tipo)
   - `fee = amount * 0.15` (comisión 15%)
   - `netAmount = amount - fee`
4. Backend crea preferencia en MercadoPago con:
   - `external_reference = consultationId`
   - `items`: Consulta médica
   - `back_urls`: URLs de éxito/cancelación/pendiente
5. Backend crea registro `Payment` con `status = 'PENDING'`
6. Backend retorna `init_point` (URL de pago)
7. Frontend abre `init_point` en navegador/app
8. Paciente completa pago en MercadoPago
9. MercadoPago redirige con deep link: `canalmedico://payment/success?preference_id=xxx`
10. App móvil recibe deep link
11. App hace polling: `GET /api/payments/consultation/:consultationId` hasta que `status = 'PAID'`
12. Cuando pago aprobado, consulta se activa automáticamente (`status = 'ACTIVE'`)

**Webhook (proceso automático):**
- MercadoPago envía webhook a `POST /api/payments/webhook`
- Backend valida:
  - Payment existe en MercadoPago (consulta API)
  - `external_reference` existe en BD (consulta)
  - Status del pago
- Si `status = 'approved'`:
  - Actualiza `Payment.status = 'PAID'`
  - Si `payoutMode = 'IMMEDIATE'`: marca como liquidado
  - Llama `consultationsService.activate()`
  - Cambia `Consultation.status = 'ACTIVE'`
- Envía notificación push al paciente y doctor

**Qué NO puede hacer:**
- Pagar consulta de otro paciente (IDOR protegido)
- Ver detalles de pago de consulta ajena (IDOR protegido)

**Errores posibles:**
- `404`: "Consulta no encontrada"
- `400`: "La consulta ya tiene un pago procesado"
- `400`: "La tarifa no está configurada" (doctor sin tarifa)
- `403`: "No tienes permiso para acceder a este pago" (IDOR)
- Errores de MercadoPago (mostrados en pantalla de pago)

**Backend:** 
- `POST /api/payments/session` (protegido por `requirePaymentOwnership`)
- `POST /api/payments/webhook` (público, validación interna)
- `GET /api/payments/consultation/:consultationId` (protegido por ownership)

---

## 2.5 MENSAJERÍA CON EL DOCTOR

### Pantalla: Chat de Consulta

**Qué ve el paciente:**
- Similar a la vista del médico
- Historial de mensajes (ordenado por fecha)
- Indicador visual de quién envió cada mensaje (doctor vs paciente)
- Input para escribir
- Botones para adjuntar: imagen, PDF, audio

**Qué puede hacer:**
- Enviar mensaje de texto
- Adjuntar imagen (desde galería o cámara)
- Adjuntar PDF (desde archivos)
- Enviar grabación de audio
- Ver archivos adjuntos
- Recibir notificaciones push cuando el doctor responde

**Qué NO puede hacer:**
- Enviar mensajes si consulta no está activa
- Enviar mensajes en consultas ajenas (IDOR protegido)
- Enviar mensajes como otro usuario (IDOR protegido)

**Validaciones:**
- Solo puede enviar si `consultation.status === 'ACTIVE'` o `'PAID'`
- `senderId` debe ser `patientId` de la consulta

**Backend:** Mismo que médico (protegido por ownership)

---

## 2.6 RECEPCIÓN DE RECETA

### Pantalla: Consulta Detalle (después de recibir receta)

**Qué ve el paciente:**
- Sección "Recetas" (si hay recetas asociadas)
- Lista de recetas:
  - Fecha de emisión
  - Estado: `ENVIADA_SNRE`, `ERROR_SNRE`
  - Código SNRE (si aplica)
  - Lista de medicamentos:
    - Nombre
    - Dosis
    - Frecuencia
    - Duración
    - Instrucciones
- Botón "Ver Receta Completa"

### Pantalla: Detalle de Receta

**Qué ve el paciente:**
- Información completa de la receta:
  - Doctor emisor
  - Fecha de emisión
  - Código SNRE (si aplica)
  - Medicamentos (lista completa con todos los detalles)
  - Notas adicionales (si las hay)
- Botón "Compartir Receta" (si implementado)
- Botón "Guardar PDF" (si implementado)

**Qué puede hacer:**
- Ver detalles completos de la receta
- Verificar código SNRE (puede validar en sitio oficial de SNRE)
- Guardar/descargar receta (si implementado)
- Compartir receta con farmacia (si implementado)

**Qué NO puede hacer:**
- Ver recetas de otros pacientes (IDOR protegido)
- Modificar recetas

**Backend:** 
- `GET /api/prescriptions/:id` (protegido por `requirePrescriptionOwnership`)
- `GET /api/consultations/:consultationId/prescriptions` (protegido por ownership)

---

## 2.7 CIERRE DE CONSULTA

### Vista: Consulta Cerrada

**Qué ve el paciente:**
- Indicador visual de que la consulta está cerrada
- Mensaje: "Esta consulta fue cerrada por el doctor el [fecha]"
- Historial completo de mensajes (solo lectura)
- Recetas asociadas (solo lectura)
- Información de pago (solo lectura)

**Qué puede hacer:**
- Ver historial completo de la consulta
- Ver recetas emitidas
- Ver información de pago
- Crear nueva consulta con el mismo o otro doctor

**Qué NO puede hacer:**
- Enviar nuevos mensajes (consulta cerrada)
- Cerrar la consulta (solo el doctor puede)

---

## 2.8 PERFIL DEL PACIENTE

### Pantalla: Perfil

**Qué ve el paciente:**
- Información personal:
  - Nombre (editable)
  - Email (editable, pero requiere validación)
  - Edad (editable)
  - RUT (editable, necesario para recibir recetas SNRE)
  - Fecha de nacimiento (editable, necesario para SNRE)
  - Género (editable, necesario para SNRE)
  - Dirección (editable, necesario para SNRE)
- Historial de consultas:
  - Lista de todas las consultas (todas)
  - Filtros: por estado, por doctor
- Botón "Cerrar sesión"

**Qué puede hacer:**
- Actualizar información personal
- Agregar/completar RUT (si quiere recibir recetas SNRE)
- Ver historial completo de consultas
- Cerrar sesión

**Backend:** 
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/consultations/patient/:patientId` (protegido por ownership)

---

# ROL 3 - ADMINISTRADOR: Flujo Completo

## 3.1 GESTIÓN DE USUARIOS

### Pantalla: Panel de Administración

**Qué ve el admin:**
- Dashboard con métricas:
  - Total de usuarios (doctores + pacientes)
  - Solicitudes de registro pendientes
  - Consultas activas
  - Ingresos del mes (comisiones)
- Menú de navegación:
  - Gestión de solicitudes de registro
  - Gestión de médicos
  - Gestión de pacientes
  - Monitoreo de consultas
  - Supervisión de pagos
  - Estadísticas de comisiones

**Backend:** Todos los endpoints requieren `requireRole('ADMIN')`

---

## 3.2 VALIDACIÓN DE MÉDICOS

### Pantalla: Solicitudes de Registro

**Qué ve el admin:**
- Lista de solicitudes con filtros:
  - Estado: `PENDING`, `REVIEWED`, `APPROVED`, `REJECTED`, `AUTO_APPROVED`, `AUTO_REJECTED`
  - Fecha de creación
- Cada solicitud muestra:
  - Nombre
  - Email
  - RUT
  - Especialidad
  - Estado
  - Resultados de validación automática (resumen)
- Botones de acción:
  - "Ver Detalles"
  - "Aprobar"
  - "Rechazar"
  - "Re-ejecutar Validaciones"

### Pantalla: Detalle de Solicitud

**Qué ve el admin:**
- Datos ingresados por el médico
- Resultado de validación de identidad:
  - Estado: `IDENTIDAD_VERIFICADA`, `RUN_INVALIDO`, `IDENTIDAD_NO_COINCIDE`, etc.
  - Datos del Registro Civil (encriptados, si aplica)
  - Fecha de verificación
  - Errores (si los hay)
- Resultado de validación RNPI:
  - Estado: `MEDICO_VERIFICADO`, `NO_MEDICO`, `SUSPENDIDO`, etc.
  - Datos de RNPI (encriptados, si aplica)
  - Profesión según RNPI
  - Fecha de verificación
  - Inconsistencias (si las hay)
- Errores de validación automática (JSON completo)
- Acciones:
  - Aprobar manualmente
  - Rechazar manualmente
  - Re-ejecutar validaciones

**Qué puede hacer:**
- Ver todos los detalles de validación
- Aprobar solicitud (crea usuario y cuenta de médico)
- Rechazar solicitud (con motivo)
- Re-ejecutar validaciones automáticas (útil si hubo error técnico)
- Ver logs de validación

**Qué NO puede hacer:**
- Ver solicitudes de otros admins (no aplica, todos ven todo)

**Backend:** 
- `GET /api/admin/signup-requests?status=PENDING&page=1&limit=10` (solo ADMIN)
- `GET /api/admin/signup-requests/:id` (solo ADMIN)
- `PATCH /api/admin/signup-requests/:id/approve` (solo ADMIN)
- `PATCH /api/admin/signup-requests/:id/reject` (solo ADMIN)
- `POST /api/admin/signup-requests/:id/re-run-verifications` (solo ADMIN)

---

## 3.3 RE-VALIDACIÓN DE MÉDICOS

### Pantalla: Re-validar Médico

**Qué ve el admin:**
- Lista de médicos con estado de verificación
- Filtros:
  - Estado: `PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `REVISION_MANUAL`
  - Fecha de última verificación
- Cada médico muestra:
  - Nombre
  - RUT
  - Estado de verificación
  - Fecha de última verificación

**Qué puede hacer:**
- Ver detalles de verificación de un médico
- Re-ejecutar validación completa (identidad + RNPI)
- Ver logs de validación

**Backend:** 
- `POST /api/admin/revalidar-medico/:id` (solo ADMIN)

---

## 3.4 MONITOREO DE CONSULTAS

### Pantalla: Monitoreo de Consultas

**Qué ve el admin:**
- Lista de todas las consultas (todas las de todos los usuarios)
- Filtros:
  - Por estado
  - Por doctor
  - Por paciente
  - Por rango de fechas
- Cada consulta muestra:
  - ID
  - Doctor
  - Paciente
  - Tipo
  - Estado
  - Fechas (creación, activación, cierre)
  - Monto pagado
- Acciones:
  - Ver detalles completos
  - Ver mensajes
  - Ver recetas
  - Ver información de pago

**Qué puede hacer:**
- Ver todas las consultas (sin restricciones)
- Ver detalles completos de cualquier consulta
- Ver mensajes de cualquier consulta
- Ver recetas de cualquier consulta
- Ver información de pago de cualquier consulta

**Backend:** Endpoints sin restricciones de ownership (admin bypass)

---

## 3.5 SUPERVISIÓN DE PAGOS

### Pantalla: Supervisión de Pagos

**Qué ve el admin:**
- Lista de todos los pagos
- Filtros:
  - Por estado: `PENDING`, `PAID`, `FAILED`
  - Por estado de liquidación: `PENDING`, `SCHEDULED`, `PAID_OUT`
  - Por doctor
  - Por rango de fechas
- Métricas:
  - Total de comisiones generadas
  - Comisiones del mes actual
  - Cantidad de pagos
- Cada pago muestra:
  - ID
  - Consulta asociada
  - Doctor
  - Paciente
  - Monto bruto
  - Comisión
  - Monto neto
  - Estado
  - Estado de liquidación
  - Fechas

**Qué puede hacer:**
- Ver todos los pagos
- Ver detalles de cualquier pago
- Ver información de MercadoPago (IDs, preferencias)
- Ver webhooks recibidos (logs)

**Backend:** 
- `GET /api/admin/payments` (si implementado, solo ADMIN)
- Endpoints de comisiones: `GET /api/commissions/stats`, etc. (solo ADMIN)

---

## 3.6 PROCESAMIENTO DE LIQUIDACIONES MENSUALES

### Acción: Procesar Liquidaciones Mensuales

**Qué ve el admin:**
- Botón "Procesar Liquidaciones Mensuales"
- Lista de médicos con modo `MONTHLY` y día de liquidación = hoy
- Resumen de lo que se va a procesar:
  - Cantidad de médicos
  - Cantidad de pagos a liquidar
  - Monto total

**Qué puede hacer:**
- Ejecutar procesamiento manual (normalmente es automático)
- Ver resultados del procesamiento

**Proceso automático (sin intervención):**
- Job diario verifica si hoy es el día de liquidación de algún médico
- Para cada médico con `payoutMode = 'MONTHLY'` y `payoutDay = día actual`:
  - Busca todos los pagos con `payoutStatus = 'PENDING'` y `status = 'PAID'`
  - Crea `PayoutBatch` con:
    - `period = 'YYYY-MM'`
    - `totalAmount = suma de netAmount`
    - `paymentCount = cantidad de pagos`
    - `status = 'PROCESSED'`
  - Marca todos los pagos con `payoutStatus = 'PAID_OUT'`, `payoutDate` y `payoutBatchId`

**Backend:** 
- `POST /api/payouts/process` (solo ADMIN, ejecuta procesamiento manual)
- Job automático ejecutado diariamente

---

## 3.7 ESTADÍSTICAS DE COMISIONES

### Pantalla: Estadísticas de Comisiones

**Qué ve el admin:**
- Métricas generales:
  - Total de comisiones generadas (histórico)
  - Comisiones del mes actual
  - Cantidad de pagos procesados
- Comisiones por período:
  - Seleccionar rango de fechas
  - Ver desglose de comisiones por día/semana/mes
- Comisiones por doctor:
  - Lista de doctores
  - Comisiones generadas por cada uno
  - Cantidad de consultas
- Detalle mensual:
  - Comisiones por mes
  - Tendencias

**Qué puede hacer:**
- Ver estadísticas generales
- Filtrar por período
- Ver comisiones por doctor
- Exportar reportes (si implementado)

**Backend:** 
- `GET /api/commissions/stats` (solo ADMIN)
- `GET /api/commissions/period?startDate=...&endDate=...` (solo ADMIN)
- `GET /api/commissions/by-doctor` (solo ADMIN)
- `GET /api/commissions/monthly` (solo ADMIN)
- `GET /api/commissions/doctor/:doctorId` (solo ADMIN)

---

## 3.8 RESOLUCIÓN DE INCIDENCIAS

### Incidencias Comunes y Soluciones

**1. Pago no se activó consulta:**
- Verificar webhook en logs
- Verificar estado del pago en MercadoPago
- Verificar `external_reference` en pago
- Re-ejecutar webhook manualmente (si implementado)

**2. Validación de médico falló por error técnico:**
- Re-ejecutar validaciones desde admin panel
- Verificar conectividad con Registro Civil (Floid)
- Verificar conectividad con RNPI
- Aprobar manualmente si datos son correctos

**3. Receta no se envió al SNRE:**
- Verificar logs de error
- Verificar conectividad con SNRE
- Verificar datos del paciente (RUT, fecha de nacimiento)
- Re-enviar manualmente (si implementado)

**4. Consulta no puede cerrarse:**
- Verificar ownership (debe ser el doctor)
- Verificar estado (debe ser `ACTIVE`)
- Forzar cierre desde admin (si implementado)

---

# GUÍA FUNCIONAL GLOBAL

## 4.1 QUÉ PROBLEMA RESUELVE CANALMEDICO

**Problema principal:**
Conectar médicos y pacientes de forma remota para consultas médicas asíncronas mediante chat, con pagos integrados, recetas electrónicas válidas y liquidaciones automáticas.

**Solución:**
- Plataforma de telemedicina que permite:
  - Consultas médicas asíncronas (no en tiempo real, sino por mensajes)
  - Pagos seguros integrados (MercadoPago)
  - Recetas electrónicas válidas (SNRE, HL7 FHIR R4)
  - Validación automática de médicos (Registro Civil + RNPI)
  - Liquidaciones automáticas (inmediato o mensual)
  - Panel web para médicos y app móvil para pacientes

---

## 4.2 CÓMO FLUYE LA INFORMACIÓN

### Flujo Principal: Consulta Completa

```
1. PACIENTE
   ├── Registro → Usuario creado → Tokens JWT
   ├── Búsqueda de doctor → Lista de doctores disponibles
   ├── Selección de doctor → Crear consulta
   │   └── POST /api/consultations
   │       └── Consulta creada (status: PENDING)
   │
   ├── Pago de consulta
   │   ├── POST /api/payments/session
   │   │   └── Preferencia MercadoPago creada
   │   │   └── Payment creado (status: PENDING)
   │   │
   │   ├── Paciente completa pago en MercadoPago
   │   │
   │   └── Webhook MercadoPago → POST /api/payments/webhook
   │       ├── Validación de pago en MercadoPago
   │       ├── Validación de external_reference
   │       ├── Payment actualizado (status: PAID)
   │       └── Consulta activada (status: ACTIVE)
   │           └── Notificación push → Paciente y Doctor
   │
   ├── Mensajería
   │   ├── POST /api/messages
   │   │   ├── Validación de ownership (consultation + sender)
   │   │   ├── Validación de estado (ACTIVE o PAID)
   │   │   └── Mensaje guardado
   │   │
   │   └── GET /api/messages/consultation/:id
   │       └── Lista de mensajes (ordenada por fecha)
   │
   └── Recepción de receta (si doctor emite)
       ├── Doctor emite receta → POST /api/prescriptions
       │   ├── Validación de ownership (consulta del doctor)
       │   ├── Validación de RUTs (doctor y paciente)
       │   ├── Creación de Bundle FHIR
       │   ├── Envío al SNRE
       │   └── Prescription guardada (status: ENVIADA_SNRE o ERROR_SNRE)
       │
       └── Paciente ve receta → GET /api/prescriptions/:id
           └── Validación de ownership

2. DOCTOR
   ├── Solicitud de registro → POST /api/signup-requests/doctor
   │   └── Validación automática iniciada (async)
   │       ├── Validación de identidad (Registro Civil)
   │       ├── Validación profesional (RNPI)
   │       └── Decisión: AUTO_APPROVED, AUTO_REJECTED, REVIEWED
   │
   ├── Aprobación (manual o automática)
   │   └── Usuario y Doctor creados
   │       └── Notificación con contraseña temporal
   │
   ├── Login → POST /api/auth/login
   │   └── Tokens JWT
   │
   ├── Gestión de consultas
   │   ├── GET /api/consultations/doctor/:id
   │   │   └── Lista de consultas (filtrable por estado)
   │   │
   │   └── GET /api/consultations/:id
   │       └── Detalle completo (protegido por ownership)
   │
   ├── Mensajería (igual que paciente)
   │
   ├── Emisión de recetas
   │   └── POST /api/prescriptions
   │       └── Validación + FHIR + SNRE
   │
   ├── Cierre de consulta
   │   └── PATCH /api/consultations/:id/close
   │       ├── Validación de ownership (solo el doctor puede cerrar)
   │       └── Consulta actualizada (status: CLOSED, closedAt: timestamp)
   │
   └── Liquidaciones
       ├── GET /api/payouts/my-payouts
       │   └── Lista de liquidaciones (si modo: MONTHLY)
       │
       ├── GET /api/payouts/my-stats
       │   └── Estadísticas: total, pendiente, liquidado
       │
       └── GET /api/payouts/:batchId
           └── Detalle de liquidación (protegido por ownership)

3. ADMINISTRADOR
   ├── Gestión de solicitudes
   │   ├── GET /api/admin/signup-requests
   │   │   └── Lista de solicitudes (filtrable por estado)
   │   │
   │   ├── GET /api/admin/signup-requests/:id
   │   │   └── Detalle completo con resultados de validación
   │   │
   │   ├── PATCH /api/admin/signup-requests/:id/approve
   │   │   └── Aprobar manualmente (crea usuario y doctor)
   │   │
   │   └── POST /api/admin/signup-requests/:id/re-run-verifications
   │       └── Re-ejecutar validaciones automáticas
   │
   ├── Re-validación de médicos
   │   └── POST /api/admin/revalidar-medico/:id
   │       └── Re-ejecutar validación completa
   │
   ├── Monitoreo de consultas
   │   └── Acceso sin restricciones de ownership
   │
   ├── Supervisión de pagos
   │   └── Ver todos los pagos y webhooks
   │
   ├── Procesamiento de liquidaciones
   │   └── POST /api/payouts/process
   │       └── Ejecutar procesamiento manual (normalmente automático)
   │
   └── Estadísticas de comisiones
       └── GET /api/commissions/*
           └── Ver todas las estadísticas y reportes
```

---

## 4.3 QUÉ SUCEDE CUANDO ALGO FALLA

### Fallos Comunes y Comportamiento del Sistema

**1. Pago no se activó consulta:**

**Síntoma:** Consulta sigue en estado `PENDING` después de pagar.

**Causas posibles:**
- Webhook no llegó desde MercadoPago
- Webhook llegó pero falló validación
- Error en activación de consulta

**Qué hace el sistema:**
- Webhook valida pago en MercadoPago (consulta API)
- Si pago existe y está `approved`, actualiza `Payment.status = 'PAID'`
- Llama `consultationsService.activate()`
- Si activación falla, logea error pero pago queda como `PAID`

**Solución manual:**
- Admin puede verificar estado del pago en MercadoPago
- Admin puede activar consulta manualmente (si implementado)
- Paciente puede hacer polling hasta que consulta se active

**2. Validación de médico falló por error técnico:**

**Síntoma:** Solicitud queda en estado `REVIEWED` sin decisión automática.

**Causas posibles:**
- Timeout en consulta a Registro Civil (Floid)
- Timeout en consulta a RNPI
- Error de red
- API externa no disponible

**Qué hace el sistema:**
- Marca solicitud como `REVIEWED` (requiere revisión manual)
- Guarda errores en `autoVerificationErrors` (JSON)
- Logea error completo

**Solución manual:**
- Admin ve solicitud en panel
- Admin puede re-ejecutar validaciones
- Admin puede aprobar manualmente si datos son correctos

**3. Receta no se envió al SNRE:**

**Síntoma:** Receta queda en estado `ERROR_SNRE`.

**Causas posibles:**
- Error de validación FHIR (datos incompletos)
- Error de comunicación con SNRE
- SNRE rechazó la receta (validación)
- RUT del paciente o doctor inválido

**Qué hace el sistema:**
- Guarda receta localmente con estado `PENDIENTE_ENVIO_SNRE`
- Intenta enviar al SNRE
- Si falla, actualiza estado a `ERROR_SNRE`
- Guarda `errorMessage` y `errorDetails` (JSON)

**Solución manual:**
- Médico puede ver error en detalle de receta
- Médico puede corregir datos y re-emitir (si implementado)
- Admin puede ver logs de error

**4. Mensaje no se puede enviar:**

**Síntoma:** Error 400 o 403 al enviar mensaje.

**Causas posibles:**
- Consulta no está activa (`status !== 'ACTIVE'` y `!== 'PAID'`)
- Usuario no es parte de la consulta (IDOR)
- `senderId` no coincide con usuario autenticado (IDOR)

**Qué hace el sistema:**
- Valida ownership antes de crear mensaje
- Valida estado de consulta
- Retorna error claro (400 o 403)

**Solución:**
- Usuario debe esperar a que consulta esté activa
- Usuario no puede enviar mensajes en consultas ajenas (por diseño)

**5. Pago falló validación de webhook:**

**Síntoma:** Webhook rechazado (log muestra error).

**Causas posibles:**
- Pago no existe en MercadoPago (ID inválido)
- `external_reference` no corresponde a consulta válida
- Headers inválidos (User-Agent, etc.)

**Qué hace el sistema:**
- Valida pago en MercadoPago antes de procesar
- Valida `external_reference` contra BD
- Si validación falla, rechaza webhook (retorna 200 pero no procesa)
- Logea error completo

**Solución:**
- Admin puede ver logs de webhook
- Admin puede verificar estado del pago en MercadoPago
- Admin puede activar consulta manualmente si pago es válido

---

## 4.4 CÓMO SE RELACIONAN LOS MÓDULOS

### Arquitectura de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION                          │
│  - Registro (crea User + Doctor/Patient)                    │
│  - Login (genera JWT tokens)                                │
│  - Refresh Token                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCTOR VERIFICATION                       │
│  - Signup Request (crea DoctorSignupRequest)                │
│  - Validación automática (Identity + RNPI)                  │
│  - Aprobación (crea User + Doctor)                          │
│  - Re-validación                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONSULTATIONS                           │
│  - Creación (Paciente crea, status: PENDING)                │
│  - Activación (después de pago, status: ACTIVE)             │
│  - Cierre (Doctor cierra, status: CLOSED)                   │
│  - Ownership validation (IDOR prevention)                   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PAYMENTS   │    │   MESSAGES   │    │ PRESCRIPTIONS│
│              │    │              │    │              │
│ - Session    │    │ - Create     │    │ - Create     │
│ - Webhook    │    │ - List       │    │ - SNRE       │
│ - Ownership  │    │ - Ownership  │    │ - FHIR       │
└──────────────┘    └──────────────┘    └──────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        PAYOUTS                               │
│  - Immediate (payoutStatus = PAID_OUT al pagar)             │
│  - Monthly (agrupa en PayoutBatch día configurado)          │
│  - Stats (total, pendiente, liquidado)                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      COMMISSIONS                             │
│  - Stats generales (total, mensual)                         │
│  - Por período                                              │
│  - Por doctor                                               │
│  - Mensual                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Dependencias entre Módulos

**1. Consultations depende de:**
- `Auth`: Usuario autenticado
- `Doctors`: Doctor debe existir
- `Patients`: Paciente debe existir
- `Payments`: Para activación

**2. Payments depende de:**
- `Consultations`: `external_reference` es `consultationId`
- `MercadoPago`: API externa
- `Payouts`: Para liquidaciones

**3. Messages depende de:**
- `Consultations`: Mensaje pertenece a consulta
- `Ownership`: Validación de IDOR

**4. Prescriptions depende de:**
- `Consultations`: Receta pertenece a consulta
- `SNRE`: API externa (enviar receta)
- `Ownership`: Validación de IDOR

**5. Payouts depende de:**
- `Payments`: Agrupa pagos para liquidación
- `Consultations`: Para obtener información de doctor

**6. Commissions depende de:**
- `Payments`: Calcula comisiones desde `fee`

---

# DOCUMENTACIÓN DE PRODUCCIÓN

## 5.1 README.md (Usuario + Desarrollador)

### Descripción del Sistema

CanalMedico es una plataforma de telemedicina que conecta médicos y pacientes para consultas médicas asíncronas mediante chat, con integración de pagos (MercadoPago), recetas electrónicas (SNRE) y liquidaciones automáticas.

**Características principales:**
- ✅ Autenticación completa (JWT con refresh tokens)
- ✅ Validación automática de médicos (Registro Civil + RNPI)
- ✅ Consultas médicas asíncronas (chat)
- ✅ Pagos integrados (MercadoPago)
- ✅ Recetas electrónicas válidas (SNRE, HL7 FHIR R4)
- ✅ Liquidaciones automáticas (inmediato o mensual)
- ✅ Panel web para médicos
- ✅ App móvil para pacientes
- ✅ Prevención de IDOR (ownership validation)
- ✅ Encriptación de datos sensibles (AES-256-CBC)

### Requisitos Mínimos

**Backend:**
- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm o yarn

**Frontend Web:**
- Node.js >= 18.0.0
- Navegador moderno (Chrome, Firefox, Safari, Edge)

**App Móvil:**
- Expo SDK ~50.0.0
- iOS 13+ o Android 8+

### Variables de Entorno (sin secretos)

**Ver archivo completo:** `backend/.env.example`

**Variables obligatorias en producción:**
- `NODE_ENV=production`
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` (mínimo 32 caracteres)
- `MERCADOPAGO_ACCESS_TOKEN` (token de acceso MercadoPago)
- `AWS_ACCESS_KEY_ID` (si se usan archivos)
- `AWS_SECRET_ACCESS_KEY` (si se usan archivos)
- `AWS_S3_BUCKET` (si se usan archivos)
- `ENCRYPTION_KEY` (mínimo 32 caracteres, para datos sensibles)
- `ENCRYPTION_SALT` (mínimo 8 caracteres)

**Variables opcionales:**
- `STRIPE_SECRET_KEY` (no se usa actualmente)
- `SNRE_BASE_URL` (si se integra SNRE)
- `SNRE_API_KEY` (si se integra SNRE)
- `FLOID_BASE_URL` (para validación de identidad)
- `FLOID_API_KEY` (para validación de identidad)
- `RNPI_API_URL` (para validación profesional)
- `FIREBASE_SERVER_KEY` (para notificaciones push)

**Validación en producción:**
- El servidor **NO arranca** si faltan variables obligatorias
- El servidor **NO arranca** si hay placeholders en variables críticas
- El servidor **NO arranca** si las claves son demasiado cortas
- Mensajes de error claros (pero sin valores sensibles)

### Flujo de Despliegue

**Backend (Railway recomendado):**

1. Conectar repositorio a Railway
2. Configurar variables de entorno (desde `.env.example`)
3. Railway detecta `package.json` y construye automáticamente
4. Railway ejecuta `npm run build`
5. Railway ejecuta `npm start`
6. Migraciones Prisma se ejecutan automáticamente al arrancar

**Frontend Web:**

1. Build: `npm run build`
2. Deploy a Vercel/Netlify o similar
3. Configurar variables de entorno (API_URL)

**App Móvil:**

1. Build: `npx expo build:android` o `npx expo build:ios`
2. Subir a Google Play / App Store
3. Configurar deep links

### Criterio GO / NO-GO

**GO a Producción si:**
- ✅ Todos los tests críticos pasan (19 tests obligatorios)
- ✅ Variables de entorno configuradas correctamente
- ✅ Validación de entorno pasa (servidor arranca)
- ✅ Base de datos conectada y migraciones aplicadas
- ✅ MercadoPago configurado (en producción, no sandbox)
- ✅ AWS S3 configurado (si se usan archivos)
- ✅ Encriptación configurada (ENCRYPTION_KEY y SALT)
- ✅ Logs funcionando (Winston)
- ✅ Health check responde (`GET /health`)

**NO-GO si:**
- ❌ Algún test crítico falla (especialmente IDOR prevention)
- ❌ Variables de entorno con placeholders
- ❌ Servidor no arranca (validación de entorno falla)
- ❌ Base de datos no conectada
- ❌ MercadoPago en modo sandbox (en producción)
- ❌ Encriptación no configurada (datos sensibles sin proteger)

### Consideraciones de Seguridad y Privacidad

**Seguridad implementada:**
- ✅ JWT con refresh tokens (rotación de tokens)
- ✅ Bcrypt para contraseñas (10 rounds)
- ✅ Rate limiting en rutas sensibles
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Validación exhaustiva con Zod
- ✅ Sanitización de entrada
- ✅ Prevención de IDOR (ownership validation en todos los endpoints sensibles)
- ✅ Encriptación AES-256-CBC para datos sensibles (RUTs, datos de validación)
- ✅ Stack traces ocultos en producción
- ✅ Validación de webhooks (MercadoPago)

**Privacidad:**
- ✅ Datos médicos encriptados en reposo
- ✅ Access control basado en ownership (IDOR prevention)
- ✅ Logs no contienen datos sensibles (en producción)
- ✅ Tokens JWT con expiración corta (15 minutos)
- ✅ Refresh tokens con expiración larga (7 días)

**Compliance:**
- ✅ Recetas SNRE cumplen con HL7 FHIR R4
- ✅ Validación de médicos contra fuentes oficiales (Registro Civil, RNPI)
- ✅ Logs de auditoría para acciones críticas

---

## 5.2 ESTRUCTURA PROPUESTA PARA GITHUB

```
docs/
├── Manual_Paciente.md              # Manual completo para pacientes
├── Manual_Medico.md                # Manual completo para médicos
├── Manual_Admin.md                 # Manual completo para administradores
├── Guia_Funcional_Sistema.md       # Guía funcional global
├── Seguridad_y_Privacidad.md       # Detalles de seguridad y privacidad
├── Produccion_y_Despliegue.md      # Guía de despliegue y producción
└── API_Reference.md                # Referencia completa de API (complementa Swagger)
```

**Archivos adicionales en raíz:**
- `README.md` (ya existe, actualizar con info de producción)
- `backend/.env.example` (ya existe, verificar que esté completo)
- `backend/tests/CRITERIO_GO_PRODUCCION.md` (ya existe)

---

# NOTAS FINALES

## Información Adicional para Documentación

**Endpoints importantes no mencionados en detalle:**
- `GET /api/files/upload` - Subida de archivos a S3
- `GET /api/files/:fileId` - Descarga de archivos (signed URL)
- `POST /api/notifications/register` - Registro de tokens de notificación push
- `POST /api/notifications/send` - Envío de notificaciones push
- `GET /health` - Health check
- `GET /api-docs` - Documentación Swagger

**Flujos adicionales:**
- Deep linking desde WhatsApp/otros
- Polling de estado de pago (después de redirección)
- Notificaciones push (nuevo mensaje, consulta activada, receta emitida)

**Consideraciones de UX:**
- Loading states en todas las operaciones asíncronas
- Mensajes de error claros para usuarios
- Confirmaciones antes de acciones críticas (cerrar consulta, etc.)
- Feedback visual inmediato (botones deshabilitados, spinners)

---

**FIN DEL DOCUMENTO - MATERIA PRIMA COMPLETA**

