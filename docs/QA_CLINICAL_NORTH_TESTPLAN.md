# 🧪 QA_CLINICAL_NORTH_TESTPLAN.md

**Plan de Pruebas QA Orientado al Requerimiento Clínico**  
**Fecha:** 2025-01-XX  
**Basado en:** `REQUIREMENTS_CLINICAL_NORTH.md`

---

## 🎯 OBJETIVO

Validar que el sistema cumple el requerimiento principal del médico:
- ✅ El médico deja de perder tiempo en WhatsApp
- ✅ El médico deja de responder gratis
- ✅ El médico recupera control de cuándo, cómo y a quién responde
- ✅ El médico puede cobrar la atención

---

## 📋 CASOS DE PRUEBA

### Flujo 1: Intercepción de WhatsApp (CRÍTICO)

**Precondiciones:**
- Médico tiene WhatsApp Business configurado
- `ENABLE_WHATSAPP_AUTO_RESPONSE=true`

**Pasos:**
1. Paciente escribe a WhatsApp del médico
2. Sistema intercepta mensaje (webhook)
3. Sistema envía auto-respuesta automática
4. Sistema crea `ConsultationAttempt`

**Resultado Esperado:**
- ✅ Médico NO recibe notificación en su teléfono
- ✅ Paciente recibe mensaje automático con link
- ✅ `ConsultationAttempt` creado con status `PENDING`

---

### Flujo 2: Login Invisible (CRÍTICO)

**Precondiciones:**
- Paciente hace clic en link de WhatsApp

**Pasos:**
1. Sistema detecta número de teléfono
2. Sistema envía OTP por WhatsApp
3. Paciente ingresa código
4. Sistema crea cuenta automáticamente (si no existe)
5. Sistema crea consulta automáticamente

**Resultado Esperado:**
- ✅ Login automático sin email/password
- ✅ Consulta creada automáticamente
- ✅ Redirige a pago

---

### Flujo 3: Consulta y Pago

**Precondiciones:**
- Consulta creada (desde Flujo 2)

**Pasos:**
1. Paciente ve pantalla de pago
2. Paciente completa pago en MercadoPago
3. Webhook confirma pago
4. Consulta se activa automáticamente

**Resultado Esperado:**
- ✅ Consulta cambia a estado `ACTIVE`
- ✅ Médico puede ver consulta en panel
- ✅ Paciente puede enviar mensajes

---

## 📊 MATRIZ DE PRUEBAS

| Acción | Usuario | Precondiciones | Resultado Esperado |
|--------|---------|----------------|-------------------|
| Escribir por WhatsApp | Paciente | Médico configurado | Auto-respuesta automática |
| Clic en link | Paciente | Link recibido | Login automático |
| Ingresar OTP | Paciente | OTP recibido | Cuenta creada/autenticada |
| Completar pago | Paciente | Consulta creada | Consulta activa |
| Ver consultas | Médico | Consultas activas | Solo consultas pagadas visibles |

---

## ✅ CRITERIOS DE ÉXITO

- ✅ Todos los flujos críticos funcionan
- ✅ Médico no recibe notificaciones de WhatsApp
- ✅ Paciente completa flujo en < 3 minutos
- ✅ Conversión WhatsApp → Consulta pagada > 60%

---

**Última actualización:** 2025-01-XX

