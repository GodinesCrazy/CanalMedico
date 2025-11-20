# CanalMedico App Móvil

App móvil para pacientes de CanalMedico, construida con React Native y Expo.

## Tecnologías

- React Native
- Expo (~50.0.0)
- TypeScript
- React Navigation
- Zustand (estado global)
- Socket.io Client (chat en tiempo real)
- Expo Notifications (push notifications)
- Expo Image Picker (multimedia)
- Expo Barcode Scanner (códigos QR)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. Iniciar servidor de desarrollo:
```bash
npx expo start
```

## Scripts

- `npm start` - Iniciar servidor de desarrollo
- `npm run android` - Ejecutar en Android
- `npm run ios` - Ejecutar en iOS
- `npm run build:android` - Build para Android
- `npm run build:ios` - Build para iOS

## Funcionalidades

### Para Pacientes
- ✅ Registro e inicio de sesión
- ✅ Búsqueda de doctores
- ✅ Escaneo de códigos QR
- ✅ Crear consultas (normal/urgencia)
- ✅ Chat en tiempo real
- ✅ Envío de archivos (imágenes, PDFs, audio)
- ✅ Pago de consultas con Stripe
- ✅ Historial de consultas
- ✅ Perfil del paciente
- ✅ Notificaciones push
- ✅ Deep links desde WhatsApp

## Deep Links

La app soporta deep links:
- `canalmedico://doctor/ID?openChat=true` - Abrir chat con doctor específico

## Estructura del Proyecto

```
app-mobile/
├── src/
│   ├── screens/         # Pantallas
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   └── DoctorSearchScreen.tsx
│   ├── components/      # Componentes reutilizables
│   ├── navigation/      # Configuración de navegación
│   ├── services/        # Servicios API
│   ├── store/           # Estado global (Zustand)
│   ├── theme/           # Tema y colores
│   ├── utils/           # Utilidades
│   └── types/           # Tipos TypeScript
├── app.json             # Configuración Expo
└── package.json
```

## Permisos

La app requiere los siguientes permisos:
- Cámara (para escanear códigos QR y tomar fotos)
- Galería (para seleccionar imágenes)
- Micrófono (para grabar audio)
- Notificaciones push

## Build para Producción

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

## Notificaciones Push

Las notificaciones push están configuradas con Expo Notifications. El token se registra automáticamente al iniciar sesión.

## Licencia

MIT

