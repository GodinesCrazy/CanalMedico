# CanalMedico — Modelo de Atención Asíncrona

Este documento explica, en lenguaje claro y orientado a ventas y operación, qué significa que CanalMedico sea una plataforma de consultas médicas asíncronas, por qué importa y cómo se implementa en el producto.

## ¿Qué significa “asíncrona”?
- La atención no exige simultaneidad. El paciente inicia la consulta cuando quiere (texto, fotos, audio, PDFs y pago) y el médico responde cuando está disponible.
- El sistema conserva el hilo, notifica eventos y cambia estados por hitos (PENDING → ACTIVE → COMPLETED) sin depender de una sesión en vivo.
- Si médico y paciente coinciden, el chat fluye en tiempo real; si no, cada parte responde en momentos distintos.

## ¿Por qué es clave para vender?
- Cierra más consultas: elimina la fricción de coordinar agendas/videollamadas.
- Reduce interrupciones: el médico responde en sus ventanas, sin llamadas ni “estar conectado”.
- Formaliza lo informal: canaliza el WhatsApp habitual a un flujo profesional y pagado.
- Trazabilidad y seguridad: todo queda registrado con controles de acceso y propiedad.

## Beneficios para el Médico
- Cobro automático sin fricción: deep link a pago (MercadoPago) y activación automática de la consulta al aprobarse; liquidaciones inmediatas o mensuales.
- Menos interrupciones: disponibilidad manual o automática por horario; responde cuando puede.
- Recetas electrónicas SNRE: emisión integrada y válida en farmacias (HL7 FHIR).
- Validación profesional: identidad (Registro Civil/Floid) y habilitación RNPI.
- Panel y métricas: ingresos, comisiones y consultas centralizadas en web.

## Beneficios para el Paciente
- Acceso sin barreras: entra desde WhatsApp y usa “login invisible” con OTP.
- Rapidez y claridad: link directo a pago y acceso inmediato al chat al confirmarse.
- Experiencia completa: texto, imágenes, audio, PDFs; historial y notificaciones.
- Confianza: médico verificado y recetas SNRE válidas para dispensación en farmacia.

## Flujo de extremo a extremo
1) Paciente escribe por WhatsApp → auto-respuesta con link.
2) OTP por WhatsApp/SMS → ingreso/creación de cuenta automática.
3) Pago en MercadoPago (deep link) → consulta pasa a ACTIVE.
4) Chat asíncrono con archivos; emisión de receta SNRE si procede.
5) Cierre de la consulta y liquidación al médico (inmediata/mensual).

## Comparado con modelos síncronos (videollamada)
- Síncrono: requiere coordinar hora y buena conectividad; mayor no-show y fricción.
- Asíncrono: disponibilidad elástica, mejor conversión (menos pasos) y registro completo.

## Preguntas frecuentes (FAQ)
- ¿Es solo “mensajería”? No: es un flujo clínico completo (pagos, estados, archivos, recetas SNRE), con seguridad y propiedad de datos.
- ¿Qué pasa si ambos están en línea? El chat funciona en tiempo real, sin perder la naturaleza asíncrona del modelo.
- ¿Se pueden enviar documentos/imágenes/audio? Sí, quedan adjuntos a la consulta.
- ¿Las recetas son válidas? Sí, a través de SNRE (integración HL7 FHIR) según la guía MINSAL.
- ¿Cómo se protege la información? Autenticación JWT, rate limiting, CORS, validación y verificación estricta de propiedad (IDOR prevention).

## Garantías técnicas que habilitan lo asíncrono
- Estados de consulta y ownership en API (`consultations`, `messages`, `files`, `payments`).
- Notificaciones push (Firebase) con fallback a eventos en tiempo real (Socket.io).
- Almacenamiento de archivos (S3) y verificación formal (SNRE, RNPI, Registro Civil/Floid).

## Cómo medir impacto (sugerencias)
- Conversión "link de WhatsApp → pago aprobado".
- Tiempo medio a primera respuesta del médico.
- Consultas completadas sin videollamada ni agenda previa.
- Recompras y satisfacción del paciente.

## Documentos relacionados
- Visión y funcionamiento: `COMO_FUNCIONA_CANALMEDICO.md`.
- Resumen general y capacidades: `README.md`.
- Índice y guías de pruebas/despliegue: `INDICE_DOCUMENTACION.md`.
