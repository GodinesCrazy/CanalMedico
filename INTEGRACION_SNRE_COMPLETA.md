# ?? Integraci�n SNRE - Sistema Nacional de Receta Electr�nica

**Versi�n:** 1.1.0  
**Fecha:** Enero 2025  
**Estado:** ? Implementaci�n Completa

---

## ?? RESUMEN

Se ha integrado exitosamente el **Sistema Nacional de Receta Electr�nica (SNRE)** de Chile en CanalMedico, permitiendo a los m�dicos emitir recetas electr�nicas formales e interoperables con farmacias en todo Chile, usando el est�ndar **HL7 FHIR R4** seg�n la Gu�a de Implementaci�n del MINSAL.

---

## ? COMPONENTES IMPLEMENTADOS

### 1. Backend - M�dulo SNRE

#### Archivos Creados:
- `backend/src/modules/snre/snre.types.ts` - Tipos TypeScript para SNRE
- `backend/src/modules/snre/snre-client.ts` - Cliente para API FHIR del SNRE
- `backend/src/modules/snre/snre-mapper.ts` - Mapper de datos CanalMedico ? FHIR
- `backend/src/modules/snre/snre.service.ts` - Servicio de negocio para recetas
- `backend/src/modules/snre/snre.controller.ts` - Controlador de endpoints
- `backend/src/modules/snre/snre.routes.ts` - Rutas de la API

#### Funcionalidades:
- ? Creaci�n de recetas electr�nicas
- ? Mapeo autom�tico a recursos FHIR (Patient, Practitioner, MedicationRequest, Composition)
- ? Env�o al SNRE con manejo de errores
- ? Consulta de recetas por ID y por consulta
- ? Validaci�n de propiedad (m�dico/paciente)
- ? Estados de receta (PENDIENTE_ENVIO_SNRE, ENVIADA_SNRE, ERROR_SNRE, ANULADA_SNRE)

### 2. Base de Datos

#### Modelos Agregados:
- `Prescription` - Recetas electr�nicas
- `PrescriptionItem` - Items de medicamentos en recetas

#### Campos Agregados a Patient:
- `rut` - RUT del paciente (necesario para SNRE)
- `birthDate` - Fecha de nacimiento
- `gender` - G�nero
- `address` - Direcci�n

#### Migraci�n SQL:
- `MIGRACION_SNRE.sql` - Script completo de migraci�n

### 3. Frontend Web (M�dicos)

#### Componentes Creados:
- `frontend-web/src/components/PrescriptionModal.tsx` - Modal para crear recetas

#### Actualizaciones:
- `frontend-web/src/pages/ChatPage.tsx` - Bot�n "Emitir Receta SNRE" y visualizaci�n de recetas
- `frontend-web/src/types/index.ts` - Tipos TypeScript para recetas

#### Funcionalidades UI:
- ? Formulario completo para crear recetas
- ? M�ltiples medicamentos por receta
- ? Campos: nombre, c�digo TFC, presentaci�n, dosis, frecuencia, duraci�n, cantidad, instrucciones
- ? Visualizaci�n de recetas existentes
- ? Estados visuales (enviada, error, pendiente)

### 4. Variables de Entorno

Agregadas a `backend/src/config/env.ts`:
- `SNRE_BASE_URL` - URL base de la API FHIR del SNRE
- `SNRE_API_KEY` - API Key para autenticaci�n
- `SNRE_CLIENT_ID` - Client ID (si usa OAuth2)
- `SNRE_CLIENT_SECRET` - Client Secret (si usa OAuth2)
- `SNRE_ENVIRONMENT` - Ambiente (sandbox/production)

---

## ?? CONFIGURACI�N

### Variables de Entorno Requeridas

```env
# SNRE Configuration
SNRE_BASE_URL=https://snre-sandbox.minsal.cl/fhir  # URL del SNRE (sandbox o producci�n)
SNRE_API_KEY=tu_api_key_aqui  # API Key proporcionada por MINSAL
SNRE_ENVIRONMENT=sandbox  # o 'production'
```

### C�mo Obtener Credenciales SNRE

1. **Contactar al MINSAL:**
   - Email: snre@minsal.cl
   - Solicitar acceso a la API FHIR del SNRE
   - Proporcionar informaci�n de CanalMedico (RUT, nombre, etc.)

2. **Ambiente Sandbox:**
   - Para pruebas y desarrollo
   - Credenciales de prueba proporcionadas por MINSAL

3. **Ambiente Producci�n:**
   - Requiere certificaci�n y aprobaci�n del MINSAL
   - Credenciales de producci�n despu�s de la certificaci�n

---

## ?? ENDPOINTS API

### POST `/api/prescriptions`
Crea una nueva receta electr�nica y la env�a al SNRE.

**Request:**
```json
{
  "consultationId": "consulta-id",
  "medications": [
    {
      "medicationName": "Paracetamol",
      "tfcCode": "TFC-12345",
      "presentation": "Tabletas 500mg",
      "dosage": "1 tableta",
      "frequency": "cada 8 horas",
      "duration": "7 d�as",
      "quantity": "21 tabletas",
      "instructions": "Tomar con alimentos"
    }
  ],
  "recetaType": "simple",
  "notes": "Notas adicionales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prescription-id",
    "status": "ENVIADA_SNRE",
    "snreId": "snre-id",
    "snreCode": "REC-123456",
    "snreBundleId": "bundle-id",
    "prescriptionItems": [...]
  }
}
```

### GET `/api/prescriptions/:id`
Obtiene una receta por ID.

### GET `/api/consultations/:consultationId/prescriptions`
Obtiene todas las recetas de una consulta.

---

## ?? FLUJO DE USO

### Para M�dicos:

1. **Abrir consulta activa** en el chat
2. **Hacer clic en "Emitir Receta SNRE"**
3. **Completar formulario:**
   - Agregar medicamentos (nombre, dosis, frecuencia, etc.)
   - Opcional: c�digo TFC, presentaci�n, instrucciones
4. **Confirmar emisi�n**
5. **Sistema autom�ticamente:**
   - Construye Bundle FHIR
   - Env�a al SNRE
   - Guarda respuesta
   - Muestra estado (�xito/error)

### Para Pacientes:

1. **Ver recetas** en la pantalla de chat de la consulta
2. **Ver c�digo SNRE** si la receta fue enviada exitosamente
3. **Usar c�digo en farmacia** para dispensar medicamentos

---

## ??? ARQUITECTURA FHIR

### Recursos FHIR Creados:

1. **Bundle** (Documento completo)
   - Tipo: `document`
   - Contiene todos los recursos

2. **Composition** (Receta)
   - Perfil: `RecetaPrescripcionCl`
   - Referencias a Patient, Practitioner, MedicationRequests

3. **Patient**
   - Perfil: `Core-CL Patient`
   - Identificador: RUT chileno
   - Sistema: `http://www.registrocivil.cl/RUT`

4. **Practitioner** (M�dico)
   - Perfil: `Core-CL Practitioner`
   - Identificador: RUT + n�mero de registro profesional

5. **MedicationRequest** (Prescripciones)
   - Uno por cada medicamento
   - C�digos: TFC, SNOMED-CT
   - Dosificaci�n completa

### Terminolog�as Utilizadas:

- **TFC** (Terminolog�a Farmac�utica Chilena) - Para medicamentos
- **SNOMED-CT** - Para medicamentos y especialidades
- **RUT** - Sistema de identificaci�n chileno

---

## ?? VALIDACIONES Y REQUISITOS

### Validaciones Implementadas:

1. **M�dico debe tener RUT** registrado
2. **Paciente debe tener RUT** registrado
3. **Consulta debe estar ACTIVA o CERRADA**
4. **M�dico debe ser due�o de la consulta**
5. **Al menos un medicamento** con nombre, dosis y frecuencia

### Manejo de Errores:

- **401/403:** Error de autenticaci�n ? Verificar credenciales SNRE
- **400:** Error de validaci�n ? Revisar datos de la receta
- **500:** Error del servidor SNRE ? Reintentar m�s tarde
- **Timeout:** Error de red ? Verificar conexi�n

---

## ?? ESTADOS DE RECETA

| Estado | Descripci�n |
|--------|-------------|
| `PENDIENTE_ENVIO_SNRE` | Receta creada localmente, pendiente de env�o |
| `ENVIADA_SNRE` | Receta enviada exitosamente al SNRE |
| `ERROR_SNRE` | Error al enviar al SNRE (ver errorMessage) |
| `ANULADA_SNRE` | Receta anulada (futuro) |

---

## ?? PRUEBAS

### Pruebas Unitarias (Pendientes):
- Mapper FHIR (conversi�n de datos)
- Cliente SNRE (mocks)

### Pruebas de Integraci�n:
1. Crear receta desde frontend
2. Verificar que se env�a al SNRE (sandbox)
3. Verificar respuesta y guardado en BD
4. Consultar receta desde frontend

### Pruebas E2E:
1. M�dico emite receta en consulta activa
2. Sistema env�a al SNRE
3. Paciente ve receta con c�digo SNRE
4. Verificar que c�digo funciona en farmacia (prueba manual)

---

## ?? DOCUMENTACI�N ADICIONAL

### Manual del M�dico:
- Secci�n: "Emitir Recetas Electr�nicas SNRE"
- Explicaci�n del proceso paso a paso
- Qu� es el SNRE y por qu� es importante

### Manual del Paciente:
- Secci�n: "Recetas Electr�nicas"
- C�mo ver sus recetas
- C�mo usar el c�digo SNRE en la farmacia

### Manual del Administrador:
- Secci�n: "Monitoreo de Recetas SNRE"
- C�mo ver logs de errores
- Qu� hacer si SNRE est� ca�do

---

## ?? PR�XIMOS PASOS

### Para Producci�n:

1. **Obtener credenciales reales del MINSAL**
2. **Configurar variables de entorno en Railway**
3. **Probar en ambiente sandbox del MINSAL**
4. **Certificaci�n con MINSAL (si es requerida)**
5. **Cambiar a ambiente producci�n**

### Mejoras Futuras:

- [ ] Cat�logo de medicamentos con c�digos TFC pre-cargados
- [ ] B�squeda de medicamentos por nombre ? c�digo TFC autom�tico
- [ ] Anulaci�n de recetas
- [ ] Consulta de estado de dispensaci�n
- [ ] Integraci�n con portal "Mis Recetas" del MINSAL
- [ ] Notificaciones cuando receta es dispensada

---

## ?? SEGURIDAD

- ? Validaci�n de propiedad (m�dico/paciente solo ven sus recetas)
- ? Autenticaci�n JWT requerida
- ? HTTPS obligatorio para comunicaci�n con SNRE
- ? Logs de auditor�a de todas las operaciones
- ? Manejo seguro de errores (no expone informaci�n sensible)

---

## ?? SOPORTE

Para problemas con la integraci�n SNRE:

1. **Revisar logs del backend** (`logger.info/error`)
2. **Verificar variables de entorno**
3. **Probar conectividad con SNRE** (health check)
4. **Contactar soporte MINSAL** si el problema es del SNRE

---

## ? CHECKLIST DE IMPLEMENTACI�N

- [x] Modelo de datos (Prisma)
- [x] Migraci�n SQL
- [x] Cliente SNRE (FHIR)
- [x] Mapper FHIR
- [x] Servicio de negocio
- [x] Controlador y rutas
- [x] Variables de entorno
- [x] UI Frontend (m�dico)
- [x] Visualizaci�n (paciente)
- [x] Validaciones
- [x] Manejo de errores
- [x] Documentaci�n
- [ ] Pruebas unitarias
- [ ] Pruebas de integraci�n
- [ ] Pruebas E2E
- [ ] Credenciales SNRE reales
- [ ] Certificaci�n MINSAL (producci�n)

---

**Integraci�n SNRE completada y lista para pruebas en ambiente sandbox.**
