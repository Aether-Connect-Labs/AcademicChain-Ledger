import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { authService } from './authService';
import { User, Mail, Wallet, Save, Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [hederaAccountId, setHederaAccountId] = useState(user?.hederaAccountId || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await authService.updateProfile({ name, hederaAccountId });
      setMessage('Perfil actualizado correctamente');
    } catch (e) {
      setMessage('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 p-4 md:p-8 font-sans selection:bg-cyan-500/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto relative z-10"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <User className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Mi Perfil</h1>
            <p className="text-slate-400">Gestiona tu información personal y configuración de cuenta.</p>
          </div>
        </div>

        <div className="bg-[#0d0d0d]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative shine */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <User className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                Nombre Completo
              </label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                Correo Electrónico
              </label>
              <input 
                value={email} 
                disabled 
                className="w-full bg-[#111] border border-white/5 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" strokeWidth={1.5} />
                El correo electrónico es gestionado por el proveedor de identidad.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Wallet className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                Cuenta Hedera (Testnet)
              </label>
              <input 
                value={hederaAccountId} 
                onChange={e => setHederaAccountId(e.target.value)} 
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all font-mono" 
                placeholder="0.0.xxxxxx" 
              />
              <p className="text-xs text-slate-500 mt-2">
                Conecta tu cuenta de Hedera para recibir credenciales directamente en tu wallet.
              </p>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              {message ? (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-sm font-medium ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}
                >
                  {message}
                </motion.span>
              ) : <span></span>}

              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" strokeWidth={1.5} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;