# GuÃ­a: Configurar Variables en Railway para ValidaciÃ³n de Doctores

## Variables a Configurar

### 1. Floid (Registro Civil)
- FLOID_BASE_URL = https://api.floid.cl/v1
- FLOID_API_KEY = temp_floid_key_12345
- FLOID_TIMEOUT_MS = 10000
- IDENTITY_VERIFICATION_PROVIDER = FLOID

### 2. RNPI (Superintendencia de Salud)
- RNPI_API_URL = https://api.supersalud.gob.cl/prestadores
- RNPI_TIMEOUT_MS = 15000

## Pasos en Railway

1. Ve a Railway â†’ Tu Proyecto â†’ Servicio canalmedico-api
2. Haz clic en pestaÃ±a "Variables"
3. Agrega cada variable una por una:
   - Haz clic en "New Variable"
   - Ingresa el Nombre
   - Ingresa el Valor
   - Haz clic en "Add" o "Save"
4. Repite para todas las 6 variables
5. Espera 1-2 minutos a que Railway reinicie el servidor

## Verificar

1. Ve a pestaÃ±a "Deployments" y verifica que hay un nuevo deployment
2. Revisa los logs para asegurarte de que no hay errores
3. Prueba en Swagger UI: GET /api/seed/verify-validation

## Nota

Estos son valores temporales. Cuando obtengas las API Keys reales, reemplÃ¡zalas.
