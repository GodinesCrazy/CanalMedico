# 📋 REQUIREMENTS_CLINICAL_NORTH.md

**Documento Guía Principal - Requerimiento Clínico del Médico**  
**Fecha de Creación:** 2025-01-XX  
**Versión:** 1.0  
**Estado:** ✅ DEFINITIVO - Guía de todas las decisiones técnicas

---

## 🎯 OBJETIVO PRIMARIO (NORTE)

### Problema Planteado por el Médico

> **"A distintas horas del día me llegan mensajes por WhatsApp con consultas médicas. No puedo cobrar por esa atención, me interrumpen constantemente y no tengo un flujo ordenado."**

### Éxito se Mide SOLO por Esto

- ✅ El médico deja de perder tiempo en WhatsApp
- ✅ El médico deja de responder gratis
- ✅ El médico recupera control de cuándo, cómo y a quién responde
- ✅ El médico puede cobrar la atención

---

## 👥 ACTORES DEL SISTEMA

### 1. Médico (Doctor)
- **Rol:** Proveedor de servicios médicos
- **Necesidad:** 
  - Controlar cuándo atiende consultas
  - Cobrar por su atención profesional
  - No ser interrumpido por mensajes no pagados
  - Tener un flujo ordenado de trabajo
- **Dolor:** 
  - Recibe mensajes a todas horas
  - No puede cobrar por WhatsApp
  - Se siente interrumpido constantemente
  - Presión social para responder gratis

### 2. Paciente
- **Rol:** Consumidor de servicios médicos
- **Necesidad:**
  - Acceso rápido y fácil a su médico
  - Respuesta garantizada
  - Atención profesional
  - Recetas válidas
- **Dolor:**
  - WhatsApp es más rápido pero no profesional
  - No quiere complicarse con registros largos
  - Quiere beneficios claros por pagar

### 3. Administrador
- **Rol:** Gestor de la plataforma
- **Necesidad:**
  - Validar médicos reales y habilitados
  - Gestionar comisiones
  - Monitorear operación
  - Garantizar seguridad y cumplimiento

---

## 🔄 FLUJOS CLÍNICOS/ADMINISTRATIVOS INVOLUCRADOS

### Flujo 1: Intercepción de WhatsApp (CRÍTICO)

**Objetivo:** Eliminar la interrupción inicial del médico

**Pasos:**
1. Paciente escribe a WhatsApp del médico
2. WhatsApp Cloud API webhook recibe el mensaje ANTES de llegar al teléfono
3. Sistema identifica: número de teléfono, médico asociado
4. Sistema envía template de WhatsApp automático:
   - "Hola, gracias por contactarme. Para consultas médicas profesionales, por favor usa CanalMedico: [link personalizado]. Aquí puedes pagar y chatear conmigo de forma segura y ordenada."
5. Sistema crea "intento de consulta" en estado `PENDING_WHATSAPP`
6. Médico NO recibe notificación directa (o recibe notificación en panel web)

**Resultado:**
- ✅ Elimina interrupción inicial (médico no ve WhatsApp directo)
- ✅ Consistencia (todos reciben mismo mensaje)
- ✅ Reducción de fricción (mensaje automático vs manual)

### Flujo 2: Registro/Login Invisible (CRÍTICO)

**Objetivo:** Reducir fricción radicalmente para el paciente

**Pasos:**
1. Paciente hace clic en link de WhatsApp
   - Sistema detecta número de teléfono
   - Si no existe cuenta: crea cuenta automáticamente
   - Si existe cuenta: login automático
   - Crea consulta automáticamente con ese médico
2. Sistema envía OTP por WhatsApp
   - Paciente ingresa código de 6 dígitos
   - Verificación completa
3. Paciente ve pantalla de pago
   - Monto pre-calculado
   - Un clic para pagar (si tiene tarjeta guardada)
   - O completar pago en MercadoPago (si no tiene)
4. Pago confirmado
   - Consulta activada automáticamente
   - Redirige a chat
   - Puede escribir inmediatamente

**Resultado:**
- ✅ De 7-10 pasos a solo 3-4 pasos
- ✅ De 5-10 minutos a 1-2 minutos
- ✅ Login automático con número de teléfono
- ✅ Consulta creada automáticamente

### Flujo 3: Consulta Médica Asíncrona

**Objetivo:** Permitir atención médica profesional vía chat

**Pasos:**
1. Consulta activa (después del pago)
2. Paciente envía mensaje (texto, foto, PDF, audio)
3. Médico recibe notificación en panel web
4. Médico responde cuando puede (dentro del plazo comprometido)
5. Intercambio de mensajes hasta resolución
6. Médico puede emitir receta electrónica SNRE
7. Médico cierra consulta cuando está completa

**Estados de Consulta:**
- `PENDING` - Creada, esperando pago
- `PAID` - Pagada, lista para activar
- `ACTIVE` - Activa, chat disponible
- `CLOSED` - Cerrada por el doctor

**Resultado:**
- ✅ Atención médica profesional estructurada
- ✅ Historial completo de consultas
- ✅ Recetas electrónicas válidas
- ✅ Respuesta garantizada en plazos definidos

### Flujo 4: Pago y Liquidación

**Objetivo:** Garantizar cobro para el médico

**Pasos:**
1. Paciente crea consulta
2. Sistema calcula monto (tarifa + comisión 15%)
3. Paciente paga vía MercadoPago
4. Webhook confirma pago
5. Consulta se activa automáticamente
6. Sistema maneja liquidación según modalidad del médico:
   - **Inmediato:** Pago por cada consulta
   - **Mensual:** Liquidación consolidada mensual

**Resultado:**
- ✅ Médico cobra antes de atender
- ✅ Sistema gestiona el cobro automáticamente
- ✅ No hay conflicto social (médico no tiene que "pedir" el pago)

### Flujo 5: Emisión de Recetas Electrónicas SNRE

**Objetivo:** Recetas válidas legalmente en Chile

**Pasos:**
1. Médico emite receta desde panel web
2. Sistema construye Bundle FHIR según Guía MINSAL
3. Sistema envía al SNRE automáticamente
4. SNRE valida y genera código único
5. Paciente recibe código SNRE
6. Paciente puede usar código en cualquier farmacia

**Resultado:**
- ✅ Recetas electrónicas válidas legalmente
- ✅ Interoperabilidad con sistema nacional
- ✅ Código único para dispensación

---

## 📊 DATOS CRÍTICOS

### Datos del Médico
- **Identidad:**
  - RUT (validado contra Registro Civil)
  - Nombre completo
  - Fecha de nacimiento
- **Habilitación Profesional:**
  - Registro en RNPI (Superintendencia de Salud)
  - Profesión: "Médico Cirujano"
  - Estado: "Habilitado"
  - Especialidades
- **Configuración:**
  - Tarifa consulta normal
  - Tarifa consulta urgencia
  - Horarios de disponibilidad
  - Modalidad de pago (inmediato/mensual)
  - Datos bancarios (para liquidaciones)

### Datos del Paciente
- **Identidad:**
  - Nombre completo
  - RUT (necesario para recetas SNRE)
  - Fecha de nacimiento
  - Género
- **Contacto:**
  - Email (opcional, puede usar solo teléfono)
  - Número de teléfono (identificador principal para login OTP)
- **Médico:**
  - Médico asociado (vinculación)

### Datos de Consulta
- **Identificación:**
  - ID único
  - Doctor ID
  - Patient ID
  - Tipo (NORMAL/URGENCIA)
  - Estado (PENDING/PAID/ACTIVE/CLOSED)
- **Temporal:**
  - Fecha de creación
  - Fecha de inicio (cuando se activa)
  - Fecha de cierre
- **Pago:**
  - Monto
  - Estado de pago
  - Payment ID (MercadoPago)
- **Origen:**
  - Source (WHATSAPP/APP/WEB)
  - ConsultationAttemptId (si viene de WhatsApp)

### Datos de Mensajes
- **Contenido:**
  - Texto
  - Archivos (imágenes, PDFs, audios)
  - URLs de archivos en S3
- **Metadatos:**
  - Sender ID (doctor o paciente)
  - Consultation ID
  - Timestamp

### Datos de Recetas SNRE
- **Identificación:**
  - Código SNRE (único)
  - Estado (ENVIADA/ERROR/PENDIENTE)
- **Contenido:**
  - Medicamentos (con códigos TFC)
  - Dosis y frecuencia
  - Instrucciones
- **FHIR:**
  - Bundle completo
  - Composition
  - Patient (perfil Core-CL)
  - Practitioner (perfil Core-CL)
  - MedicationRequest (uno por medicamento)

---

## 🔒 RESTRICCIONES/SEGURIDAD/PRIVACIDAD

### Restricciones de Negocio

1. **Médico solo ve consultas pagadas:**
   - No puede ver intentos de WhatsApp no pagados (o los ve en sección separada)
   - Solo atiende consultas con estado ACTIVE

2. **Pago antes de atención:**
   - Consulta no se activa hasta que el pago se confirme
   - No hay atención gratuita (excepto casos excepcionales)

3. **Plazos de respuesta:**
   - Consulta Normal: 24 horas
   - Consulta Urgencia: 4 horas
   - Sistema debe monitorear y alertar incumplimientos

4. **Comisión de plataforma:**
   - 15% por defecto (configurable)
   - Se calcula automáticamente en cada pago

### Seguridad Técnica

1. **Autenticación:**
   - JWT tokens con expiración
   - Refresh tokens
   - Rate limiting en login
   - Protección contra brute force

2. **Autorización (RBAC):**
   - Roles: ADMIN, DOCTOR, PATIENT
   - Validación de propiedad en todos los endpoints
   - Médico solo accede a sus consultas
   - Paciente solo accede a sus consultas

3. **Validación de Entrada:**
   - Zod schemas para validación
   - Sanitización de inputs
   - Prevención de inyección SQL (Prisma)
   - Validación de tipos de archivo

4. **Protección de Datos:**
   - Contraseñas hasheadas (bcrypt)
   - Tokens nunca en logs
   - Información clínica encriptada en tránsito (HTTPS)
   - Archivos en S3 con URLs firmadas

5. **Headers de Seguridad:**
   - Helmet.js configurado
   - CORS exacto (no wildcard)
   - Content Security Policy

### Privacidad de Datos de Salud

1. **Cumplimiento:**
   - Ley de Protección de Datos Personales (Chile)
   - Principios de confidencialidad médica
   - Acceso solo a datos propios

2. **Logs:**
   - NO registrar información clínica en logs
   - NO registrar tokens o contraseñas
   - Solo metadata técnica

3. **Auditoría:**
   - Registro de accesos a datos sensibles
   - Trazabilidad de acciones críticas
   - Retención de logs según normativa

4. **Retención:**
   - Datos clínicos: según normativa médica
   - Datos de pago: según normativa financiera
   - Política de eliminación de datos

---

## 🎯 CRITERIOS DE ÉXITO (MÉTRICAS)

### Para el Médico

1. **Reducción de Interrupciones:**
   - ❌ ANTES: Recibe notificaciones de WhatsApp a todas horas
   - ✅ DESPUÉS: Solo ve consultas pagadas en panel web

2. **Cobro Garantizado:**
   - ❌ ANTES: No puede cobrar por WhatsApp
   - ✅ DESPUÉS: Cobra antes de atender (100% de consultas pagadas)

3. **Control de Tiempo:**
   - ❌ ANTES: Debe responder inmediatamente
   - ✅ DESPUÉS: Responde cuando puede (dentro del plazo comprometido)

4. **Flujo Ordenado:**
   - ❌ ANTES: Mensajes desordenados en WhatsApp
   - ✅ DESPUÉS: Panel unificado con todas las consultas

### Para el Paciente

1. **Fricción Reducida:**
   - ❌ ANTES: 7-10 pasos, 5-10 minutos
   - ✅ DESPUÉS: 3-4 pasos, 1-2 minutos

2. **Conversión:**
   - ❌ ANTES: 20-40% de conversión WhatsApp → CanalMedico
   - ✅ DESPUÉS: 60-80% de conversión (con mejoras críticas)

3. **Beneficios Claros:**
   - ✅ Respuesta garantizada en 24 horas
   - ✅ Recetas electrónicas válidas
   - ✅ Historial médico completo
   - ✅ Primera consulta con 50% descuento

### Para la Plataforma

1. **Seguridad:**
   - ✅ 0 vulnerabilidades críticas (OWASP Top 10)
   - ✅ Validación de propiedad en 100% de endpoints
   - ✅ Logs sin datos sensibles

2. **Confiabilidad:**
   - ✅ Uptime > 99.5%
   - ✅ Health checks funcionando
   - ✅ Migraciones automáticas

3. **Observabilidad:**
   - ✅ Logs estructurados
   - ✅ Métricas de performance
   - ✅ Alertas configuradas

---

## 🚫 RESTRICCIONES TÉCNICAS

### No Negociables

1. **No inventar requisitos:**
   - Todo debe estar basado en este documento o documentación existente

2. **No refactors masivos:**
   - Cambios incrementales pero suficientes para producción

3. **No comprometer seguridad:**
   - Todos los cambios deben mantener o mejorar seguridad

4. **No romper funcionalidad existente:**
   - El deploy ya funciona correctamente
   - No reabrir incidentes previos salvo que sea necesario

---

## 📚 REFERENCIAS

### Documentos Fuente

1. **SOLUCION_PROBLEMA_REAL_MEDICO.md** - Análisis completo del problema y solución
2. **COMO_FUNCIONA_CANALMEDICO.md** - Descripción técnica del sistema
3. **MANUAL_MEDICOS.md** - Manual de usuario para médicos
4. **MANUAL_PACIENTES.md** - Manual de usuario para pacientes
5. **README.md** - Documentación general del proyecto

### Integraciones Críticas

1. **WhatsApp Cloud API** - Para intercepción de mensajes
2. **MercadoPago** - Para procesamiento de pagos
3. **SNRE (MINSAL)** - Para recetas electrónicas
4. **Floid** - Para validación de identidad (Registro Civil)
5. **RNPI** - Para validación de habilitación profesional

---

## ✅ ESTADO ACTUAL vs REQUERIDO

### ✅ Ya Implementado

- Backend API funcional
- Frontend Web para médicos
- App móvil para pacientes
- Sistema de pagos con MercadoPago
- Sistema de recetas SNRE
- Validación automática de médicos
- Chat asíncrono
- Sistema de liquidaciones

### ⚠️ Pendiente (Mejoras Críticas)

1. **Integración WhatsApp Cloud API:**
   - Auto-respuesta automática
   - Intercepción de mensajes
   - Creación de intentos de consulta

2. **Login Invisible:**
   - OTP por WhatsApp
   - Auto-creación de cuenta
   - Auto-creación de consulta desde link

3. **Panel Unificado:**
   - Consultas pagadas + intentos de WhatsApp
   - Estadísticas de ingresos
   - Modo estricto

4. **Mejoras de Seguridad:**
   - Auditoría completa
   - Validación robusta
   - Logs sin datos sensibles

---

## 🎯 DECISIONES ARQUITECTÓNICAS ORIENTADAS AL NORTE

Todas las decisiones técnicas deben responder a:

1. **¿Elimina la interrupción del médico?**
2. **¿Permite que el médico cobre?**
3. **¿Reduce la fricción para el paciente?**
4. **¿Protege al médico de presión social?**

Si una decisión técnica NO contribuye a estos objetivos, debe ser cuestionada.

---

**Este documento es la guía definitiva para todas las decisiones técnicas y de producto.**  
**Cualquier cambio debe ser justificado en relación a este "Norte Clínico".**

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Equipo de Desarrollo CanalMedico

