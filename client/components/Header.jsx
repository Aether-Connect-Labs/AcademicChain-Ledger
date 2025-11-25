// src/components/layout/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import LoginModal from './LoginModal.jsx';

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
  const [isEmitMenuOpen, setIsEmitMenuOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginUserType, setLoginUserType] = useState('student');

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
    setIsEmitMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      setLoginUserType(detail.userType || 'student');
      setLoginModalOpen(true);
    };
    window.addEventListener('openLoginModal', handler);
    return () => window.removeEventListener('openLoginModal', handler);
  }, []);

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

  useEffect(() => {
    let API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL) {
      setApiConnected(false);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    fetch(`${API_URL}/api/verification/status`, { signal: controller.signal })
      .then(r => setApiConnected(r.ok))
      .catch(() => setApiConnected(false))
      .finally(() => clearTimeout(id));
  }, []);

  // Navegación principal
  const navigation = [
    { name: 'Inicio', href: '/', current: location.pathname === '/' },
    { name: 'Instituciones', href: '/instituciones', current: location.pathname === '/instituciones' },
    { name: 'Verificar', href: '/verificar', current: location.pathname === '/verificar' },
    { name: 'Precios', href: '/pricing', current: location.pathname === '/pricing' },
    { name: 'Documentación', href: '/docs', current: location.pathname.startsWith('/docs') }
  ];

  // Navegación para usuarios autenticados
  const authNavigation = [
    { name: 'Dashboard Institución', href: '/institution/dashboard', icon: '📊', role: ['institution'] },
    { name: 'Emitir Título', href: '/institution/emitir/titulo', icon: '🎓', role: ['institution'] },
    { name: 'Emitir Certificado', href: '/institution/emitir/certificado', icon: '📜', role: ['institution'] },
    { name: 'Emitir Diploma', href: '/institution/emitir/diploma', icon: '🏅', role: ['institution'] },
    { name: 'Portal Alumno', href: '/student/portal', icon: '🎓', role: ['student'] },
    { name: 'Verificar', href: '/verificar', icon: '🔍', role: ['student','admin','institution','employer'] },
    { name: 'Admin', href: '/admin', icon: '⚙️', role: ['admin'] },
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
      case 'exit-owner':
        try { localStorage.removeItem('previewOwner'); } catch {}
        logout();
        disconnectWallet();
        navigate('/login');
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
  const isOwnerMode = (import.meta.env.DEV || import.meta.env.VITE_ALLOW_OWNER === '1') && (() => { try { return localStorage.getItem('previewOwner') === '1'; } catch { return false; } })();

  return (
    <>
    <header className={headerClasses.trim()}>
      {(import.meta.env.DEV || import.meta.env.VITE_ALLOW_OWNER === '1') && (
        <div className="w-full bg-secondary-600 text-white text-center text-xs py-1">Modo Propietario activo</div>
      )}
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
              {import.meta.env.VITE_LOGO_URL ? (
                <img src={import.meta.env.VITE_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-lg shadow-lg object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">AC</span>
                </div>
              )}
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
                      ? 'bg-primary-100 text-primary-700 shadow-sm' 
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
                <span>Hedera {network && network !== 'unknown' ? `· ${network}` : ''}</span>
              </div>
              {(import.meta.env.DEV || import.meta.env.VITE_ALLOW_OWNER === '1') && isAuthenticated && user?.role === 'admin' && (
                <div className="hidden lg:flex items-center space-x-2 bg-secondary-50 text-secondary-700 px-3 py-1.5 rounded-full text-sm">
                  <span className="font-semibold">Admin (propietario)</span>
                </div>
              )}
              {isConnected && balance && (
                <div className="hidden lg:flex items-center space-x-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm">
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
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-soft hover-lift"
                >
                  🔗 Conectar Wallet
                </button>
              ) : (
                <button
                  onClick={handleWalletDisconnect}
                  className="btn-secondary hover-lift text-red-600 border-red-300 hover:bg-red-50"
                >
                  Desconectar
                </button>
              )}
            </div>

            {isAuthenticated && user?.role === 'institution' && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsEmitMenuOpen(!isEmitMenuOpen)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-soft hover-lift flex items-center space-x-2"
                >
                  <span>Emitir</span>
                  <span className={`transform transition-transform ${isEmitMenuOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isEmitMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <Link to="/institution/emitir/titulo" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">🎓 Emitir Título</Link>
                    <Link to="/institution/emitir/certificado" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">📜 Emitir Certificado</Link>
                    <Link to="/institution/emitir/diploma" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">🏅 Emitir Diploma</Link>
                  </div>
                )}
              </div>
            )}

            {/* Menú de usuario autenticado */}
            {showAuth && isAuthenticated && user ? (
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors hover-lift"
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
                            className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors hover-lift"
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
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left hover-lift"
                      >
                        <span>👤</span>
                        <span>Mi Perfil</span>
                      </button>
                      <button
                        onClick={() => handleUserAction('settings')}
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left hover-lift"
                      >
                        <span>⚙️</span>
                        <span>Configuración</span>
                      </button>
                      {isOwnerMode && (
                        <button
                          onClick={() => handleUserAction('exit-owner')}
                          className="flex items-center space-x-3 px-4 py-2 text-secondary-700 hover:bg-secondary-50 transition-colors w-full text-left hover-lift"
                        >
                          <span>🔒</span>
                          <span>Salir del modo propietario</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction('logout')}
                        className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left border-t border-gray-100 mt-2 hover-lift"
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
                    setLoginUserType('student');
                    setLoginModalOpen(true);
                  }}
                  className={`btn-ghost ${textClasses} hover:bg-gray-100 hover:text-gray-800`}
                >
                  🎓 Acceso Alumnos
                </button>
                <button
                  onClick={() => {
                    setLoginUserType('institution');
                    setLoginModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-soft hover-lift"
                >
                  🏫 Acceso Instituciones
                </button>
                <button
                  onClick={() => {
                    const allowInstitutionRegister = import.meta.env.VITE_ALLOW_INSTITUTION_REGISTER === '1';
                    const target = allowInstitutionRegister ? '/institution/register' : '/register';
                    console.log(`[DEBUG] Navigating to ${target}`);
                    navigate(target);
                  }}
                  className="btn-primary hover-lift"
                >
                  🚀 Comenzar Gratis
                </button>
              </div>
            ) : null}

            {/* CTA móvil visible */}
            <div className="lg:hidden mr-2">
              <button
                onClick={() => {
                  setLoginUserType('student');
                  setLoginModalOpen(true);
                }}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-soft hover:bg-blue-700"
              >
                Acceso
              </button>
            </div>
            {/* Botón menú móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${textClasses} hover:bg-gray-100 hover-lift`}
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
                      : `hover:bg-gray-100 ${textClasses} hover:text-gray-700 hover-lift`
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

              {apiConnected !== null && (
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 ${apiConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse`}></div>
                    <span>{apiConnected ? 'API conectada' : 'API desconectada'}</span>
                  </div>
                </div>
              )}

              {/* Auth móvil */}
              {showAuth && !isAuthenticated && (
                <div className="grid grid-cols-2 gap-3 px-4">
                  <button
                    onClick={() => {
                      setLoginUserType('student');
                      setLoginModalOpen(true);
                    }}
                    className="btn-ghost flex items-center justify-center space-x-2"
                  >
                    <span>🎓</span><span>Alumnos</span>
                  </button>
                  <button
                    onClick={() => {
                      setLoginUserType('institution');
                      setLoginModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 hover-lift shadow-soft"
                  >
                    <span>🏫</span><span>Instituciones</span>
                  </button>
                  <button
                    onClick={() => {
                      console.log('[DEBUG] Navigating to /register');
                      navigate('/register');
                    }}
                    className="col-span-2 btn-primary flex items-center justify-center space-x-2 hover-lift"
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
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium transition-colors hover-lift shadow-soft"
                  >
                    🔗 Conectar Wallet
                  </button>
                ) : (
                  <button
                    onClick={handleWalletDisconnect}
                    className="w-full btn-secondary text-red-600 border-red-300 hover:bg-red-50 hover-lift"
                  >
                    Desconectar Wallet
                  </button>
                )}
              </div>

              {isAuthenticated && user?.role === 'institution' && (
                <div className="px-4 space-y-2">
                  <Link to="/institution/emitir/titulo" className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-700">🎓 Emitir Título</Link>
                  <Link to="/institution/emitir/certificado" className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-700">📜 Emitir Certificado</Link>
                  <Link to="/institution/emitir/diploma" className="block px-3 py-2 rounded-lg bg-blue-50 text-blue-700">🏅 Emitir Diploma</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
    {loginModalOpen && (
      <LoginModal
        open={loginModalOpen}
        userType={loginUserType}
        onClose={() => setLoginModalOpen(false)}
      />
    )}
    </>
  );
};

export default React.memo(Header);