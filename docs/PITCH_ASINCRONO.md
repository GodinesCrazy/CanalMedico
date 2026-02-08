# Presentación — CanalMedico (8–10 diapositivas)

## 1) El Problema (Hoy)
- Pacientes escriben al médico por WhatsApp a cualquier hora.
- El médico responde gratis, sin trazabilidad ni cobro formal.
- Coordinar videollamadas crea fricción y baja conversión.
- Riesgos legales y de seguridad (datos, identidad, recetas).

## 2) Nuestra Solución
- Plataforma de consultas asíncronas: de WhatsApp a un flujo profesional y pagado.
- Chat con texto, imágenes, audio y PDFs; pagos con MercadoPago.
- Recetas electrónicas SNRE y verificación oficial del médico (Floid + RNPI).
- Liquidaciones configurables (inmediatas o mensuales) y paneles de control.

## 3) ¿Qué significa “asíncrona”?
- Sin simultaneidad obligatoria: el paciente inicia cuando quiere; el médico responde cuando puede.
- El sistema guarda el hilo, notifica y avanza estados por hitos (PENDING → ACTIVE → COMPLETED).
- Si coinciden, el chat fluye en tiempo real; si no, continúa sin fricción.

## 4) Flujo de Extremo a Extremo
- WhatsApp → auto‑respuesta con link.
- OTP “invisible” → ingreso/creación de cuenta automática.
- Pago (MercadoPago) → consulta pasa a ACTIVE.
- Chat + archivos → receta SNRE si corresponde.
- Cierre y liquidación al médico (inmediata/mensual).

## 5) Beneficios Para el Médico
- Cobro automático y sin fricción (deep links, activación por pago).
- Menos interrupciones: responde en sus ventanas; disponibilidad automática por horarios.
- Recetas SNRE válidas y trazables.
- Validación profesional (identidad + RNPI) y paneles de ingresos/comisiones.

## 6) Beneficios Para el Paciente
- Acceso familiar: entra desde WhatsApp; login por OTP (sin contraseñas).
- Rapidez y claridad: link directo a pago y seguimiento del estado.
- Experiencia completa: síntomas, archivos, historial y notificaciones.
- Confianza: médico verificado; recetas electrónicas válidas en farmacias.

## 7) Diferenciadores Frente a la Competencia
- No invasiva: se integra con hábitos reales (WhatsApp) y canaliza al circuito pagado.
- Onboarding con fricción mínima (OTP + deep links) y mayor conversión.
- Cumplimiento por diseño: SNRE, verificación oficial y prevención de IDOR.
- Operación robusta: health checks, fallback de WhatsApp, jobs de payout, S3, notificaciones.

## 8) Seguridad y Cumplimiento
- Autenticación JWT + blacklist, rate limiting, CORS, validación de datos.
- Propiedad estricta de recursos (IDOR prevention) y logs.
- SNRE (HL7 FHIR), Floid (Registro Civil) y RNPI (Superintendencia).

## 9) Casos de Uso y Métricas
- Repetición de consultas sin coordinación de agenda.
- Tele‑seguimiento post‑consulta y educación.
- Métricas: conversión link→pago, tiempo a primera respuesta, NPS, re‑compras.

## 10) Cierre / Próximos Pasos
- Listo para producción (web + móvil + backend).
- Despliegue rápido en Railway; configuración de variables y credenciales.
- Piloto con médicos seleccionados; iteración con métricas de conversión.

---

Notas para el presentador (sugerencia)
- Resalta “asíncrona” como ventaja competitiva clave: más consultas cerradas y menos fricción.
- Usa ejemplos concretos (receta SNRE, fotos de lesiones, respuesta diferida).
- Enfatiza la validación oficial y la seguridad de datos.
