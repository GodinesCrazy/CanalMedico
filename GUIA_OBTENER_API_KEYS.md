# ðŸ”‘ GuÃ­a Completa: CÃ³mo Obtener las API Keys Necesarias

**Fecha:** 2025-12-12  
**VersiÃ³n:** 1.0.0

---

## ðŸ“‹ Resumen de APIs Necesarias

Para el sistema de validaciÃ³n de doctores en CanalMedico, necesitas las siguientes APIs:

| API | PropÃ³sito | Estado | Prioridad |
|-----|-----------|--------|-----------|
| **Floid** | ValidaciÃ³n de identidad (Registro Civil) | Requiere contacto comercial | ðŸ”´ Alta |
| **RNPI** | ValidaciÃ³n profesional (Superintendencia de Salud) | No hay API pÃºblica | ðŸŸ¡ Media |
| **SNRE** | Recetas electrÃ³nicas (opcional) | Requiere registro | ðŸŸ¢ Baja |

---

## 1. ðŸ”´ Floid API - ValidaciÃ³n de Identidad (Registro Civil)

### Â¿QuÃ© es Floid?
Floid es un servicio que permite validar RUN/RUT contra el Registro Civil de Chile de forma automatizada. Valida:
- Existencia del RUN
- Nombre completo
- Fecha de nacimiento
- Estado de la cÃ©dula de identidad

### Â¿CÃ³mo obtener la API Key?

#### Paso 1: Contactar a Floid
1. **Visita el sitio web:** https://www.floid.io
2. **SecciÃ³n de contacto:** Busca "Contacto" o "Solicitar Demo"
3. **InformaciÃ³n a solicitar:**
   - Acceso a la API de Registro Civil
   - Plan de precios
   - DocumentaciÃ³n tÃ©cnica
   - API Key para desarrollo/producciÃ³n

#### Paso 2: Proceso de Registro
1. **Completa el formulario** en su sitio web
2. **Especifica tu caso de uso:**
   - "ValidaciÃ³n de identidad para plataforma mÃ©dica"
   - "VerificaciÃ³n de RUN de doctores en Chile"
   - "Volumen estimado de consultas"
3. **Espera respuesta del equipo comercial** (generalmente 1-3 dÃ­as hÃ¡biles)

#### Paso 3: Obtener Credenciales
Una vez aprobado, recibirÃ¡s:
- **API Key** (ej: `floid_live_abc123xyz...`)
- **Base URL** (ej: `https://api.floid.cl/v1`)
- **DocumentaciÃ³n tÃ©cnica**
- **LÃ­mites de uso** (requests por minuto/dÃ­a)

#### Paso 4: Configurar en Railway
Una vez tengas las credenciales:
```
FLOID_BASE_URL = https://api.floid.cl/v1
FLOID_API_KEY = tu_api_key_aqui
FLOID_TIMEOUT_MS = 10000
IDENTITY_VERIFICATION_PROVIDER = FLOID
```

### âš ï¸ Alternativas a Floid
Si Floid no estÃ¡ disponible o es muy costoso, puedes considerar:
- **Otros proveedores de validaciÃ³n de identidad en Chile**
- **Contactar directamente al Registro Civil** (puede ser mÃ¡s complejo)
- **Usar valores temporales** mientras obtienes la API real

---

## 2. ðŸŸ¡ RNPI API - ValidaciÃ³n Profesional (Superintendencia de Salud)

### Â¿QuÃ© es RNPI?
El Registro Nacional de Prestadores Individuales (RNPI) es el registro oficial de profesionales de salud habilitados en Chile. Valida:
- Si el profesional estÃ¡ registrado
- ProfesiÃ³n (debe ser "MÃ©dico Cirujano")
- Estado (debe estar "Habilitado")
- Especialidades registradas

### âš ï¸ Problema: No hay API PÃºblica
La Superintendencia de Salud **NO ofrece una API pÃºblica** para consultar el RNPI. Solo tienen:
- **Consulta web:** https://www.supersalud.gob.cl/servicios/576/w3-article-5587.html
- **BÃºsqueda manual** por nombre o RUN

### Soluciones Posibles

#### OpciÃ³n 1: Contactar a la Superintendencia de Salud (Recomendado)
1. **Contacto oficial:**
   - **Email:** contacto@supersalud.gob.cl
   - **TelÃ©fono:** 600 600 3600
   - **Sitio web:** https://www.supersalud.gob.cl

2. **Solicitud a realizar:**
   ```
   Asunto: Solicitud de acceso a API o datos masivos del RNPI
   
   Estimados,
   
   Somos [Tu Empresa], desarrolladores de CanalMedico, una plataforma 
   de telemedicina en Chile. Necesitamos validar automÃ¡ticamente que 
   los mÃ©dicos registrados en nuestra plataforma estÃ©n habilitados en 
   el RNPI.
   
   Â¿Existe alguna forma de:
   - Acceder a una API del RNPI?
   - Obtener un archivo actualizado periÃ³dicamente?
   - Realizar consultas automatizadas?
   
   Gracias por su atenciÃ³n.
   ```

3. **Espera respuesta** (puede tardar 1-2 semanas)

#### OpciÃ³n 2: Web Scraping (Temporal, no recomendado para producciÃ³n)
- **Ventaja:** Funciona inmediatamente
- **Desventaja:** FrÃ¡gil, puede romperse si cambian el sitio web
- **Legalidad:** Verificar tÃ©rminos de uso del sitio

#### OpciÃ³n 3: Usar valores temporales (Para desarrollo)
Mientras obtienes acceso real, puedes usar:
```
RNPI_API_URL = https://api.supersalud.gob.cl/prestadores
RNPI_API_KEY = public (o dejar vacÃ­o)
RNPI_TIMEOUT_MS = 15000
```

**Nota:** El sistema funcionarÃ¡, pero las validaciones reales no se ejecutarÃ¡n hasta tener acceso real.

---

## ðŸ“ Plan de AcciÃ³n Recomendado

### Fase 1: Inmediato (Para que el sistema funcione)
1. âœ… **Configurar valores temporales** en Railway
2. âœ… **El sistema funcionarÃ¡** pero las validaciones reales estarÃ¡n deshabilitadas

### Fase 2: Corto Plazo (1-2 semanas)
1. ðŸ“§ **Contactar a Floid:** Enviar solicitud comercial
2. ðŸ“§ **Contactar a Superintendencia de Salud:** Enviar solicitud formal

### Fase 3: Mediano Plazo (1-2 meses)
1. âœ… **Obtener API Key de producciÃ³n de Floid**
2. âœ… **Implementar soluciÃ³n para RNPI**
3. âœ… **Actualizar variables en Railway** con valores reales

---

## ðŸ”§ ConfiguraciÃ³n Temporal en Railway

Mientras obtienes las API Keys reales, puedes configurar estos valores temporales:

### Variables MÃ­nimas Requeridas:
```
FLOID_BASE_URL = https://api.floid.cl/v1
FLOID_API_KEY = temp_floid_key_12345
FLOID_TIMEOUT_MS = 10000
IDENTITY_VERIFICATION_PROVIDER = FLOID

RNPI_API_URL = https://api.supersalud.gob.cl/prestadores
RNPI_TIMEOUT_MS = 15000
```

---

## ðŸ“ž Contactos Importantes

### Floid
- **Sitio web:** https://www.floid.io
- **Contacto:** A travÃ©s del formulario en su sitio web

### Superintendencia de Salud
- **Sitio web:** https://www.supersalud.gob.cl
- **Email:** contacto@supersalud.gob.cl
- **TelÃ©fono:** 600 600 3600
- **RNPI Web:** https://www.supersalud.gob.cl/servicios/576/w3-article-5587.html

---

## âœ… Checklist de ConfiguraciÃ³n

### Para Desarrollo/Testing:
- [ ] Configurar valores temporales en Railway
- [ ] Verificar que el servidor inicia correctamente
- [ ] Probar endpoints de validaciÃ³n (fallarÃ¡n pero no crashearÃ¡n)

### Para ProducciÃ³n:
- [ ] Contactar a Floid y obtener API Key real
- [ ] Contactar a Superintendencia de Salud
- [ ] Obtener acceso a RNPI (API, scraping, o archivo)
- [ ] Actualizar variables en Railway con valores reales
- [ ] Probar validaciones end-to-end con datos reales

---

**Ãšltima actualizaciÃ³n:** 2025-12-12
