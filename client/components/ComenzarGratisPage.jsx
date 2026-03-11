import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Check, 
  Video, 
  Building, 
  ArrowRight, 
  Shield, 
  Zap,
  Globe,
  UserPlus
} from 'lucide-react';

const ComenzarGratisPage = () => {
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    const base = '/institution/register';
    const next = 'next=/institution/dashboard';
    const emailParam = superAdminEmail ? `super_admin_email=${encodeURIComponent(superAdminEmail)}` : '';
    const qs = [emailParam, next].filter(Boolean).join('&');
    navigate(`${base}?${qs}`);
  };

  const steps = [
    "Regístrate con tu correo institucional",
    "Configura tu institución y departamentos",
    "Emite tu primera credencial",
    "Comparte el QR y verifica"
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold mb-6 backdrop-blur-md">
            <Rocket className="w-3 h-3" />
            PLAN GRATUITO DE POR VIDA
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Empieza en minutos, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              sin costo alguno
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Emite y verifica tus primeras credenciales con límites generosos. Escala a medida que creces sin compromisos.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          
          {/* Card 1: What's Included */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-green-500/30 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-green-500" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-6 group-hover:scale-110 transition-transform relative z-10">
              <Check className="w-6 h-6 text-green-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-white mb-4 relative z-10">Incluido Gratis</h2>
            <ul className="space-y-3 relative z-10">
              {[
                "Emisión de credenciales limitadas",
                "Verificación instantánea vía QR",
                "Portal para alumnos y empleadores",
                "API básica de integración"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card 2: Creators */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Video className="w-24 h-24 text-purple-500" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6 group-hover:scale-110 transition-transform relative z-10">
              <Video className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-white mb-4 relative z-10">¿Eres Creador?</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed relative z-10">
              Emite certificaciones de tus cursos, mentorías y bootcamps sin burocracia. Ideal para la economía digital.
            </p>
            <div className="flex flex-col gap-3 relative z-10">
              <Link 
                to="/creators/register" 
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm text-center transition-colors shadow-lg shadow-purple-900/20"
              >
                Comenzar como Creador
              </Link>
              <Link 
                to="/creators" 
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm text-center transition-colors border border-white/5"
              >
                Ver beneficios
              </Link>
            </div>
          </motion.div>

          {/* Card 3: Steps */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Globe className="w-24 h-24 text-blue-500" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 group-hover:scale-110 transition-transform relative z-10">
              <ArrowRight className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-white mb-4 relative z-10">Cómo comenzar</h2>
            <div className="space-y-4 relative z-10">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                    {i + 1}
                  </span>
                  <span className="text-slate-400 text-sm">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Action Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-[#0d0d0d] to-[#111] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Acceso al Panel de Autoridad</h3>
              </div>
              
              <p className="text-slate-400 mb-8">
                Ingresa el correo del super administrador de tu institución para habilitar el panel de control completo.
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="superadmin@institucion.edu"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
                
                <button 
                  onClick={handleCreateAccount} 
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <p className="text-xs text-slate-500 text-center mt-4">
                  Puedes continuar sin este campo, pero lo necesitarás para activar la "Gestión de Vigencia".
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link to="/precios" className="text-slate-500 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 group">
              ¿Buscas planes para empresas?
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ComenzarGratisPage;
