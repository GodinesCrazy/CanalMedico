# ?? MODELO DE NEGOCIO COMPLETO - CanalMedico

**Versi�n:** 1.1.0  
**Fecha:** Enero 2025  
**Estado:** ? Operativo y Listo para Producci�n

---

## ?? VISI�N GENERAL

CanalMedico es una **plataforma de telemedicina as�ncrona** que conecta m�dicos y pacientes en Chile a trav�s de consultas por chat, creando un mercado digital para atenci�n m�dica de calidad.

### Propuesta de Valor �nica

**Diferencia clave:** Consultas **as�ncronas** (no en tiempo real), permitiendo:
- ? M�dicos atienden cuando pueden (flexibilidad total)
- ? Pacientes consultan sin esperar (env�an mensaje y reciben respuesta)
- ? Precios m�s accesibles que consultas presenciales
- ? Sin necesidad de videollamadas programadas

---

## ?? MODELO DE INGRESOS

### Fuente Principal: Comisi�n por Consulta

**Mec�nica:**
1. Paciente paga la consulta (ej: $20.000 CLP)
2. CanalMedico retiene **15%** como comisi�n ($3.000 CLP)
3. M�dico recibe **85%** ($17.000 CLP)

**Ejemplo Real:**
```
Consulta Normal: $20.000 CLP
??? Comisi�n CanalMedico (15%): $3.000 CLP
??? Pago al M�dico (85%): $17.000 CLP
```

### Sistema Dual de Liquidaciones

**Opci�n 1: Pago Inmediato**
- M�dico recibe el pago 1-2 d�as despu�s de cada consulta
- Ideal para m�dicos que necesitan liquidez constante
- Sin acumulaci�n, transferencia directa

**Opci�n 2: Pago Mensual**
- Los pagos se acumulan durante el mes
- Se liquidan el d�a 5 de cada mes (configurable)
- Ideal para m�dicos que prefieren un pago consolidado
- Reduce costos de transacci�n

**Ventaja del Modelo:**
- Mayor retenci�n de m�dicos (flexibilidad)
- Menor fricci�n en pagos
- Escalable sin intervenci�n manual

---

## ?? ESTRUCTURA DE COSTOS

### Costos Fijos Mensuales

| Concepto | Costo Mensual (CLP) |
|----------|---------------------|
| Hosting (Railway) | $50.000 |
| Base de Datos (PostgreSQL) | $30.000 |
| Almacenamiento (AWS S3) | $20.000 |
| Notificaciones (Firebase) | $10.000 |
| Dominio y SSL | $5.000 |
| **Total Infraestructura** | **$115.000** |

### Costos Variables

| Concepto | Costo por Consulta |
|----------|-------------------|
| Procesamiento de Pago (MercadoPago) | 3.5% del monto |
| Almacenamiento de Archivos | $0.10 por MB |
| Notificaciones Push | $0.01 por notificaci�n |

**Ejemplo:**
- Consulta de $20.000
- Comisi�n recibida: $3.000
- Costo MercadoPago (3.5%): $700
- **Ganancia Neta:** $2.300 por consulta

### Margen Operativo

**Con 500 consultas/mes:**
- Ingresos: $1.500.000 CLP
- Costos fijos: $115.000 CLP
- Costos variables: ~$175.000 CLP (3.5% de $5.000.000)
- **Ganancia Neta:** $1.210.000 CLP
- **Margen:** ~80%

---

## ?? FLUJO DE VALOR

### Flujo Completo del Negocio

```
1. PACIENTE
   ??? Se registra (gratis)
   ??? Busca m�dico
   ??? Crea consulta
   ??? Paga $20.000 CLP

2. CANALMEDICO
   ??? Recibe pago completo
   ??? Retiene 15% ($3.000)
   ??? Activa consulta
   ??? Notifica al m�dico

3. M�DICO
   ??? Recibe notificaci�n
   ??? Atiende consulta (cuando puede)
   ??? Responde por chat
   ??? Cierra consulta

4. LIQUIDACI�N
   ??? Si inmediato: Transfiere $17.000 en 1-2 d�as
   ??? Si mensual: Acumula hasta d�a 5 del mes
```

### Estados y Transiciones

**Estados de Consulta:**
```
PENDING ? PAID ? ACTIVE ? CLOSED
  ?        ?        ?         ?
Creada  Pagada  En Curso  Finalizada
```

**Estados de Pago:**
```
PENDING ? PAID ? LIQUIDATED
  ?        ?          ?
Creado  Confirmado  Transferido
```

---

## ?? PROYECCI�N FINANCIERA

### Escenario Base (A�o 1)

**Supuestos:**
- 100 m�dicos activos
- 5 consultas/m�dico/mes promedio
- 500 consultas/mes total
- Tarifa promedio: $20.000 CLP
- Comisi�n: 15% = $3.000 por consulta

**Ingresos:**
- Mensual: 500 � $3.000 = **$1.500.000 CLP**
- Anual: **$18.000.000 CLP**

**Costos:**
- Fijos: $115.000/mes = $1.380.000/a�o
- Variables: ~$175.000/mes = $2.100.000/a�o
- **Total:** $3.480.000/a�o

**Resultado:**
- **EBITDA:** $14.520.000 CLP/a�o
- **Margen:** 80.7%

### Escenario Crecimiento (A�o 2)

**Supuestos:**
- 500 m�dicos activos
- 10 consultas/m�dico/mes promedio
- 5.000 consultas/mes total
- Tarifa promedio: $22.000 CLP
- Comisi�n: 15% = $3.300 por consulta

**Ingresos:**
- Mensual: 5.000 � $3.300 = **$16.500.000 CLP**
- Anual: **$198.000.000 CLP**

**Costos:**
- Fijos: $200.000/mes (escala) = $2.400.000/a�o
- Variables: ~$1.925.000/mes = $23.100.000/a�o
- **Total:** $25.500.000/a�o

**Resultado:**
- **EBITDA:** $172.500.000 CLP/a�o
- **Margen:** 87.1%

### Escenario Escala (A�o 3)

**Supuestos:**
- 2.000 m�dicos activos
- 20 consultas/m�dico/mes promedio
- 40.000 consultas/mes total
- Tarifa promedio: $25.000 CLP
- Comisi�n: 15% = $3.750 por consulta

**Ingresos:**
- Mensual: 40.000 � $3.750 = **$150.000.000 CLP**
- Anual: **$1.800.000.000 CLP**

**Costos:**
- Fijos: $500.000/mes = $6.000.000/a�o
- Variables: ~$17.500.000/mes = $210.000.000/a�o
- **Total:** $216.000.000/a�o

**Resultado:**
- **EBITDA:** $1.584.000.000 CLP/a�o
- **Margen:** 88%

---

## ?? ESTRATEGIA DE CRECIMIENTO

### Fase 1: Adquisici�n de M�dicos (Meses 1-6)

**Objetivo:** 100 m�dicos activos

**Estrategia:**
- Marketing directo a cl�nicas
- Programas de referidos
- Alianzas con colegios m�dicos
- Eventos y conferencias m�dicas

**Costo por M�dico Adquirido:** $50.000 CLP
**Inversi�n Total:** $5.000.000 CLP

### Fase 2: Adquisici�n de Pacientes (Meses 3-12)

**Objetivo:** 1.000 pacientes activos

**Estrategia:**
- Marketing digital (Google Ads, Facebook)
- Programas de referidos
- Alianzas con farmacias
- Contenido educativo (blog, redes sociales)

**Costo por Paciente Adquirido:** $5.000 CLP
**Inversi�n Total:** $5.000.000 CLP

### Fase 3: Retenci�n y Escala (A�o 2)

**Objetivo:** 500 m�dicos, 5.000 consultas/mes

**Estrategia:**
- Mejora continua de producto
- Programas de fidelizaci�n
- Expansi�n a nuevas especialidades
- Alianzas estrat�gicas

---

## ?? VENTAJAS COMPETITIVAS

### 1. Modelo As�ncrono �nico

**Diferencia clave:** No requiere tiempo espec�fico
- M�dicos atienden cuando pueden
- Pacientes no esperan en l�nea
- Mayor flexibilidad = mayor adopci�n

### 2. Tecnolog�a Propia

- Desarrollo interno = control total
- Sin dependencia de terceros cr�ticos
- Escalabilidad garantizada
- Mejoras r�pidas sin restricciones

### 3. Sistema Dual de Pagos

- Flexibilidad para m�dicos
- Mayor retenci�n
- Diferencia competitiva

### 4. Enfoque Local

- Adaptado a Chile (CLP, RUT, regulaciones)
- Entendimiento del mercado
- Relaciones locales

### 5. Seguridad y Compliance

- Protecci�n de datos implementada
- Validaci�n de propiedad
- Logs de auditor�a
- Cumplimiento normativo

---

## ?? M�TRICAS CLAVE (KPIs)

### M�tricas de Negocio

#### Crecimiento
- **M�dicos Activos:** Total y nuevos por mes
- **Pacientes Activos:** Total y nuevos por mes
- **Consultas Totales:** Por d�a/semana/mes
- **GMV (Gross Merchandise Value):** Valor total de consultas

#### Rentabilidad
- **Comisiones Generadas:** Ingresos de la plataforma
- **Margen Operativo:** % de ganancia
- **CAC (Customer Acquisition Cost):** Costo de adquirir usuario
- **LTV (Lifetime Value):** Valor de por vida del usuario
- **CAC/LTV Ratio:** Debe ser < 0.33 (3:1)

#### Calidad
- **Tasa de Conversi�n:** % de consultas que se pagan
- **Tiempo Promedio de Respuesta:** Por tipo de consulta
- **Tasa de Cierre:** % de consultas cerradas exitosamente
- **Satisfacci�n del Usuario:** NPS (Net Promoter Score)

### Dashboard de M�tricas

El sistema incluye dashboards en tiempo real para:
- **Admin:** M�tricas globales, comisiones, actividad
- **M�dicos:** Estad�sticas personales, ingresos, consultas
- **Pacientes:** Historial, consultas activas

---

## ?? RIESGOS Y MITIGACI�N

### Riesgos Identificados

#### 1. Regulatorio
**Riesgo:** Cambios en regulaci�n de telemedicina  
**Mitigaci�n:** 
- Cumplimiento proactivo
- Asesor�a legal continua
- Relaciones con autoridades

#### 2. Competencia
**Riesgo:** Entrada de competidores grandes  
**Mitigaci�n:**
- Ventaja de primer movedor
- Tecnolog�a propia
- Foco en experiencia de usuario

#### 3. Adopci�n
**Riesgo:** Baja adopci�n de m�dicos o pacientes  
**Mitigaci�n:**
- Marketing agresivo
- Programas de incentivos
- Alianzas estrat�gicas

#### 4. Tecnol�gico
**Riesgo:** Fallos del sistema o seguridad  
**Mitigaci�n:**
- Infraestructura robusta
- Monitoreo 24/7
- Backups autom�ticos
- Seguridad implementada

---

## ?? ROADMAP ESTRAT�GICO

### Q1 2025: Lanzamiento ?
- ? Plataforma 100% funcional
- ? Pruebas completas
- ? Documentaci�n
- ?? Lanzamiento oficial

### Q2 2025: Crecimiento
- ?? 100 m�dicos activos
- ?? 1.000 pacientes activos
- ?? 500 consultas/mes
- ?? Marketing y adquisici�n

### Q3 2025: Escala
- ?? 300 m�dicos activos
- ?? 3.000 pacientes activos
- ?? 2.000 consultas/mes
- ?? Alianzas estrat�gicas

### Q4 2025: Dominancia
- ?? 500 m�dicos activos
- ?? 5.000 pacientes activos
- ?? 5.000 consultas/mes
- ?? Expansi�n a nuevas especialidades

### 2026: Expansi�n
- ?? Apps nativas
- ?? Integraci�n FONASA
- ?? Expansi�n regional
- ?? Nuevas funcionalidades

---

## ?? PROPUESTA DE VALOR PARA INVERSIONISTAS

### �Por qu� invertir en CanalMedico?

1. **Mercado en Crecimiento**
   - Telemedicina creciendo 25-30% anual
   - Baja penetraci�n actual (<5%)
   - Regulaci�n favorable

2. **Modelo Escalable**
   - Bajo costo marginal por consulta
   - Altos m�rgenes (80%+)
   - Tecnolog�a propia

3. **Ventaja Competitiva**
   - Modelo as�ncrono �nico
   - Tecnolog�a desarrollada
   - Primer movedor

4. **Equipo y Ejecuci�n**
   - Producto 100% funcional
   - Listo para producci�n
   - Roadmap claro

5. **Proyecci�n de Retorno**
   - Ingresos proyectados: $1.800M CLP a�o 3
   - Margen objetivo: 88%
   - ROI atractivo

---

## ?? CONTACTO

**Para m�s informaci�n sobre el modelo de negocio:**

?? **Email**: negocio@canalmedico.cl  
?? **Tel�fono**: +56 9 XXXX XXXX  
?? **Web**: https://canalmedico.cl  

---

## ? CONCLUSI�N

**CanalMedico representa una oportunidad �nica:**

? **Mercado grande y en crecimiento**  
? **Modelo de negocio probado y escalable**  
? **Tecnolog�a 100% funcional**  
? **Ventaja competitiva clara**  
? **Proyecci�n de retorno atractiva**  

**El momento es ahora. La telemedicina as�ncrona es el futuro de la atenci�n m�dica en Chile.**

---

**CanalMedico - Modelo de Negocio Completo**  
**Enero 2025**
