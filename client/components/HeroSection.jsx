import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import ConnectionService from './services/connectionService';
import { theme } from './themeConfig';

// Variantes de animación
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: theme.animations.stagger,
      delayChildren: theme.animations.stagger,
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

export const HeroSection = () => {
  // Placeholder para la traducción, se puede reemplazar con un hook de i18next para React
  const t = (key, defaultValue) => defaultValue;
  const [health, setHealth] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [statusLabel, setStatusLabel] = useState('Plataforma Operacional');

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const t0 = Date.now();
      const { data } = await ConnectionService.fetchWithFallback('/health', { status: 'DEMO', timestamp: new Date().toISOString(), uptime: 0, environment: 'development', memory: { used: 0, total: 0 }, xrpl: { enabled: false }, algorand: { enabled: false }, ipfs: { enabled: false } });
      const t1 = Date.now();
      if (!mounted) return;
      setLatencyMs(Math.max(0, t1 - t0));
      setHealth(data);
      setStatusLabel((data && data.status === 'OK') ? 'Operacional en Tiempo Real' : 'Degradado');
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const liveStats = useMemo(() => {
    const uptimeSec = Number(health?.uptime || 0);
    const uptimeH = Math.floor(uptimeSec / 3600);
    const enabledServices = ['xrpl','algorand','ipfs'].reduce((acc, k) => acc + (health?.[k]?.enabled ? 1 : 0), 0) + 1;
    const memUsed = health?.memory?.used ? `${health.memory.used} MB` : '--';
    const avgLatency = latencyMs != null ? `${latencyMs} ms` : '--';
    return [
      { number: `${enabledServices}`, label: 'Servicios activos' },
      { number: `${uptimeH}h`, label: 'Uptime continuo' },
      { number: avgLatency, label: 'Respuesta API' },
      { number: memUsed, label: 'Memoria usada' },
    ];
  }, [health, latencyMs]);
  
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#0b1224] to-[#0a0f1f] px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Efectos de fondo mejorados */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#0066FF]/12 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#0066FF]/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-1/2 bg-[linear-gradient(90deg,#0066FF_0%,transparent_40%,transparent_60%,#0066FF_100%)] bg-[length:200%_100%] animate-background-shine"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto pt-32" style={{ paddingBottom: theme.spacing.sectionPb }}>
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="text-center"
        >
          {/* Badge Ecosistema ACL */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <Link to="/status" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all duration-300 backdrop-blur-sm group">
              <ShieldCheck className="text-cyan-400 w-5 h-5" />
              <span className="text-sm font-medium text-cyan-100 group-hover:text-white transition-colors">Ecosistema ACL</span>
              <ArrowRight className="text-cyan-400 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Título principal con efectos mejorados */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
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
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
            {t('hero.subtitle', 'Fe pública digital con garantía perpetua y estándar global. Blindaje total contra el fraude académico, verificación instantánea en cualquier lugar.')}
          </p>
            <motion.p 
              variants={itemVariants}
              className="mt-3 text-sm sm:text-base text-cyan-200/80 max-w-2xl mx-auto"
            >
              {t('hero.description', 'Autoridad inquebrantable para títulos y certificados. Transparencia, confianza y cumplimiento sin fricción.')}
            </motion.p>
          </motion.div>

          {/* Botones CTA mejorados */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link to="/verify">
              <motion.div
                className="group inline-flex items-center btn-primary px-8 py-4 rounded-2xl text-lg shadow-soft hover-lift"
              >
                <span className="relative z-10 flex items-center">
                  🔍 {t('hero.cta_verify', 'Verificar Título')}
                </span>
              </motion.div>
            </Link>
            
            <a href="https://calendly.com/academicchain/demo" target="_blank" rel="noreferrer">
              <motion.div className="group inline-flex items-center justify-center btn-secondary px-8 py-4 rounded-2xl text-lg shadow-soft hover-lift">
                <span className="flex items-center">
                  📅 {t('hero.cta_secondary', 'Agendar Demo')}
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.div>
            </a>
          </motion.div>

          {/* Estadísticas en tiempo real */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            {liveStats.slice(0,3).map((stat, index) => (
              <motion.div
                key={`${stat.label}-${index}`}
                variants={floatingVariants}
                animate="floating"
                className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all duration-300 hover-lift"
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(6, 182, 212, 0.1)"
                }}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
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
