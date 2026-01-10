# 🚀 PLAN DE IMPLEMENTACIÓN TÉCNICA - SOLUCIÓN DEFINITIVA

**Fecha:** 2025-01-XX  
**Tech Lead + Product Manager:** Implementación de cambios críticos  
**Objetivo:** "El médico ya no pierde tiempo por WhatsApp y cobra la atención de forma automática"

---

## 📋 RESUMEN EJECUTIVO

**Estado Actual:** Sistema funcional en producción técnica  
**Cambios Críticos:** 2 (WhatsApp Cloud API + Login Invisible)  
**Tiempo Estimado:** 5-7 semanas (Prioridad 1)  
**Riesgo:** MEDIO (integración externa WhatsApp)  
**Rollback:** Posible con feature flags

---

## 1️⃣ IMPACTO POR MÓDULO

### 🔴 CAMBIO CRÍTICO 1: INTEGRACIÓN WHATSAPP CLOUD API

#### Backend: Módulos Nuevos/Modificados

**NUEVO MÓDULO: `whatsapp/`**
```
backend/src/modules/whatsapp/
├── whatsapp.controller.ts      [NUEVO]
├── whatsapp.routes.ts          [NUEVO]
├── whatsapp.service.ts         [NUEVO]
├── whatsapp.types.ts           [NUEVO]
└── whatsapp-templates.ts       [NUEVO]
```

**Responsabilidades:**
- `whatsapp.service.ts`: Lógica de negocio (webhook, auto-respuesta, templates)
- `whatsapp.controller.ts`: Endpoints HTTP (webhook público, admin)
- `whatsapp.routes.ts`: Rutas `/api/whatsapp/*`
- `whatsapp.types.ts`: Tipos TypeScript (WhatsAppMessage, WebhookPayload, etc.)
- `whatsapp-templates.ts`: Templates de mensajes aprobados por Meta

**MÓDULOS MODIFICADOS:**

1. **`consultations/consultations.service.ts`**
   - Agregar método `createFromWhatsAppAttempt(attemptId: string)`
   - Modificar `create()` para aceptar `source: 'WHATSAPP' | 'APP' | 'WEB'`

2. **`patients/patients.service.ts`**
   - Agregar método `findOrCreateByPhone(phoneNumber: string)`
   - Modificar `create()` para aceptar `phoneNumber` como identificador alternativo

3. **`doctors/doctors.service.ts`**
   - Agregar campo `whatsappBusinessNumber` (opcional)
   - Agregar método `findByWhatsAppNumber(phoneNumber: string)`

4. **`notifications/notifications.service.ts`**
   - Agregar método `notifyDoctorWhatsAppAttempt(doctorId: string, attempt: ConsultationAttempt)`
   - Modificar para NO enviar notificación push de WhatsApp (solo panel web)

**Base de Datos: Cambios en Schema**

```prisma
// NUEVA TABLA: ConsultationAttempt
model ConsultationAttempt {
  id                String   @id @default(cuid())
  doctorId          String
  patientPhone      String   // Número de teléfono del paciente
  source            String   @default("WHATSAPP") // "WHATSAPP" | "SMS" | "EMAIL"
  status            String   @default("PENDING") // "PENDING" | "CONVERTED" | "ABANDONED"
  messageText       String?  // Texto original del mensaje de WhatsApp
  consultationId    String?  // Si se convierte, ID de la consulta creada
  deepLinkSent      Boolean  @default(false)
  deepLinkClicked   Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  convertedAt       DateTime?
  
  // Relaciones
  doctor            Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  consultation      Consultation? @relation(fields: [consultationId], references: [id])
  
  @@index([doctorId])
  @@index([patientPhone])
  @@index([status])
  @@index([createdAt])
  @@map("consultation_attempts")
}

// MODIFICACIÓN: Doctor
model Doctor {
  // ... campos existentes ...
  
  // NUEVO CAMPO
  whatsappBusinessNumber String? // Número de WhatsApp Business verificado
  whatsappBusinessId    String? // ID de WhatsApp Business en Meta
  
  @@index([whatsappBusinessNumber])
}

// MODIFICACIÓN: Patient
model Patient {
  // ... campos existentes ...
  
  // NUEVO CAMPO
  phoneNumber String? @unique // Número de teléfono (identificador alternativo)
  
  @@index([phoneNumber])
}

// MODIFICACIÓN: User
model User {
  // ... campos existentes ...
  
  // NUEVO CAMPO
  phoneNumber String? @unique // Número de teléfono (para login alternativo)
  
  @@index([phoneNumber])
}

// MODIFICACIÓN: Consultation
model Consultation {
  // ... campos existentes ...
  
  // NUEVO CAMPO
  source            String   @default("APP") // "WHATSAPP" | "APP" | "WEB"
  consultationAttemptId String? // ID del intento de WhatsApp que originó esta consulta
  
  consultationAttempt ConsultationAttempt? @relation(fields: [consultationAttemptId], references: [id])
  
  @@index([source])
  @@index([consultationAttemptId])
}
```

**Endpoints Nuevos:**

```typescript
// POST /api/whatsapp/webhook
// Webhook público de Meta (sin autenticación, validado por signature)
// Recibe mensajes de WhatsApp Cloud API

// GET /api/whatsapp/attempts/pending
// Lista intentos de WhatsApp no convertidos (para panel médico)
// Requiere autenticación DOCTOR

// POST /api/whatsapp/attempts/:id/resend-link
// Reenvía link a paciente (acción manual del médico)
// Requiere autenticación DOCTOR

// GET /api/whatsapp/stats
// Estadísticas de conversión WhatsApp → CanalMedico
// Requiere autenticación DOCTOR
```

#### Frontend Web: Pantallas Nuevas/Ajustes

**PANTALLA NUEVA: `WhatsAppAttemptsPage.tsx`**
```
frontend-web/src/pages/
└── WhatsAppAttemptsPage.tsx  [NUEVO]
```

**Responsabilidades:**
- Lista intentos de WhatsApp no convertidos
- Muestra: número de teléfono, mensaje original, fecha, estado
- Botón "Reenviar link" para cada intento
- Estadísticas: intentos totales, convertidos, tasa de conversión

**PANTALLAS MODIFICADAS:**

1. **`ConsultationsPage.tsx`**
   - Agregar filtro/tab "Intentos de WhatsApp"
   - Mostrar badge "Desde WhatsApp" en consultas convertidas

2. **`SettingsPage.tsx`**
   - Agregar sección "Configuración WhatsApp"
   - Campo: Número de WhatsApp Business
   - Toggle: "Modo estricto" (solo atiende consultas pagadas)
   - Toggle: "Auto-respuesta activa"

3. **`DashboardPage.tsx`**
   - Agregar widget "Intentos de WhatsApp"
   - Mostrar: intentos este mes, tasa de conversión, potencial perdido

#### App Móvil: Flujos Nuevos/Modificados

**PANTALLA NUEVA: `QuickConsultationScreen.tsx`**
```
app-mobile/src/screens/
└── QuickConsultationScreen.tsx  [NUEVO]
```

**Responsabilidades:**
- Se abre cuando paciente hace clic en link de WhatsApp
- Recibe parámetros: `doctorId`, `phone`, `attemptId`
- Muestra campo OTP (6 dígitos)
- Auto-envía OTP por WhatsApp al cargar
- Al verificar OTP: auto-login, auto-crea consulta, redirige a pago

**PANTALLAS MODIFICADAS:**

1. **`RegisterScreen.tsx`**
   - Agregar opción "Registrarse con WhatsApp" (alternativa a email)
   - Si viene de deep link, pre-llenar número de teléfono

2. **`LoginScreen.tsx`**
   - Agregar opción "Iniciar sesión con WhatsApp" (alternativa a email)
   - Campo: número de teléfono + OTP

3. **`DoctorSearchScreen.tsx`**
   - Si viene de deep link con `doctorId`, auto-seleccionar doctor
   - Si viene de deep link con `attemptId`, mostrar mensaje: "Completa tu consulta"

**NAVEGACIÓN MODIFICADA:**

```typescript
// app-mobile/src/navigation/AppNavigator.tsx
// Agregar nueva ruta:
{
  name: 'QuickConsultation',
  component: QuickConsultationScreen,
  params: {
    doctorId: string;
    phone: string;
    attemptId: string;
  }
}
```

**DEEP LINKS MODIFICADOS:**

```typescript
// app-mobile/src/utils/linking.ts
// Agregar nuevo patrón:
{
  screens: {
    QuickConsultation: 'consultation/create',
    // Parámetros: ?doctorId=xxx&phone=xxx&attemptId=xxx
  }
}
```

---

### 🔴 CAMBIO CRÍTICO 2: LOGIN/REGISTRO INVISIBLE (WHATSAPP OTP)

#### Backend: Módulos Nuevos/Modificados

**MÓDULO MODIFICADO: `auth/`**

**`auth.service.ts` - Métodos Nuevos:**

```typescript
// NUEVO: Enviar OTP por WhatsApp
async sendOTP(data: {
  phoneNumber: string;
  method: 'WHATSAPP' | 'SMS';
}): Promise<{ success: boolean; expiresIn: number }>

// NUEVO: Verificar OTP
async verifyOTP(data: {
  phoneNumber: string;
  otp: string;
}): Promise<{ 
  user: User | null; // null si no existe cuenta
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}>

// NUEVO: Registrar con número de teléfono
async registerWithPhone(data: {
  phoneNumber: string;
  name: string;
  otp: string; // OTP ya verificado
}): Promise<AuthResponse>

// NUEVO: Login con número de teléfono
async loginWithPhone(data: {
  phoneNumber: string;
  otp: string;
}): Promise<AuthResponse>
```

**NUEVA TABLA: `OTPVerification`**

```prisma
model OTPVerification {
  id          String   @id @default(cuid())
  phoneNumber String
  otp         String   // Hash del OTP (no texto plano)
  method      String   @default("WHATSAPP") // "WHATSAPP" | "SMS"
  verified    Boolean  @default(false)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([phoneNumber])
  @@index([expiresAt])
  @@map("otp_verifications")
}
```

**Endpoints Nuevos:**

```typescript
// POST /api/auth/send-otp
// Envía OTP por WhatsApp o SMS
// Body: { phoneNumber: string, method: 'WHATSAPP' | 'SMS' }

// POST /api/auth/verify-otp
// Verifica OTP y retorna tokens (o null si no existe cuenta)
// Body: { phoneNumber: string, otp: string }

// POST /api/auth/register-phone
// Registra nuevo usuario con número de teléfono
// Body: { phoneNumber: string, name: string, otp: string }

// POST /api/auth/login-phone
// Login con número de teléfono
// Body: { phoneNumber: string, otp: string }
```

**MÓDULO MODIFICADO: `consultations/`**

**`consultations.service.ts` - Método Nuevo:**

```typescript
// NUEVO: Crear consulta rápida desde WhatsApp
async createQuickConsultation(data: {
  doctorId: string;
  patientId: string;
  attemptId: string; // ID del intento de WhatsApp
  type?: 'NORMAL' | 'URGENCIA'; // Default: NORMAL
}): Promise<Consultation>
```

#### Frontend Web: Sin Cambios

**No requiere cambios** (este flujo es solo para app móvil)

#### App Móvil: Flujos Nuevos/Modificados

**PANTALLA NUEVA: `OTPVerificationScreen.tsx`**
```
app-mobile/src/screens/
└── OTPVerificationScreen.tsx  [NUEVO]
```

**Responsabilidades:**
- Muestra campo OTP (6 dígitos)
- Auto-envía OTP al cargar
- Verifica OTP automáticamente
- Si usuario existe: auto-login
- Si usuario no existe: redirige a registro simplificado

**PANTALLA MODIFICADA: `QuickConsultationScreen.tsx`**

**Flujo Completo:**
1. Recibe parámetros: `doctorId`, `phone`, `attemptId`
2. Auto-envía OTP por WhatsApp
3. Muestra campo OTP
4. Al verificar OTP:
   - Si usuario existe: auto-login
   - Si usuario no existe: crea cuenta automáticamente (nombre: "Paciente")
5. Auto-crea consulta con `createQuickConsultation()`
6. Redirige a `PaymentScreen` con consulta creada

**SERVICIO MODIFICADO: `auth.service.ts`**

```typescript
// app-mobile/src/services/auth.service.ts
// Agregar métodos:

async sendOTP(phoneNumber: string, method: 'WHATSAPP' | 'SMS'): Promise<void>
async verifyOTP(phoneNumber: string, otp: string): Promise<{ user: User | null; tokens: AuthTokens; isNewUser: boolean }>
async registerWithPhone(phoneNumber: string, name: string, otp: string): Promise<AuthResponse>
async loginWithPhone(phoneNumber: string, otp: string): Promise<AuthResponse>
```

**STORE MODIFICADO: `authStore.ts`**

```typescript
// app-mobile/src/store/authStore.ts
// Agregar acciones:

sendOTP: (phoneNumber: string, method: 'WHATSAPP' | 'SMS') => Promise<void>
verifyOTP: (phoneNumber: string, otp: string) => Promise<{ isNewUser: boolean }>
loginWithPhone: (phoneNumber: string, otp: string) => Promise<void>
registerWithPhone: (phoneNumber: string, name: string, otp: string) => Promise<void>
```

---

## 2️⃣ ORDEN DE IMPLEMENTACIÓN (OBLIGATORIO)

### FASE 1: FUNDACIÓN (Semana 1-2)

**Objetivo:** Preparar infraestructura sin romper producción

#### 1.1 Base de Datos (Día 1-2)

**Tareas:**
1. Crear migración Prisma para nuevas tablas:
   - `ConsultationAttempt`
   - `OTPVerification`
   - Campos nuevos en `Doctor`, `Patient`, `User`, `Consultation`

2. Ejecutar migración en entorno de desarrollo

3. Verificar que migración es reversible (rollback script)

**Criterio de Éxito:**
- ✅ Migración ejecuta sin errores
- ✅ Rollback funciona correctamente
- ✅ No afecta datos existentes

**Riesgo:** BAJO (solo agregar tablas/campos, no modificar existentes)

---

#### 1.2 Feature Flags (Día 2-3)

**Implementar sistema de feature flags simple:**

```typescript
// backend/src/config/featureFlags.ts
export const featureFlags = {
  WHATSAPP_AUTO_RESPONSE: process.env.ENABLE_WHATSAPP_AUTO_RESPONSE === 'true',
  PHONE_LOGIN: process.env.ENABLE_PHONE_LOGIN === 'true',
  QUICK_CONSULTATION: process.env.ENABLE_QUICK_CONSULTATION === 'true',
} as const;
```

**Uso en código:**
```typescript
if (featureFlags.WHATSAPP_AUTO_RESPONSE) {
  // Lógica nueva
} else {
  // Lógica actual (fallback)
}
```

**Criterio de Éxito:**
- ✅ Feature flags funcionan
- ✅ Pueden activarse/desactivarse sin deploy
- ✅ Por defecto: DESACTIVADOS (no rompe producción)

**Riesgo:** BAJO (solo configuración)

---

#### 1.3 Estructura de Módulos (Día 3-4)

**Crear estructura de archivos (sin lógica aún):**

```
backend/src/modules/whatsapp/
├── whatsapp.controller.ts      [VACÍO, solo estructura]
├── whatsapp.routes.ts          [VACÍO, solo rutas básicas]
├── whatsapp.service.ts         [VACÍO, solo clase]
├── whatsapp.types.ts           [TIPOS TypeScript]
└── whatsapp-templates.ts       [Templates de mensajes]
```

**Criterio de Éxito:**
- ✅ Archivos creados
- ✅ Rutas registradas en `app.ts` (pero deshabilitadas con feature flag)
- ✅ No rompe compilación

**Riesgo:** BAJO (solo estructura)

---

### FASE 2: WHATSAPP CLOUD API (Semana 2-4)

**Objetivo:** Implementar auto-respuesta de WhatsApp

#### 2.1 Configuración Meta Business (Día 5-7)

**Tareas:**
1. Crear cuenta Meta Business (si no existe)
2. Configurar WhatsApp Business API
3. Obtener tokens de acceso
4. Configurar webhook URL (usar ngrok para desarrollo)
5. Aprobar templates de mensajes en Meta

**Variables de Entorno Nuevas:**
```env
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx
WHATSAPP_API_VERSION=v21.0
```

**Criterio de Éxito:**
- ✅ Webhook verificado por Meta
- ✅ Templates aprobados
- ✅ Puede enviar mensaje de prueba

**Riesgo:** MEDIO (depende de aprobación Meta, puede tardar días)

---

#### 2.2 Servicio WhatsApp (Día 8-10)

**Implementar `whatsapp.service.ts`:**

```typescript
// Funcionalidades:
1. handleIncomingMessage() - Procesa webhook de Meta
2. sendTemplateMessage() - Envía template aprobado
3. findDoctorByWhatsAppNumber() - Identifica médico
4. createConsultationAttempt() - Crea intento en BD
5. generateDeepLink() - Genera link personalizado
```

**Criterio de Éxito:**
- ✅ Recibe webhook de Meta
- ✅ Identifica médico correctamente
- ✅ Crea `ConsultationAttempt` en BD
- ✅ Envía auto-respuesta con link

**Riesgo:** MEDIO (integración externa)

---

#### 2.3 Webhook Público (Día 11-12)

**Implementar `POST /api/whatsapp/webhook`:**

```typescript
// Validaciones:
1. Verificar signature de Meta (seguridad)
2. Validar formato de payload
3. Procesar solo mensajes de texto (por ahora)
4. Ignorar mensajes del sistema
```

**Criterio de Éxito:**
- ✅ Webhook responde 200 OK a Meta
- ✅ Valida signature correctamente
- ✅ Procesa mensajes en < 2 segundos

**Riesgo:** MEDIO (webhook público, debe ser seguro)

---

#### 2.4 Panel Web - Intentos de WhatsApp (Día 13-14)

**Implementar `WhatsAppAttemptsPage.tsx`:**

```typescript
// Funcionalidades:
1. Lista intentos no convertidos
2. Muestra: teléfono, mensaje, fecha, estado
3. Botón "Reenviar link"
4. Estadísticas de conversión
```

**Criterio de Éxito:**
- ✅ Médico ve intentos de WhatsApp
- ✅ Puede reenviar link manualmente
- ✅ Ve estadísticas de conversión

**Riesgo:** BAJO (solo UI)

---

### FASE 3: LOGIN INVISIBLE (Semana 4-6)

**Objetivo:** Implementar login/registro con WhatsApp OTP

#### 3.1 Servicio OTP (Día 15-17)

**Implementar en `auth.service.ts`:**

```typescript
// Funcionalidades:
1. sendOTP() - Genera OTP, lo hashea, guarda en BD, envía por WhatsApp
2. verifyOTP() - Verifica OTP, retorna tokens o null
3. registerWithPhone() - Crea cuenta con número de teléfono
4. loginWithPhone() - Login con número de teléfono
```

**Criterio de Éxito:**
- ✅ OTP se genera correctamente (6 dígitos)
- ✅ OTP expira en 5 minutos
- ✅ OTP se envía por WhatsApp
- ✅ Verificación funciona

**Riesgo:** MEDIO (integración WhatsApp para OTP)

---

#### 3.2 Endpoints Auth (Día 18-19)

**Implementar endpoints:**

```typescript
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/register-phone
POST /api/auth/login-phone
```

**Criterio de Éxito:**
- ✅ Endpoints funcionan
- ✅ Validación de datos correcta
- ✅ Rate limiting implementado (prevenir spam)

**Riesgo:** BAJO (solo endpoints)

---

#### 3.3 App Móvil - QuickConsultationScreen (Día 20-22)

**Implementar pantalla completa:**

```typescript
// Flujo:
1. Recibe parámetros de deep link
2. Auto-envía OTP al cargar
3. Muestra campo OTP
4. Verifica OTP automáticamente
5. Si usuario existe: auto-login
6. Si usuario no existe: crea cuenta automáticamente
7. Auto-crea consulta
8. Redirige a pago
```

**Criterio de Éxito:**
- ✅ Pantalla se abre desde deep link
- ✅ OTP se envía automáticamente
- ✅ Verificación funciona
- ✅ Consulta se crea automáticamente

**Riesgo:** MEDIO (flujo complejo)

---

#### 3.4 Integración Completa (Día 23-24)

**Conectar todo el flujo:**

```typescript
// Flujo completo:
WhatsApp → Webhook → Auto-respuesta → Deep link → 
App móvil → OTP → Auto-login → Auto-crea consulta → Pago
```

**Criterio de Éxito:**
- ✅ Flujo completo funciona end-to-end
- ✅ Tiempo total < 2 minutos
- ✅ Sin errores en producción

**Riesgo:** MEDIO (integración compleja)

---

### FASE 4: TESTING Y OPTIMIZACIÓN (Semana 6-7)

**Objetivo:** Validar y optimizar

#### 4.1 Testing End-to-End (Día 25-27)

**Casos de prueba:**
1. Paciente nuevo escribe por WhatsApp → Completa flujo
2. Paciente existente escribe por WhatsApp → Completa flujo
3. Paciente abandona en OTP → Reenvío funciona
4. Paciente abandona en pago → Reenvío funciona
5. Múltiples intentos del mismo paciente → No duplica

**Criterio de Éxito:**
- ✅ Todos los casos pasan
- ✅ Sin errores en logs
- ✅ Performance aceptable (< 2s por paso)

**Riesgo:** BAJO (solo testing)

---

#### 4.2 Monitoreo y Métricas (Día 28-30)

**Implementar tracking:**

```typescript
// Eventos a trackear:
1. whatsapp_message_received
2. whatsapp_auto_response_sent
3. deep_link_clicked
4. otp_sent
5. otp_verified
6. consultation_created_from_whatsapp
7. payment_completed_from_whatsapp
```

**Criterio de Éxito:**
- ✅ Eventos se registran correctamente
- ✅ Dashboard muestra métricas
- ✅ Alertas configuradas

**Riesgo:** BAJO (solo tracking)

---

#### 4.3 Documentación (Día 31-32)

**Documentar:**
1. Configuración WhatsApp Cloud API
2. Flujo completo de usuario
3. Troubleshooting común
4. Rollback procedure

**Criterio de Éxito:**
- ✅ Documentación completa
- ✅ Ejemplos de código
- ✅ Guía de troubleshooting

**Riesgo:** BAJO (solo documentación)

---

## 3️⃣ ESTRATEGIA DE DESPLIEGUE

### Feature Flags (OBLIGATORIO)

**Todas las funcionalidades nuevas detrás de feature flags:**

```typescript
// Variables de entorno:
ENABLE_WHATSAPP_AUTO_RESPONSE=false  // Por defecto: desactivado
ENABLE_PHONE_LOGIN=false              // Por defecto: desactivado
ENABLE_QUICK_CONSULTATION=false       // Por defecto: desactivado
```

**Ventajas:**
- ✅ Puede activarse/desactivarse sin deploy
- ✅ Rollback instantáneo
- ✅ Testing en producción sin afectar usuarios

**Activación Gradual:**
1. **Semana 1:** Activar solo en desarrollo
2. **Semana 2:** Activar en staging
3. **Semana 3:** Activar para 10% de médicos (beta)
4. **Semana 4:** Activar para 50% de médicos
5. **Semana 5:** Activar para 100% de médicos

---

### Entornos Separados

**NO requiere entorno separado** (todo puede convivir con flujo actual)

**Razón:**
- Feature flags permiten activar/desactivar
- Flujo actual sigue funcionando
- Nuevo flujo es paralelo, no reemplaza

---

### Convivencia con Flujo Actual

**Flujo Actual (Sigue Funcionando):**
```
Paciente → App móvil → Registro email/password → 
Buscar doctor → Crear consulta → Pagar → Chat
```

**Flujo Nuevo (Paralelo):**
```
Paciente → WhatsApp → Auto-respuesta → Deep link → 
App móvil → OTP → Auto-login → Auto-crea consulta → Pagar → Chat
```

**Ambos flujos pueden coexistir:**
- ✅ Feature flags controlan cuál está activo
- ✅ No se rompe flujo actual
- ✅ Migración gradual posible

---

### Rollback Procedure

**Si algo falla:**

1. **Desactivar feature flags:**
   ```env
   ENABLE_WHATSAPP_AUTO_RESPONSE=false
   ENABLE_PHONE_LOGIN=false
   ENABLE_QUICK_CONSULTATION=false
   ```

2. **Reiniciar servidor** (o usar hot reload si está disponible)

3. **Verificar que flujo actual sigue funcionando**

4. **Investigar error en logs**

**Tiempo de rollback:** < 5 minutos

---

## 4️⃣ RIESGOS TÉCNICOS REALES

### 🔴 RIESGO 1: WhatsApp Cloud API

**Riesgo:** Meta puede rechazar templates o limitar acceso

**Probabilidad:** MEDIA  
**Impacto:** ALTO (bloquea funcionalidad completa)

**Mitigación:**
1. Aprobar templates ANTES de implementar
2. Tener plan B: SMS OTP (más caro pero funciona)
3. Monitorear límites de rate de Meta
4. Implementar retry logic con exponential backoff

**Plan B:** Si WhatsApp falla, usar SMS OTP (Twilio)

---

### 🔴 RIESGO 2: Privacidad y Legal

**Riesgo:** Almacenar números de teléfono sin consentimiento explícito

**Probabilidad:** BAJA  
**Impacto:** ALTO (multas, cierre)

**Mitigación:**
1. Agregar consentimiento explícito en primer mensaje
2. Cumplir con LGPD/GDPR (derecho al olvido)
3. Encriptar números de teléfono en BD
4. No compartir con terceros sin consentimiento

**Plan B:** Si no hay consentimiento, no crear cuenta automáticamente

---

### 🔴 RIESGO 3: UX - Abandono en OTP

**Riesgo:** Paciente abandona si OTP no llega o tarda mucho

**Probabilidad:** MEDIA  
**Impacto:** MEDIO (pierde conversión)

**Mitigación:**
1. OTP llega en < 10 segundos (WhatsApp es rápido)
2. Mostrar "Reenviar OTP" después de 30 segundos
3. Permitir cambio de número si OTP no llega
4. Mensaje claro: "Revisa tu WhatsApp"

**Plan B:** Si OTP falla 3 veces, ofrecer registro manual

---

### 🔴 RIESGO 4: Spam y Abuso

**Riesgo:** Alguien envía muchos mensajes de WhatsApp para saturar sistema

**Probabilidad:** MEDIA  
**Impacto:** MEDIO (costo, saturación)

**Mitigación:**
1. Rate limiting en webhook (max 10 mensajes/min por número)
2. Rate limiting en OTP (max 3 OTP/hora por número)
3. Blacklist de números sospechosos
4. Monitoreo de patrones anómalos

**Plan B:** Si detecta spam, bloquear número automáticamente

---

### 🔴 RIESGO 5: Deep Links No Funcionan

**Riesgo:** Deep links no abren app en algunos dispositivos

**Probabilidad:** BAJA  
**Impacto:** MEDIO (pierde conversión)

**Mitigación:**
1. Probar en iOS y Android
2. Tener fallback: link web que redirige a app store
3. Mostrar QR code como alternativa
4. Mensaje claro: "Si no se abre la app, descárgala aquí"

**Plan B:** Si deep link falla, mostrar página web con botón "Abrir app"

---

## 5️⃣ CRITERIO DE ÉXITO (MEDIBLE)

### Métrica 1: Conversión WhatsApp → CanalMedico

**Definición:** % de pacientes que escriben por WhatsApp y completan el pago

**Fórmula:**
```
Conversión = (Consultas pagadas desde WhatsApp / Intentos de WhatsApp) × 100
```

**Meta Actual (sin cambios):** 20-40%  
**Meta Objetivo (con cambios):** 60-80%

**Tracking:**
```typescript
// Evento: whatsapp_message_received
// Evento: consultation_created_from_whatsapp
// Evento: payment_completed_from_whatsapp
```

**Dashboard:**
- Tasa de conversión diaria/semanal/mensual
- Comparación antes/después
- Segmentación por médico

---

### Métrica 2: Tiempo Medio desde Mensaje → Pago

**Definición:** Tiempo promedio desde que paciente escribe por WhatsApp hasta que completa el pago

**Fórmula:**
```
Tiempo Medio = Suma(tiempo_pago - tiempo_mensaje) / Total_consultas_pagadas
```

**Meta Actual (sin cambios):** 5-10 minutos  
**Meta Objetivo (con cambios):** 1-2 minutos

**Tracking:**
```typescript
// Timestamp: consultation_attempt.createdAt
// Timestamp: payment.paidAt
// Calcular diferencia
```

**Dashboard:**
- Tiempo medio por día/semana
- Distribución (percentiles: p50, p75, p95)
- Comparación antes/después

---

### Métrica 3: % Consultas Pagadas vs Intentos

**Definición:** Ratio de consultas que se pagan vs intentos totales

**Fórmula:**
```
Ratio = Consultas pagadas / Intentos totales
```

**Meta Actual (sin cambios):** 0.2-0.4 (20-40%)  
**Meta Objetivo (con cambios):** 0.6-0.8 (60-80%)

**Tracking:**
```typescript
// Contar: consultation_attempts (status = 'CONVERTED' y consultation.payment.status = 'PAID')
// Contar: consultation_attempts (total)
```

**Dashboard:**
- Ratio diario/semanal/mensual
- Tendencias
- Segmentación por médico

---

### Métrica 4: Tasa de Abandono por Etapa

**Definición:** % de pacientes que abandonan en cada etapa del flujo

**Etapas:**
1. Mensaje recibido → Auto-respuesta enviada
2. Auto-respuesta enviada → Deep link clickeado
3. Deep link clickeado → OTP enviado
4. OTP enviado → OTP verificado
5. OTP verificado → Consulta creada
6. Consulta creada → Pago iniciado
7. Pago iniciado → Pago completado

**Fórmula:**
```
Abandono Etapa X = (Pacientes que llegan a X - Pacientes que pasan a X+1) / Pacientes que llegan a X
```

**Meta Objetivo:**
- Etapa 1-2: < 10% (auto-respuesta funciona)
- Etapa 2-3: < 20% (deep link funciona)
- Etapa 3-4: < 15% (OTP funciona)
- Etapa 4-5: < 5% (auto-creación funciona)
- Etapa 5-6: < 10% (pago iniciado)
- Etapa 6-7: < 10% (pago completado)

**Tracking:**
```typescript
// Eventos en cada etapa:
1. whatsapp_message_received
2. whatsapp_auto_response_sent
3. deep_link_clicked
4. otp_sent
5. otp_verified
6. consultation_created
7. payment_initiated
8. payment_completed
```

**Dashboard:**
- Funnel de conversión
- Identificar cuellos de botella
- Comparación antes/después

---

### Métrica 5: Satisfacción del Médico

**Definición:** % de médicos que reportan que el sistema resuelve su problema

**Encuesta (opcional):**
- "¿El sistema elimina las interrupciones de WhatsApp?" (Sí/No)
- "¿Puedes cobrar más consultas ahora?" (Sí/No)
- "¿Recomendarías CanalMedico a otros médicos?" (1-10)

**Meta Objetivo:** 80%+ de médicos reportan que SÍ resuelve el problema

---

## 📊 DASHBOARD DE MÉTRICAS

### Panel de Control para Product Manager

```
┌─────────────────────────────────────────────────────────┐
│  CONVERSIÓN WHATSAPP → CANALMEDICO                     │
│  ─────────────────────────────────────────────────────  │
│  Tasa Actual: 65% (↑ desde 30%)                        │
│  Meta: 60-80% ✅                                        │
│                                                         │
│  [Gráfico: Tasa de conversión últimos 30 días]        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TIEMPO MEDIO: MENSAJE → PAGO                          │
│  ─────────────────────────────────────────────────────  │
│  Tiempo Actual: 1.5 minutos (↓ desde 7 minutos)      │
│  Meta: 1-2 minutos ✅                                    │
│                                                         │
│  [Gráfico: Distribución de tiempos]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FUNNEL DE CONVERSIÓN                                  │
│  ─────────────────────────────────────────────────────  │
│  1. Mensaje recibido: 100%                              │
│  2. Auto-respuesta enviada: 98% (↓ 2%)                │
│  3. Deep link clickeado: 85% (↓ 13%)                  │
│  4. OTP verificado: 75% (↓ 10%)                        │
│  5. Consulta creada: 72% (↓ 3%)                        │
│  6. Pago completado: 65% (↓ 7%)                        │
│                                                         │
│  [Gráfico: Funnel visual]                              │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Fundación
- [ ] Migración BD ejecutada
- [ ] Feature flags implementados
- [ ] Estructura de módulos creada

### Fase 2: WhatsApp Cloud API
- [ ] Meta Business configurado
- [ ] Templates aprobados
- [ ] Webhook verificado
- [ ] Servicio WhatsApp implementado
- [ ] Panel web - Intentos implementado

### Fase 3: Login Invisible
- [ ] Servicio OTP implementado
- [ ] Endpoints auth nuevos implementados
- [ ] QuickConsultationScreen implementado
- [ ] Integración completa funcionando

### Fase 4: Testing y Optimización
- [ ] Testing end-to-end completado
- [ ] Monitoreo y métricas implementados
- [ ] Documentación completa

---

## 🎯 CONCLUSIÓN

**Este plan permite implementar la solución definitiva sin romper producción:**

1. ✅ **Feature flags** permiten activar/desactivar sin deploy
2. ✅ **Rollback** es instantáneo (< 5 minutos)
3. ✅ **Flujo actual** sigue funcionando (no se rompe)
4. ✅ **Migración gradual** posible (10% → 50% → 100%)
5. ✅ **Métricas claras** para medir éxito

**Al finalizar:**
- ✅ El médico ya no pierde tiempo por WhatsApp
- ✅ El médico cobra la atención de forma automática
- ✅ Conversión aumenta de 20-40% a 60-80%
- ✅ Tiempo de flujo reduce de 5-10 min a 1-2 min

---

**FIN DEL PLAN DE IMPLEMENTACIÓN**

