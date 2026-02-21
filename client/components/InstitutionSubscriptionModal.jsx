import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Shield, Globe, Calendar, UserCheck, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import n8nService from './services/n8nService';
import { toast } from 'react-hot-toast';

const InstitutionSubscriptionModal = ({ onClose, onSubscribe, currentPlanId }) => {
  const [step, setStep] = useState('plans'); // plans, auth_choice, login, reset
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const plans = [
    {
      id: 'esencial',
      name: 'Plan Esencial',
      price: '$50',
      period: '/mes',
      description: 'Para instituciones pequeñas iniciando en blockchain.',
      features: [
        '50 Emisiones / mes',
        'Red Hedera + IPFS',
        'Analíticas Básicas',
        'Soporte por Email'
      ],
      color: 'blue'
    },
    {
      id: 'professional',
      name: 'Plan Profesional',
      price: '$155',
      period: '/mes',
      recommended: true,
      description: 'El estándar para universidades modernas.',
      features: [
        '220 Emisiones / mes ($0.70/u)',
        'Doble Sello (Hedera + XRP)',
        'API de Integración',
        'Heatmap de Empleabilidad (IA)',
        'Soporte Prioritario'
      ],
      color: 'purple'
    },
    {
      id: 'enterprise',
      name: 'Plan Enterprise',
      price: 'A Medida',
      period: '',
      description: 'Para grandes redes educativas y ministerios.',
      features: [
        'Emisiones Ilimitadas',
        'Triple Sello (Hedera + XRP + Algo)',
        'Nodos Dedicados',
        'Soporte On-Premise 24/7',
        'Personalización Total'
      ],
      color: 'pink'
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
        const { exists } = await n8nService.checkInstitutionAccount(email);
        if (exists) {
            setStep('login_password');
        } else {
            // If email doesn't exist, we might want to let them create one or contact sales
            // User instruction: "si ya tiene una cuenta n8n revisara si ese correo existe y el tendra que poner su clave o crear una si se olvido"
            // Assuming "crear una si se olvido" refers to password reset/creation.
            // If account not found, maybe redirect to demo/signup?
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
    toast.success('Sesión iniciada. Procesando suscripción...');
  };

  const handleResetPassword = async () => {
    setLoading(true);
    await n8nService.requestPasswordReset(email);
    setLoading(false);
    toast.success('Enlace de recuperación enviado a tu correo');
    setStep('login_password'); // Go back to login or stay
  };

  const renderContent = () => {
    switch (step) {
        case 'plans':
            return (
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  {plans.map((plan) => {
                    const isCurrent = currentPlanId === plan.id;
                    return (
                      <div key={plan.id} className={`p-8 relative group ${plan.recommended ? 'bg-purple-900/10' : 'hover:bg-slate-800/30'} transition-colors flex flex-col`}>
                        {plan.recommended && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-bold px-4 py-1 rounded-b-xl shadow-lg shadow-purple-900/50">
                            MÁS POPULAR
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
                          <p className="text-sm text-slate-400 h-10">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                              <CheckCircle size={18} className={`text-${plan.color}-500 shrink-0 mt-0.5`} />
                              <span dangerouslySetInnerHTML={{ __html: feat.replace(/\((.*?)\)/g, '<strong class="text-white">$1</strong>') }}></span>
                            </li>
                          ))}
                        </ul>

                        <button 
                          onClick={() => !isCurrent && handlePlanSelect(plan.id)}
                          disabled={isCurrent}
                          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                            ${isCurrent 
                              ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700' 
                              : plan.recommended 
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-900/20' 
                                : 'bg-white text-slate-900 hover:bg-slate-200 shadow-white/5'
                            }`}
                        >
                          {isCurrent ? 'Plan Actual' : plan.id === 'enterprise' ? 'Contactar Ventas' : 'Seleccionar Plan'}
                          {!isCurrent && <span className="text-lg">→</span>}
                        </button>
                      </div>
                    );
                  })}
                </div>
            );

        case 'auth_choice':
            return (
                <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
                    <h3 className="text-2xl font-bold text-white mb-8">¿Cómo deseas continuar?</h3>
                    <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
                        <button 
                            onClick={() => window.open('https://calendly.com/academic-chain-demo', '_blank')}
                            className="flex flex-col items-center p-8 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl transition-all group"
                        >
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar size={32} className="text-blue-400" />
                            </div>
                            <span className="text-xl font-bold text-white mb-2">Agendar Demo</span>
                            <span className="text-sm text-slate-400 text-center">Habla con un experto y descubre el potencial.</span>
                        </button>

                        <button 
                            onClick={() => setStep('login_email')}
                            className="flex flex-col items-center p-8 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl transition-all group"
                        >
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UserCheck size={32} className="text-purple-400" />
                            </div>
                            <span className="text-xl font-bold text-white mb-2">Ya tengo cuenta</span>
                            <span className="text-sm text-slate-400 text-center">Inicia sesión para procesar tu actualización.</span>
                        </button>
                    </div>
                    <button onClick={() => setStep('plans')} className="mt-8 text-slate-500 hover:text-white text-sm underline">
                        Volver a planes
                    </button>
                </div>
            );

        case 'login_email':
            return (
                <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-full max-w-md">
                        <h3 className="text-2xl font-bold text-white mb-2 text-center">Bienvenido de nuevo</h3>
                        <p className="text-slate-400 text-center mb-8">Ingresa tu correo para verificar tu cuenta</p>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@institucion.edu"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
                            
                            <button 
                                onClick={checkEmail}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Continuar'} <ArrowRight size={20} />
                            </button>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <button onClick={() => setStep('auth_choice')} className="text-slate-500 hover:text-white text-sm">
                                Atrás
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'login_password':
            return (
                <div className="p-10 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-full max-w-md">
                        <h3 className="text-2xl font-bold text-white mb-2 text-center">Ingresa tu contraseña</h3>
                        <p className="text-slate-400 text-center mb-8">Para {email}</p>
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            
                            <button 
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión y Pagar'}
                            </button>

                            <button 
                                onClick={handleResetPassword}
                                className="w-full text-sm text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                ¿Olvidaste tu contraseña? Crear nueva.
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={() => setStep('login_email')} className="text-slate-500 hover:text-white text-sm">
                                Cambiar correo
                            </button>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-6xl w-full overflow-hidden my-8"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white z-10 transition-colors">
          <span className="text-2xl">✕</span>
        </button>
        
        <div className="p-10 text-center border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Escala tu Confianza Institucional
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Elige el nivel de seguridad y volumen que tu institución necesita. 
            <br className="hidden md:block" />
            No solo emites títulos, construyes reputación inmutable.
          </p>
        </div>
        
        {renderContent()}
        
        <div className="p-6 bg-slate-950 text-center border-t border-slate-800">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><Shield size={12}/> Auditoría Blockchain Incluida</span>
                <span className="flex items-center gap-1"><Globe size={12}/> Validez Internacional</span>
                <span className="flex items-center gap-1"><Zap size={12}/> Emisión en Milisegundos</span>
            </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InstitutionSubscriptionModal;
