import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Zap, Database, ArrowRight, Briefcase, CheckCircle2, Users } from 'lucide-react';

const EmployerLanding = () => {
  const navigate = useNavigate();

  const handleStartSimulation = () => {
    localStorage.setItem('acl:simulationMode', 'true');
    navigate('/employer/dashboard');
  };

  const features = [
    {
      icon: Search,
      title: "Búsqueda Inteligente",
      description: "Encuentra talento verificado utilizando filtros avanzados de IA y palabras clave específicas.",
      color: "blue"
    },
    {
      icon: Shield,
      title: "Verificación Blockchain",
      description: "Garantía de autenticidad. Cada credencial y título es validado instantáneamente contra la red Hedera.",
      color: "green"
    },
    {
      icon: Database,
      title: "Base de Datos Global",
      description: "Accede a un pool de talento internacional con certificaciones estandarizadas y verificables.",
      color: "purple"
    },
    {
      icon: Zap,
      title: "Conexión Instantánea",
      description: "Contacta directamente con los candidatos sin intermediarios y gestiona tus procesos de selección.",
      color: "yellow"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 selection:bg-cyan-500/30 font-sans overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-sm font-bold mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Nueva Experiencia de Contratación
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-white">
              Contrata Talento <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                Verificado por Blockchain
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              AcademicChain revoluciona el reclutamiento eliminando el fraude de títulos. 
              Accede a perfiles con credenciales inmutables y habilidades validadas técnicamente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/employer/dashboard"
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-cyan-50 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(6,182,212,0.5)] flex items-center gap-3"
              >
                <Briefcase className="w-5 h-5" />
                Buscar Talento
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/instituciones"
                className="px-8 py-4 rounded-xl font-bold text-lg text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-700 transition-all flex items-center gap-3"
              >
                <Users className="w-5 h-5" />
                Para Instituciones
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-[#0d0d0d]/40 backdrop-blur-xl border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">¿Cómo funciona la simulación?</h2>
            <p className="text-slate-400 text-lg">Prueba el poder de nuestra plataforma sin necesidad de registro previo.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 rounded-2xl bg-[#0d0d0d] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/10"
              >
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-${feature.color}-500/20`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-400`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview / CTA */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-xl rounded-3xl p-8 md:p-16 border border-cyan-500/20 relative overflow-hidden text-center group">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-colors duration-500"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-500"></div>
            
            <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 mb-8 border border-cyan-500/30">
                    <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">¿Listo para encontrar el candidato perfecto?</h2>
                <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                    Entra al buscador de talentos y experimenta cómo la tecnología blockchain elimina la fricción en la contratación y garantiza la confianza.
                </p>
                <button 
                    onClick={handleStartSimulation}
                    className="px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/30 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                >
                    <Search className="w-5 h-5" />
                    Buscar Talento Ahora
                </button>
            </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">© 2024 AcademicChain. Simulación de entorno empresarial.</p>
      </footer>

    </div>
  );
};

export default EmployerLanding;
