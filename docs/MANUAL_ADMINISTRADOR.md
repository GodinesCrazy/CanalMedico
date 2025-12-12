# 🔧 Manual de Administrador - CanalMedico

## Guía de Administración y Soporte Técnico

---

## 📑 Índice

1. [Introducción](#introducción)
2. [Acceso al Panel de Administración](#acceso-al-panel-de-administración)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Gestión de Médicos](#gestión-de-médicos)
5. [Gestión de Pacientes](#gestión-de-pacientes)
6. [Monitoreo de Consultas](#monitoreo-de-consultas)
7. [Gestión de Pagos](#gestión-de-pagos)
8. [Reportes y Estadísticas](#reportes-y-estadísticas)
9. [Soporte Técnico](#soporte-técnico)
10. [Mantenimiento del Sistema](#mantenimiento-del-sistema)
11. [Procedimientos de Emergencia](#procedimientos-de-emergencia)

---

## Introducción

### Rol del Administrador

Como administrador de CanalMedico, usted es responsable de:

✅ Gestionar usuarios (médicos y pacientes)  
✅ Monitorear el funcionamiento de la plataforma  
✅ Resolver incidencias técnicas  
✅ Generar reportes financieros  
✅ Asegurar la calidad del servicio  
✅ Coordinar pagos a médicos  

### Responsabilidades Clave

1. **Operativas**: Mantener la plataforma funcionando 24/7
2. **Soporte**: Atender consultas de usuarios
3. **Financieras**: Gestionar pagos y comisiones
4. **Seguridad**: Proteger datos sensibles
5. **Calidad**: Asegurar buenas prácticas médicas

---

## Acceso al Panel de Administración

### Credenciales de Acceso

**URL**: https://admin.canalmedico.cl  
**Usuario**: admin@canalmedico.cl  
**Contraseña**: [Proporcionada por el equipo técnico]

> **Seguridad**: Cambie la contraseña por defecto en el primer acceso.

### Iniciar Sesión

1. Navegue a la URL del panel de administración
2. Ingrese su correo electrónico
3. Ingrese su contraseña
4. Haga clic en **"Iniciar Sesión"**
5. (Opcional) Active autenticación de dos factores (2FA)

### Permisos y Roles

El sistema cuenta con diferentes niveles de acceso:

| Rol | Permisos |
|-----|----------|
| **Super Admin** | Acceso total al sistema |
| **Admin** | Gestión de usuarios y consultas |
| **Soporte** | Solo lectura y soporte a usuarios |
| **Finanzas** | Gestión de pagos y reportes financieros |

---

## Gestión de Usuarios

### Ver Listado de Usuarios

1. En el menú principal, seleccione **"Usuarios"**
2. Verá una tabla con:
   - ID de usuario
   - Nombre
   - Email
   - Rol (DOCTOR / PATIENT / ADMIN)
   - Fecha de registro
   - Estado (Activo / Inactivo)

### Filtrar Usuarios

Use los filtros disponibles:
- **Por Rol**: Médicos, Pacientes, Admins
- **Por Estado**: Activos, Inactivos, Suspendidos
- **Por Fecha**: Rango de fechas de registro
- **Búsqueda**: Por nombre o email

### Crear Nuevo Usuario

#### Registrar un Médico

1. Haga clic en **"Nuevo Usuario"** → **"Médico"**
2. Complete el formulario:
   - **Email**: Correo profesional del médico
   - **Nombre**: Nombre completo
   - **RUT**: RUT chileno (será validado automáticamente)
   - **Especialidad**: Especialidad médica
   - **Contraseña Temporal**: El sistema generará una automáticamente
3. Haga clic en **"Crear Médico"**
4. El sistema enviará un correo al médico con instrucciones

#### Registrar un Paciente

1. Haga clic en **"Nuevo Usuario"** → **"Paciente"**
2. Complete el formulario:
   - **Email**: Correo del paciente
   - **Nombre**: Nombre completo
   - **Edad**: Edad del paciente
   - **Contraseña Temporal**: El sistema generará una automáticamente
3. Haga clic en **"Crear Paciente"**
4. El sistema enviará un correo al paciente

### Editar Usuario

1. En el listado de usuarios, haga clic en el ícono de **editar** ✏️
2. Modifique los campos necesarios
3. Haga clic en **"Guardar Cambios"**

### Suspender/Activar Usuario

#### Suspender

1. Seleccione el usuario
2. Haga clic en **"Suspender"**
3. Ingrese el motivo de suspensión
4. Confirme la acción
5. El usuario no podrá acceder al sistema

#### Reactivar

1. Filtre por usuarios suspendidos
2. Seleccione el usuario
3. Haga clic en **"Reactivar"**
4. Confirme la acción

### Eliminar Usuario

> **Advertencia**: Esta acción es irreversible y eliminará todo el historial del usuario.

1. Seleccione el usuario
2. Haga clic en **"Eliminar"**
3. Escriba **"CONFIRMAR"** en el cuadro de diálogo
4. Haga clic en **"Eliminar Permanentemente"**

---

## Gestión de Médicos

### Solicitudes de Registro (NUEVO)

Los médicos ahora pueden solicitar su registro directamente desde la plataforma:

1. Vaya a **"Solicitudes de Registro"** en el menú principal
2. Verá todas las solicitudes pendientes con:
   - Nombre completo
   - Email
   - RUT
   - Especialidad
   - Número de registro profesional
   - Clínica o centro donde trabaja
   - Comentarios adicionales
   - Fecha de solicitud

### Sistema de Validación Automática (NUEVO)

CanalMedico ahora valida automáticamente a los médicos usando **dos fuentes oficiales del Estado de Chile**:

1. **Registro Civil** - Valida RUN y nombre
2. **Superintendencia de Salud (RNPI)** - Valida habilitación profesional

**Estados de Validación:**

- **AUTO_APPROVED**: Aprobada automáticamente (médico creado)
- **AUTO_REJECTED**: Rechazada automáticamente (no cumple requisitos)
- **REVIEWED**: Requiere revisión manual (inconsistencias menores)

### Verificar Resultados de Validación

En el panel de solicitudes, puede ver:

1. **Validación de Identidad:**
   - Estado: Verificada / No Coincide / RUN Inválido
   - Detalles: Nombre oficial, fecha de nacimiento, estado de cédula

2. **Validación RNPI:**
   - Estado: Médico Verificado / No Médico / Suspendido / Inconsistencias
   - Detalles: Profesión oficial, estado, especialidades registradas

3. **Errores de Validación:**
   - Lista de errores encontrados durante la validación automática

### Re-ejecutar Validaciones

Si necesita re-ejecutar las validaciones automáticas:

1. Abra los detalles de la solicitud
2. Haga clic en **"Re-ejecutar Validaciones"**
3. El sistema volverá a consultar las fuentes oficiales
4. Los resultados se actualizarán en breve

### Verificar Credenciales (Revisión Manual)

Para solicitudes que requieren revisión manual (`REVIEWED`), verifique:

✅ **RUT**: Válido y único en el sistema  
✅ **Validación de Identidad**: Revise si el nombre coincide  
✅ **Validación RNPI**: Revise profesión, estado y especialidades  
✅ **Título Profesional**: Solicite copia del título si hay dudas  
✅ **Registro en Superintendencia de Salud**: Verifique en https://www.supersalud.gob.cl  
✅ **Especialidad**: Confirme que coincida con su formación  
✅ **Número de Registro**: Verifique que sea válido  

### Aprobar/Rechazar Médico

1. Vaya a **"Solicitudes de Registro"**
2. Filtre por estado: **"Pendientes"**
3. Haga clic en una solicitud para ver todos los detalles
4. Revise la información completa
5. Haga clic en:
   - **"Aprobar"**: 
     - El sistema creará automáticamente la cuenta del médico
     - Se enviará un correo con instrucciones de acceso
     - El médico podrá usar la plataforma inmediatamente
   - **"Rechazar"**: 
     - Ingrese el motivo del rechazo
     - Se enviará un correo al médico explicando el motivo
     - La solicitud quedará archivada

### Estados de Solicitudes

- **PENDING**: Pendiente de revisión
- **REVIEWED**: En revisión
- **APPROVED**: Aprobada (médico creado)
- **REJECTED**: Rechazada

### Configurar Tarifas Sugeridas

1. Vaya a **"Configuración"** → **"Tarifas"**
2. Establezca rangos sugeridos:
   - **Consulta Normal**: Min/Max en CLP
   - **Consulta Urgente**: Min/Max en CLP
3. Los médicos verán estas sugerencias al configurar sus tarifas

### Monitorear Desempeño de Médicos

1. Vaya a **"Médicos"** → **"Estadísticas"**
2. Vea métricas por médico:
   - Número de consultas atendidas
   - Tiempo promedio de respuesta
   - Calificación de pacientes (si aplica)
   - Ingresos generados
   - Consultas cerradas vs activas

### Gestionar Quejas contra Médicos

1. Vaya a **"Soporte"** → **"Quejas"**
2. Filtre por **"Contra Médicos"**
3. Revise cada caso:
   - Leer la queja del paciente
   - Revisar el historial de la consulta
   - Contactar al médico para su versión
4. Tome acción:
   - **Advertencia**: Enviar advertencia al médico
   - **Suspensión Temporal**: 7, 15 o 30 días
   - **Suspensión Permanente**: En casos graves
   - **Archivar**: Si la queja no procede

---

## Gestión de Pacientes

### Ver Historial de Paciente

1. Busque al paciente por nombre o email
2. Haga clic en **"Ver Perfil"**
3. Verá:
   - Datos personales
   - Médicos vinculados
   - Historial de consultas
   - Historial de pagos
   - Quejas o reportes

### Vincular Paciente con Médico

En caso de que un paciente tenga problemas para vincularse:

1. Vaya al perfil del paciente
2. Haga clic en **"Vincular con Médico"**
3. Busque al médico
4. Haga clic en **"Vincular"**
5. Ambos recibirán una notificación

### Gestionar Quejas de Pacientes

1. Vaya a **"Soporte"** → **"Quejas"**
2. Filtre por **"De Pacientes"**
3. Revise cada caso
4. Tome acción según corresponda

---

## Monitoreo de Consultas

### Dashboard de Consultas

1. Vaya a **"Consultas"** → **"Dashboard"**
2. Verá métricas en tiempo real:
   - **Consultas Activas**: Cantidad actual
   - **Consultas Pendientes de Pago**: Requieren atención
   - **Consultas Cerradas Hoy**: Productividad diaria
   - **Tiempo Promedio de Respuesta**: Por tipo de consulta

### Ver Consultas en Curso

1. Vaya a **"Consultas"** → **"Activas"**
2. Vea todas las consultas en curso
3. Puede filtrar por:
   - Médico
   - Paciente
   - Tipo (Normal / Urgente)
   - Fecha de inicio

### Intervenir en una Consulta

> **Nota**: Solo en casos excepcionales (quejas, emergencias, etc.)

1. Abra la consulta
2. Revise el historial de mensajes
3. Haga clic en **"Intervenir"**
4. Envíe un mensaje visible para ambas partes
5. Documente la razón de la intervención

### Cerrar Consulta Manualmente

En caso de que un médico no cierre una consulta:

1. Abra la consulta
2. Haga clic en **"Cerrar Manualmente"**
3. Ingrese el motivo
4. Confirme la acción
5. Ambas partes recibirán una notificación

---

## Gestión de Pagos

### Dashboard Financiero

1. Vaya a **"Finanzas"** → **"Dashboard"**
2. Verá:
   - **Ingresos del Mes**: Total facturado
   - **Comisiones del Mes**: 15% de cada consulta
   - **Pagos Pendientes a Médicos**: Montos por transferir
   - **Gráficos**: Evolución mensual

### Ver Transacciones

1. Vaya a **"Finanzas"** → **"Transacciones"**
2. Vea todas las transacciones:
   - ID de transacción
   - Fecha y hora
   - Paciente
   - Médico
   - Monto total
   - Comisión (15%)
   - Monto neto para médico
   - Estado (Pendiente / Aprobado / Fallido)
   - Método de pago (MercadoPago)

### Filtrar Transacciones

- **Por Fecha**: Rango de fechas
- **Por Médico**: Ver pagos de un médico específico
- **Por Estado**: Exitosos, Fallidos, Pendientes
- **Por Monto**: Rango de montos

### Exportar Reportes

1. Configure los filtros deseados
2. Haga clic en **"Exportar"**
3. Elija el formato:
   - **Excel (.xlsx)**: Para análisis
   - **PDF**: Para impresión
   - **CSV**: Para importar a otros sistemas
4. El archivo se descargará automáticamente

### Procesar Pagos a Médicos

#### Sistema Dual de Pagos

CanalMedico ahora soporta dos modalidades de pago:

1. **Pago Inmediato**: Se procesan automáticamente después de cada consulta
2. **Pago Mensual**: Se acumulan y liquidan mensualmente

#### Procesar Liquidaciones Mensuales (NUEVO)

Los médicos con modalidad mensual se liquidan automáticamente, pero puede revisar y gestionar:

1. Vaya a **"Finanzas"** → **"Liquidaciones Mensuales"**
2. Verá todas las liquidaciones:
   - **Pendientes**: Aún no procesadas
   - **Programadas**: Para el próximo día de liquidación
   - **Procesadas**: Ya transferidas

3. Para procesar manualmente una liquidación:
   - Seleccione el médico
   - Revise el monto acumulado
   - Haga clic en **"Procesar Liquidación"**
   - El sistema generará el lote de liquidación

#### Proceso de Liquidación Automático

El sistema procesa automáticamente las liquidaciones mensuales:
- **Cuándo**: El día configurado por cada médico (por defecto día 5)
- **Qué incluye**: Todas las consultas pagadas del mes anterior
- **Proceso**: 
  1. Se agrupan todos los pagos pendientes del médico
  2. Se calcula el monto total
  3. Se crea un lote de liquidación
  4. Se marca como "SCHEDULED"
  5. Se envía notificación al médico

#### Procesar Transferencias

1. Vaya a **"Finanzas"** → **"Pagos Pendientes"**
2. Filtre por médicos con modalidad mensual
3. Revise los lotes de liquidación pendientes
4. Haga clic en **"Generar Archivo para Banco"**
5. Descargue el archivo (formato compatible con su banco)
6. Suba el archivo al portal de su banco
7. Procese las transferencias
8. En CanalMedico, marque los pagos como **"Transferidos"**
9. El sistema enviará comprobantes a cada médico

### Gestionar Pagos Fallidos

1. Vaya a **"Finanzas"** → **"Pagos Fallidos"**
2. Vea la lista de pagos rechazados
3. Para cada uno:
   - Contacte al paciente
   - Verifique el motivo del rechazo
   - Ofrezca reintentar el pago
   - Si no se resuelve, cancele la consulta

### Reembolsos

> **Política**: Los reembolsos solo se aprueban en casos excepcionales.

**Casos válidos para reembolso**:
- Error técnico de la plataforma
- Médico no respondió en el plazo comprometido
- Consulta duplicada por error

**Proceso**:

1. Vaya a **"Finanzas"** → **"Solicitudes de Reembolso"**
2. Revise cada solicitud
3. Verifique el motivo
4. Revise el historial de la consulta
5. Decida:
   - **Aprobar**: Procesar reembolso
   - **Rechazar**: Indicar motivo
6. Si aprueba:
   - El sistema procesará el reembolso vía MercadoPago
   - El paciente recibirá el dinero en 5-10 días hábiles
   - Se descontará la comisión del médico (si ya se pagó)

---

## Reportes y Estadísticas

### Reportes Disponibles

#### Reporte de Actividad

- Consultas por día/semana/mes
- Médicos más activos
- Pacientes más frecuentes
- Horarios de mayor demanda

#### Reporte Financiero

- Ingresos totales
- Comisiones generadas
- Pagos a médicos
- Métodos de pago más usados

#### Reporte de Calidad

- Tiempo promedio de respuesta por médico
- Consultas cerradas vs abandonadas
- Quejas y resoluciones

### Generar Reporte Personalizado

1. Vaya a **"Reportes"** → **"Nuevo Reporte"**
2. Seleccione:
   - **Tipo de reporte**
   - **Rango de fechas**
   - **Filtros** (médico, especialidad, etc.)
   - **Formato** (Excel, PDF, CSV)
3. Haga clic en **"Generar"**
4. Espere a que se procese (puede tomar unos minutos)
5. Descargue el archivo

---

## Sistema de Validación Automática de Médicos

### ¿Cómo Funciona?

CanalMedico valida automáticamente a todos los médicos que solicitan registro usando **dos fuentes oficiales del Estado de Chile**:

1. **Registro Civil** - Valida que el RUN existe y que el nombre coincide
2. **Superintendencia de Salud (RNPI)** - Valida que sea médico habilitado

### Estados de Validación

**En el panel de solicitudes, verá:**

- **AUTO_APPROVED**: Aprobada automáticamente (médico ya creado)
- **AUTO_REJECTED**: Rechazada automáticamente (no cumple requisitos)
- **REVIEWED**: Requiere revisión manual (inconsistencias menores)
- **PENDING**: Validaciones en curso

### Revisar Resultados de Validación

1. Abra los detalles de una solicitud
2. En la sección **"Validaciones Automáticas"** verá:
   - **Validación de Identidad**: Estado y detalles
   - **Validación RNPI**: Estado y datos oficiales
   - **Errores**: Si hubo errores durante la validación

### Re-ejecutar Validaciones

Si necesita re-validar una solicitud:

1. Abra los detalles de la solicitud
2. Haga clic en **"Re-ejecutar Validaciones"**
3. El sistema volverá a consultar las fuentes oficiales
4. Los resultados se actualizarán en breve

### Qué Hacer con Cada Estado

**AUTO_APPROVED:**
- ✅ No requiere acción
- El médico ya fue creado automáticamente
- Puede verificar que el médico puede iniciar sesión

**AUTO_REJECTED:**
- ✅ No requiere acción
- El sistema rechazó automáticamente por no cumplir requisitos
- Revise los errores para entender el motivo

**REVIEWED:**
- ⚠️ Requiere revisión manual
- Revise las inconsistencias encontradas
- Compare datos proporcionados vs datos oficiales
- Decida aprobar o rechazar según corresponda

**PENDING:**
- ⏳ Validaciones en curso
- Espere a que se completen (puede tomar unos minutos)
- Si tarda mucho, puede re-ejecutar manualmente

### Fuentes Oficiales Utilizadas

1. **Registro Civil de Chile**
   - Proveedor: Floid (configurable)
   - Valida: RUN, nombre, fecha de nacimiento
   - URL: https://www.registrocivil.gob.cl

2. **Superintendencia de Salud - RNPI**
   - Registro Nacional de Prestadores Individuales
   - Valida: Profesión, estado, especialidades
   - URL: https://www.supersalud.gob.cl

---

## Monitoreo de Recetas SNRE

### Ver Recetas Emitidas

1. Vaya a **"Consultas"** → **"Todas las Consultas"**
2. Filtre por consultas con recetas
3. Haga clic en una consulta para ver detalles
4. Verá todas las recetas emitidas en esa consulta

### Monitorear Errores de SNRE

1. Vaya a **"Sistema"** → **"Logs"** o **"Recetas SNRE"**
2. Filtre por estado **"ERROR_SNRE"**
3. Revise cada error:
   - **Error de autenticación**: Verificar credenciales SNRE
   - **Error de validación**: Revisar datos de la receta
   - **Error del servidor SNRE**: Contactar al MINSAL

### Qué Hacer si SNRE está Caído

1. **Verificar estado del SNRE:**
   - Revisar logs del backend
   - Intentar health check manual
   - Contactar soporte MINSAL si es necesario

2. **Comunicar a médicos:**
   - Enviar notificación si el SNRE está caído
   - Indicar que pueden seguir emitiendo recetas localmente
   - Las recetas se enviarán automáticamente cuando SNRE vuelva

3. **Reintentar envíos fallidos:**
   - El sistema puede reintentar automáticamente
   - O puede hacerlo manualmente desde el panel de administración

### Configuración SNRE

Para configurar credenciales SNRE:

1. Vaya a **"Sistema"** → **"Configuración"** → **"SNRE"**
2. Configure:
   - **SNRE_BASE_URL**: URL de la API FHIR
   - **SNRE_API_KEY**: API Key proporcionada por MINSAL
   - **SNRE_ENVIRONMENT**: sandbox o production
3. Guarde los cambios
4. El sistema validará la conexión automáticamente

---

## Soporte Técnico

### Canales de Soporte

Los usuarios pueden contactar a soporte por:

📧 **Email**: soporte@canalmedico.cl  
📱 **WhatsApp**: +56 9 XXXX XXXX  
💬 **Chat en vivo**: Dentro de la plataforma  

### Gestionar Tickets de Soporte

1. Vaya a **"Soporte"** → **"Tickets"**
2. Vea todos los tickets:
   - **Abiertos**: Requieren atención
   - **En Proceso**: Siendo atendidos
   - **Resueltos**: Cerrados
   - **Cerrados**: Archivados

### Atender un Ticket

1. Haga clic en un ticket abierto
2. Lea la consulta del usuario
3. Revise el historial del usuario si es necesario
4. Responda al ticket:
   - Escriba su respuesta
   - Adjunte capturas de pantalla si ayuda
   - Haga clic en **"Enviar Respuesta"**
5. Cambie el estado:
   - **En Proceso**: Si requiere más investigación
   - **Resuelto**: Si solucionó el problema
   - **Escalado**: Si requiere intervención técnica avanzada

### Problemas Comunes y Soluciones

#### Usuario no puede iniciar sesión

**Solución**:
1. Verifique que el usuario exista en el sistema
2. Verifique que no esté suspendido
3. Restablezca la contraseña manualmente
4. Envíe las nuevas credenciales al usuario

#### Pago no se refleja en el sistema

**Solución**:
1. Vaya a **"Finanzas"** → **"Transacciones"**
2. Busque por ID de transacción de MercadoPago
3. Si no aparece, revise los logs de webhooks
4. Si el pago existe en MercadoPago pero no en CanalMedico:
   - Contacte al equipo técnico
   - Procese manualmente la activación de la consulta

#### Médico no recibe notificaciones

**Solución**:
1. Verifique que el médico tenga notificaciones activadas
2. Revise que el correo no esté en spam
3. Verifique la configuración de notificaciones push
4. Pida al médico que cierre sesión y vuelva a entrar

---

## Mantenimiento del Sistema

### Tareas de Mantenimiento Regular

#### Diarias

- ✅ Revisar tickets de soporte abiertos
- ✅ Monitorear pagos fallidos
- ✅ Verificar que el sistema esté en línea

#### Semanales

- ✅ Revisar reportes de actividad
- ✅ Aprobar nuevos médicos
- ✅ Procesar quejas pendientes
- ✅ Backup de base de datos

#### Mensuales

- ✅ Procesar pagos a médicos
- ✅ Generar reportes financieros
- ✅ Revisar métricas de calidad
- ✅ Actualizar documentación

### Backup y Recuperación

#### Backup Automático

El sistema realiza backups automáticos:
- **Diarios**: A las 02:00 AM (hora Chile)
- **Semanales**: Domingos a las 03:00 AM
- **Mensuales**: Primer día del mes

#### Restaurar desde Backup

> **Advertencia**: Solo en caso de emergencia. Contacte al equipo técnico.

1. Vaya a **"Sistema"** → **"Backups"**
2. Seleccione el backup a restaurar
3. Haga clic en **"Restaurar"**
4. Confirme la acción
5. El sistema se reiniciará (puede tomar 10-15 minutos)

---

## Procedimientos de Emergencia

### Sistema Caído

1. **Verificar**: Intente acceder desde otro navegador/dispositivo
2. **Notificar**: Contacte al equipo técnico inmediatamente
3. **Comunicar**: Envíe un correo masivo a usuarios informando la situación
4. **Monitorear**: Revise el estado cada 15 minutos
5. **Confirmar**: Una vez resuelto, notifique a los usuarios

### Brecha de Seguridad

1. **Aislar**: Suspenda el acceso al sistema si es necesario
2. **Notificar**: Contacte al equipo técnico y legal
3. **Investigar**: Determine el alcance de la brecha
4. **Remediar**: Implemente las correcciones necesarias
5. **Comunicar**: Informe a usuarios afectados según la ley

### Queja Grave contra Médico

1. **Revisar**: Evalúe la gravedad de la queja
2. **Suspender**: Si es necesario, suspenda al médico temporalmente
3. **Investigar**: Revise el historial completo
4. **Contactar**: Hable con ambas partes
5. **Decidir**: Tome una decisión fundamentada
6. **Documentar**: Registre todo el proceso

---

## Contactos de Emergencia

### Equipo Técnico

- **CTO**: cto@canalmedico.cl
- **DevOps**: devops@canalmedico.cl
- **Soporte L2**: soporte-avanzado@canalmedico.cl

### Equipo Legal

- **Legal**: legal@canalmedico.cl

### Proveedores

- **MercadoPago Soporte**: soporte@mercadopago.cl
- **Hosting**: [Según proveedor]

---

## Glosario

- **Consulta Activa**: Consulta pagada y en curso
- **Consulta Pendiente**: Consulta creada pero no pagada
- **Comisión**: 15% retenido por la plataforma
- **Monto Neto**: Ingreso del médico después de comisión
- **RUT**: Rol Único Tributario (identificación chilena)
- **Webhook**: Notificación automática de MercadoPago

---

## Actualizaciones del Manual

**Versión**: 1.1.0  
**Fecha**: Enero 2025  
**Última actualización**: Enero 2025

### Nuevas Funcionalidades en esta Versión

- ✅ **Panel de Solicitudes de Registro**: Gestión completa de solicitudes de médicos
- ✅ **Sistema Dual de Liquidaciones**: Pago inmediato y mensual
- ✅ **Liquidaciones Automáticas**: Procesamiento automático de liquidaciones mensuales
- ✅ **Mejoras de Seguridad**: Validación de propiedad en todos los endpoints

---

**Equipo CanalMedico**  
*Administración y Soporte Técnico*

Para consultas sobre este manual: admin@canalmedico.cl

---

*CanalMedico - Panel de Administración* 🔧
