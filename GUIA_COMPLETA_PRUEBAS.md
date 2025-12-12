# 🧪 Guía Completa de Pruebas - CanalMedico Mejoras

Esta guía te ayudará a probar todas las nuevas mejoras implementadas.

---

## 📋 Pre-requisitos

1. ✅ **Migraciones ejecutadas**: Verifica que las migraciones de la base de datos se hayan ejecutado correctamente
2. ✅ **Servidor backend corriendo**: El backend debe estar disponible
3. ✅ **Frontend web desplegado**: El frontend debe estar accesible
4. ✅ **Credenciales de prueba**: Usuario médico y admin

---

## 🧪 1. Prueba del Sistema de Disponibilidad Automática

### 1.1 Configurar Disponibilidad Automática

1. **Inicia sesión** como médico en el frontend web
2. **Navega a Configuración** (menú lateral)
3. **Ve a la sección "Configuración de Disponibilidad"**
4. **Verifica que se muestre:**
   - Selector de modo (Manual/Automático)
   - Estado actual de disponibilidad
   - Opciones para configurar horarios (si está en modo Automático)

### 1.2 Probar Modo Manual (Como Antes)

1. **Selecciona "Modo Manual"**
2. **Marca/desmarca** el checkbox "Disponible para consultas"
3. **Guarda la configuración**
4. **Verifica** que el estado cambie correctamente en el Dashboard

### 1.3 Probar Modo Automático

1. **Selecciona "Modo Automático"**
2. **Habilita algunos días** (ej: Lunes a Viernes)
3. **Configura horarios** para cada día:
   - Lunes: 09:00 - 18:00
   - Martes: 09:00 - 18:00
   - etc.
4. **Guarda la configuración**
5. **Verifica** en el Dashboard que:
   - Si estás dentro del horario → muestra "✅ Disponible (Modo Automático)"
   - Si estás fuera del horario → muestra "❌ No Disponible (Modo Automático)"

### 1.4 Verificar Disponibilidad Calculada

1. **Ve al Dashboard**
2. **Verifica** que se muestre el estado actual:
   - Si es Manual: muestra toggle para activar/desactivar
   - Si es Automático: muestra estado calculado con link a Configuración
3. **Cambia la hora del sistema** (si tienes acceso) o espera a que cambie el horario
4. **Recarga el Dashboard** y verifica que el estado se actualice

---

## 💰 2. Prueba del Cambio de Moneda a CLP

### 2.1 Frontend Web - Dashboard

1. **Inicia sesión** como médico
2. **Ve al Dashboard**
3. **Verifica** que los "Ingresos Totales" y "Ingresos del Mes" se muestren en formato CLP:
   - Formato esperado: `$12.000` o `$15.000` (con puntos como separador de miles)
   - No debe mostrar `$12.50` o `USD`

### 2.2 Frontend Web - Configuración

1. **Ve a Configuración**
2. **Verifica** que las etiquetas digan:
   - "Tarifa Consulta Normal (CLP)" en lugar de "(USD)"
   - "Tarifa Consulta Urgencia (CLP)" en lugar de "(USD)"
3. **Ingresa un valor** (ej: 15000)
4. **Verifica** que se muestre el preview con formato CLP debajo del input

### 2.3 Frontend Web - Ingresos

1. **Ve a Ingresos** (si tienes pagos registrados)
2. **Verifica** que todos los montos se muestren en formato CLP:
   - Montos de pagos
   - Comisiones
   - Totales

### 2.4 App Móvil - Búsqueda de Médicos

1. **Abre la app móvil**
2. **Busca un médico**
3. **Verifica** que los precios se muestren en formato CLP:
   - "Crear Consulta - $15.000" en lugar de "$15.00"
   - Precios de consulta normal y urgencia en formato CLP

### 2.5 App Móvil - Pago

1. **Crea una consulta** como paciente
2. **Ve a la pantalla de pago**
3. **Verifica** que el monto se muestre en formato CLP

---

## 📝 3. Prueba del Formulario de Solicitud de Registro

### 3.1 Enviar Solicitud (Usuario Sin Cuenta)

1. **Ve a la página de login** (frontend web)
2. **Haz clic** en "¿No tienes cuenta? Contacta al administrador"
3. **Verifica** que se abra la página de solicitud de registro
4. **Completa el formulario:**
   - Nombre completo (requerido)
   - RUT (opcional)
   - Especialidad (requerido)
   - Número de registro (opcional)
   - Correo electrónico (requerido)
   - Teléfono (opcional)
   - Clínica/Centro (opcional)
   - Comentarios (opcional)
5. **Envía la solicitud**
6. **Verifica** que aparezca el mensaje de éxito
7. **Verifica** que se redirija al login

### 3.2 Ver Solicitudes (Admin)

1. **Inicia sesión** como administrador
2. **Verifica** que aparezca el menú "Solicitudes de Registro" en el menú lateral
3. **Haz clic** en "Solicitudes de Registro"
4. **Verifica** que se muestre la lista de solicitudes
5. **Verifica** que puedas:
   - Ver todas las solicitudes (o filtrar por estado)
   - Ver detalles de una solicitud (clic en una fila o botón "Ver Detalles")
   - Filtrar por estado (PENDING, REVIEWED, APPROVED, REJECTED, ALL)

### 3.3 Gestionar Solicitudes (Admin)

1. **Abre los detalles** de una solicitud pendiente
2. **Verifica** que se muestre toda la información:
   - Nombre, RUT, Especialidad
   - Email, Teléfono
   - Clínica/Centro
   - Comentarios
   - Estado actual
   - Fecha de solicitud
3. **Aproba una solicitud:**
   - Haz clic en "Aprobar"
   - Verifica que el estado cambie a "Aprobada"
   - Verifica que la solicitud desaparezca del filtro "Pendientes"
4. **Rechaza una solicitud:**
   - Abre otra solicitud pendiente
   - Haz clic en "Rechazar"
   - Verifica que el estado cambie a "Rechazada"

### 3.4 Validaciones

1. **Intenta enviar una solicitud** con el mismo email dos veces
2. **Verifica** que aparezca un error indicando que ya existe una solicitud con ese email
3. **Intenta enviar una solicitud** con campos requeridos vacíos
4. **Verifica** que no se permita enviar sin completar campos requeridos

---

## 🔧 4. Verificación de Integraciones

### 4.1 Backend - Endpoints

Verifica que todos los endpoints nuevos funcionen correctamente usando Swagger UI:

1. **Abre** `https://canalmedico-production.up.railway.app/api-docs`
2. **Prueba los endpoints:**
   - `GET /api/doctors/:id/availability` - Debe retornar disponibilidad calculada
   - `PATCH /api/doctors/:id/availability-settings` - Debe actualizar configuración
   - `POST /api/signup-requests` - Debe crear solicitud
   - `GET /api/signup-requests` - Debe listar solicitudes (requiere auth admin)
   - `PATCH /api/signup-requests/:id/status` - Debe actualizar estado (requiere auth admin)

### 4.2 Disponibilidad Automática en Listado de Médicos

1. **En la app móvil** o usando el endpoint `GET /api/doctors/online`
2. **Verifica** que solo se muestren médicos que estén disponibles:
   - En modo Manual: solo los que tienen `estadoOnline = true`
   - En modo Automático: solo los que están dentro de su horario configurado

### 4.3 Disponibilidad en Tiempo Real

1. **Configura** un médico con disponibilidad automática (ej: Lunes 09:00-18:00)
2. **Verifica** la disponibilidad:
   - Si es Lunes entre 09:00-18:00 → debe estar disponible
   - Si es Lunes fuera de ese horario → no debe estar disponible
   - Si es otro día → no debe estar disponible

---

## ✅ Checklist de Verificación

### Disponibilidad Automática
- [ ] Puedo cambiar entre modo Manual y Automático
- [ ] En modo Manual, puedo activar/desactivar disponibilidad
- [ ] En modo Automático, puedo configurar horarios por día
- [ ] La disponibilidad se calcula correctamente según los horarios
- [ ] El Dashboard muestra el estado actual correcto
- [ ] Solo aparecen disponibles los médicos que cumplen los criterios

### Moneda CLP
- [ ] Dashboard muestra ingresos en formato CLP
- [ ] Configuración muestra tarifas en CLP
- [ ] Todas las pantallas de ingresos muestran CLP
- [ ] App móvil muestra precios en formato CLP
- [ ] No hay referencias a USD en ninguna parte

### Solicitud de Registro
- [ ] Puedo acceder al formulario desde el login
- [ ] Puedo enviar una solicitud correctamente
- [ ] Como admin, puedo ver la lista de solicitudes
- [ ] Como admin, puedo ver detalles de una solicitud
- [ ] Como admin, puedo aprobar/rechazar solicitudes
- [ ] Las validaciones funcionan correctamente
- [ ] No puedo crear solicitudes duplicadas con el mismo email

---

## 🐛 Solución de Problemas

### La disponibilidad no se calcula correctamente

**Problema**: El médico está en modo Automático pero no aparece como disponible cuando debería.

**Solución**:
1. Verifica que los horarios estén configurados correctamente
2. Verifica que el día de la semana sea correcto
3. Verifica que la hora actual esté dentro del rango configurado
4. Revisa los logs del backend para ver errores

### Las tarifas no se muestran en formato CLP

**Problema**: Todavía aparecen en formato USD o sin formatear.

**Solución**:
1. Verifica que el frontend esté actualizado
2. Limpia el caché del navegador
3. Reconstruye el frontend: `npm run build`

### No puedo ver las solicitudes como admin

**Problema**: El menú "Solicitudes de Registro" no aparece.

**Solución**:
1. Verifica que tu usuario tenga el rol ADMIN
2. Cierra sesión y vuelve a iniciar sesión
3. Verifica que la ruta `/admin/signup-requests` esté configurada

### Error al crear solicitud

**Problema**: No puedo enviar una solicitud de registro.

**Solución**:
1. Verifica que todos los campos requeridos estén completos
2. Verifica que el email sea válido
3. Verifica que no exista ya una solicitud con ese email
4. Revisa los logs del backend para ver el error específico

---

## 📊 Resultados Esperados

Después de completar todas las pruebas, deberías tener:

1. ✅ **Disponibilidad Automática** funcionando correctamente
2. ✅ **Moneda CLP** mostrándose en todas las pantallas
3. ✅ **Solicitud de Registro** funcionando end-to-end
4. ✅ **Panel Admin** permitiendo gestionar solicitudes
5. ✅ **Sin errores** en la consola o logs

---

**¡Todo listo para probar!** 🚀

Si encuentras algún problema, revisa los logs del backend y frontend para obtener más detalles.

