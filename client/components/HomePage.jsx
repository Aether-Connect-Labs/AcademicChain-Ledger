// client/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';
import FeaturesSection from "./FeaturesSection";
import CTASection from './CTASection';

const HomePage = () => {
  return (
    <>
      <div className="relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-[128px] pointer-events-none" />

        <HeroSection />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="container-responsive py-24 relative z-10"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
              Protocolo de Verificación
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Infraestructura descentralizada para la emisión y validación de credenciales académicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: "📤", title: "Ingesta segura", desc: "Hash SHA-256 generado localmente." },
            { icon: "🔒", title: "Sello ACL", desc: "Firma criptográfica inmutable." },
            { icon: "🧾", title: "Consenso Hedera", desc: "Registro público en DLT." },
            { icon: "✅", title: "Validación Universal", desc: "Verificable en cualquier explorador." }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="glass-card p-8 border-t border-white/10"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="font-bold text-lg text-white mb-2 font-display">{item.title}</div>
              <div className="text-sm text-slate-400">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <FeaturesSection />

      <motion.section
        className="container-responsive py-24 relative z-10"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4 font-display">Niveles de Servicio</h2>
          <p className="text-slate-400">Escalabilidad Enterprise para instituciones modernas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan Esencial */}
          <div className="glass-panel p-8 relative overflow-hidden group hover:border-primary-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-50">
              <span className="text-xs font-mono border border-primary-500/30 px-2 py-1 rounded text-primary-400">CORE</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white mb-2">Esencial</h3>
            <div className="text-4xl font-bold text-primary-400 mb-6">$50<span className="text-sm text-slate-500">/mo</span></div>
            <ul className="space-y-4 text-slate-300 text-sm mb-8">
              <li className="flex items-center gap-2"><span className="text-primary-500">❖</span> Registro en Hedera Testnet</li>
              <li className="flex items-center gap-2"><span className="text-primary-500">❖</span> 50 Emisiones / mes</li>
              <li className="flex items-center gap-2"><span className="text-primary-500">❖</span> Soporte Básico</li>
            </ul>
            <Link to="/comenzar-gratis" className="btn-primary w-full block text-center bg-primary-600/20 border border-primary-500/50 text-primary-300 hover:bg-primary-500 hover:text-black">
              Iniciar
            </Link>
          </div>

          {/* Plan Profesional (Featured) */}
          <div className="glass-panel p-8 relative overflow-hidden ring-1 ring-secondary-500 shadow-neon-purple transform md:-translate-y-4">
            <div className="absolute inset-0 bg-secondary-500/5 pointer-events-none" />
            <div className="absolute top-0 right-0 p-4">
              <span className="text-xs font-mono bg-secondary-500 text-white px-2 py-1 rounded shadow-lg uppercase tracking-wider">Recomendado</span>
            </div>
            <h3 className="text-xl font-bold font-display text-white mb-2">Profesional</h3>
            <div className="text-4xl font-bold text-secondary-400 mb-6">$155<span className="text-sm text-slate-500">/mo</span></div>
            <ul className="space-y-4 text-slate-300 text-sm mb-8">
              <li className="flex items-center gap-2"><span className="text-secondary-400">◈</span> Hedera Mainnet + XRPL</li>
              <li className="flex items-center gap-2"><span className="text-secondary-400">◈</span> 500 Emisiones / mes</li>
              <li className="flex items-center gap-2"><span className="text-secondary-400">◈</span> API Access (Headless)</li>
              <li className="flex items-center gap-2"><span className="text-secondary-400">◈</span> Soporte Prioritario 24/7</li>
            </ul>
            <Link to="/precios" className="btn-primary w-full block text-center bg-secondary-600 hover:bg-secondary-500 text-white shadow-lg shadow-secondary-500/25">
              Mejorar Plan
            </Link>
          </div>

          {/* Plan Enterprise */}
          <div className="glass-panel p-8 relative overflow-hidden group hover:border-slate-500 transition-colors">
            <h3 className="text-xl font-bold font-display text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-bold text-white mb-6">Custom</div>
            <ul className="space-y-4 text-slate-300 text-sm mb-8">
              <li className="flex items-center gap-2"><span className="text-white">❖</span> Nodos Dedicados</li>
              <li className="flex items-center gap-2"><span className="text-white">❖</span> Emisiones Ilimitadas</li>
              <li className="flex items-center gap-2"><span className="text-white">❖</span> SLA 99.99%</li>
              <li className="flex items-center gap-2"><span className="text-white">❖</span> On-Premise Option</li>
            </ul>
            <Link to="/agenda" className="btn-primary w-full block text-center bg-transparent border border-slate-600 text-slate-300 hover:bg-white hover:text-black">
              Contactar Ventas
            </Link>
          </div>
        </div>
      </motion.section>

      <CTASection variant="secondary" />

      <div id="demo" className="container mx-auto px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary-500/30 bg-[#0B0B15]/90 p-12 text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          {/* Holographic Grid Effect */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/5 to-primary-900/20"></div>
          
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-extrabold mb-6 font-display text-white tracking-tight drop-shadow-lg">
              Zona de Pruebas <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Holográfica</span>
            </h3>
            
            <p className="text-slate-300 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              Experimenta la emisión y verificación en tiempo real sin compromisos. 
              <span className="block mt-2 text-cyan-200/80">Acceso instantáneo al entorno sandbox.</span>
            </p>

            <div className="flex flex-col sm:flex-col gap-6 max-w-md mx-auto">
              <Link 
                to="/demo/institution" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-cyan-50 tracking-wide">Simular Institución</span>
              </Link>
              
              <Link 
                to="/demo/student" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-blue-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-blue-50 tracking-wide">Simular Alumno</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
