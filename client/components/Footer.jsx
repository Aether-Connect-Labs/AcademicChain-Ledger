// src/components/layout/Footer.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';
import { useHedera } from './useHedera';

const Footer = ({ variant = 'default' }) => {
  const { trackButtonClick } = useAnalytics();
  const { isConnected, account, network } = useHedera();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isScrolled, setIsScrolled] = useState(false);

  // Efecto para año actual
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Variantes de footer
  const variants = {
    default: {
      bg: 'bg-gradient-to-b from-gray-900 to-gray-800',
      text: 'text-gray-300',
      border: 'border-gray-700'
    },
    light: {
      bg: 'bg-gradient-to-b from-white to-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200'
    },
    premium: {
      bg: 'bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900',
      text: 'text-blue-100',
      border: 'border-blue-700'
    }
  };

  const currentVariant = variants[variant] || variants.default;

  // Navegación del footer
  const footerSections = [
    {
      title: 'Plataforma',
      links: [
        { name: 'Características', href: '/features', icon: '🚀' },
        { name: 'Portal de Instituciones', href: '/institutions/login', icon: '🏫' },
        { name: 'Portal de Alumnos', href: '/students/login', icon: '🎓' },
        { name: 'Demo Institución', href: '/demo/institution', icon: '🧪' },
        { name: 'Demo Alumno', href: '/demo/student', icon: '🧪' },
        { name: 'Para Empleadores', href: '/employers', icon: '💼' },
        { name: 'Precios', href: '/pricing', icon: '💰' },
        { name: 'Casos de Éxito', href: '/case-studies', icon: '📈' }
      ]
    },
    {
      title: 'Soluciones',
      links: [
        { name: 'Verificación Instantánea', href: '/solutions/verification', icon: '⚡' },
        { name: 'Emisión Masiva', href: '/solutions/bulk-issuance', icon: '📦' },
        { name: 'Credenciales Digitales', href: '/solutions/digital-credentials', icon: '🪪' },
        { name: 'API & Integración', href: '/solutions/api', icon: '🔧' },
        { name: 'Seguridad Blockchain', href: '/solutions/security', icon: '🔒' },
        { name: 'Reportes Analytics', href: '/solutions/analytics', icon: '📊' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Documentación', href: '/docs', icon: '📚' },
        { name: 'Centro de Ayuda', href: '/help', icon: '❓' },
        { name: 'Blog', href: '/blog', icon: '✍️' },
        { name: 'Webinars', href: '/webinars', icon: '🎥' },
        { name: 'Developers', href: '/developers', icon: '👨‍💻' },
        { name: 'Status', href: '/status', icon: '🟢' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Sobre Nosotros', href: '/about', icon: '👥' },
        { name: 'Contacto', href: '/contact', icon: '📞' },
        { name: 'Carreras', href: '/careers', icon: '💼' },
        { name: 'Prensa', href: '/press', icon: '📰' },
        { name: 'Partners', href: '/partners', icon: '🤝' },
        { name: 'Legal', href: '/legal', icon: '⚖️' }
      ]
    }
  ];

  // Enlaces legales
  const legalLinks = [
    { name: 'Términos de Servicio', href: '/terms' },
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Seguridad', href: '/security' },
    { name: 'GDPR', href: '/gdpr' }
  ];

  // Redes sociales
  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/Aether-Connect-Labs/AcademicChain-Ledger', icon: '💻' },
    { name: 'Twitter', href: 'https://twitter.com/academicchain', icon: '🐦' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/academicchain', icon: '💼' },
    { name: 'Discord', href: 'https://discord.gg/academicchain', icon: '💬' },
    { name: 'YouTube', href: 'https://youtube.com/academicchain', icon: '🎥' }
  ];

  const handleLinkClick = (linkName, category) => {
    trackButtonClick({
      buttonType: 'footer_link',
      linkName: linkName,
      category: category,
      section: 'footer'
    });
  };

  const handleSocialClick = (platform) => {
    trackButtonClick({
      buttonType: 'social_link',
      platform: platform,
      section: 'footer'
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackButtonClick({
      buttonType: 'scroll_to_top',
      section: 'footer'
    });
  };

  return (
    <footer className={`${currentVariant.bg} ${currentVariant.text} relative overflow-hidden`}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-5% text-2xl">🎓</div>
        <div className="absolute top-20 right-10% text-xl">🔗</div>
        <div className="absolute bottom-20 left-15% text-3xl">⚡</div>
        <div className="absolute bottom-10 right-5% text-2xl">🏫</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Sección principal */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand y descripción */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {import.meta.env.VITE_LOGO_URL ? (
                  <img src={import.meta.env.VITE_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AC</span>
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">AcademicChain</h3>
                  <p className="text-sm opacity-75">Powered by Hedera</p>
                </div>
              </div>
              
              <p className="mb-6 leading-relaxed max-w-md">
                Revolucionamos la educación mediante tecnología blockchain. 
                Emisión y verificación instantánea de credenciales académicas 
                en la red descentralizada de Hedera Hashgraph.
              </p>

              {/* Estado de Hedera */}
              <div className="flex items-center space-x-2 mb-4 p-3 bg-white/10 rounded-lg">
                <div className={`w-2 h-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'} rounded-full animate-pulse`}></div>
                <span className="text-sm">
                  Hedera {network ? `· ${network}` : ''}
                </span>
                {isConnected && account && (
                  <span className="text-xs font-mono bg-black/20 px-2 py-1 rounded">
                    {account.accountId?.slice(0, 8)}...
                  </span>
                )}
              </div>

              {/* Newsletter Subscription */}
              <div className="mb-6 card">
                <h4 className="font-semibold text-gray-900 mb-3">Newsletter</h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="input-primary"
                  />
                  <button
                    onClick={() => handleLinkClick('newsletter_subscribe', 'newsletter')}
                    className="btn-primary hover-lift"
                  >
                    Suscribir
                  </button>
                </div>
              </div>
            </div>

            {/* Secciones de navegación */}
            {footerSections.map((section, index) => (
              <div key={section.title}>
                <h4 className="font-semibold text-white mb-4 text-lg">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        onClick={() => handleLinkClick(link.name, section.title.toLowerCase())}
                        className="flex items-center space-x-2 hover:text-white transition-colors group hover-lift"
                      >
                        <span className="text-sm opacity-75 group-hover:opacity-100">
                          {link.icon}
                        </span>
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Línea divisoria */}
        <div className={`border-t ${currentVariant.border}`}></div>

        {/* Sección inferior */}
        <div className="py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            {/* Derechos de autor y enlaces legales */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <span>
                © {currentYear} AcademicChain by Aether Connect Labs. Todos los derechos reservados.
              </span>
              
              <div className="flex flex-wrap justify-center gap-4">
                {legalLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => handleLinkClick(link.name, 'legal')}
                    className="hover:text-white transition-colors hover-lift"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Redes sociales y botones de acción */}
            <div className="flex items-center space-x-6">
              {/* Redes sociales */}
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialClick(social.name)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all shadow-soft hover-lift"
                    title={social.name}
                  >
                    <span className="text-sm">{social.icon}</span>
                  </a>
                ))}
              </div>

              {/* Separador */}
              <div className="h-6 w-px bg-gray-600"></div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={scrollToTop}
                  className="btn-ghost w-10 h-10 rounded-lg flex items-center justify-center hover-lift shadow-soft"
                  title="Volver arriba"
                >
                  <span>↑</span>
                </button>

                <button
                  onClick={() => handleLinkClick('contact', 'action')}
                  className="btn-primary px-4 py-2 rounded-lg font-medium hover-lift shadow-soft"
                >
                  Contactar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Badges de tecnología y partners */}
        <div className="py-6 border-t border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Tecnologías */}
            <div className="flex items-center space-x-6 text-sm opacity-75">
              <span>Powered by:</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Hedera Hashgraph</span>
                </span>
                <span className="flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Blockchain</span>
                </span>
                <span className="flex items-center space-x-2">
                  <span>🌱</span>
                  <span>Carbon Negative</span>
                </span>
              </div>
            </div>

            {/* Certificaciones y badges */}
            <div className="flex items-center space-x-4">
              <div className="badge badge-info">
                <span>🔒</span>
                <span className="ml-2">SSL Secured</span>
              </div>
              <div className="badge badge-info">
                <span>🌎</span>
                <span className="ml-2">GDPR Compliant</span>
              </div>
              <div className="badge badge-success">
                <span>🟢</span>
                <span className="ml-2">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante de scroll to top (solo en móvil) */}
      {isScrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 lg:hidden w-12 h-12 rounded-full shadow-soft flex items-center justify-center transition-all hover-lift z-50 btn-ghost"
        >
          ↑
        </button>
      )}
    </footer>
  );
};

export default Footer;
