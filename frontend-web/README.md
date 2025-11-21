# CanalMedico - Frontend Web

Panel web profesional para médicos de CanalMedico.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js LTS (v18.x o superior)
- npm 9.x o superior
- Backend API corriendo (ver [README.md](../README.md))

### Instalación

1. **Instalar dependencias:**

```bash
cd frontend-web
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` en la carpeta `frontend-web/`:

```env
# URL del backend API
VITE_API_URL=http://localhost:3000

# Stripe (opcional para desarrollo)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Firebase (opcional para notificaciones push)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Para desarrollo local:**
```env
VITE_API_URL=http://localhost:3000
```

**Para producción (Railway):**
```env
VITE_API_URL=https://canalmedico-production.up.railway.app
```

3. **Iniciar servidor de desarrollo:**

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 🧪 Probar el Frontend

### 1. Verificar que el Backend esté corriendo

Primero, asegúrate de que el backend API esté funcionando:

```bash
# En otra terminal, desde la raíz del proyecto:
cd backend
npm run dev
```

O verifica que el backend en Railway esté activo:
- URL del backend: `https://canalmedico-production.up.railway.app`
- Swagger: `https://canalmedico-production.up.railway.app/api-docs`
- Health check: `https://canalmedico-production.up.railway.app/health`

### 2. Acceder al Frontend

Abre tu navegador en: `http://localhost:5173`

### 3. Iniciar Sesión

**Para probar como médico:**

Necesitas tener una cuenta de médico creada. Si no tienes una:

1. **Crear cuenta de médico manualmente:**
   - Usa Postman o curl para hacer un POST a `/api/auth/register`
   - O crea una cuenta desde el backend directamente en la base de datos

2. **Datos de ejemplo:**
   ```
   Email: doctor@test.com
   Password: password123
   Role: DOCTOR
   ```

3. **Inicia sesión** en el frontend con tus credenciales

### 4. Funcionalidades a Probar

Una vez dentro del panel:

#### ✅ Dashboard (`/`)
- Ver estadísticas (consultas totales, activas, ingresos)
- Ver consultas recientes
- Toggle de estado en línea/disponible
- Acceso rápido a chats activos

#### ✅ Consultas (`/consultations`)
- Lista de todas las consultas
- Filtros por estado (PENDING, PAID, ACTIVE, CLOSED)
- Paginación
- Abrir chat de consultas activas
- Cerrar consultas

#### ✅ Chat (`/chat/:consultationId`)
- Chat en tiempo real con Socket.io
- Enviar mensajes de texto
- **Subir archivos:**
  - Imágenes (con preview)
  - PDFs
  - Audios (con reproductor)
- Cerrar consulta desde el chat
- Ver historial de mensajes

#### ✅ Ingresos (`/earnings`)
- Ver total de ingresos netos
- Historial de pagos
- Ver comisiones descontadas

#### ✅ Configuración (`/settings`)
- Editar perfil (nombre, especialidad)
- Configurar tarifas (consulta normal, urgencia)
- Activar/desactivar disponibilidad

#### ✅ Perfil (`/profile`)
- Ver información del perfil
- Editar datos personales

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview

# Linter
npm run lint

# Formatear código
npm run format
```

### Estructura del Proyecto

```
frontend-web/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   └── FileUpload.tsx   # Componente de subida de archivos
│   ├── layouts/             # Layouts
│   │   └── Layout.tsx       # Layout principal con sidebar
│   ├── pages/               # Páginas/screens
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ConsultationsPage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── EarningsPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/            # Servicios API
│   │   ├── api.ts           # Cliente Axios
│   │   └── auth.service.ts  # Servicio de autenticación
│   ├── store/               # Estado global (Zustand)
│   │   └── authStore.ts
│   ├── config/              # Configuración
│   │   └── env.ts           # Variables de entorno
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts
│   ├── styles/              # Estilos globales
│   │   └── index.css        # TailwindCSS
│   ├── App.tsx              # Router y rutas
│   └── main.tsx             # Punto de entrada
├── package.json
├── vite.config.ts           # Configuración de Vite
├── tailwind.config.js       # Configuración de Tailwind
└── tsconfig.json            # Configuración de TypeScript
```

## 🌐 Variables de Entorno

### Requeridas:
- `VITE_API_URL` - URL del backend API

### Opcionales:
- `VITE_STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe (para futuras integraciones de pago en frontend)
- Variables de Firebase (para notificaciones push)

## 🐛 Solución de Problemas

### El frontend no se conecta al backend

1. **Verifica que el backend esté corriendo:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verifica la variable de entorno:**
   ```bash
   # En frontend-web/.env
   VITE_API_URL=http://localhost:3000
   ```

3. **Verifica CORS en el backend:**
   - El backend debe permitir requests desde `http://localhost:5173`

### Error de autenticación

1. **Verifica que tengas un token válido**
2. **Verifica que el backend tenga las variables de JWT configuradas**
3. **Limpia el localStorage y vuelve a iniciar sesión**

### Error al subir archivos

1. **Verifica que AWS S3 esté configurado en el backend**
2. **Verifica los permisos del bucket S3**
3. **Verifica que el endpoint `/api/files/upload` funcione en el backend**

### Socket.io no conecta

1. **Verifica que el backend tenga Socket.io configurado**
2. **Verifica que el token JWT sea válido**
3. **Revisa la consola del navegador para errores**

## 📚 Recursos

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

## 🚀 Deployment

Para desplegar en Railway o producción:

1. Configura las variables de entorno en Railway
2. Build del proyecto: `npm run build`
3. El build se genera en `dist/`
4. Servir los archivos estáticos desde `dist/`

