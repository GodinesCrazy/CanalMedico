# Changelog - CanalMedico

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.3.0] - 2025-01-XX

### ✨ Agregado

#### Sistema de Validación Automática de Médicos
- **Validación de Identidad**: Módulo completo para validar RUN contra Registro Civil
- **Validación Profesional**: Módulo completo para validar contra RNPI (Superintendencia de Salud)
- **Aprobación/Rechazo Automático**: Sistema aprueba o rechaza solicitudes automáticamente según validaciones
- **Revisión Manual**: Inconsistencias menores se marcan para revisión manual
- **Panel Admin Mejorado**: Visualización completa de resultados de validación
- **Logs de Auditoría**: Todas las validaciones se registran para auditoría

#### Backend
- Nuevo módulo `identity-verification/` con proveedor Floid
- Nuevo módulo `rnpi-verification/` para consulta a Superintendencia de Salud
- Integración automática en flujo de registro de médicos
- Endpoint `POST /api/signup-requests/:id/re-verify` para re-ejecutar validaciones

#### Frontend Web
- Formulario de registro actualizado (RUT obligatorio, fecha de nacimiento)
- Mensaje informativo sobre validación automática
- Panel admin con visualización de validaciones
- Botón para re-ejecutar validaciones

#### Base de Datos
- Campos de validación agregados a `DoctorSignupRequest`
- Migración SQL: `MIGRACION_VALIDACION_MEDICOS.sql`

### 🔧 Mejorado
- Seguridad mejorada: Solo médicos reales y habilitados pueden registrarse
- Proceso de registro más rápido: Aprobación automática cuando todo coincide
- Transparencia: Médicos ven qué fuentes oficiales se usan

---

## [1.2.0] - 2025-01-XX

### ✨ Agregado

#### Integración SNRE - Recetas Electrónicas
- **Módulo completo SNRE** con cliente FHIR para comunicación con Sistema Nacional de Receta Electrónica
- **Mapper FHIR** que convierte datos de CanalMedico a recursos HL7 FHIR R4 según Guía MINSAL
- **Emisión de recetas electrónicas** desde el panel médico
- **Visualización de recetas** para pacientes en app móvil y web
- **Códigos SNRE únicos** para dispensación en farmacias
- **Validaciones completas** (RUT médico, RUT paciente, etc.)
- **Manejo robusto de errores** con estados y mensajes claros
- **Modelos de datos** para recetas y items de medicamentos
- **Migración SQL** lista para ejecutar

#### Backend
- Nuevo módulo `snre/` con 6 archivos (types, client, mapper, service, controller, routes)
- Endpoints: `POST /api/prescriptions`, `GET /api/prescriptions/:id`, `GET /api/consultations/:id/prescriptions`
- Variables de entorno para configuración SNRE
- Integración con API FHIR del SNRE

#### Frontend Web
- Componente `PrescriptionModal` para crear recetas
- Botón "Emitir Receta SNRE" en ChatPage
- Visualización de recetas con código SNRE destacado
- Estados visuales (enviada, error, pendiente)

#### App Móvil
- Visualización de recetas en `ConsultationDetailScreen`
- Código SNRE destacado para uso en farmacia
- Lista de medicamentos con dosis y frecuencia

#### Documentación
- `INTEGRACION_SNRE_COMPLETA.md` - Documentación técnica completa
- `RESUMEN_INTEGRACION_SNRE.md` - Resumen ejecutivo
- Manuales actualizados (Médicos, Pacientes, Administrador)
- README actualizado con sección SNRE

### 🔧 Mejorado
- Modelo `Patient` ahora incluye RUT, birthDate, gender, address (necesarios para SNRE)
- Validaciones mejoradas en todos los endpoints de recetas

---

## [1.1.0] - 2025-01-XX

### ✨ Agregado

#### Deep Linking y Polling
- Deep linking post-pago automático
- Polling de estado de pago cada 3 segundos
- Redirección automática al chat cuando pago se confirma

#### Validación de Propiedad
- Validación mejorada en todos los endpoints
- Usuarios solo pueden acceder a sus propios recursos

#### Disponibilidad Automática
- Sistema de horarios automáticos para médicos
- Cálculo automático de disponibilidad

---

## [1.0.0] - 2024-11-22

### 🎉 Lanzamiento Inicial

Primera versión completa de CanalMedico, plataforma de consultas médicas asíncronas para Chile.

### ✨ Agregado

#### Backend
- Sistema de autenticación con JWT
- Gestión de usuarios (Doctor, Patient, Admin)
- Sistema de consultas médicas (Normal/Urgente)
- Chat en tiempo real con Socket.IO
- Integración de pagos con MercadoPago Chile
- Sistema dual de liquidaciones (Inmediato/Mensual)
- Panel de comisiones para administradores
- Upload de archivos a AWS S3
- Notificaciones push con Firebase
- Rate limiting y seguridad con Helmet
- Logging con Winston
- Validación de datos con Zod
- 12 módulos funcionales completos

#### Frontend Web
- Panel de médicos con React + Vite
- 8 páginas completas
- Navegación por roles (Doctor/Admin)
- Configuración de modalidad de pago
- Panel financiero con estadísticas
- Panel de comisiones (solo Admin)
- Chat en tiempo real
- Formato de moneda CLP
- Validación de RUT chileno
- Diseño responsive con Tailwind CSS

#### App Móvil
- App de pacientes con React Native + Expo
- Estructura Expo Router
- Navegación configurada
- Servicios API integrados
- State management con Zustand

#### Base de Datos
- 8 modelos con Prisma ORM
- Migraciones completas
- Índices optimizados
- Soporte SQLite (dev) y PostgreSQL (prod)

#### Documentación
- README principal completo
- Manual Técnico exhaustivo
- Guía de Despliegue en Railway
- Documentación de API REST y WebSocket
- Manual de Médicos
- Manual de Pacientes
- Manual de Administrador
- Archivos .env.example

### 🔧 Configuración

#### Integraciones
- MercadoPago Chile para pagos
- AWS S3 para almacenamiento de archivos
- Firebase para notificaciones push
- Socket.IO para chat en tiempo real

#### Seguridad
- Bcrypt para hashing de contraseñas
- JWT para autenticación
- Helmet.js para headers de seguridad
- CORS configurado
- Rate limiting implementado

### 📦 Dependencias Principales

#### Backend
- Node.js >= 18.0.0
- Express 4.18.2
- Prisma 5.7.1
- Socket.IO 4.5.4
- MercadoPago SDK 2.10.0
- AWS SDK 3.490.0
- Firebase Admin 12.0.0

#### Frontend Web
- React 18.2.0
- Vite 5.0.8
- TypeScript 5.3.3
- Tailwind CSS 3.4.0
- Zustand 4.4.7

#### App Móvil
- React Native 0.73.2
- Expo 50.0.0
- TypeScript 5.3.3

### 🚀 Deployment

- Configuración para Railway
- Scripts de build y deploy
- Migraciones automáticas
- Variables de entorno documentadas

---

## [1.1.0] - 2025-01-XX

### 🎉 Versión de Producción - 100% Completa

Esta versión completa todas las funcionalidades críticas y mejora la experiencia del usuario con deep linking y polling de pagos.

### ✨ Agregado

#### App Móvil
- **Deep Linking Post-Pago**: Redirección automática después de completar pago en MercadoPago
- **Polling de Estado de Pago**: Verificación automática cada 3 segundos del estado del pago
- **Manejo de Deep Links**: Sistema completo de deep linking para callbacks de pago
- **Mejoras en PaymentScreen**: UI mejorada con estados de pago (pending, checking, paid, failed)
- **Botón de Verificación Manual**: Opción para verificar estado del pago manualmente

#### Backend
- **URLs de Retorno Configurables**: MercadoPago ahora acepta deep links desde app móvil
- **Validación de Propiedad Mejorada**: Todos los endpoints validan que usuarios solo accedan a sus recursos
- **Soporte para Deep Links**: Backend acepta URLs de retorno personalizadas (deep links o URLs web)

### 🔧 Mejorado

#### Seguridad
- **Validación de Propiedad en Consultas**: Pacientes solo pueden ver sus propias consultas
- **Validación de Propiedad en Doctores**: Doctores solo pueden modificar su propio perfil
- **Validación de Propiedad en Pagos**: Doctores solo pueden ver sus propios pagos
- **Validación en Creación de Consultas**: Solo pacientes pueden crear consultas para sí mismos

#### UX de Pagos
- **Experiencia de Pago Mejorada**: Redirección automática al chat después de pago confirmado
- **Feedback Visual**: Estados claros durante el proceso de pago
- **Manejo de Errores**: Mensajes claros cuando el pago falla o se cancela
- **Polling Inteligente**: Verificación automática que se detiene cuando se confirma el pago

#### Disponibilidad
- **Disponibilidad Automática en App Móvil**: La app móvil ahora muestra correctamente la disponibilidad calculada
- **Sincronización de Estados**: Estados de disponibilidad sincronizados entre backend y frontend

### 🐛 Corregido

- **Flujo de Pago**: Corregido uso de `initPoint` y `sandboxInitPoint` en app móvil
- **Memory Leaks**: Polling se limpia correctamente al desmontar componente
- **Deep Links**: Manejo correcto de deep links cuando la app vuelve al foreground
- **Estados de Pago**: Estados se actualizan correctamente durante el proceso

### 📚 Documentación

- **Pruebas E2E**: Documento completo de pruebas end-to-end
- **Guía de Deep Linking**: Documentación de implementación de deep linking
- **Actualización de Manuales**: Todos los manuales actualizados con nuevas funcionalidades

---

## [Unreleased]

### Planeado para Futuras Versiones

#### v1.1.0
- Videollamadas integradas
- Recetas electrónicas
- Integración con FONASA
- Tests automatizados (Jest, Cypress)
- Métricas y analytics

#### v1.2.0
- Apps nativas (iOS/Android)
- Modo offline
- Sincronización automática
- Caché optimizado

#### v2.0.0
- Microservicios
- Escalabilidad horizontal
- Multi-idioma
- Expansión internacional

---

## Tipos de Cambios

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Corrección de bugs
- `Security` - Mejoras de seguridad

---

**Última actualización**: Enero 2025
