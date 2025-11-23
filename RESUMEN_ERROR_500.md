# ⚡ Resumen Rápido: Solucionar Error 500 en Login

## 🔥 Solución Rápida (2 minutos)

### 1️⃣ Crear Usuarios de Prueba

**Opción A - Desde Swagger (Más Fácil):**
1. Abre: `https://canalmedico-production.up.railway.app/api-docs`
2. Busca: `POST /api/seed`
3. Haz clic en "Try it out" → "Execute"
4. ✅ Debería crear los usuarios automáticamente

**Opción B - Desde cURL:**
```bash
curl -X POST https://canalmedico-production.up.railway.app/api/seed
```

### 2️⃣ Verificar Variable del Frontend

**En Railway:**
1. Ve a: Servicio `CanalMedico-Web` → Variables
2. Verifica que existe:
   ```
   VITE_API_URL=https://canalmedico-production.up.railway.app
   ```
3. Si no existe, créala y haz **redeploy**

### 3️⃣ Probar Login

**Credenciales:**
- Email: `doctor1@ejemplo.com`
- Password: `doctor123`

**Prueba en:**
- Frontend: `https://canalmedico-web-production.up.railway.app/login`
- Swagger: `https://canalmedico-production.up.railway.app/api-docs` → `POST /api/auth/login`

---

## 🔍 Si el Error Persiste

1. **Revisa los logs del backend** en Railway
2. **Prueba directamente en Swagger** para aislar el problema
3. **Verifica que el backend responda:** `https://canalmedico-production.up.railway.app/health`

---

Para más detalles, ver: `SOLUCION_ERROR_500_LOGIN.md`

