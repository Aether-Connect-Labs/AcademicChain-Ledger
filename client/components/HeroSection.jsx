import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Users, Globe } from 'lucide-react';

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { 
    y: 30, 
    opacity: 0,
    scale: 0.95
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
      duration: 0.8
    },
  },
};

const floatingVariants = {
  floating: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Estadísticas para mostrar
const stats = [
  { number: '10K+', label: 'Credenciales Emitidas', icon: Zap },
  { number: '50+', label: 'Instituciones', icon: Users },
  { number: '150+', label: 'Países', icon: Globe }
];

export const HeroSection = () => {
  // Placeholder para la traducción, se puede reemplazar con un hook de i18next para React
  const t = (key, defaultValue) => defaultValue;
  
  return (
    <section className="section-padding relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black animated-grid-background">
      {/* Efectos de fondo mejorados */}
      <div className="absolute inset-0">
        {/* Gradientes animados */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid animado */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="text-center"
        >
          {/* Badge de estado mejorado */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link to="/status">
              <motion.div 
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-cyan-300 bg-cyan-900/30 backdrop-blur-sm rounded-2xl border border-cyan-500/30 hover:bg-cyan-900/50 transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShieldCheck className="w-5 h-5 mr-3" />
                <span className="font-semibold">{t('hero.status', 'Plataforma Operacional')}</span>
                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Link>
          </motion.div>

          {/* Título principal con efectos mejorados */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="hero-title text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-gray-400 block">
                {t('hero.title.line1', 'El Futuro de las')}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 block mt-2">
                {t('hero.title.line2', 'Credenciales Académicas')}
              </span>
            </h1>
          </motion.div>

          {/* Subtítulo mejorado */}
          <motion.div variants={itemVariants} className="mb-10">
            <p className="hero-subtitle text-base sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
              {t('hero.subtitle', 'Verificación instantánea y segura con arquitectura triple: Hedera (certificado), XRP (timestamp) y Algoran (escalado y gobernanza).')}
            </p>
            <motion.p 
              variants={itemVariants}
              className="mt-3 text-sm sm:text-base text-cyan-200/80 max-w-2xl mx-auto"
            >
              {t('hero.description', 'Únete a la revolución de la educación digital.')}
            </motion.p>
          </motion.div>

          {/* Botones CTA mejorados */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link to="/#demo">
              <motion.div
                className="group inline-flex items-center btn-primary px-8 py-4 rounded-2xl text-lg shadow-soft hover-lift"
              >
                <span className="relative z-10 flex items-center">
                  🚀 {t('hero.cta_primary', 'Comenzar Gratis')}
                </span>
              </motion.div>
            </Link>
            
            <Link to="/demo">
              <motion.div
                className="group inline-flex items-center justify-center btn-secondary px-8 py-4 rounded-2xl text-lg shadow-soft hover-lift"
              >
                <span className="flex items-center">
                  📅 {t('hero.cta_secondary', 'Agendar Demo')}
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.div>
            </Link>
          </motion.div>

          {/* Estadísticas flotantes */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={floatingVariants}
                animate="floating"
                className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover-lift"
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(6, 182, 212, 0.1)"
                }}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-6">
              {t('hero.trusted_by', 'CON LA CONFIANZA DE INSTITUCIONES LÍDERES')}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {/* Logos de instituciones - puedes reemplazar con imágenes reales */}
              {['Universidad', 'Tecnológico', 'Colegio', 'Instituto', 'Academia'].map((institution, index) => (
                <motion.div
                  key={institution}
                  className="text-gray-400 font-semibold text-lg"
                  whileHover={{ scale: 1.1, color: "#06b6d4" }}
                >
                  {institution}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
};
