import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import SignupRequestPage from './pages/SignupRequestPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import ConsultationsPage from './pages/ConsultationsPage';
import ChatPage from './pages/ChatPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import DoctorSettingsPage from './pages/DoctorSettingsPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import CommissionsPage from './pages/CommissionsPage';
import AdminSignupRequestsPage from './pages/AdminSignupRequestsPage';
import Layout from './layouts/Layout';
import BenefitsPage from './pages/BenefitsPage';

const TermsPage = () => (
  <div className="max-w-4xl mx-auto py-10 px-4 text-gray-800">
    <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Uso</h1>
    <p className="mb-4 text-sm text-gray-600">Última actualización: febrero 2026 · Aplicable en Chile</p>

    <h2 className="text-xl font-semibold mt-6 mb-3">1. Objeto del Servicio</h2>
    <p className="mb-3 text-gray-700">
      CanalMedico es una plataforma de telemedicina asíncrona que conecta pacientes y médicos habilitados en Chile
      para consultas no presenciales mediante chat y archivos. No es un servicio de urgencia ni reemplaza atención
      presencial cuando ésta sea necesaria.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">2. Usuarios</h2>
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      <li>Pacientes mayores de 18 años o con representación válida.</li>
      <li>Médicos con habilitación vigente en Chile (RNPI) y verificación de identidad.</li>
      <li>Administradores designados por CanalMedico.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-3">3. Alcance y Limitaciones</h2>
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      <li>No apto para emergencias. En caso de riesgo vital, dirígete a SAMU 131 o servicios de urgencia.</li>
      <li>El médico decide si la consulta puede resolverse asíncronamente o requiere derivación.</li>
      <li>Recetas electrónicas se emiten vía SNRE según normativa chilena; pueden requerir verificación de identidad.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-3">4. Pagos y Comisiones</h2>
    <p className="mb-3 text-gray-700">
      Los pagos se procesan a través de MercadoPago. El precio se define por el médico y se cobra antes de activar la
      consulta. CanalMedico puede cobrar comisión por servicio y liquidar al médico en modalidad inmediata o mensual.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">5. Obligaciones del Usuario</h2>
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      <li>Entregar información veraz y actualizada.</li>
      <li>No suplantar identidades ni compartir cuentas.</li>
      <li>Respetar confidencialidad y buen uso de la plataforma.</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-3">6. Responsabilidad</h2>
    <p className="mb-3 text-gray-700">
      CanalMedico provee la infraestructura tecnológica. El acto médico es responsabilidad del profesional. La
      plataforma no garantiza resultados clínicos y no asume responsabilidad por usos indebidos o por falta de
      información entregada por el paciente.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">7. Propiedad Intelectual</h2>
    <p className="mb-3 text-gray-700">
      CanalMedico y sus logotipos son marcas protegidas. El usuario no adquiere derechos sobre el software ni sus
      componentes.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">8. Ley Aplicable y Jurisdicción</h2>
    <p className="mb-3 text-gray-700">
      Estos términos se rigen por la legislación chilena. Cualquier disputa se somete a los tribunales ordinarios de
      la Región Metropolitana de Santiago.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">9. Contacto</h2>
    <p className="text-gray-700">soporte@canalmedico.cl · +56 2 1234 5678</p>
  </div>
);

const PrivacyPage = () => (
  <div className="max-w-4xl mx-auto py-10 px-4 text-gray-800">
    <h1 className="text-3xl font-bold mb-6">Política de Privacidad y Protección de Datos</h1>
    <p className="mb-4 text-sm text-gray-600">Última actualización: febrero 2026 · Ley 19.628 (Chile)</p>

    <h2 className="text-xl font-semibold mt-6 mb-3">1. Responsable del Tratamiento</h2>
    <p className="mb-3 text-gray-700">CanalMedico SpA (Chile), contacto: privacidad@canalmedico.cl</p>

    <h2 className="text-xl font-semibold mt-6 mb-3">2. Datos que Tratamos</h2>
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      <li>Identificación y contacto: nombre, email, teléfono.</li>
      <li>Datos de salud entregados por el paciente en la consulta.</li>
      <li>Archivos adjuntos (imágenes, PDF, audio) y recetas SNRE.</li>
      <li>Datos de pago (tokenizados por el PSP, no almacenamos tarjeta).</li>
      <li>Metadatos de uso y registros de acceso (logs con correlationId).</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-3">3. Finalidades</h2>
    <ul className="list-disc ml-6 space-y-2 text-gray-700">
      <li>Prestar el servicio de telemedicina asíncrona y emitir recetas.</li>
      <li>Facturación, liquidaciones y prevención de fraude.</li>
      <li>Seguridad, trazabilidad clínica y cumplimiento legal.</li>
      <li>Mejora del servicio (métricas agregadas y anónimas).</li>
    </ul>

    <h2 className="text-xl font-semibold mt-6 mb-3">4. Bases de Licitud</h2>
    <p className="mb-3 text-gray-700">
      Consentimiento del paciente para el tratamiento de datos personales y de salud; ejecución de contrato de
      prestación de servicios; cumplimiento de obligaciones legales (SNRE, facturación).
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">5. Conservación</h2>
    <p className="mb-3 text-gray-700">
      Conservamos datos clínicos y registros de atención por el tiempo necesario para fines asistenciales, legales y
      de trazabilidad, siguiendo buenas prácticas chilenas. Los tokens de sesión se retienen solo durante su vigencia.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">6. Derechos del Titular</h2>
    <p className="mb-3 text-gray-700">
      Puedes ejercer derechos de acceso, rectificación, cancelación y oposición (ARCO) enviando solicitud a
      privacidad@canalmedico.cl. Para datos de salud, podríamos requerir verificación de identidad adicional.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">7. Destinatarios y Transferencias</h2>
    <p className="mb-3 text-gray-700">
      Compartimos datos solo con: médicos tratantes, procesadores de pago (MercadoPago), almacenamiento seguro (AWS
      S3), notificaciones (Firebase), y SNRE para recetas. No vendemos datos personales.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">8. Seguridad</h2>
    <p className="mb-3 text-gray-700">
      Uso de cifrado en tránsito (HTTPS), control de acceso por rol, validación de propiedad (IDOR), URLs firmadas
      para archivos y eliminación de ejecutables. Los logs se asocian con correlationId y se sanitizan.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">9. Cookies y Analítica</h2>
    <p className="mb-3 text-gray-700">
      El panel web puede usar cookies esenciales de sesión. No utilizamos cookies de publicidad de terceros.
    </p>

    <h2 className="text-xl font-semibold mt-6 mb-3">10. Contacto y Reclamos</h2>
    <p className="text-gray-700">
      Para ejercer derechos o reclamos sobre protección de datos: privacidad@canalmedico.cl. Puedes acudir a la
      autoridad competente en Chile conforme a la Ley 19.628.
    </p>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardRoute() {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role === 'ADMIN') {
    return <AdminDashboardPage />;
  }
  
  return <DoctorDashboardPage />;
}

function SettingsRoute() {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role === 'ADMIN') {
    return <AdminSettingsPage />;
  }
  
  return <DoctorSettingsPage />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-request" element={<SignupRequestPage />} />
        <Route path="/legal/terminos" element={<TermsPage />} />
        <Route path="/legal/privacidad" element={<PrivacyPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRoute />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="chat/:consultationId" element={<ChatPage />} />
          <Route path="settings" element={<SettingsRoute />} />
          <Route path="earnings" element={<EarningsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="commissions" element={<CommissionsPage />} />
          <Route path="admin/signup-requests" element={<AdminSignupRequestsPage />} />
          <Route path="benefits" element={<BenefitsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;



