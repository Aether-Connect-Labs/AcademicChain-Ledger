import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Rocket, 
  Gem, 
  Check, 
  ArrowRight, 
  Zap, 
  Globe 
} from 'lucide-react';

const CreatorsPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-6 backdrop-blur-md">
              <Rocket className="w-3 h-3" strokeWidth={1.5} />
              ECONOMÍA DEL CREADOR
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Certifica tu Conocimiento y <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Marca Personal
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Otorga valor real y verificable a tus cursos, mentorías y talleres en sectores sin jurisdicción tradicional.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/creators/register" 
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link 
                to="/agenda" 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl backdrop-blur-sm transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                Agendar Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Potencia tu Comunidad</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              La educación descentralizada necesita confianza. AcademicChain Ledger te permite emitir credenciales inmutables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <GraduationCap className="w-8 h-8 text-purple-400" strokeWidth={1.5} />,
                title: "Valor Educativo",
                desc: "Transforma tus cursos y talleres en certificaciones con respaldo tecnológico, aumentando la tasa de finalización y el valor percibido.",
                color: "purple"
              },
              {
                icon: <Zap className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />,
                title: "Sin Burocracia",
                desc: "Ideal para sectores emergentes y sin jurisdicción oficial. Tú defines los estándares, la blockchain garantiza la autenticidad.",
                color: "cyan"
              },
              {
                icon: <Gem className="w-8 h-8 text-pink-400" strokeWidth={1.5} />,
                title: "Marca Personal",
                desc: "Refuerza tu autoridad. Cada certificado emitido lleva tu firma digital y fortalece tu posicionamiento como experto.",
                color: "pink"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-white/10 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/20 mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-[#0d0d0d]/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Ideal Para</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Mentores de Negocios', icon: <Globe className="w-5 h-5" /> },
              { label: 'Creadores de Cursos', icon: <Rocket className="w-5 h-5" /> },
              { label: 'Influencers Educativos', icon: <Zap className="w-5 h-5" /> },
              { label: 'Bootcamps Tech', icon: <GraduationCap className="w-5 h-5" /> }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-center justify-center gap-3 text-slate-300 font-bold hover:text-white hover:border-purple-500/30 transition-all cursor-default"
              >
                <span className="text-purple-500">{item.icon}</span>
                {item.label}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatorsPage;
