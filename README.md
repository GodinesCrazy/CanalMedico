# 📘 CanalMedico - Plataforma de Consultas Médicas Asíncronas

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

**CanalMedico** es una plataforma integral de telemedicina que conecta médicos y pacientes a través de consultas asíncronas, permitiendo atención médica de calidad desde cualquier lugar de Chile.

---

## 🌟 Características Principales

### Para Médicos
- 💼 Panel de gestión completo
- 💰 Sistema dual de pagos (inmediato/mensual)
- 📊 Dashboard financiero con estadísticas
- 💬 Chat en tiempo real con pacientes
- 📁 Gestión de archivos médicos
- ⚙️ Configuración de tarifas y horarios
- 📱 Notificaciones push
- 💊 **Emisión de recetas electrónicas SNRE** (NUEVO)
- 🔐 **Validación automática de identidad y habilitación profesional** (NUEVO)

### Para Pacientes
- 📱 App móvil intuitiva
- 🔍 Búsqueda de médicos por especialidad
- 💳 Pagos seguros con MercadoPago (con deep linking automático)
- 🔄 Verificación automática del estado de pago
- 💬 Chat con médicos
- 📄 Historial médico completo
- 🔔 Notificaciones en tiempo real
- 💊 **Recetas electrónicas SNRE** (NUEVO) - Válidas en todas las farmacias de Chile

### Para Administradores
- 📊 Panel de comisiones
- 📈 Estadísticas y reportes
- 👥 Gestión de usuarios
- 💰 Control de liquidaciones

---

## 🏗️ Arquitectura

```
CanalMedico/
├── backend/              # API REST + WebSocket
│   ├── src/
│   │   ├── modules/      # 12 módulos funcionales
│   │   ├── config/       # Configuración
│   │   ├── middlewares/  # Middlewares
│   │   └── jobs/         # Tareas programadas
│   └── prisma/           # Schema de base de datos
├── frontend-web/         # Panel de médicos (React)
│   └── src/
│       ├── pages/        # 8 páginas
│       ├── components/   # Componentes reutilizables
│       └── services/     # Servicios API
└── app-mobile/           # App de pacientes (React Native)
    └── src/
        ├── screens/      # Pantallas
        └── components/   # Componentes
```

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- SQLite (desarrollo) o PostgreSQL (producción)

### Instalación

#### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npx prisma migrate dev
npx prisma generate
npm run dev
```

#### 2. Frontend Web
```bash
cd frontend-web
npm install
cp .env.example .env
# Editar .env con la URL del backend
npm run dev
```

#### 3. App Móvil
```bash
cd app-mobile
npm install
cp .env.example .env
# Editar .env con la URL del backend
npm start
```

---

## 📚 Documentación

- [Manual Técnico](./docs/MANUAL_TECNICO.md)
- [Manual de Médicos](./docs/MANUAL_MEDICOS.md)
- [Manual de Pacientes](./docs/MANUAL_PACIENTES.md)
- [Manual de Administrador](./docs/MANUAL_ADMINISTRADOR.md)
- [Guía de Despliegue](./docs/GUIA_DESPLIEGUE.md)
- [Documentación de API](./docs/API.md)

---

## 🔧 Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- Socket.IO
- MercadoPago SDK
- AWS S3
- Firebase Admin
- JWT

### Frontend Web
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Router
- Socket.IO Client

### App Móvil
- React Native
- Expo
- TypeScript
- Zustand
- Expo Router

---

## 🔐 Sistema de Validación Automática de Médicos

CanalMedico valida automáticamente a todos los médicos usando **fuentes oficiales del Estado de Chile**:

### Validación de Identidad (Registro Civil)
- ✅ Validación de RUN contra Registro Civil
- ✅ Verificación de nombre y fecha de nacimiento
- ✅ Integración con Floid (proveedor configurable)

### Validación Profesional (RNPI - Superintendencia de Salud)
- ✅ Consulta automática al Registro Nacional de Prestadores Individuales
- ✅ Verificación de profesión (debe ser "Médico Cirujano")
- ✅ Verificación de estado (debe estar "Habilitado")
- ✅ Comparación de especialidades

### Resultados
- **Aprobación Automática**: Si todo coincide, el médico se crea automáticamente
- **Rechazo Automático**: Si no cumple requisitos, se rechaza automáticamente
- **Revisión Manual**: Si hay inconsistencias menores, requiere revisión

**Garantiza que solo médicos reales y habilitados pueden atender en CanalMedico.**

---

## 💊 Integración SNRE - Recetas Electrónicas

CanalMedico está integrado con el **Sistema Nacional de Receta Electrónica (SNRE)** del Ministerio de Salud de Chile, permitiendo emitir recetas médicas electrónicas formales e interoperables.

### Características
- ✅ Emisión de recetas electrónicas desde el panel médico
- ✅ Integración con HL7 FHIR R4 según Guía de Implementación MINSAL
- ✅ Códigos únicos SNRE para dispensación en farmacias
- ✅ Visualización de recetas para pacientes
- ✅ Validación automática de datos (RUT, medicamentos, etc.)

### Configuración
1. Obtener credenciales del MINSAL (contactar: snre@minsal.cl)
2. Configurar variables de entorno:
   ```env
   SNRE_BASE_URL=https://snre-sandbox.minsal.cl/fhir
   SNRE_API_KEY=tu_api_key
   SNRE_ENVIRONMENT=sandbox
   ```
3. Ver documentación completa: `INTEGRACION_SNRE_COMPLETA.md`

---

## 💳 Integración de Pagos

CanalMedico utiliza **MercadoPago Chile** para procesar pagos de forma segura.

### Configuración
1. Crear cuenta en MercadoPago
2. Obtener credenciales (Access Token y Public Key)
3. Configurar en `.env`:
```env
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key
```

### Sistema Dual de Liquidaciones
Los médicos pueden elegir entre:
- **Pago Inmediato**: Liquidación por cada consulta
- **Pago Mensual**: Liquidación consolidada mensual

---

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Bcrypt para contraseñas
- ✅ Helmet.js
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validación de datos (Zod)
- ✅ HTTPS en producción

---

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend-web
npm test

# App Móvil
cd app-mobile
npm test
```

---

## 📦 Despliegue

### Railway (Recomendado)

#### Backend
```bash
cd backend
railway login
railway init
railway add
# Configurar variables de entorno en Railway
railway up
```

#### Frontend Web
```bash
cd frontend-web
railway init
railway add
railway up
```

Ver [Guía de Despliegue](./docs/GUIA_DESPLIEGUE.md) para más detalles.

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

---

## 👥 Equipo

**CanalMedico** - Plataforma de telemedicina para Chile

---

## 📞 Soporte

- Email: soporte@canalmedico.cl
- Documentación: [docs](./docs/)
- Issues: [GitHub Issues](https://github.com/canalmedico/issues)

---

## 🗺️ Roadmap

### ✅ Completado (Versión 1.1.0)
- [x] Sistema de consultas asíncronas
- [x] Chat en tiempo real con Socket.io
- [x] Pagos con MercadoPago Chile
- [x] Sistema dual de liquidaciones (inmediato/mensual)
- [x] Panel de comisiones para administradores
- [x] Deep linking post-pago
- [x] Polling automático de estado de pago
- [x] Disponibilidad automática de médicos
- [x] Validación de propiedad en todos los endpoints
- [x] Panel de solicitudes de registro médico

### 🎯 Próximas Funcionalidades
- [ ] Videollamadas integradas
- [x] Recetas electrónicas SNRE (HL7 FHIR)
- [ ] Integración con FONASA
- [ ] App iOS nativa
- [ ] App Android nativa
- [ ] Modo offline
- [ ] IA para triage inicial

---

**Hecho con ❤️ en Chile 🇨🇱**

---

## 🕒 Atención Asíncrona (qué significa y por qué importa)
- El paciente inicia la consulta cuando quiere (texto/fotos/audio/PDFs y pago) y el médico responde cuando está disponible.
- El sistema guarda el hilo, notifica y avanza estados sin depender de videollamadas.
- Si coinciden, el chat fluye en tiempo real; si no, cada parte responde en momentos distintos.

Ver detalle: `docs/ASINCRONO.md`
