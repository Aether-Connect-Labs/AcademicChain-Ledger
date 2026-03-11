import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';
import FeaturesSection from "./FeaturesSection";
import CTASection from './CTASection';
import { CheckCircle2, ArrowRight, Fingerprint, Database, Network, ShieldCheck, GraduationCap, Building2, User } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="relative overflow-hidden bg-[#050505] min-h-screen text-slate-200 selection:bg-emerald-500/30 font-sans">
      
      {/* Hero Section */}
      <HeroSection />

      {/* Protocol / Features Section */}
      <FeaturesSection />

      {/* Multichain Section */}
      <section className="relative py-24 container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <Network size={14} />
              <span>INTEROPERABILIDAD</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Certificación <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Multichain</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Protocolo de consenso distribuido que integra orquestación cross-chain (Hedera Hashgraph & XRPL), garantizando inmutabilidad criptográfica, persistencia de datos y verificación universal descentralizada.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                { title: "Consenso Hedera", desc: "Timestamping justo y ordenamiento final." },
                { title: "XRPL Ledger", desc: "Liquidación eficiente y bajo costo." },
                { title: "IPFS Storage", desc: "Persistencia descentralizada de metadatos." }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-3xl opacity-20" />
            <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Network size={120} className="text-white" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Certificado Registrado</h3>
                    <p className="text-emerald-400 text-sm font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ON-CHAIN VERIFIED
                    </p>
                  </div>
                </div>

                <div className="bg-[#050505]/60 rounded-xl p-6 border border-white/5 font-mono text-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500">TX ID</span>
                    <span className="text-cyan-400">0x7f3...9a2b</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500">BLOCK</span>
                    <span className="text-slate-300">#12,405,291</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-slate-500">TIMESTAMP</span>
                    <span className="text-slate-300">2024-03-15 14:30:22 UTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">SIGNER</span>
                    <span className="text-purple-400">AcademicChain Authority</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">HEDERA</div>
                  <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">XRPL</div>
                  <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">IPFS</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Smart CV Section */}
      <section className="relative py-24 bg-[#0a0a0a] border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1 relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
              <div className="glass-panel p-8 relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl transform rotate-1 hover:rotate-0 transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Smart CV</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">AI POWERED</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">VERIFIED</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#050505]/60 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-slate-400">Habilidad Técnica</div>
                      <div className="text-xs text-emerald-400 font-mono">100% VERIFIED</div>
                    </div>
                    <div className="font-bold text-white text-lg">Desarrollo Blockchain</div>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[95%]"></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#050505]/60 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-slate-400">Soft Skill</div>
                      <div className="text-xs text-emerald-400 font-mono">PEER REVIEWED</div>
                    </div>
                    <div className="font-bold text-white text-lg">Liderazgo de Equipos</div>
                    <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-[88%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <User size={14} />
                <span>PARA ESTUDIANTES</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Tu Carrera, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Impulsada por IA
                </span>
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Smart CV analiza tus credenciales verificadas y genera un perfil profesional optimizado para los algoritmos de reclutamiento. No solo digas lo que sabes, demuéstralo matemáticamente.
              </p>
              
              <Link 
                to="/student/smart-cv"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 group"
              >
                Crear mi Smart CV
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Employers Section */}
      <section className="relative py-24 container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Building2 size={14} />
              <span>PARA EMPLEADORES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Contratación basada en <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Verdad Criptográfica
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Accede a una red de talento donde cada habilidad ha sido validada en la blockchain. Elimina el fraude y reduce el tiempo de verificación a cero.
            </p>
            
            <Link 
              to="/employer/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-purple-500/20 group"
            >
              Buscar Talento Verificado
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
             <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
             <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative">
               <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                 <div>
                   <div className="text-xs text-purple-400 font-mono mb-1">CANDIDATE MATCH</div>
                   <div className="text-xl font-bold text-white">Sofia R.</div>
                 </div>
                 <div className="text-right">
                   <div className="text-3xl font-bold text-emerald-400">98%</div>
                   <div className="text-xs text-slate-500">MATCH SCORE</div>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-300">Solidity Dev</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[98%]"></div>
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-300">React Architecture</span>
                    <ShieldCheck size={16} className="text-emerald-400" />
                 </div>
                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 w-[92%]"></div>
                 </div>
               </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Holographic Sandbox */}
      <section className="py-24 container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B0B15]">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/5 to-cyan-900/10"></div>
          
          <div className="relative z-10 p-12 md:p-20 text-center">
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Zona de Pruebas <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Holográfica</span>
            </h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg">
              Experimenta la emisión y verificación en tiempo real sin compromisos. Acceso instantáneo al entorno sandbox.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link 
                to="/demo/institution" 
                className="px-8 py-4 bg-[#0F172A] border border-cyan-500/30 rounded-xl text-cyan-50 font-bold hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all"
              >
                Simular Institución
              </Link>
              <Link 
                to="/portal-creadores" 
                className="px-8 py-4 bg-[#0F172A] border border-pink-500/30 rounded-xl text-pink-50 font-bold hover:border-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all"
              >
                Simular Creador
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />
      
    </div>
  );
};

export default HomePage;
