// src/components/layout/AdminSidebar.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin'; // Corregido
import { useHedera } from '../hooks/useHedera'; // Corregido
import HederaStatus from './ui/HederaStatus'; // Corregido
const AdminSidebar = ({ 
  // ... (props sin cambios)
  isOpen = true, 
  isMobile = false, 
  onClose,
  onToggle 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { account, balance, isConnected, connectWallet } = useHedera(); // Asumimos que HederaStatus es un componente UI
  const { user, logout, hasPermission, navigationSections } = useAdmin(); // Obtenemos la navegación del hook
  const [activeSubmenu, setActiveSubmenu] = useState(null);

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
          onClick={() => {
            if (hasChildren) {
              handleSubmenuToggle(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`
            w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
            ${isActive 
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
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
      transition-all duration-300 ease-in-out shadow-lg
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">AC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AcademicChain</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md mx-auto">
            <span className="text-white font-bold text-lg">AC</span>
          </div>
        )}
        
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title={isOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        )}
        
        {isMobile && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Contenido desplazable */}
      <div className="flex-1 overflow-y-auto">
        {/* Estado de Hedera */}
        <div className="p-4 border-b border-gray-200">
          <HederaStatus 
            isConnected={isConnected}
            accountId={account?.accountId}
            balance={balance}
            isCompact={!isOpen}
            onConnect={connectWallet}
          />
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
              v1.0.0 • {isConnected ? '🟢 Online' : '🔴 Offline'}
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
            w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg
            text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors
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

export default AdminSidebar;