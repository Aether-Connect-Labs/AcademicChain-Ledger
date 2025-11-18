// src/components/layout/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';

const Header = ({ 
  variant = 'default',
  sticky = true,
  showAuth = true,
  transparent = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackButtonClick } = useAnalytics();
  const { isConnected, account, balance, network, connectWallet, disconnectWallet } = useHedera();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Configuraciones por variante
  const variants = {
    default: {
      bg: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
      scrolled: 'bg-white/95 backdrop-blur-md shadow-lg'
    },
    dark: {
      bg: 'bg-gray-900',
      text: 'text-white',
      border: 'border-gray-700',
      scrolled: 'bg-gray-900/95 backdrop-blur-md shadow-lg'
    },
    transparent: {
      bg: 'bg-transparent',
      text: 'text-white',
      border: 'border-transparent',
      scrolled: 'bg-white/95 backdrop-blur-md shadow-lg text-gray-900'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  // Efecto para detectar scroll
  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky]);

  // Cerrar menús al cambiar ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  // Navegación principal
  const navigation = [
    { name: 'Inicio', href: '/', current: location.pathname === '/' },
    { name: 'Características', href: '/features', current: location.pathname === '/features' },
    { name: 'Soluciones', href: '/solutions', current: location.pathname.startsWith('/solutions') },
    { name: 'Precios', href: '/pricing', current: location.pathname === '/pricing' },
    { name: 'Documentación', href: '/docs', current: location.pathname.startsWith('/docs') }
  ];

  // Navegación para usuarios autenticados
  const authNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', role: ['student', 'admin', 'institution'] },
    { name: 'Mis Credenciales', href: '/credentials', icon: '🎓', role: ['student'] },
    { name: 'Verificar', href: '/verify', icon: '🔍', role: ['employer', 'admin'] },
    { name: 'Admin', href: '/admin', icon: '⚙️', role: ['admin', 'institution'] },
    { name: 'API Keys', href: '/api-keys', icon: '🔑', role: ['developer', 'admin'] }
  ];

  const handleNavClick = (itemName, href) => {
    trackButtonClick({
      buttonType: 'nav_link',
      linkName: itemName,
      href: href,
      section: 'header'
    });
  };

  const handleAuthAction = (action) => {
    trackButtonClick({
      buttonType: 'auth_action',
      action: action,
      section: 'header'
    });

    if (action === 'login') {
      console.log('[DEBUG] Navigating to /login');
      navigate('/login');
    } else if (action === 'register') {
      navigate('/register');
    }
  };

  const handleWalletConnect = async () => {
    try {
      trackButtonClick({
        buttonType: 'wallet_connect',
        action: 'connect',
        section: 'header'
      });

      await connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      trackButtonClick({
        buttonType: 'wallet_connect',
        action: 'error',
        error: error.message,
        section: 'header'
      });
    }
  };

  const handleWalletDisconnect = () => {
    trackButtonClick({
      buttonType: 'wallet_connect',
      action: 'disconnect',
      section: 'header'
    });

    disconnectWallet();
  };

  const handleUserAction = (action) => {
    trackButtonClick({
      buttonType: 'user_action',
      action: action,
      section: 'header'
    });

    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout();
        disconnectWallet();
        navigate('/');
        break;
      default:
        break;
    }
  };

  // Clases dinámicas basadas en estado
  const headerClasses = `
    ${currentVariant.bg} 
    ${currentVariant.border} 
    ${sticky ? 'sticky top-0 z-50 transition-all duration-300' : ''}
    ${isScrolled ? currentVariant.scrolled : ''}
    ${transparent && !isScrolled ? 'bg-transparent border-transparent' : ''}
  `;

  const textClasses = `
    ${isScrolled && variant === 'transparent' ? 'text-gray-900' : currentVariant.text}
  `;

  return (
    <header className={headerClasses.trim()}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo y navegación principal */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-3"
              onClick={() => handleNavClick('logo', '/')}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-xl font-bold ${textClasses}`}>AcademicChain</h1>
                <p className="text-xs opacity-75">Powered by Hedera</p>
              </div>
            </Link>

            {/* Navegación desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => handleNavClick(item.name, item.href)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${item.current 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : `hover:bg-gray-100 ${textClasses} hover:text-gray-700`
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Lado derecho - Acciones */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} px-3 py-1.5 rounded-full text-sm`}>
                <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></div>
                <span>Hedera {network ? `· ${network}` : ''}</span>
              </div>
              {isConnected && balance && (
                <div className="hidden lg:flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                  <span className="font-mono">{balance.hbars.toFixed(2)} ℏ</span>
                </div>
              )}
              {isConnected && account && (
                <div className="hidden xl:flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                  <span className="font-mono text-xs">{account.accountId}</span>
                </div>
              )}
            </div>

            {/* Botón de wallet */}
            <div className="hidden sm:block">
              {!isConnected ? (
                <button
                  onClick={handleWalletConnect}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🔗 Conectar Wallet
                </button>
              ) : (
                <button
                  onClick={handleWalletDisconnect}
                  className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Desconectar
                </button>
              )}
            </div>

            {/* Menú de usuario autenticado */}
            {showAuth && isAuthenticated && user ? (
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs opacity-75 capitalize">{user.role}</p>
                  </div>
                  <span className={`transform transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.institution && (
                        <p className="text-xs text-gray-400 mt-1">{user.institution}</p>
                      )}
                    </div>

                    {/* Navegación rápida */}
                    <div className="py-2">
                      {authNavigation
                        .filter(item => item.role.includes(user.role))
                        .map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                          </Link>
                        ))
                      }
                    </div>

                    {/* Acciones de usuario */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => handleUserAction('profile')}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <span>👤</span>
                        <span>Mi Perfil</span>
                      </button>
                      <button
                        onClick={() => handleUserAction('settings')}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <span>⚙️</span>
                        <span>Configuración</span>
                      </button>
                      <button
                        onClick={() => handleUserAction('logout')}
                        className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left border-t border-gray-100 mt-2"
                      >
                        <span>🚪</span>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : showAuth ? (
              // Botones de login/register
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => {
                    console.log('[DEBUG] Navigating to /students/login');
                    navigate('/students/login');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${textClasses} hover:bg-gray-100 hover:text-gray-800`}
                >
                  🎓 Acceso Alumnos
                </button>
                <button
                  onClick={() => {
                    console.log('[DEBUG] Navigating to /institution/login');
                    navigate('/institution/login');
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🏫 Acceso Instituciones
                </button>
                <button
                  onClick={() => {
                    console.log('[DEBUG] Navigating to /register');
                    navigate('/register');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  🚀 Comenzar Gratis
                </button>
              </div>
            ) : null}

            {/* Botón menú móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${textClasses} hover:bg-gray-100`}
            >
              {isMobileMenuOpen ? (
                <span className="text-2xl">✕</span>
              ) : (
                <span className="text-2xl">☰</span>
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Navegación móvil */}
            <nav className="space-y-2 mb-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => handleNavClick(item.name, item.href)}
                  className={`
                    block px-4 py-3 rounded-lg font-medium transition-colors
                    ${item.current 
                      ? 'bg-blue-100 text-blue-700' 
                      : `hover:bg-gray-100 ${textClasses} hover:text-gray-700`
                    }
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Acciones móviles */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {/* Estado de Hedera móvil */}
              {isConnected && (
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Conectado a Hedera</span>
                  </div>
                  {account && (
                    <p className="text-xs font-mono mt-1 opacity-75">
                      {account.accountId}
                    </p>
                  )}
                </div>
              )}

              {/* Auth móvil */}
              {showAuth && !isAuthenticated && (
                <div className="grid grid-cols-2 gap-3 px-4">
                  <button
                    onClick={() => {
                      console.log('[DEBUG] Navigating to /students/login');
                      navigate('/students/login');
                    }}
                    className="border border-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🎓</span><span>Alumnos</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('[DEBUG] Navigating to /institution/login');
                      navigate('/institution/login');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🏫</span><span>Instituciones</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('[DEBUG] Navigating to /register');
                      navigate('/register');
                    }}
                    className="col-span-2 bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>🚀</span><span>Comenzar Gratis</span>
                  </button>
                </div>
              )}

              {/* Wallet móvil */}
              <div className="px-4">
                {!isConnected ? (
                  <button
                    onClick={handleWalletConnect}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    🔗 Conectar Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleWalletDisconnect}
                    className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-medium transition-colors"
                  >
                    Desconectar Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);