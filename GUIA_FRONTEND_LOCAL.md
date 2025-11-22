# 🏃‍♂️ Cómo ejecutar el Frontend Web Localmente

Este documento describe cómo levantar el panel de médicos (Frontend Web) en tu máquina local y conectarlo al backend en la nube.

## 1. Configuración del Entorno

El archivo `.env` en `c:\CanalMedico\frontend-web` ha sido configurado para apuntar al backend de producción en Railway.

**Contenido de `.env`:**
```env
VITE_API_URL=https://canalmedico-production.up.railway.app
```

## 2. Ejecución

Se han ejecutado los siguientes comandos:

```bash
cd frontend-web
npm install
npm run dev
```

## 3. Verificación

1.  Abre tu navegador en: [http://localhost:5173](http://localhost:5173)
2.  Deberías ver la pantalla de Login.
3.  **Prueba de Conexión:** Intenta iniciar sesión o registrarte.
    *   Si el backend responde, verás mensajes de éxito o error de credenciales.
    *   Si el backend NO responde, verás un error de conexión (Network Error).

## 4. Credenciales de Prueba (Si ya existen en BD)

Si ya ejecutaste las migraciones en el backend, puedes intentar registrar un nuevo doctor:

*   **Email:** `doctor@prueba.com`
*   **Password:** `Password123!`
*   **Nombre:** `Dr. Prueba`

## 5. Solución de Problemas

*   **Error de CORS:** Si ves errores de CORS en la consola del navegador, significa que el backend en Railway necesita actualizar su lista de orígenes permitidos para incluir `http://localhost:5173`.
*   **Backend Caído:** Verifica que `https://canalmedico-production.up.railway.app/health` responda "OK".
