import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ShieldCheck, GraduationCap, BookOpen, ChevronRight, CheckCircle2, Play, LayoutDashboard, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const StepCard = ({ icon: Icon, title, description, ctaText, ctaHref, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="group relative bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/10"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-cyan-500/20">
        <Icon className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-slate-400 mb-6 leading-relaxed min-h-[48px]">{description}</p>
      
      <Link 
        to={ctaHref} 
        className="inline-flex items-center text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group/link"
      >
        <span>{ctaText}</span>
        <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
      </Link>
    </div>
  </motion.div>
);

const Stat = ({ value, label }) => (
  <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1">{value}</div>
    <div className="text-slate-400 text-sm font-medium">{label}</div>
  </div>
);

const Welcome = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 pt-24 pb-12 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            <span>Cuenta verificada exitosamente</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6"
          >
            Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">AcademicChain</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed"
          >
            La plataforma líder para la emisión y verificación de credenciales académicas 
            utilizando tecnología blockchain de última generación.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StepCard
            icon={ShieldCheck}
            title="Verificar Credencial"
            description="Escanea un código QR o ingresa el ID para validar instantáneamente la autenticidad en Hedera Hashgraph."
            ctaText="Ir a Verificación"
            ctaHref="/verificar"
            delay={0.3}
          />
          <StepCard
            icon={GraduationCap}
            title="Emitir Demo"
            description="Simula el proceso completo de emisión de certificados digitales seguros y verificables."
            ctaText="Explorar Emisión"
            ctaHref="/institution/emitir/certificado"
            delay={0.4}
          />
          <StepCard
            icon={BookOpen}
            title="Explorar Plataforma"
            description="Descubre todas las funcionalidades y herramientas disponibles para instituciones y estudiantes."
            ctaText="Ver Características"
            ctaHref="/instituciones"
            delay={0.5}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 mb-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[bottom_1px_center]" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Cómo funciona el ecosistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold text-cyan-400 border border-white/10 mb-4">1</div>
                <h3 className="font-bold text-white mb-2">Emisión Segura</h3>
                <p className="text-slate-400 text-sm">Se crea un activo digital único (NFT) con metadatos inmutables registrado en la red Hedera.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xl font-bold text-blue-400 border border-white/10 mb-4">2</div>
                <h3 className="font-bold text-white mb-2">Entrega Digital</h3>
                <p className="text-slate-400 text-sm">El estudiante recibe su credencial en su billetera digital con un código QR verificable.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl font-bold text-purple-400 border border-white/10 mb-4">3</div>
                <h3 className="font-bold text-white mb-2">Verificación Universal</h3>
                <p className="text-slate-400 text-sm">Empleadores verifican la autenticidad en tiempo real sin intermediarios ni costos.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-16"
        >
          <Stat value="< 3s" label="Tiempo de verificación" />
          <Stat value="$0.001" label="Costo por transacción" />
          <Stat value="100%" label="Inmutabilidad garantizada" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          {user?.role === 'admin' ? (
            <Link 
              to="/institution/dashboard" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Ir al Panel de Administración</span>
            </Link>
          ) : (
            <Link 
              to="/verificar" 
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all hover:scale-105"
            >
              <Search className="w-5 h-5" />
              <span>Probar Verificación Ahora</span>
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
