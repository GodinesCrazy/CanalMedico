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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

