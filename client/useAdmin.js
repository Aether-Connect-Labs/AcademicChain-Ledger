// client/hooks/useAdmin.js
import { useAuth } from './useAuth'; // Corregido

// Estructura de navegación estática como placeholder.
// En una versión avanzada, esto se obtendría de una API.
const adminNavigation = [
  {
    title: '',
    items: [
      { id: 'dashboard', name: 'Dashboard', path: '/admin', icon: '📊', permission: 'view_dashboard' },
    ],
  },
  {
    title: 'Credenciales',
    items: [
      { id: 'issue-credentials', name: 'Emitir Credenciales', path: '/admin/credentials/issue', icon: '🎓', permission: 'issue_credentials' },
      { id: 'bulk-issue', name: 'Emisión Masiva', path: '/admin/credentials/bulk', icon: '⚡', permission: 'bulk_issue' },
      { id: 'verify-credentials', name: 'Verificar', path: '/admin/credentials/verify', icon: '🔍', permission: 'verify_credentials' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { id: 'institutions', name: 'Instituciones', path: '/admin/institutions', icon: '🏫', permission: 'manage_institutions' },
      { id: 'users', name: 'Usuarios', path: '/admin/users', icon: '👥', permission: 'manage_users' },
      { id: 'job-monitor', name: 'Monitor de Trabajos', path: '/admin/jobs', icon: '📈', permission: 'view_job_monitor' },
      { id: 'settings', name: 'Configuración', path: '/admin/settings', icon: '⚙️', permission: 'manage_settings' },
    ],
  },
];

export const useAdmin = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isAdmin = isAuthenticated && user?.role === 'admin';

  /**
   * Comprueba si el usuario tiene un permiso específico.
   * @param {string} permission El permiso a comprobar.
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!isAdmin) {
      return false;
    }
    // Un super admin tiene todos los permisos.
    if (user?.permissions?.includes('all') || user?.role === 'super_admin') {
      return true;
    }
    return user?.permissions?.includes(permission) ?? false;
  };

  /**
   * Filtra las secciones de navegación basadas en los permisos del usuario.
   * @returns {Array} Las secciones de navegación a las que el usuario tiene acceso.
   */
  const getFilteredNavigation = () => {
    if (!isAdmin) return [];

    return adminNavigation
      .map(section => {
        const filteredItems = section.items.filter(item => hasPermission(item.permission));
        return { ...section, items: filteredItems };
      })
      .filter(section => section.items.length > 0);
  };

  return {
    user,
    isAuthenticated: isAdmin,
    isLoading,
    logout,
    hasPermission,
    navigationSections: getFilteredNavigation(),
  };
};