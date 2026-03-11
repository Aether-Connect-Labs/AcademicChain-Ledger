import React, { useState } from 'react';
import developerService from './services/developerService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Key, 
  Lock, 
  Shield, 
  Terminal, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Server,
  Database,
  User,
  Mail,
  ArrowRight,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

const DeveloperPortal = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState('free');
  const [verifyToken, setVerifyToken] = useState('');
  const [jwt, setJwt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('register');

  const handleAction = async (actionFn, successMsg) => {
    setLoading(true);
    setMessage('');
    try {
      const result = await actionFn();
      // If the function returns data, use it if needed, otherwise just set success message
      setMessage({ type: 'success', text: successMsg || 'Operación exitosa' });
      return result;
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Error en la operación' });
    } finally {
      setLoading(false);
    }
  };

  const register = () => handleAction(async () => {
    const data = await developerService.register({ email, name, password, plan });
    setVerifyToken(data?.data?.verificationToken || '');
    setActiveTab('verify');
    return 'Registro creado. Por favor verifica tu email.';
  }, 'Registro creado. Por favor verifica tu email.');

  const verifyEmail = () => handleAction(async () => {
    const data = await developerService.verifyEmail(verifyToken);
    setActiveTab('login');
    return data.message || 'Email verificado exitosamente';
  }, 'Email verificado exitosamente');

  const login = () => handleAction(async () => {
    const data = await developerService.login(email, password);
    setJwt(data?.data?.token || '');
    return 'Inicio de sesión exitoso';
  }, 'Inicio de sesión exitoso');

  const issueKey = () => handleAction(async () => {
    const data = await developerService.issueApiKey(jwt);
    setApiKey(data?.data?.apiKey || '');
    return 'API Key generada correctamente';
  }, 'API Key generada correctamente');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copiado al portapapeles' });
  };

  const tabs = [
    { id: 'register', label: 'Registro', icon: User },
    { id: 'verify', label: 'Verificar', icon: CheckCircle },
    { id: 'login', label: 'Acceso', icon: Lock },
    { id: 'apikey', label: 'API Key', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-6 backdrop-blur-md">
            <Terminal className="w-3 h-3" />
            DEVELOPER CONSOLE
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Construye el Futuro <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              Descentralizado
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Accede a nuestras APIs de verificación blockchain. Integra credenciales inmutables en tus aplicaciones en minutos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border ${
                  activeTab === tab.id 
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]' 
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            ))}

            {/* Status Message */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-6 p-4 rounded-xl border ${
                    message.type === 'error' 
                      ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                      : 'bg-green-500/10 border-green-500/30 text-green-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#0d0d0d]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient blob */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]"></div>

              {activeTab === 'register' && (
                <div className="space-y-6 max-w-lg">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <User className="w-6 h-6 text-cyan-400" />
                      Crear Cuenta de Desarrollador
                    </h2>
                    <p className="text-slate-400">Comienza a construir gratis hoy mismo.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                          placeholder="dev@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                          placeholder="••••••••"
                        />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Inicial</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['free', 'startup', 'enterprise'].map((p) => (
                          <button
                            key={p}
                            onClick={() => setPlan(p)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${
                              plan === p 
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                                : 'bg-[#050505] border-white/10 text-slate-400 hover:bg-white/5'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={register}
                    disabled={loading}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Registrar Cuenta
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'verify' && (
                <div className="space-y-6 max-w-lg">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      Verificar Email
                    </h2>
                    <p className="text-slate-400">Ingresa el token que enviamos a tu correo.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Token de Verificación</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text" 
                        value={verifyToken}
                        onChange={(e) => setVerifyToken(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                        placeholder="VERIFICATION-TOKEN"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={verifyEmail}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Verificar Ahora
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'login' && (
                <div className="space-y-6 max-w-lg">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <Lock className="w-6 h-6 text-purple-400" />
                      Acceso Seguro
                    </h2>
                    <p className="text-slate-400">Ingresa a tu panel de control.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={login}
                    disabled={loading}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Iniciar Sesión
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {jwt && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Token (JWT)</span>
                        <button onClick={() => copyToClipboard(jwt)} className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1">
                          <Copy className="w-3 h-3" /> Copiar
                        </button>
                      </div>
                      <div className="text-xs font-mono text-slate-500 break-all bg-[#050505] p-3 rounded-lg border border-white/5 max-h-24 overflow-y-auto custom-scrollbar">
                        {jwt}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeTab === 'apikey' && (
                <div className="space-y-6 max-w-lg">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <Key className="w-6 h-6 text-yellow-400" />
                      Gestión de API Keys
                    </h2>
                    <p className="text-slate-400">Genera credenciales para tus aplicaciones.</p>
                  </div>

                  {!jwt ? (
                    <div className="p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-200 flex flex-col items-center text-center gap-4">
                      <Lock className="w-12 h-12 text-yellow-500/50" />
                      <div>
                        <h3 className="font-bold mb-1">Autenticación Requerida</h3>
                        <p className="text-sm opacity-80">Debes iniciar sesión primero para gestionar tus API Keys.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('login')}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-sm font-bold transition-colors"
                      >
                        Ir al Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
                        <div className="flex items-center gap-2 mb-2 font-bold">
                          <Shield className="w-4 h-4" />
                          Seguridad
                        </div>
                        Las API Keys tienen permisos de lectura y escritura sobre tus credenciales. Mantenlas seguras y no las compartas en repositorios públicos.
                      </div>

                      <button 
                        onClick={issueKey}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Generar Nueva API Key
                            <Zap className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {apiKey && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 p-6 rounded-xl bg-[#050505] border border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.2)]"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                              <Key className="w-4 h-4" /> Tu API Key
                            </span>
                            <button onClick={() => copyToClipboard(apiKey)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-mono text-lg text-white break-all bg-white/5 p-4 rounded-lg border border-white/10">
                            {apiKey}
                          </div>
                          <p className="mt-3 text-xs text-slate-500 text-center">
                            Esta llave se mostrará una sola vez. Guárdala en un lugar seguro.
                          </p>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPortal;
