// src/components/landing/CTASection.js
import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnalytics } from './useAnalytics';
import { useNavigate } from 'react-router-dom';

const CTASection = ({ 
  variant = 'primary', 
  title = null,
  subtitle = null,
  showDemoForm = false 
}) => {
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const { trackButtonClick, trackFormSubmission } = useAnalytics();
  const [animatedSubtitle, setAnimatedSubtitle] = useState('');
  const navigate = useNavigate();

  // Observer para animaciones
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  // Configuraciones por variante
  const variants = {
    primary: {
      bg: 'bg-gradient-to-br from-[#020617] via-[#0b1b3a] to-[#0a0f1f]',
      text: 'text-white',
      button: 'bg-[#0066FF] text-white hover:bg-[#0057d6]',
      secondaryButton: 'border-2 border-white text-white hover:bg-white hover:text-[#0066FF]'
    },
    secondary: {
      bg: 'bg-gradient-to-br from-[#020617] to-[#0b1b3a]',
      text: 'text-white',
      button: 'bg-[#0066FF] text-white hover:bg-[#0057d6]',
      secondaryButton: 'border-2 border-[#0066FF] text-[#cde0ff] hover:bg-[#0066FF] hover:text-white'
    },
    light: {
      bg: 'bg-gradient-to-br from-gray-50 to-blue-50',
      text: 'text-gray-900',
      button: 'bg-[#0066FF] text-white hover:bg-[#0057d6]',
      secondaryButton: 'border-2 border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF] hover:text-white'
    }
  };

  const currentVariant = variants[variant] || variants.primary;

  // Contenido por defecto
  const defaultContent = {
    primary: {
      title: 'Blindaje Total contra el Fraude Académico',
      subtitle: 'Fe pública digital con garantía perpetua y estándar global para credenciales verificables.',
      primaryButton: '🚀 Comenzar Gratis',
      secondaryButton: '📅 Agendar Demo',
      features: [
        'Activación en minutos',
        'Soporte 24/7',
        'Sin costos ocultos',
        'Integración asegurada'
      ]
    },
    secondary: {
      title: 'Garantía de Autoridad Inquebrantable',
      subtitle: 'Títulos con verificación instantánea y trazabilidad forense, sin complejidad técnica.',
      primaryButton: '🏫 Registrar Institución',
      secondaryButton: '📚 Ver Casos de Éxito',
      features: [
        'Alta disponibilidad',
        'Verificación en segundos',
        'Cero mantenimiento oculto',
        'Cumplimiento internacional'
      ]
    },
    light: {
      title: 'Transforma tu Institución Hoy',
      subtitle: 'Prueba AcademicChain y certifica con fe pública digital sin fricción.',
      primaryButton: '🎯 Probar Demo',
      secondaryButton: '📞 Contactar Ventas',
      features: [
        'Demo interactiva incluida',
        'Migración asistida',
        'Training completo',
        'ROI garantizado'
      ]
    }
  };

  const content = defaultContent[variant] || defaultContent.primary;

  // Contador animado de instituciones
  const [institutionCount, setInstitutionCount] = useState(0);
  useEffect(() => {
    if (inView) {
      const target = 57; // Número real de instituciones
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setInstitutionCount(target);
          clearInterval(timer);
        } else {
          setInstitutionCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [inView]);

  // Efecto de máquina de escribir para el subtítulo
  useEffect(() => {
    if (inView && (subtitle || content.subtitle)) {
      const fullText = subtitle || content.subtitle;
      setAnimatedSubtitle(fullText);
    }
  }, [inView, subtitle, content.subtitle]);


  const handleCTAClick = (type) => {
    trackButtonClick({
      buttonType: 'cta',
      action: type,
      variant: variant,
      section: 'cta'
    });

    console.log(`[DEBUG] Navigating to action: ${type}`);

    switch (type) {
      case 'institution':
        navigate('/institution/login');
        break;
      case 'student':
        navigate('/students/login');
        break;
      case 'demo':
        window.open('https://calendly.com/academicchain/demo', '_blank');
        break;
      case 'free':
        try {
          const allowInstitutionRegister = import.meta.env.VITE_ALLOW_INSTITUTION_REGISTER === '1';
          navigate(allowInstitutionRegister ? '/institution/register?next=/institution/dashboard' : '/register?next=/student/portal');
        } catch {
          navigate('/register?next=/student/portal');
        }
        break;
      default:
        console.warn(`[DEBUG] Unknown navigation action: ${type}`);
        break;
    }
  };

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      trackFormSubmission({
        formType: 'demo_request',
        email: email,
        institution: institution,
        variant: variant
      });

      // Simular envío a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aquí iría la llamada real a la API
      // await api.submitDemoRequest({ email, institution });
      
      setSubmitStatus('success');
      setEmail('');
      setInstitution('');
      
      trackButtonClick({
        buttonType: 'demo_submit',
        variant: variant,
        section: 'cta',
        action: 'demo_submitted'
      });

    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting demo request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      ref={ref}
      className={`section-padding ${currentVariant.bg} ${currentVariant.text} py-16 md:py-20 lg:py-28 relative overflow-hidden`}
    >
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🎓</div>
        <div className="absolute top-20 right-20 text-4xl">🔗</div>
        <div className="absolute bottom-20 left-20 text-5xl">⚡</div>
        <div className="absolute bottom-10 right-10 text-6xl">🏫</div>
      </div>

      <div className="container-responsive relative z-10">
        <div className={`max-w-6xl mx-auto text-center transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          
          {/* Badge de confianza */}
          <div className="badge badge-success mb-8 inline-flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">
              <span className="font-bold">{institutionCount}+</span> Instituciones Confían en Nosotros
            </span>
          </div>

          {/* Título principal */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title || content.title}
          </h2>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto leading-relaxed min-h-[3em]">
            {animatedSubtitle}
            <span className="inline-block w-1 h-7 ml-1 bg-current animate-pulse" style={{ animation: 'blink 1s step-end infinite' }}></span>
          </p>

          {/* Características rápidas */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {content.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg"
              >
                <span className="text-green-300">✓</span>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => handleCTAClick('institution')}
              className="btn-secondary px-8 py-4 rounded-xl text-lg shadow-soft hover-lift flex items-center justify-center space-x-3"
            >
              <span>🏫</span>
              <span>Portal de Institución</span>
            </button>
            
            <button
              onClick={() => handleCTAClick('student')}
              className="btn-secondary px-8 py-4 rounded-xl text-lg shadow-soft hover-lift flex items-center justify-center space-x-3"
            >
              <span>🎓</span>
              <span>Portal de Alumno</span>
            </button>
            <button
              onClick={() => handleCTAClick('free')}
              className="btn-primary px-8 py-4 rounded-xl text-lg shadow-soft hover-lift flex items-center justify-center space-x-3"
            >
              <span>🚀</span>
              <span>Comenzar Gratis</span>
            </button>
          </div>

          {/* Formulario de demo (condicional) */}
          {(showDemoForm || submitStatus) && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              {submitStatus === 'success' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white">✓</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">¡Solicitud Recibida!</h3>
                  <p className="opacity-90 mb-4">
                    Te contactaremos en menos de 24 horas para agendar tu demo personalizada.
                  </p>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className="text-blue-300 hover:text-white underline"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 text-center">
                    Agenda una Demo Personalizada
                  </h3>
                  <form onSubmit={handleDemoSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu.email@institucion.edu"
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="Nombre de tu institución"
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover-lift shadow-soft"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <span>🎯 Solicitar Demo Gratuita</span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Información de confianza */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm opacity-75 mb-6 uppercase tracking-wider">
              Incluye sin costo adicional
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-300">🛡️</span>
                <span>Soporte 24/7</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-300">🔧</span>
                <span>Migración Asistida</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-300">📚</span>
                <span>Training Completo</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-300">💰</span>
                <span>Sin Costos Ocultos</span>
              </div>
            </div>
          </div>

          {/* Garantía */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-sm opacity-80">
              <strong className="opacity-100">Garantía de satisfacción:</strong> Si en los primeros 30 días no 
              estás completamente satisfecho, te ayudamos a migrar tus datos sin costo.
            </p>
          </div>
        </div>
      </div>

      {/* Efecto de partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </section>
  );
};

// Animación CSS para las partículas
const styles = `
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}
.animate-float {
  animation: float linear infinite;
}
@keyframes blink {
  from, to { opacity: 1 }
  50% { opacity: 0 }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default CTASection;
