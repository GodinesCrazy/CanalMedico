# AUDITORÍA FUNCIONAL Y DE ROLES - CanalMedico

**Fecha:** 2024-01-XX  
**Auditor:** Lead Backend Engineer + Product Manager  
**Versión Sistema:** Producción (Railway)  
**Rol Auditado:** ADMIN (admin@canalmedico.com)

---

## 1️⃣ RESUMEN EJECUTIVO

### Estado Actual: ❌ **NO CUMPLE EL MODELO DE ROLES**

**Respuesta directa:**
- ❌ El sistema **NO se comporta acorde al rol ADMIN** en múltiples áreas críticas
- ⚠️ Existen **funciones de MÉDICO visibles y activas en ADMIN** que no deberían existir
- ❌ Faltan funciones críticas que un ADMIN debería tener (dashboard administrativo, métricas globales reales)
- ⚠️ Los errores actuales **ROMPEN el modelo** en algunos casos y son técnicos en otros
- ❌ El frontend y backend **NO están completamente alineados** con el modelo de datos esperado

### Riesgo General: **ALTO** 🔴

**Razones:**
1. ADMIN puede acceder a funcionalidades de DOCTOR que causan errores (dashboard médico, configuración de tarifas)
2. ADMIN no tiene un dashboard propio con métricas administrativas reales
3. La experiencia de usuario es confusa: ADMIN ve menús de DOCTOR que no funcionan
4. Errores en runtime cuando ADMIN intenta usar funciones médicas (profile null, doctorId undefined)

### Si Hoy se Pudiera Vender → ¿Qué Fallaría Primero?

**Respuestas inmediatas (primeras 24 horas):**
1. ❌ **Dashboard completamente roto** - ADMIN ve pantalla en blanco o errores al cargar
2. ❌ **Configuración inaccesible** - ADMIN no puede editar su perfil porque no tiene profile Doctor
3. ⚠️ **Consultas muestra datos incorrectos** - Si accede, ve consultas de otros médicos sin filtro apropiado
4. ✅ **Comisiones funciona** - Esta es la única área que funciona correctamente para ADMIN
5. ✅ **Solicitudes de Registro funciona** - Esta área también funciona correctamente

---

## 2️⃣ MATRIZ DE CONSISTENCIA POR ROL

| Pantalla | URL | Rol Visible | Rol Correcto | Estado | Comentario |
|----------|-----|-------------|--------------|--------|------------|
| Dashboard | `/` | ADMIN, DOCTOR | ADMIN (con métricas globales), DOCTOR (con métricas propias) | ❌ **ERROR** | ADMIN ve código de DOCTOR, falla al intentar acceder a `user.profile` (null), busca `doctorId` que no existe |
| Consultas | `/consultations` | ADMIN, DOCTOR | ADMIN (todas), DOCTOR (propias) | ⚠️ **WARNING** | Menú visible pero página probablemente muestra datos incorrectos o errores |
| Ingresos | `/earnings` | DOCTOR | DOCTOR | ✅ **OK** | Correctamente oculto para ADMIN |
| Comisiones | `/commissions` | ADMIN | ADMIN | ✅ **OK** | Funciona correctamente, backend protegido |
| Solicitudes de Registro | `/admin/signup-requests` | ADMIN | ADMIN | ✅ **OK** | Funciona correctamente, backend protegido |
| Configuración | `/settings` | ADMIN, DOCTOR | DOCTOR (tarifas, disponibilidad), ADMIN (perfil básico) | ❌ **ERROR** | ADMIN ve formulario de DOCTOR, intenta actualizar tarifas que no existen, causa errores |
| Perfil | `/profile` | ADMIN, DOCTOR | ADMIN, DOCTOR | ⚠️ **WARNING** | Probablemente falla para ADMIN porque `users.service.ts` solo devuelve `doctor` o `patient`, no maneja ADMIN |

---

## 3️⃣ LISTA PRIORITARIA DE PROBLEMAS

### 🔥 CRÍTICOS (Rompen el Modelo de Negocio)

#### 1. Dashboard Admin - Código Médico Ejecutándose para ADMIN
**Severidad:** 🔴 CRÍTICO  
**Ubicación:** `frontend-web/src/pages/DashboardPage.tsx`  
**Problema:**
```typescript
// Líneas 123, 142, 155 - El código asume que user.profile es un Doctor
const doctorId = (user?.profile as Doctor)?.id;
if (!doctorId) return; // ADMIN no tiene doctorId → Pantalla vacía

// Líneas 38-52, 54-71 - Intenta cargar disponibilidad y verificación médica
loadCurrentAvailability(); // Falla para ADMIN
loadVerificationStatus(); // Falla para ADMIN
```
**Impacto:**
- ADMIN ve pantalla en blanco o errores en consola
- No hay dashboard administrativo con métricas globales
- Experiencia de usuario completamente rota

**Solución Requerida:**
- Crear `AdminDashboardPage.tsx` separado con métricas administrativas
- O condicional en `DashboardPage.tsx` que muestre diferentes vistas según `user.role`
- Métricas ADMIN: total consultas, total ingresos, médicos activos, solicitudes pendientes, comisiones totales

#### 2. Settings Admin - Intenta Configurar Tarifas Médicas
**Severidad:** 🔴 CRÍTICO  
**Ubicación:** `frontend-web/src/pages/SettingsPage.tsx`  
**Problema:**
```typescript
// Línea 29 - Intenta obtener profile Doctor
const response = await api.get<{ profile: Doctor }>('/users/profile');
// Para ADMIN, esto devuelve profile: null (línea 22 de users.service.ts)

// Líneas 33-39 - Intenta usar datos de Doctor
setFormData({
  name: profile.name || '', // profile es null para ADMIN
  speciality: profile.speciality || '', // ❌ ADMIN no tiene especialidad
  tarifaConsulta: Number(profile.tarifaConsulta) || 0, // ❌ ADMIN no configura tarifas
  tarifaUrgencia: Number(profile.tarifaUrgencia) || 0, // ❌ ADMIN no configura tarifas
});

// Líneas 115-155 - Formulario completo de configuración médica
// ADMIN puede intentar guardar tarifas que no existen
```
**Impacto:**
- ADMIN ve formulario de configuración médica (incorrecto para su rol)
- Intenta guardar tarifas y causa errores en backend
- No puede editar su perfil básico (nombre, email)

**Solución Requerida:**
- Crear `AdminSettingsPage.tsx` con solo perfil básico (nombre, email, contraseña)
- O condicional que oculte tarifas/disponibilidad para ADMIN
- Backend debe rechazar intentos de ADMIN de actualizar tarifas

#### 3. Users Service - No Maneja ADMIN sin Profile
**Severidad:** 🔴 CRÍTICO  
**Ubicación:** `backend/src/modules/users/users.service.ts`  
**Problema:**
```typescript
// Líneas 9-14 - Solo incluye doctor o patient, no maneja ADMIN
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    doctor: true,
    patient: true,
  },
});

// Línea 22 - Si ADMIN no tiene doctor ni patient, profile es null
let profile: any = user.doctor || user.patient;

// Líneas 48-93 - updateProfile() solo funciona para doctor o patient
// Si ADMIN intenta actualizar, lanza error "Perfil no encontrado" (línea 88)
```
**Impacto:**
- `/users/profile` devuelve `profile: null` para ADMIN
- ADMIN no puede actualizar su perfil (nombre, email)
- Frontend falla al intentar acceder a `user.profile.name`

**Solución Requerida:**
- Modificar `users.service.ts` para manejar ADMIN sin profile
- Si `role === 'ADMIN'`, devolver datos básicos del User (id, email, role)
- Permitir actualización de email/nombre para ADMIN sin requerir profile Doctor/Patient

### ⚠️ IMPORTANTES (Rompen Flujos)

#### 4. Consultas Page - Probablemente No Filtra Correctamente para ADMIN
**Severidad:** 🟡 IMPORTANTE  
**Ubicación:** `frontend-web/src/pages/ConsultationsPage.tsx` (no revisado pero probable)  
**Problema:**
- Menú visible para ADMIN pero página probablemente diseñada para DOCTOR
- Si muestra todas las consultas, debería tener filtros administrativos
- Si no muestra todas, es funcionalidad incorrecta para ADMIN

**Solución Requerida:**
- Verificar implementación de `ConsultationsPage.tsx`
- Para ADMIN: mostrar todas las consultas con filtros (médico, paciente, estado, fecha)
- Para DOCTOR: mostrar solo consultas propias

#### 5. Layout - Muestra Profile Name que No Existe para ADMIN
**Severidad:** 🟡 IMPORTANTE  
**Ubicación:** `frontend-web/src/layouts/Layout.tsx`  
**Problema:**
```typescript
// Líneas 68-75 - Intenta mostrar nombre del profile
<span className="text-primary-600 font-medium">
  {user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
</span>
<p className="text-sm font-medium text-gray-900">
  {user?.profile?.name || 'Usuario'}
</p>
```
**Impacto:**
- Si `user.profile` es null para ADMIN, muestra "Usuario" genérico
- No hay forma de mostrar el email o nombre real del ADMIN

**Solución Requerida:**
- Usar `user.email` como fallback si `user.profile.name` no existe
- O almacenar nombre en User directamente para ADMIN

### 🧱 TÉCNICOS (Deuda Técnica)

#### 6. Backend - Falta Validación de Rol en Algunos Endpoints
**Severidad:** 🟢 TÉCNICO  
**Ubicación:** `backend/src/modules/doctors/doctors.controller.ts`, `backend/src/modules/users/users.controller.ts`  
**Problema:**
- Algunos endpoints validan ownership (usuario solo puede modificar su propio perfil) pero no validan rol
- ADMIN podría intentar usar endpoints de DOCTOR sin ser bloqueado explícitamente

**Solución Requerida:**
- Agregar `requireRole('DOCTOR')` en middleware de rutas de DOCTOR donde sea necesario
- O validar que ADMIN tenga permisos especiales explícitos

#### 7. Frontend - No Hay Diferenciación Clara de Roles en Componentes
**Severidad:** 🟢 TÉCNICO  
**Ubicación:** Múltiples archivos de frontend  
**Problema:**
- Código duplicado para verificar `user.role === 'ADMIN'` en múltiples lugares
- No hay componente wrapper `<RequireRole>` para proteger rutas/páginas
- No hay hook `useRole()` para facilitar verificaciones

**Solución Requerida:**
- Crear componentes/hooks reutilizables para manejo de roles
- Reducir duplicación de código de autorización

---

## 4️⃣ RECOMENDACIONES PARA LA FASE 2

### DEBE ARREGLARSE ANTES DE CONTINUAR

#### Prioridad 1: Dashboard Admin Funcional
**Tiempo estimado:** 4-6 horas  
**Acciones:**
1. Crear `AdminDashboardPage.tsx` con métricas administrativas:
   - Total consultas (todas)
   - Total ingresos (plataforma)
   - Médicos activos
   - Solicitudes pendientes
   - Comisiones totales del mes
   - Gráficos de consultas por período
2. Modificar routing para usar `AdminDashboardPage` cuando `role === 'ADMIN'`
3. Crear endpoints administrativos si no existen:
   - `GET /api/admin/statistics` (métricas globales)
   - `GET /api/admin/doctors` (lista de médicos)
   - `GET /api/admin/consultations` (todas las consultas)

#### Prioridad 2: Users Service para ADMIN
**Tiempo estimado:** 2-3 horas  
**Acciones:**
1. Modificar `users.service.ts` para manejar ADMIN:
   ```typescript
   if (user.role === 'ADMIN') {
     return {
       id: user.id,
       email: user.email,
       role: user.role,
       profile: null, // ADMIN no tiene profile médico/paciente
       createdAt: user.createdAt,
     };
   }
   ```
2. Modificar `updateProfile()` para permitir actualizar email/nombre para ADMIN
3. Agregar validación en frontend para no intentar acceder a `user.profile.name` si es ADMIN

#### Prioridad 3: Settings Admin Separado
**Tiempo estimado:** 2-3 horas  
**Acciones:**
1. Crear `AdminSettingsPage.tsx` con solo:
   - Nombre (si se almacena en User)
   - Email
   - Cambiar contraseña
2. Ocultar formulario de tarifas/disponibilidad para ADMIN
3. Modificar routing para usar página correcta según rol

### PUEDE POSPONERSE

#### Prioridad 4: Consultas Admin Completa
**Tiempo estimado:** 3-4 horas  
**Acciones:**
- Verificar y completar `ConsultationsPage.tsx` para ADMIN
- Agregar filtros administrativos
- Mostrar todas las consultas con paginación

#### Prioridad 5: Layout Mejorado
**Tiempo estimado:** 1 hora  
**Acciones:**
- Usar `user.email` como fallback en Layout cuando `profile.name` no existe
- Mejorar visualización de usuario ADMIN en sidebar

### DECISIONES DE DISEÑO QUE DEBEN TOMARSE AHORA

#### 1. ¿ADMIN tiene Perfil Completo o Solo Datos Básicos?
**Decisión requerida:** Determinar si ADMIN debe tener:
- Solo email, password, role (actual)
- O también: nombre, apellido, avatar (futuro)

**Recomendación:** Por ahora mantener solo datos básicos, pero agregar campo `name` opcional en User para ADMIN.

#### 2. ¿ADMIN Puede Ver Todas las Consultas o Solo Resumen?
**Decisión requerida:** Determinar alcance de funcionalidad ADMIN en consultas.

**Recomendación:** ADMIN debe poder ver TODAS las consultas con filtros avanzados (médico, paciente, estado, fecha). Es función crítica de administración.

#### 3. ¿ADMIN Puede Editar Perfiles de Médicos?
**Decisión requerida:** Determinar si ADMIN puede modificar datos de médicos aprobados.

**Recomendación:** Por ahora NO. ADMIN solo aprueba/rechaza solicitudes de registro. Edición de perfiles médicos puede ser funcionalidad futura con permisos especiales.

#### 4. ¿Qué Métricas Admin Son Críticas vs Nice-to-Have?
**Decisión requerida:** Priorizar métricas para dashboard ADMIN.

**Recomendación (MVP):**
- **Críticas:** Total consultas, Total ingresos, Médicos activos, Solicitudes pendientes
- **Nice-to-have:** Gráficos temporales, Comparativas, Exportación de reportes

---

## 5️⃣ ANÁLISIS DETALLADO POR PANTALLA

### A. Dashboard (`/`)

**Identificación:**
- **URL:** `/`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Métricas administrativas globales (consultas totales, ingresos plataforma, médicos activos, solicitudes pendientes)

**Evaluación de Consistencia de Rol:**
- ❌ **CRÍTICO** - ADMIN ve código de DOCTOR ejecutándose
- ❌ **INCORRECTO** - Función de DOCTOR (métricas propias, disponibilidad, verificación médica)

**Errores Detectados:**

1. **Error de Frontend:** `DashboardPage.tsx` asume `user.profile` es un `Doctor`
   ```typescript
   const doctorId = (user?.profile as Doctor)?.id;
   if (!doctorId) return; // ADMIN no tiene doctorId → Pantalla vacía
   ```
   **Tipo:** Error de implementación frontend  
   **Severidad:** 🔴 CRÍTICO  
   **Resultado:** Pantalla en blanco para ADMIN

2. **Error de Frontend:** Intenta cargar disponibilidad médica para ADMIN
   ```typescript
   loadCurrentAvailability(); // Llama a /doctors/${doctorId}/availability
   loadVerificationStatus(); // Llama a /medicos/${doctorId}/estado-validacion
   ```
   **Tipo:** Error de implementación frontend  
   **Severidad:** 🔴 CRÍTICO  
   **Resultado:** Errores 404 o 403 en consola

3. **Error de Modelo de Datos:** No hay endpoint para métricas administrativas
   - `/doctors/${doctorId}/statistics` - Solo para DOCTOR
   - No existe `/admin/statistics` o similar
   **Tipo:** Error de modelo de datos  
   **Severidad:** 🔴 CRÍTICO  
   **Resultado:** No hay forma de obtener métricas para ADMIN

**Impacto:**
- **Operación:** 🔴 Dashboard completamente inutilizable para ADMIN
- **Escalabilidad:** 🟡 No afecta directamente
- **Seguridad:** 🟢 No hay vulnerabilidad de seguridad, solo UX rota
- **Experiencia de usuario:** 🔴 Experiencia completamente rota, pantalla en blanco
- **Viabilidad comercial:** 🔴 Imposible vender con esta funcionalidad rota

---

### B. Configuración (`/settings`)

**Identificación:**
- **URL:** `/settings`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Para ADMIN: Editar perfil básico (email, nombre, contraseña). Para DOCTOR: Configurar perfil médico completo (tarifas, disponibilidad, horarios)

**Evaluación de Consistencia de Rol:**
- ❌ **CRÍTICO** - ADMIN ve formulario completo de configuración médica
- ❌ **INCORRECTO** - ADMIN no debe configurar tarifas ni disponibilidad

**Errores Detectados:**

1. **Error de Frontend:** `SettingsPage.tsx` no diferencia entre ADMIN y DOCTOR
   ```typescript
   // Intenta obtener profile Doctor (línea 29)
   const response = await api.get<{ profile: Doctor }>('/users/profile');
   // Para ADMIN, profile es null → FormData queda con valores vacíos
   
   // Muestra formulario completo de tarifas médicas (líneas 115-155)
   // ADMIN puede intentar guardar tarifas que no tiene
   ```
   **Tipo:** Error de implementación frontend  
   **Severidad:** 🔴 CRÍTICO  
   **Resultado:** Formulario incorrecto para ADMIN, errores al guardar

2. **Error de Backend:** `users.service.ts` no permite actualizar perfil para ADMIN
   ```typescript
   // updateProfile() solo maneja doctor o patient (líneas 48-93)
   if (user.doctor) { /* ... */ }
   else if (user.patient) { /* ... */ }
   else throw createError('Perfil no encontrado', 404); // ❌ ADMIN cae aquí
   ```
   **Tipo:** Error de implementación backend  
   **Severidad:** 🔴 CRÍTICO  
   **Resultado:** ADMIN no puede actualizar su perfil

3. **Error de Seguridad:** ADMIN podría intentar guardar tarifas (aunque backend debería rechazarlo)
   **Tipo:** Error de seguridad/permisos  
   **Severidad:** 🟡 IMPORTANTE  
   **Resultado:** Intentos de actualización fallidos, errores en logs

**Impacto:**
- **Operación:** 🔴 ADMIN no puede editar su perfil básico
- **Escalabilidad:** 🟢 No afecta
- **Seguridad:** 🟡 Funcionalidad incorrecta expuesta, aunque backend debería proteger
- **Experiencia de usuario:** 🔴 Confusión total: ve formulario médico, no puede guardar nada
- **Viabilidad comercial:** 🔴 Funcionalidad crítica rota

---

### C. Consultas (`/consultations`)

**Identificación:**
- **URL:** `/consultations`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Para ADMIN: Ver todas las consultas con filtros (médico, paciente, estado, fecha). Para DOCTOR: Ver solo consultas propias.

**Evaluación de Consistencia de Rol:**
- ⚠️ **WARNING** - Menú visible pero implementación no verificada completamente
- ⚠️ **POSIBLEMENTE INCORRECTO** - Si muestra solo consultas propias, es incorrecto para ADMIN

**Errores Detectados (Probables):**

1. **No verificado en código:** `ConsultationsPage.tsx` no fue leído completamente
   **Tipo:** Verificación pendiente  
   **Severidad:** 🟡 IMPORTANTE  
   **Resultado:** Necesita revisión para confirmar comportamiento

**Impacto:**
- **Operación:** 🟡 Posible funcionalidad incorrecta o incompleta
- **Escalabilidad:** 🟢 No afecta
- **Seguridad:** 🟢 Probablemente protegido en backend
- **Experiencia de usuario:** 🟡 Posible confusión si muestra datos incorrectos
- **Viabilidad comercial:** 🟡 Funcionalidad importante pero no crítica para MVP

---

### D. Comisiones (`/commissions`)

**Identificación:**
- **URL:** `/commissions`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Ver y gestionar comisiones de la plataforma (total, por médico, por período, exportar reportes)

**Evaluación de Consistencia de Rol:**
- ✅ **CORRECTO** - Funciona correctamente para ADMIN
- ✅ **IMPLEMENTACIÓN CORRECTA** - Backend protegido con `requireRole('ADMIN')`, frontend muestra datos administrativos

**Errores Detectados:**
- ✅ Ninguno. Esta es la única área completamente funcional para ADMIN.

**Impacto:**
- **Operación:** ✅ Funcional
- **Escalabilidad:** ✅ Funcional
- **Seguridad:** ✅ Protegido correctamente
- **Experiencia de usuario:** ✅ Buena experiencia
- **Viabilidad comercial:** ✅ Funcionalidad crítica operativa

---

### E. Solicitudes de Registro (`/admin/signup-requests`)

**Identificación:**
- **URL:** `/admin/signup-requests`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Ver, revisar, aprobar/rechazar solicitudes de registro médico. Re-ejecutar validaciones automáticas.

**Evaluación de Consistencia de Rol:**
- ✅ **CORRECTO** - Funciona correctamente para ADMIN
- ✅ **IMPLEMENTACIÓN CORRECTA** - Backend protegido, frontend completo con todas las funcionalidades necesarias

**Errores Detectados:**
- ✅ Ninguno. Esta es la segunda área completamente funcional para ADMIN.

**Impacto:**
- **Operación:** ✅ Funcional
- **Escalabilidad:** ✅ Funcional
- **Seguridad:** ✅ Protegido correctamente
- **Experiencia de usuario:** ✅ Buena experiencia
- **Viabilidad comercial:** ✅ Funcionalidad crítica operativa

---

### F. Perfil (`/profile`)

**Identificación:**
- **URL:** `/profile`
- **Rol activo:** ADMIN (visible en menú)
- **Función esperada según modelo:** Ver y editar perfil básico (email, nombre si existe, contraseña)

**Evaluación de Consistencia de Rol:**
- ⚠️ **WARNING** - Probablemente falla para ADMIN porque `users.service.ts` devuelve `profile: null`

**Errores Detectados (Probables):**

1. **Error de Backend:** `users.service.ts` no maneja ADMIN correctamente
   ```typescript
   let profile: any = user.doctor || user.patient;
   // Para ADMIN, profile es null
   ```
   **Tipo:** Error de implementación backend  
   **Severidad:** 🟡 IMPORTANTE  
   **Resultado:** Frontend probablemente muestra perfil vacío o errores

**Impacto:**
- **Operación:** 🟡 Funcionalidad incompleta o rota
- **Escalabilidad:** 🟢 No afecta
- **Seguridad:** 🟢 No hay vulnerabilidad
- **Experiencia de usuario:** 🟡 Perfil no se muestra correctamente
- **Viabilidad comercial:** 🟡 Funcionalidad importante pero no crítica

---

## 6️⃣ CONCLUSIONES FINALES

### Estado General del Sistema

El sistema CanalMedico tiene una **implementación parcial del modelo RBAC**. Las áreas administrativas críticas (Comisiones, Solicitudes de Registro) funcionan correctamente, pero las áreas de uso diario (Dashboard, Configuración, Perfil) están completamente rotas para el rol ADMIN.

### Puntos Positivos ✅

1. **Backend protegido:** Los endpoints críticos tienen protección de roles (`requireRole('ADMIN')`)
2. **Comisiones funcional:** Dashboard de comisiones completamente operativo
3. **Solicitudes de registro funcional:** Gestión de solicitudes médicas operativa
4. **Arquitectura base sólida:** El sistema tiene una base técnica sólida para corregir los problemas

### Puntos Críticos ❌

1. **Dashboard Admin inexistente:** Código de DOCTOR ejecutándose para ADMIN
2. **Settings Admin roto:** Formulario médico mostrado a ADMIN
3. **Users Service incompleto:** No maneja ADMIN sin profile
4. **Frontend no diferenciado:** No hay componentes/páginas separadas por rol

### Recomendación Final

**NO es viable para producción en su estado actual** para el rol ADMIN. Se requieren correcciones críticas (Prioridades 1, 2, 3) antes de considerar el sistema estable.

**Tiempo estimado de corrección:** 8-12 horas de desarrollo para corregir los problemas críticos.

**Riesgo de implementar ahora:** 🔴 ALTO - Admin no puede usar el sistema de manera productiva.

---

**Fin de Auditoría**

