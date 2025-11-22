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

### Verificar Credenciales

Antes de aprobar un médico, verifique:

✅ **RUT**: Válido y único en el sistema  
✅ **Título Profesional**: Solicite copia del título  
✅ **Registro en Superintendencia de Salud**: Verifique en https://www.supersalud.gob.cl  
✅ **Especialidad**: Confirme que coincida con su formación  

### Aprobar/Rechazar Médico

1. Vaya a **"Médicos"** → **"Pendientes de Aprobación"**
2. Revise la documentación adjunta
3. Verifique credenciales
4. Haga clic en:
   - **"Aprobar"**: El médico podrá usar la plataforma
   - **"Rechazar"**: Ingrese el motivo del rechazo

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

#### Ciclo de Pago Mensual

Los pagos a médicos se procesan el **día 5 de cada mes**.

**Proceso**:

1. Vaya a **"Finanzas"** → **"Pagos a Médicos"**
2. Seleccione el mes a procesar
3. El sistema generará un listado con:
   - Nombre del médico
   - RUT
   - Total de consultas
   - Monto bruto
   - Comisión retenida
   - **Monto a transferir**
   - Datos bancarios

4. Revise el listado
5. Haga clic en **"Generar Archivo para Banco"**
6. Descargue el archivo (formato compatible con su banco)
7. Suba el archivo al portal de su banco
8. Procese las transferencias
9. En CanalMedico, marque los pagos como **"Transferidos"**
10. El sistema enviará comprobantes a cada médico

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

**Versión**: 1.0  
**Fecha**: Noviembre 2024  
**Última actualización**: 22/11/2024

---

**Equipo CanalMedico**  
*Administración y Soporte Técnico*

Para consultas sobre este manual: admin@canalmedico.cl

---

*CanalMedico - Panel de Administración* 🔧
