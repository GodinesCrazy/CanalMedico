# ?? Instrucciones: Crear/Actualizar Archivos .env.example

## ? Los archivos YA EXISTEN pero necesitan actualizarse

Los archivos `.env.example` ya existen en:
- `backend/.env.example`
- `frontend-web/.env.example`
- `app-mobile/.env.example`

Pero tienen contenido desactualizado. Sigue estas instrucciones para actualizarlos.

---

## ?? M�TODO RECOMENDADO: Desde VS Code

### Paso 1: Abrir los archivos en VS Code

1. Abre VS Code en la carpeta `C:\CanalMedico`
2. Abre cada archivo:
   - `backend/.env.example`
   - `frontend-web/.env.example`
   - `app-mobile/.env.example`

### Paso 2: Reemplazar el contenido

Copia y pega el contenido correspondiente de abajo en cada archivo.

---

## ?? CONTENIDO PARA `backend/.env.example`

Copia TODO este contenido y reemplaza el contenido actual del archivo:

```env
# ============================================
# CanalMedico Backend - Variables de Entorno
# ============================================
# Copia este archivo a .env y completa con tus valores reales
# NUNCA commitees el archivo .env con valores reales

# ============================================
# ENTORNO
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# URLs
# ============================================
# URL completa del backend (ej: https://canalmedico-production.up.railway.app)
API_URL=http://localhost:3000

# URLs de frontends (para CORS y redirects)
FRONTEND_WEB_URL=http://localhost:5173
MOBILE_APP_URL=http://localhost:8081

# ============================================
# BASE DE DATOS
# ============================================
# PostgreSQL connection string
# Formato: postgresql://usuario:password@host:puerto/database?schema=public
# Desarrollo local: postgresql://postgres:password@localhost:5432/canalmedico?schema=public
# Railway: Usa la variable ${{Postgres.DATABASE_URL}}
DATABASE_URL=postgresql://usuario:password@localhost:5432/canalmedico?schema=public

# ============================================
# AUTENTICACI�N JWT
# ============================================
# Genera secrets seguros con: openssl rand -base64 32
# IMPORTANTE: En producci�n usa secrets de al menos 32 caracteres
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_aqui_cambiar_en_produccion
JWT_REFRESH_SECRET=tu_jwt_refresh_secret_minimo_32_caracteres_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# PAGOS - MERCADOPAGO
# ============================================
# Obt�n estas credenciales desde el dashboard de MercadoPago
# https://www.mercadopago.cl/developers/panel
# IMPORTANTE: En producci�n usa credenciales reales, no de test
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_aqui
# Opcional: Secret para validar webhooks (recomendado en producci�n)
MERCADOPAGO_WEBHOOK_SECRET=

# ============================================
# PAGOS - STRIPE (Opcional - No usado actualmente)
# ============================================
# Si planeas usar Stripe en el futuro
STRIPE_SECRET_KEY=sk_test_temporal_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_temporal_placeholder
STRIPE_WEBHOOK_SECRET=
STRIPE_COMMISSION_FEE=0.15

# ============================================
# ALMACENAMIENTO - AWS S3
# ============================================
# Credenciales de AWS para almacenar archivos (im�genes, PDFs, audio)
# Crea un bucket en AWS S3 y obt�n las credenciales
# IMPORTANTE: En producci�n usa credenciales reales
AWS_ACCESS_KEY_ID=AKIA_TU_ACCESS_KEY_AQUI
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET=canalmedico-files

# ============================================
# NOTIFICACIONES - FIREBASE
# ============================================
# Opcional: Para notificaciones push
FIREBASE_SERVER_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# ============================================
# SEGURIDAD
# ============================================
# Rondas de bcrypt para hash de contrase�as (10 es un buen balance)
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
# Opcional: Ruta a archivo de log (ej: ./logs/app.log)
LOG_FILE=
```

---

## ?? CONTENIDO PARA `frontend-web/.env.example`

Copia TODO este contenido y reemplaza el contenido actual del archivo:

```env
# ============================================
# CanalMedico Frontend Web - Variables de Entorno
# ============================================
# Copia este archivo a .env y completa con tus valores reales
# NUNCA commitees el archivo .env con valores reales

# ============================================
# API BACKEND
# ============================================
# URL completa del backend API
# Desarrollo: http://localhost:3000
# Producci�n: https://canalmedico-production.up.railway.app
VITE_API_URL=http://localhost:3000

# ============================================
# PAGOS - STRIPE (Opcional - No usado actualmente)
# ============================================
# Si planeas usar Stripe en el futuro
VITE_STRIPE_PUBLISHABLE_KEY=

# ============================================
# NOTIFICACIONES - FIREBASE (Opcional)
# ============================================
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

---

## ?? CONTENIDO PARA `app-mobile/.env.example`

Copia TODO este contenido y reemplaza el contenido actual del archivo:

```env
# ============================================
# CanalMedico App M�vil - Variables de Entorno
# ============================================
# Para Expo, estas variables deben configurarse en app.json o como EXPO_PUBLIC_*
# Ver documentaci�n de Expo para m�s detalles
# https://docs.expo.dev/guides/environment-variables/

# ============================================
# API BACKEND
# ============================================
# URL completa del backend API
# Desarrollo: http://localhost:3000
# Producci�n: https://canalmedico-production.up.railway.app
# NOTA: En Expo, las variables deben empezar con EXPO_PUBLIC_
EXPO_PUBLIC_API_URL=http://localhost:3000

# ============================================
# PAGOS - STRIPE (Opcional - No usado actualmente)
# ============================================
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ============================================
# NOTIFICACIONES - FIREBASE (Opcional)
# ============================================
EXPO_PUBLIC_FIREBASE_API_KEY=
```

---

## ?? M�TODO ALTERNATIVO: Desde PowerShell

Si prefieres usar PowerShell, ejecuta estos comandos:

### Para Backend:

```powershell
$content = @"
# ============================================
# CanalMedico Backend - Variables de Entorno
# ============================================
# ... (copia TODO el contenido de arriba para backend)
"@

$content | Out-File -FilePath "c:\CanalMedico\backend\.env.example" -Encoding utf8 -NoNewline
```

### Para Frontend Web:

```powershell
$content = @"
# ============================================
# CanalMedico Frontend Web - Variables de Entorno
# ============================================
# ... (copia TODO el contenido de arriba para frontend-web)
"@

$content | Out-File -FilePath "c:\CanalMedico\frontend-web\.env.example" -Encoding utf8 -NoNewline
```

### Para App M�vil:

```powershell
$content = @"
# ============================================
# CanalMedico App M�vil - Variables de Entorno
# ============================================
# ... (copia TODO el contenido de arriba para app-mobile)
"@

$content | Out-File -FilePath "c:\CanalMedico\app-mobile\.env.example" -Encoding utf8 -NoNewline
```

---

## ? Verificaci�n

Despu�s de actualizar los archivos, verifica que:

1. ? Los archivos tienen el contenido completo (no est�n vac�os)
2. ? Tienen todas las variables documentadas
3. ? Los comentarios est�n incluidos

### Verificar desde PowerShell:

```powershell
# Ver contenido de backend
Get-Content "c:\CanalMedico\backend\.env.example" | Select-Object -First 10

# Ver contenido de frontend-web
Get-Content "c:\CanalMedico\frontend-web\.env.example" | Select-Object -First 10

# Ver contenido de app-mobile
Get-Content "c:\CanalMedico\app-mobile\.env.example" | Select-Object -First 10
```

---

## ?? Notas Importantes

1. **Los archivos `.env.example` NO deben contener valores reales** - Solo ejemplos y placeholders
2. **NUNCA commitees archivos `.env`** - Solo `.env.example` debe estar en el repositorio
3. **Los archivos `.env.example` deben estar en el repositorio** - Son documentaci�n

---

## ?? Resumen

**Ubicaciones:**
- `backend/.env.example` - Variables del backend
- `frontend-web/.env.example` - Variables del frontend web
- `app-mobile/.env.example` - Variables de la app m�vil

**Acci�n requerida:**
1. Abrir cada archivo en VS Code
2. Reemplazar el contenido con el contenido de arriba
3. Guardar los archivos
4. Verificar que se guardaron correctamente

---

**�Listo!** Una vez actualizados, los archivos estar�n completos y documentados. ??
