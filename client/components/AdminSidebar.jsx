import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import AdminAPI from './services/adminAPI';

const AdminSidebar = ({ 
  // ... (props sin cambios)
  isOpen = true, 
  isMobile = false, 
  onClose,
  onToggle 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Obtenemos la navegación del hook
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [xrpInfo, setXrpInfo] = useState({ enabled: false, network: 'disabled', address: null, balance: null });
  const [loadingXrp, setLoadingXrp] = useState(false);
  const [errorXrp, setErrorXrp] = useState('');
  const [hederaApiBalance, setHederaApiBalance] = useState(null);

  // TODO: La lógica de `navigationSections` y `hasPermission` debería venir del backend
  // o estar definida en un servicio de configuración de roles.
  // Por ahora, se define un mock para que el componente renderice.
  const navigationSections = useMemo(() => ([
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', name: 'Dashboard', path: '/admin', icon: '📊', permission: 'view_dashboard' },
        { id: 'usage', name: 'Uso por institución', path: '/admin/usage', icon: '📈', permission: 'manage_settings' },
        { id: 'alerts', name: 'Alertas', path: '/admin/alerts', icon: '⚠️', permission: 'manage_settings' },
        { id: 'reports', name: 'Reportes', path: '/admin/reports', icon: '📄', permission: 'manage_settings' },
        { id: 'bulk_issuance', name: 'Emisión Masiva', path: '/admin/credentials/bulk', icon: '📦', permission: 'issue_credentials' },
        { id: 'manage_validity', name: 'Gestión de Vigencia', path: '/admin/credentials/revoke', icon: '🛡️', permission: 'manage_settings' },
      ]
    }
  ]), []);
  const hasPermission = (permission) => {
    return true; // Mock: permitir todo por ahora
  };

  // Efecto para cerrar submenús al cambiar ruta
  useEffect(() => {
    // Mantener abierto el submenú del item activo
    const activeItem = navigationSections
      .flatMap(s => s.items)
      .find(item => location.pathname.startsWith(item.path));

    if (activeItem) {
      const parent = navigationSections
        .flatMap(s => s.items)
        .find(item => item.children?.some(child => child.id === activeItem.id));
      setActiveSubmenu(parent ? parent.id : activeItem.id);
    }
  }, [location.pathname, navigationSections]);

  useEffect(() => {
    setLoadingXrp(true);
    setErrorXrp('');
    (async () => {
      try {
        const status = await AdminAPI.getXrpStatus();
        const s = status?.data || {};
        setXrpInfo({ enabled: Boolean(s.enabled), network: s.network || 'disabled', address: null, balance: null });
        if (s.enabled) {
          try {
            const bal = await AdminAPI.getXrpBalance();
            const d = bal?.data || {};
            setXrpInfo({ enabled: true, network: s.network || 'unknown', address: d.address || null, balance: d.balance ?? null });
          } catch {}
        }
      } catch (e) {
        setErrorXrp(e.message);
      } finally {
        setLoadingXrp(false);
      }
      try {
        const dataH = await AdminAPI.getHederaBalance();
        const hb = dataH?.data?.hbars;
        if (typeof hb === 'number') setHederaApiBalance(hb);
      } catch {}
    })();
  }, []);

  // Manejar navegación
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Manejar toggle de submenús
  const handleSubmenuToggle = (submenuId) => {
    setActiveSubmenu(activeSubmenu === submenuId ? null : submenuId);
  };

  // Renderizar badge
  const renderBadge = (badge) => {
    if (!badge) return null;
    
    const badgeStyles = {
      new: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${badgeStyles[badge] || badgeStyles.new}`}>
        {badge}
      </span>
    );
  };

  // Renderizar item de navegación
  const renderNavItem = (item, level = 0) => {
    const isActive = location.pathname.startsWith(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const canAccess = hasPermission(item.permission);

    if (!canAccess) return null;

    return (
      <div key={item.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <button
          data-tour-id={item.id}
          onClick={() => {
            if (hasChildren) {
              handleSubmenuToggle(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`
            w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 hover-lift
            ${isActive ? 'nav-link-active bg-primary-50 border-r-2 border-primary-600' : 'nav-link'}
            ${level > 0 ? 'text-sm' : 'text-base'}
          `}
        >
          <span className="text-lg mr-3 flex-shrink-0">{item.icon}</span>
          
          {isOpen && (
            <>
              <span className="flex-1 text-left">{item.name}</span>
              {renderBadge(item.badge)}
              {hasChildren && (
                <span className={`transform transition-transform ${
                  activeSubmenu === item.id ? 'rotate-90' : ''
                }`}>
                  ▶
                </span>
              )}
            </>
          )}
        </button>

        {/* Submenús */}
        {hasChildren && activeSubmenu === item.id && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar sección de navegación
  const renderNavigationSection = (title, items, showDivider = true) => {
    const visibleItems = items.filter(item => hasPermission(item.permission));
    if (visibleItems.length === 0) return null;

    return (
      <>
        {isOpen && title && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {title}
            </h3>
          </div>
        )}
        
        <div className="space-y-1">
          {items.map(item => renderNavItem(item))}
        </div>

        {showDivider && isOpen && (
          <div className="my-4 border-t border-gray-200"></div>
        )}
      </>
    );
  };

  return (
    <div className={`
      flex flex-col bg-white border-r border-gray-200 h-full
      ${isOpen ? 'w-64' : 'w-20'} 
      ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
      transition-all duration-300 ease-in-out shadow-soft
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen ? (
          <div className="flex items-center space-x-3">
            {import.meta.env.VITE_LOGO_URL ? (
              <img src={import.meta.env.VITE_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-lg object-contain shadow-md" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">AC</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">AcademicChain</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        ) : (
          import.meta.env.VITE_LOGO_URL ? (
            <img src={import.meta.env.VITE_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-lg object-contain shadow-md mx-auto" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md mx-auto">
              <span className="text-white font-bold text-lg">AC</span>
            </div>
          )
        )}
        
        {!isMobile && (
          <button
            onClick={onToggle}
            className="btn-ghost p-2 hover-lift"
            title={isOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        )}
        
        {isMobile && (
          <button
            onClick={onClose}
            className="btn-ghost p-2 hover-lift"
          >
            ✕
          </button>
        )}
      </div>

      {/* Contenido desplazable */}
      <div className="flex-1 overflow-y-auto">
        {/* Estado de XRP */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${xrpInfo.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${xrpInfo.enabled ? 'text-green-800' : 'text-gray-800'}`}>XRP Ledger</p>
                <p className="text-xs text-gray-500">{xrpInfo.network}</p>
              </div>
            )}
          </div>
          {isOpen && xrpInfo.enabled && (
            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded-md space-y-1">
              {xrpInfo.address && (
                <div>
                  Dirección: <span className="font-mono">{xrpInfo.address}</span>
                </div>
              )}
              {typeof xrpInfo.balance === 'number' && (
                <div>
                  Balance: <span className="font-mono">{xrpInfo.balance.toFixed(6)} XRP</span>
                </div>
              )}
            </div>
          )}
          {isOpen && !xrpInfo.enabled && (
            <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded-md border border-yellow-200">
              {loadingXrp ? 'Cargando estado de XRP...' : (errorXrp ? `Error: ${errorXrp}` : 'XRP deshabilitado')}
            </div>
          )}
        </div>

        {/* Perfil de usuario */}
        {isOpen && user && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role?.replace('_', ' ') || 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="p-4 space-y-6">
          {navigationSections.map((section, index) => 
            renderNavigationSection(
              section.title, 
              section.items, 
              index < navigationSections.length - 1))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        {/* Versión y estado */}
        {isOpen && (
          <div className="mb-3 text-center">
            <p className="text-xs text-gray-500">
              v1.0.0 • 🟢 Online
            </p>
          </div>
        )}

        {/* Botón de logout */}
        <button
          onClick={() => {
            logout();
            if (isMobile && onClose) onClose();
          }}
          className={`
            btn-secondary w-full justify-center hover-lift text-red-600 border-red-300 hover:bg-red-50
            ${!isOpen ? 'px-2' : ''}
          `}
        >
          <span className="text-lg">🚪</span>
          {isOpen && <span className="ml-2">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default React.memo(AdminSidebar);
