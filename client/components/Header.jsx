import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, ChevronDown, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toGateway, getGateways } from './utils/ipfsUtils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isConnected, account, connectWallet, disconnectWallet } = useHedera();
  const { user } = useAuth();
  const canShowWallet = (user?.role === 'admin' || user?.role === 'university' || user?.role === 'institution');
  const [logoSrc, setLogoSrc] = useState(toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGateways = useRef(getGateways('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGwIndex = useRef(0);
  const handleLogoError = () => {
    logoGwIndex.current = Math.min(logoGwIndex.current + 1, logoGateways.current.length - 1);
    const next = logoGateways.current[logoGwIndex.current] || logoSrc;
    setLogoSrc(next);
  };
  const [institutionName, setInstitutionName] = useState('');
  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem('acl:brand:logoUrl');
      const storedName = localStorage.getItem('acl:brand:institutionName');
      const storedColor = localStorage.getItem('acl:brand:primaryColor');
      if (storedLogo) setLogoSrc(storedLogo);
      if (storedName) setInstitutionName(storedName);
      if (storedColor) {
        document.documentElement.style.setProperty('--brand-primary', storedColor);
      }
    } catch {}
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Detectar scroll para cambiar estilo del header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const formatAccountId = (id) => {
    if (!id) return '';
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Instituciones', path: '/instituciones' },
    { name: 'Verificar', path: '/verificar' },
    { name: 'Agenda', path: '/agenda' },
    { name: 'Precios', path: '/precios' },
    { name: 'Documentación', path: '/developers/docs' },
  ];

  const isHome = location.pathname === '/';
  const effectiveScrolled = scrolled || !isHome;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        effectiveScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 group">
            <Link to="/">
              <img
                src={logoSrc}
                onError={handleLogoError}
                alt="Logo Institucional"
                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-14 lg:w-14 rounded-full lg:shadow-xl lg:shadow-black/20"
                style={{ aspectRatio: '1 / 1', objectFit: 'contain' }}
              />
            </Link>
            <div className="flex flex-col items-start gap-1">
              <Link to="/" className="flex flex-col">
                <span className={`font-bold text-lg leading-tight ${effectiveScrolled ? 'text-gray-900' : 'text-white'}`}>
                  {institutionName || 'AcademicChain'}
                </span>
                <span className={`text-xs ${effectiveScrolled ? 'text-gray-800' : 'text-white/90'}`}>
                  Powered by AcademicChain
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-cyan-500 ${
                  effectiveScrolled ? 'text-gray-700' : 'text-gray-200'
                } ${location.pathname === link.path ? 'text-cyan-500 font-bold' : ''}`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Hedera Badge */}
            <div className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1 border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              Hedera
            </div>

            {/* Wallet Button (solo admin/institución) */}
            {canShowWallet && (
              <button
                onClick={isConnected ? disconnectWallet : connectWallet}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 ${
                  isConnected 
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                <Wallet className="w-4 h-4" />
                {isConnected ? (
                  <span>{account?.accountId || 'Conectado'}</span>
                ) : (
                  <span>Conectar Wallet</span>
                )}
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              effectiveScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4 px-4">
                  <span className="text-sm font-medium text-gray-500">Red</span>
                  <div className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Hedera Testnet
                  </div>
                </div>

                {canShowWallet && (
                  <button
                    onClick={isConnected ? disconnectWallet : connectWallet}
                    className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
                      isConnected
                        ? 'bg-gray-100 text-gray-800 border border-gray-200'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    {isConnected ? 'Desconectar' : 'Conectar Wallet'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
