import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { motion } from 'framer-motion';
import { Lock, Mail, Loader2, AlertTriangle, ArrowRight, User, Building, Briefcase, GraduationCap } from 'lucide-react';

const LoginPage = ({ userType = 'student', mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, registerInstitution, registerCreator, registerEmployer } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email || !password) {
      setError('Ingresa correo y contraseña');
      setIsSubmitting(false);
      return;
    }

    (async () => {
      try {
        let ok = false;
        if (mode === 'register') {
          if (userType === 'institution') {
            ok = await registerInstitution(email, password);
          } else if (userType === 'creator') {
            ok = await registerCreator(email, password);
          } else if (userType === 'employer') {
            ok = await registerEmployer(email, password);
          } else {
            ok = await register(email, password);
          }
        } else {
          ok = await login(email, password, userType);
        }
        if (!ok) throw new Error('Credenciales inválidas');
        const params = new URLSearchParams(location.search);
        const nextParam = params.get('next');
        const stateFrom = location.state?.from?.pathname;
        const target = nextParam || stateFrom || (
          userType === 'institution' ? '/institution/dashboard' : 
          userType === 'creator' ? '/portal-creadores' : 
          userType === 'student' ? '/student/portal' : 
          userType === 'employer' ? '/employer/dashboard' : '/'
        );
        navigate(target, { replace: true });
      } catch (e) {
        setError(e.message || 'Error de inicio de sesión');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const getTitle = () => {
    if (mode === 'register') return 'Crear Cuenta';
    return 'Iniciar Sesión';
  }

  const getSubtitle = () => {
    if (userType === 'institution') return 'Acceso Institucional';
    if (userType === 'creator') return 'Acceso Creadores';
    if (userType === 'employer') return 'Acceso Empresas';
    return 'Acceso Estudiantes';
  }

  const getUserIcon = () => {
    if (userType === 'institution') return <Building size={32} strokeWidth={1.5} className="text-white" />;
    if (userType === 'creator') return <User size={32} strokeWidth={1.5} className="text-white" />;
    if (userType === 'employer') return <Briefcase size={32} strokeWidth={1.5} className="text-white" />;
    return <GraduationCap size={32} strokeWidth={1.5} className="text-white" />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#050505] selection:bg-emerald-500/30 font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
          {/* Decorative gradient border top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-50"></div>
          
          <div className="text-center mb-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto h-16 w-16 bg-gradient-to-br from-slate-800 to-black rounded-xl border border-white/10 flex items-center justify-center mb-6 shadow-lg group relative"
            >
              <div className="absolute inset-0 bg-white/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {getUserIcon()}
            </motion.div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              {getTitle()}
            </h2>
            <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
              {getSubtitle()}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 text-sm"
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email-address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} strokeWidth={1.5} />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 placeholder-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} strokeWidth={1.5} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 placeholder-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-black bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-300 transform hover:scale-[1.02] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5 text-black" strokeWidth={1.5} />
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {mode === 'register' ? 'Registrar Cuenta' : 'Acceder al Portal'}
                    <ArrowRight size={18} strokeWidth={1.5} />
                  </span>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Protegido por criptografía de grado institucional.
              <br />
              <span className="text-slate-600">AcademicChain Ledger Protocol v2.0</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
