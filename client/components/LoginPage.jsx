import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { motion } from 'framer-motion';

const LoginPage = ({ userType = 'student', mode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, registerInstitution, registerCreator } = useAuth();

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
          } else {
            ok = await register(email, password);
          }
        } else {
          ok = await login(email, password, userType);
        }
        if (!ok) throw new Error('Credenciales inválidas');
        const params = new URLSearchParams(location.search);
        const nextParam = params.get('next');
        const target = nextParam || (userType === 'institution' ? '/institution/dashboard' : userType === 'creator' ? '/portal-creadores' : userType === 'student' ? '/student/portal' : '/');
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
    return 'Acceso Estudiantes';
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel max-w-md w-full p-10 relative z-10 mx-auto"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-6 shadow-glow"
          >
            <span className="text-3xl">🔐</span>
          </motion.div>
          <h2 className="text-3xl font-extrabold font-display text-white">
            {getTitle()}
          </h2>
          <p className="mt-2 text-sm text-primary-400 font-mono tracking-wider uppercase">
            {getSubtitle()}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 placeholder-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none relative block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 placeholder-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-black bg-primary hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 transform hover:scale-[1.02] shadow-neon-blue ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                mode === 'register' ? 'Registrar Cuenta' : 'Acceder'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
