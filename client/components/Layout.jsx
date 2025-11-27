import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import LoadingSpinner from './ui/LoadingSpinner';
import { useAnalytics } from './useAnalytics';
import ErrorBoundary from './ErrorBoundary';
import { useHedera } from './useHedera';

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
  const { isConnected } = useHedera();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [originalTitle] = useState(() => document.title);
  const [originalFaviconHref, setOriginalFaviconHref] = useState(() => {
    const link = document.querySelector("link[rel='icon']");
    return link ? link.getAttribute('href') : null;
  });

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
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  // Scroll to top en cambio de ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const isDemo = location.pathname.startsWith('/demo');
    if (isDemo) {
      document.title = `${originalTitle} • DEMO`;
      const link = document.querySelector("link[rel='icon']");
      if (link) {
        if (!originalFaviconHref) setOriginalFaviconHref(link.getAttribute('href'));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#F59E0B"/><text x="32" y="42" font-size="30" text-anchor="middle" fill="#111827" font-family="Arial, Helvetica, sans-serif">D</text></svg>`;
        const url = 'data:image/svg+xml;base64,' + btoa(svg);
        link.setAttribute('href', url);
      }
    } else {
      document.title = originalTitle;
      const link = document.querySelector("link[rel='icon']");
      if (link && originalFaviconHref) link.setAttribute('href', originalFaviconHref);
    }
  }, [location.pathname, originalTitle, originalFaviconHref]);

  // Determinar si es una ruta especial (sin navbar/footer)
  const isSpecialRoute = location.pathname.includes('/auth') || 
                        location.pathname.includes('/admin') || 
                        location.pathname === '/404';

  // Clases dinámicas para el layout
  const getLayoutClasses = () => {
    const baseClasses = "flex flex-col min-h-screen bg-white dark:bg-gray-900";
    
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

      {/* Navbar condicional */}
      {showNavbar && !isSpecialRoute && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Header 
            transparent={transparentNavbar}
          />
        </motion.header>
      )}

      {/* Banner Global de Modo Demo */}
      {location.pathname.startsWith('/demo') && (
        <div className="sticky top-0 z-40 w-full">
          <div className="bg-yellow-100 text-yellow-900 py-2 px-4 text-center text-sm border-b border-yellow-200">
            Estás visualizando una demostración. Es una simulación: no se guarda información ni se emite en red.
          </div>
        </div>
      )}

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
      <main className="flex-grow relative">
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
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 z-40 flex items-center justify-center group"
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
