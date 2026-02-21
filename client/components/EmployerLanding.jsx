import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Zap, Database, ArrowRight } from 'lucide-react';

const EmployerLanding = () => {
  const navigate = useNavigate();

  const handleStartSimulation = () => {
    // Set a flag to indicate simulation mode if needed, though dashboard is now open
    localStorage.setItem('acl:simulationMode', 'true');
    navigate('/employer/dashboard');
  };

  const features = [
    {
      icon: <Search className="w-6 h-6 text-blue-400" />,
      title: "Búsqueda Inteligente",
      description: "Encuentra talento verificado utilizando filtros avanzados de IA y palabras clave específicas."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: "Verificación Blockchain",
      description: "Garantía de autenticidad. Cada credencial y título es validado instantáneamente contra la red Hedera."
    },
    {
      icon: <Database className="w-6 h-6 text-purple-400" />,
      title: "Base de Datos Global",
      description: "Accede a un pool de talento internacional con certificaciones estandarizadas."
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Conexión Instantánea",
      description: "Contacta directamente con los candidatos sin intermediarios y gestiona tus procesos de selección."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
           <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-sm font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Nueva Experiencia de Contratación
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
              Contrata Talento <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Verificado por Blockchain
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              AcademicChain revoluciona el reclutamiento eliminando el fraude de títulos. 
              Accede a perfiles con credenciales inmutables y habilidades validadas técnicamente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/employer/dashboard"
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3"
              >
                Buscar Talento
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/instituciones"
                className="px-8 py-4 rounded-xl font-bold text-lg text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-700 transition-all"
              >
                Para Instituciones
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">¿Cómo funciona la simulación?</h2>
            <p className="text-slate-400">Prueba el poder de nuestra plataforma sin necesidad de registro previo.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-800 group-hover:border-blue-500/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview / CTA */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900/50 to-blue-900/50 rounded-3xl p-8 md:p-12 border border-indigo-500/30 relative overflow-hidden text-center">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">¿Listo para encontrar el candidato perfecto?</h2>
                <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
                    Entra al buscador de talentos y experimenta cómo la tecnología blockchain elimina la fricción en la contratación.
                </p>
                <button 
                    onClick={handleStartSimulation}
                    className="px-10 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-105"
                >
                    Buscar Talento
                </button>
            </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="py-8 border-t border-slate-900 text-center text-slate-500 text-sm">
        <p>© 2024 AcademicChain. Simulación de entorno empresarial.</p>
      </footer>

    </div>
  );
};

export default EmployerLanding;
