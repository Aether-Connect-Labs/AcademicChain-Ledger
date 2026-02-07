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

      {/* Student / Smart CV Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="container-responsive py-24 relative z-10 border-b border-white/5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="glass-panel p-6 relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">🎓</div>
                <div>
                  <h3 className="font-bold text-white">Smart CV</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Identidad Verificada
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Habilidad Verificada</div>
                  <div className="font-bold text-white flex justify-between">
                    Desarrollo Blockchain
                    <span className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded">Hash: 0x8a...2b</span>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Proyecto Certificado</div>
                  <div className="font-bold text-white flex justify-between">
                    Marketplace NFT
                    <span className="text-purple-400 text-xs bg-purple-500/10 px-2 py-1 rounded">Top 5%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <div className="text-xs text-slate-500 mb-2">Generado por IA • Validado por Blockchain</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <span className="animate-pulse">●</span> Para Estudiantes
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 font-display leading-tight">
              Tu Carrera, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Impulsada por IA
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              No solo estudies, demuestra. Nuestro Smart CV analiza tus credenciales verificadas y genera un perfil profesional optimizado para los algoritmos de reclutamiento de las mejores empresas.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✓</div>
                Generación automática basada en logros reales.
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✓</div>
                Verificación de identidad (KYC) integrada.
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs">✓</div>
                Visibilidad prioritaria para reclutadores.
              </div>
            </div>

            <Link 
              to="/student/smart-cv"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              Crear mi Smart CV
              <span className="text-xl">→</span>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Recruiting 3.0 Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="container-responsive py-24 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <span className="animate-pulse">●</span> Para Empleadores
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 font-display leading-tight">
              Contratación basada en <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Verdad Criptográfica
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Olvídate de verificar títulos manualmente. Accede a una red de talento donde cada habilidad, certificado y logro ha sido validado matemáticamente en la blockchain.
            </p>
            
            <div className="space-y-6 mb-8">
              {[
                { title: "Verificación Instantánea", desc: "Valida credenciales en milisegundos, no semanas." },
                { title: "Smart Matching con IA", desc: "Encuentra candidatos que realmente cumplen tus requisitos técnicos." },
                { title: "Sin Fraude", desc: "La inmutabilidad de Hedera garantiza la autenticidad del historial." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-900/30 flex items-center justify-center border border-purple-500/30 text-purple-400 shrink-0">
                    {idx === 0 ? '⚡' : idx === 1 ? '🧠' : '🛡️'}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{item.title}</h4>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link 
              to="/employer/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-purple-500/25"
            >
              Buscar Talento
              <span className="text-xl">→</span>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
            <div className="glass-panel p-6 relative bg-slate-900/80 backdrop-blur-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div>
                  <div className="text-xs text-purple-400 font-mono mb-1">CANDIDATE MATCH</div>
                  <div className="text-xl font-bold text-white">Sofia R.</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">98%</div>
                  <div className="text-xs text-slate-500">Match Score</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Ingeniería de Software</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Verificado
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[100%]"></div>
                </div>

                <div className="flex justify-between items-center text-sm mt-4">
                  <span className="text-slate-400">Blockchain Architecture</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> Verificado
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 w-[95%]"></div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">Solidity</span>
                    <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">React</span>
                    <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300">Hedera</span>
                  </div>
                </div>
              </div>
            </div>
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
                to="/portal-creadores" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-pink-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-pink-50 tracking-wide">Simular Creador</span>
              </Link>
              
              <Link 
                to="/employer/dashboard" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-purple-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-purple-50 tracking-wide">Simular Empleador</span>
              </Link>

              <Link 
                to="/demo/student" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-blue-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-blue-50 tracking-wide">Simular Alumno</span>
              </Link>

              <Link 
                to="/student/smart-cv" 
                className="group relative px-8 py-4 bg-[#0F172A] border border-green-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 font-bold text-green-50 tracking-wide">Simular Smart CV</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
