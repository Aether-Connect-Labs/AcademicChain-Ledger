import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle, 
  Calendar, 
  UserCheck, 
  Mail, 
  Shield, 
  Loader2, 
  ArrowRight, 
  Lock,
  X,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiService from './services/apiService';

const CreatorSubscriptionModal = ({ onClose, onSubscribe, currentPlanId, initialPlanId }) => {
  const [step, setStep] = useState(initialPlanId ? 'auth_choice' : 'plans'); // plans, auth_choice, login, reset
  const [selectedPlan, setSelectedPlan] = useState(initialPlanId || null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const plans = [
    {
      id: 'creator-base',
      name: 'Creador Base',
      price: '$50',
      period: '/mes',
      description: 'Tus cursos ahora tienen validez criptográfica inmediata.',
      features: [
        'Sello de Autor exclusivo en Hedera',
        '50 Emisiones / mes',
        'Certificados de Habilidades',
        'Validez inmediata',
        'Panel de gestión simplificado'
      ],
      color: 'cyan',
      recommended: false
    },
    {
      id: 'creator-pro',
      name: 'Creador Pro',
      price: 'A medida',
      period: '',
      description: 'Para creadores con miles de alumnos y academias online.',
      features: [
        'Redes: Hedera + XRP + Algorand',
        'Conexión directa a Buscador de Talentos',
        'Alumnos destacados aparecen primero',
        'Emisiones masivas automatizadas',
        'API de integración LMS'
      ],
      color: 'indigo',
      recommended: true
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    setStep('auth_choice');
  };

  const checkEmail = async () => {
    if (!email.includes('@')) {
        setAuthError('Email inválido');
        return;
    }
    setLoading(true);
    setAuthError('');
    try {
        const { exists } = await apiService.checkCreatorAccount(email);
        if (exists) {
            setStep('login_password');
        } else {
            setAuthError('Cuenta no encontrada. ¿Deseas agendar una demo?');
        }
    } catch (e) {
        setAuthError('Error al verificar cuenta');
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    // Simulate login check
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onSubscribe(selectedPlan); // Proceed with subscription
    onClose();
    toast.success('Sesión iniciada. Procesando suscripción...', {
        style: {
            background: '#050505',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
        }
    });
  };

  const handleResetPassword = async () => {
    setLoading(true);
    await apiService.requestPasswordReset(email, 'creator');
    setLoading(false);
    toast.success('Enlace de recuperación enviado a tu correo', {
        style: {
            background: '#050505',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
        }
    });
    setStep('login_password'); // Go back to login or stay
  };

  const renderContent = () => {
    switch (step) {
        case 'plans':
            return (
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                  {plans.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    return (
                      <div key={plan.id} className={`p-8 relative group transition-colors flex flex-col ${plan.recommended ? 'bg-indigo-900/10' : 'hover:bg-white/5'}`}>
                        {plan.recommended && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-xl shadow-lg shadow-indigo-900/50 z-10">
                            RECOMENDADO
                          </div>
                        )}

                        <div className="mb-8 text-center">
                          <div className={`text-sm font-bold mb-2 uppercase tracking-wider text-${plan.color}-400`}>
                            {plan.name}
                          </div>
                          <div className="flex items-baseline justify-center gap-1 mb-4">
                            <span className="text-4xl font-black text-white">{plan.price}</span>
                            <span className="text-slate-500 font-medium">{plan.period}</span>
                          </div>
                          <p className="text-sm text-slate-400 h-10 leading-relaxed">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                              <CheckCircle size={18} strokeWidth={1.5} className={`text-${plan.color}-500 shrink-0 mt-0.5`} />
                              <span dangerouslySetInnerHTML={{ __html: feat.replace(/\((.*?)\)/g, '<strong class="text-white">$1</strong>') }}></span>
                            </li>
                          ))}
                        </ul>

                        <button 
                          onClick={() => !isCurrent && handlePlanSelect(plan.id)}
                          disabled={isCurrent}
                          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                            ${isCurrent 
                              ? 'bg-white/5 text-slate-500 cursor-default border border-white/5' 
                              : plan.recommended 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/20' 
                                : 'bg-white text-black hover:bg-slate-200 shadow-white/5'
                            }`}
                        >
                          {isCurrent ? 'Plan Actual' : plan.id === 'creator-pro' ? 'Contactar Ventas' : 'Seleccionar Plan'}
                          {!isCurrent && <ArrowRight className="w-4 h-4" strokeWidth={2} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
            );

        case 'auth_choice':
            return (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-10 flex flex-col items-center justify-center min-h-[400px]"
                >
                    <h3 className="text-2xl font-bold text-white mb-8">¿Cómo deseas continuar?</h3>
                    <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
                        <button 
                            onClick={() => window.open('https://calendly.com/academic-chain-demo', '_blank')}
                            className="flex flex-col items-center p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all group"
                        >
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar size={32} strokeWidth={1.5} className="text-blue-400" />
                            </div>
                            <span className="text-xl font-bold text-white mb-2">Agendar Demo</span>
                            <span className="text-sm text-slate-400 text-center">Habla con un experto y descubre el potencial.</span>
                        </button>

                        <button 
                            onClick={() => setStep('login_email')}
                            className="flex flex-col items-center p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UserCheck size={32} strokeWidth={1.5} className="text-purple-400" />
                            </div>
                            <span className="text-xl font-bold text-white mb-2">Ya tengo cuenta</span>
                            <span className="text-sm text-slate-400 text-center">Inicia sesión para procesar tu suscripción.</span>
                        </button>
                    </div>
                    <button onClick={() => setStep('plans')} className="mt-8 text-slate-500 hover:text-white text-sm underline transition-colors">
                        Volver a planes
                    </button>
                </motion.div>
            );

        case 'login_email':
            return (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-10 max-w-md mx-auto min-h-[400px] flex flex-col justify-center"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">Verificar Cuenta</h3>
                    <p className="text-slate-400 mb-6">Ingresa tu correo de creador para continuar.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} strokeWidth={1.5} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                                    placeholder="creador@ejemplo.com"
                                />
                            </div>
                        </div>

                        {authError && (
                            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
                                <Shield size={14} strokeWidth={1.5} />
                                {authError}
                            </div>
                        )}

                        <button 
                            onClick={checkEmail}
                            disabled={loading || !email}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Continuar'}
                            {!loading && <ArrowRight size={18} strokeWidth={2} />}
                        </button>
                    </div>

                    <button onClick={() => setStep('auth_choice')} className="mt-6 text-slate-500 hover:text-white text-sm text-center w-full transition-colors">
                        Volver
                    </button>
                </motion.div>
            );

        case 'login_password':
            return (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-10 max-w-md mx-auto min-h-[400px] flex flex-col justify-center"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h3>
                    <p className="text-slate-400 mb-6">Ingresa tu contraseña para confirmar.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} strokeWidth={1.5} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#050505] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button 
                                onClick={handleResetPassword}
                                className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 block text-right transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button 
                            onClick={handleLogin}
                            disabled={loading || !password}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión y Suscribir'}
                        </button>
                    </div>

                    <button onClick={() => setStep('login_email')} className="mt-6 text-slate-500 hover:text-white text-sm text-center w-full transition-colors">
                        Cambiar cuenta
                    </button>
                </motion.div>
            );

        default:
            return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 my-8 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Sparkles className="text-cyan-400" size={20} strokeWidth={1.5} />
                        </div>
                        Planes para Creadores
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Escala tu impacto educativo con tecnología blockchain.</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                >
                    <X size={20} strokeWidth={1.5} />
                </button>
            </div>

            {/* Content */}
            <div className="bg-[#050505] min-h-[400px]">
                {renderContent()}
            </div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default CreatorSubscriptionModal;
