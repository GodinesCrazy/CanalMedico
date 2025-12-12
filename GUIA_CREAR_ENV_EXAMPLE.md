# ?? Gu�a: C�mo Crear/Actualizar Archivos .env.example

Esta gu�a te explica c�mo crear y actualizar los archivos `.env.example` en el proyecto CanalMedico.

---

## ? Estado Actual

**Los archivos `.env.example` ya existen y han sido actualizados con el contenido completo.**

### Ubicaciones de los archivos:

1. **Backend:** `c:\CanalMedico\backend\.env.example` ?
2. **Frontend Web:** `c:\CanalMedico\frontend-web\.env.example` ?
3. **App M�vil:** `c:\CanalMedico\app-mobile\.env.example` ?

---

## ?? Contenido de Cada Archivo

### 1. Backend (.env.example)

**Ubicaci�n:** `backend/.env.example`

**Variables principales:**
- `NODE_ENV`, `PORT`
- `API_URL`, `FRONTEND_WEB_URL`, `MOBILE_APP_URL`
- `DATABASE_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc.
- `BCRYPT_ROUNDS`, `RATE_LIMIT_*`
- `LOG_LEVEL`

### 2. Frontend Web (.env.example)

**Ubicaci�n:** `frontend-web/.env.example`

**Variables principales:**
- `VITE_API_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY` (opcional)
- `VITE_FIREBASE_*` (opcional)

### 3. App M�vil (.env.example)

**Ubicaci�n:** `app-mobile/.env.example`

**Variables principales:**
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (opcional)
- `EXPO_PUBLIC_FIREBASE_API_KEY` (opcional)

---

## ?? C�mo Verificar que los Archivos Existen

### Opci�n 1: Desde el Explorador de Archivos

1. Abre el explorador de archivos de Windows
2. Navega a:
   - `C:\CanalMedico\backend\`
   - `C:\CanalMedico\frontend-web\`
   - `C:\CanalMedico\app-mobile\`
3. Busca los archivos `.env.example` (pueden estar ocultos, activa "Mostrar archivos ocultos")

### Opci�n 2: Desde PowerShell

```powershell
# Verificar backend
Test-Path "c:\CanalMedico\backend\.env.example"

# Verificar frontend-web
Test-Path "c:\CanalMedico\frontend-web\.env.example"

# Verificar app-mobile
Test-Path "c:\CanalMedico\app-mobile\.env.example"
```

### Opci�n 3: Desde Terminal/CMD

```cmd
# Verificar backend
dir c:\CanalMedico\backend\.env.example

# Verificar frontend-web
dir c:\CanalMedico\frontend-web\.env.example

# Verificar app-mobile
dir c:\CanalMedico\app-mobile\.env.example
```

---

## ?? C�mo Crear los Archivos Manualmente (Si No Existen)

### M�todo 1: Desde el Explorador de Archivos

1. Navega a cada carpeta (`backend`, `frontend-web`, `app-mobile`)
2. Crea un nuevo archivo de texto
3. Ren�mbralo a `.env.example` (incluyendo el punto al inicio)
4. Copia el contenido del archivo correspondiente desde este documento

### M�todo 2: Desde PowerShell

```powershell
# Crear archivo en backend
@"
# Contenido del archivo backend/.env.example
# (copiar desde el archivo actualizado)
"@ | Out-File -FilePath "c:\CanalMedico\backend\.env.example" -Encoding utf8

# Crear archivo en frontend-web
@"
# Contenido del archivo frontend-web/.env.example
# (copiar desde el archivo actualizado)
"@ | Out-File -FilePath "c:\CanalMedico\frontend-web\.env.example" -Encoding utf8

# Crear archivo en app-mobile
@"
# Contenido del archivo app-mobile/.env.example
# (copiar desde el archivo actualizado)
"@ | Out-File -FilePath "c:\CanalMedico\app-mobile\.env.example" -Encoding utf8
```

### M�todo 3: Desde VS Code o tu Editor

1. Abre VS Code en la carpeta del proyecto
2. Crea un nuevo archivo en cada carpeta:
   - `backend/.env.example`
   - `frontend-web/.env.example`
   - `app-mobile/.env.example`
3. Copia el contenido correspondiente

---

## ? Verificaci�n Final

Despu�s de crear/actualizar los archivos, verifica que:

1. ? Los archivos existen en las ubicaciones correctas
2. ? Tienen el contenido completo (no est�n vac�os)
3. ? Est�n en el repositorio (no est�n en .gitignore)

### Verificar que NO est�n en .gitignore

Los archivos `.env.example` **NO deben estar** en `.gitignore` porque son documentaci�n.

Verifica en cada `.gitignore`:
- `backend/.gitignore` - No debe tener `.env.example`
- `frontend-web/.gitignore` - No debe tener `.env.example`
- `app-mobile/.gitignore` - No debe tener `.env.example`

Si est�n bloqueados, agrega esta l�nea al final de cada `.gitignore`:
```
# Permitir .env.example (documentaci�n)
!.env.example
```

---

## ?? Pr�ximos Pasos

Una vez que los archivos `.env.example` est�n creados y actualizados:

1. ? **Commitear los archivos al repositorio:**
   ```bash
   git add backend/.env.example
   git add frontend-web/.env.example
   git add app-mobile/.env.example
   git commit -m "docs: actualizar archivos .env.example con todas las variables"
   ```

2. ? **Usar los archivos como plantilla:**
   - Copiar `.env.example` a `.env` en cada m�dulo
   - Completar con valores reales (nunca commitees `.env`)

3. ? **Documentar en README:**
   - Agregar instrucciones sobre c�mo usar los archivos `.env.example`

---

## ?? Referencias

- Los archivos ya est�n actualizados con el contenido completo
- Ver `CORRECCIONES_APLICADAS_AUDITORIA.md` para m�s detalles
- Ver `INFORME_AUDITORIA_TECNICA_COMPLETA.md` para el contexto completo

---

**Estado:** ? Archivos actualizados y listos para usar
