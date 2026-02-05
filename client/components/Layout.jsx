import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import LoadingSpinner from './ui/LoadingSpinner';
import { useAnalytics } from './useAnalytics';
import ErrorBoundary from './ErrorBoundary';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import SupportWidget from './SupportWidget';

// Variantes de animación para transiciones de página
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

const Layout = ({
  children,
  className = '',
  showNavbar = true,
  showFooter = true,
  transparentNavbar = false,
  footerVariant = 'default',
  loading = false
}) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  const { isConnected, networkStatus } = useHedera();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  const [originalTitle] = useState(() => document.title);
  const [originalFaviconHref] = useState(() => {
    const link = document.querySelector("link[rel='icon']");
    return link ? link.getAttribute('href') : null;
  });

  // Auto Dark Mode Effect based on Hedera Network Status
  useEffect(() => {
    if (networkStatus === 'High Traffic') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [networkStatus]);

  // Track page views
  useEffect(() => {
    trackPageView({
      page: location.pathname,
      title: document.title,
      referrer: document.referrer
    });
  }, [location.pathname, trackPageView]);

  // Loading state para transiciones de ruta
  useEffect(() => {
    // Este es un ejemplo de cómo se podría simular la carga en React Router.
    // En una app real, esto se integraría con `useNavigation` de react-router-dom v6.4+
    // o con un gestor de estado.
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500); // Simula carga

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Progress bar para scroll
  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight || 0);
      }
    };

    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
    window.addEventListener('orientationchange', updateScrollProgress);
    // Inicializar altura del header
    updateScrollProgress();
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
      window.removeEventListener('orientationchange', updateScrollProgress);
    };
  }, []);

  // Observa dinámicamente el tamaño del header (incluye menú expandido en móvil)
  useEffect(() => {
    if (!headerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.target?.offsetHeight || entry.contentRect?.height || 0;
        setHeaderHeight(h);
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [headerRef.current]);

  // Scroll to top en cambio de ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Scroll a ancla (#hash) cuando está presente
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.startsWith('#')) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    document.title = originalTitle;
    const link = document.querySelector("link[rel='icon']");
    if (link && originalFaviconHref) link.setAttribute('href', originalFaviconHref);
  }, [location.pathname, originalTitle, originalFaviconHref]);

  // Determinar si es una ruta especial (sin navbar/footer)
  const isSpecialRoute = location.pathname.includes('/auth') ||
    location.pathname.includes('/admin') ||
    location.pathname === '/404';

  // Clases dinámicas para el layout
  const getLayoutClasses = () => {
    const baseClasses = "flex flex-col min-h-screen bg-background text-slate-100 overflow-hidden relative";

    // Agregar clases específicas basadas en la ruta
    const routeClasses = {
      '/': 'home-layout',
      '/auth': 'auth-layout',
      '/admin': 'admin-layout',
      '/dashboard': 'dashboard-layout'
    }[location.pathname] || 'default-layout';

    return `${baseClasses} ${routeClasses} ${className}`;
  };

  return (
    <div className={getLayoutClasses()}>
      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Progress Bar Global */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {(!showNavbar || isSpecialRoute) && user?.role === 'pending_university' && (
        <div className="w-full bg-yellow-100 border-b border-yellow-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 text-yellow-900 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><span>⏳</span>Tu institución está en revisión</span>
            <div className="flex items-center gap-2">
              <Link to="/institution/pending" className="btn-secondary">Ver estado</Link>
              <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'soporte@tu-institucion.edu'}`} className="btn-ghost text-yellow-900">Soporte</a>
            </div>
          </div>
        </div>
      )}

      {/* Navbar condicional */}
      {showNavbar && !isSpecialRoute && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          ref={headerRef}
        >
          <Header
            transparent={transparentNavbar}
          />
        </motion.header>
      )}

      {/* Banner Demo eliminado */}

      {/* Loading Overlay */}
      <AnimatePresence mode="wait">
        {(loading || isLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-gray-600 dark:text-gray-400 font-medium"
              >
                Cargando AcademicChain...
              </motion.p>
              {isConnected && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-sm text-cyan-600 dark:text-cyan-400"
                >
                  🔗 Conectado a Hedera Network
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal con animaciones */}
      <main
        className="flex-grow relative"
        style={{ paddingTop: showNavbar && !isSpecialRoute && !transparentNavbar ? headerHeight : 0 }}
      >
        <ErrorBoundary onReset={() => window.location.reload()} showDetails={import.meta.env.MODE === 'development'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="min-h-screen"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Footer condicional */}
      {showFooter && !isSpecialRoute && (
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <Footer variant={footerVariant} />
        </motion.footer>
      )}

      {/* Botón flotante de scroll to top */}
      {scrollProgress > 10 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-8 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 z-40 flex items-center justify-center group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↑
          </motion.span>
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      )}

      {/* Support Widget */}
      {!isSpecialRoute && <SupportWidget />}

      {/* Notificación de conexión Hedera */}
      {isConnected && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Conectado a Hedera</span>
        </motion.div>
      )}

      {/* High Traffic / Dark Mode Notification */}
      <AnimatePresence>
        {networkStatus === 'High Traffic' && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="fixed top-24 right-4 md:right-8 bg-[#0B0B15] border border-[#7c3aed]/50 text-white p-0 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.2)] z-50 overflow-hidden max-w-sm w-full"
          >
            {/* Notification Glow Line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#7c3aed] shadow-[0_0_10px_#7c3aed]"></div>
            
            <div className="flex items-start p-5 gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#1A1A2E] rounded-xl flex items-center justify-center border border-[#7c3aed]/30 shadow-inner">
                  <span className="text-2xl drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]">🛡️</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-display font-bold text-[#E9D5FF] text-sm tracking-widest uppercase mb-1 drop-shadow-sm">
                  High Traffic Detected
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Activating <span className="text-white font-medium">Dark Mode</span> for visual comfort & energy efficiency.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Propiedades por defecto para diferentes layouts
Layout.Default = ({ children, ...props }) => (
  <Layout showNavbar showFooter {...props}>
    {children}
  </Layout>
);

Layout.Auth = ({ children, ...props }) => (
  <Layout
    showNavbar={false}
    showFooter={false}
    className="auth-layout"
    {...props}
  >
    {children}
  </Layout>
);

Layout.Admin = ({ children, ...props }) => (
  <Layout
    showNavbar={false}
    showFooter={false}
    className="admin-layout"
    {...props}
  >
    {children}
  </Layout>
);

Layout.Landing = ({ children, ...props }) => (
  <Layout
    transparentNavbar={true}
    footerVariant="premium"
    className="landing-layout"
    {...props}
  >
    {children}
  </Layout>
);

Layout.Dashboard = ({ children, ...props }) => (
  <Layout
    showFooter={false}
    className="dashboard-layout"
    {...props}
  >
    {children}
  </Layout>
);

export default Layout;
