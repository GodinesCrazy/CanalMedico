import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { FiHome, FiMessageSquare, FiSettings, FiDollarSign, FiUser, FiLogOut, FiPieChart, FiUsers } from 'react-icons/fi';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome, roles: ['DOCTOR', 'ADMIN'] },
    { name: 'Consultas', href: '/consultations', icon: FiMessageSquare, roles: ['DOCTOR', 'ADMIN'] },
    { name: 'Ingresos', href: '/earnings', icon: FiDollarSign, roles: ['DOCTOR'] },
    { name: 'Comisiones', href: '/commissions', icon: FiPieChart, roles: ['ADMIN'] },
    { name: 'Solicitudes de Registro', href: '/admin/signup-requests', icon: FiUsers, roles: ['ADMIN'] },
    { name: 'Configuración', href: '/settings', icon: FiSettings, roles: ['DOCTOR', 'ADMIN'] },
    { name: 'Perfil', href: '/profile', icon: FiUser, roles: ['DOCTOR', 'ADMIN'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-gray-200 px-4 py-3">
            <img
              src="/assets/logo-full.png"
              alt="CanalMedico"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation
              .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut className="mr-3 h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
