import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, ExternalLink, ChevronRight } from 'lucide-react';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { toGateway, getGateways } from './utils/ipfsUtils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isConnected, account, connectWallet, disconnectWallet } = useHedera();
  const { user, logout } = useAuth();
  const canShowWallet = (user?.role === 'admin' || user?.role === 'university' || user?.role === 'institution');
  const [logoSrc, setLogoSrc] = useState(toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGateways = useRef(getGateways('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const logoGwIndex = useRef(0);
  
  const handleLogoError = () => {
    logoGwIndex.current = Math.min(logoGwIndex.current + 1, logoGateways.current.length - 1);
    const next = logoGateways.current[logoGwIndex.current] || logoSrc;
    setLogoSrc(next);
  };

  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem('acl:brand:logo');
      const storedColor = localStorage.getItem('acl:brand:primaryColor');
      
      if (storedLogo) setLogoSrc(storedLogo);
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
    { name: 'Creadores', path: '/creators' },
    { name: 'Instituciones', path: '/instituciones' },
    { name: 'Empresas', path: '/employer' },
    { name: 'Ecosistema ACL', path: 'https://aether-connect-labs.vercel.app/', external: true },
    { name: 'Verificar', path: '/verificar' },
    { name: 'Agenda', path: '/agenda' },
    { name: 'Precios', path: '/precios' },
    { name: 'Documentación', path: '/developers/docs' },
  ];

  if (user?.role === 'CREATOR') {
    navLinks.push({ name: 'Portal', path: '/portal-creadores' });
  } else if (user?.role === 'student') {
    navLinks.push({ name: 'Portal', path: '/student/portal' });
  } else if (user?.role === 'university' || user?.role === 'institution') {
    navLinks.push({ name: 'Dashboard', path: '/institution/dashboard' });
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent ${
        scrolled 
          ? 'bg-[#050505]/80 backdrop-blur-xl border-white/5 py-3 shadow-lg shadow-black/20' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <Link to="/" className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src={logoSrc}
                onError={handleLogoError}
                alt="Logo Institucional"
                className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-white/10 group-hover:border-cyan-500/50 transition-colors bg-[#050505]"
                style={{ objectFit: 'contain' }}
              />
            </Link>
            <div className="flex flex-col items-start justify-center h-full">
              <Link to="/" className="flex items-center">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors duration-300">
                  AcademicChain <span className="font-light text-slate-500">Ledger</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-x-1 p-1.5 rounded-full bg-[#0d0d0d]/50 border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.name}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 rounded-full hover:bg-white/5"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={1} />
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                    location.pathname === link.path 
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] border border-cyan-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-x-4">
            {/* Hedera Badge */}
            <div className="px-3 py-1.5 rounded-full bg-[#0d0d0d] border border-white/10 text-xs font-mono text-slate-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              HEDERA_MAINNET
            </div>

            {/* Wallet Button */}
            {canShowWallet && (
              <button
                onClick={isConnected ? disconnectWallet : connectWallet}
                className={`relative group flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 overflow-hidden ${
                  isConnected 
                    ? 'bg-[#0d0d0d] border border-white/10 text-slate-300 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-white text-black hover:bg-cyan-50'
                }`}
              >
                {!isConnected && (
                   <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                )}
                <Wallet className="w-4 h-4" strokeWidth={1.5} />
                <span className="relative z-10">
                  {isConnected ? formatAccountId(account?.accountId) : 'Conectar Wallet'}
                </span>
              </button>
            )}

            {/* Logout Button */}
            {user && (
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
              >
                Salir
              </button>
            )}
            
             {/* Mobile Menu Toggle (visible on smaller screens than XL) */}
            <button
              onClick={toggleMenu}
              className="xl:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" strokeWidth={1} />
            </button>
          </div>

          {/* Mobile Menu Button (visible on all mobile) */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" strokeWidth={1} /> : <Menu className="w-6 h-6" strokeWidth={1} />}
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.name}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                  >
                    <span className="flex items-center gap-2">
                      {link.name}
                      <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={1} />
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-30" strokeWidth={1} />
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors border ${
                      location.pathname === link.path
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
                    }`}
                  >
                    {link.name}
                    {location.pathname === link.path && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>}
                  </Link>
                )
              ))}
            </div>
            
            <div className="px-6 py-6 border-t border-white/10 bg-white/5">
              {canShowWallet && (
                <button
                  onClick={() => {
                    isConnected ? disconnectWallet() : connectWallet();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold transition-all shadow-lg ${
                    isConnected
                      ? 'bg-[#0d0d0d] text-slate-300 border border-white/10'
                      : 'bg-white text-black'
                  }`}
                >
                  <Wallet className="w-5 h-5" strokeWidth={1.5} />
                  {isConnected ? `Desconectar (${formatAccountId(account?.accountId)})` : 'Conectar Wallet'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
