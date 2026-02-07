import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Star, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentUpgradePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      toast.success('¡Plan Career Pro activado exitosamente!');
      navigate('/student/portal');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      
      <div className="max-w-lg w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 mb-4 border border-purple-500/30">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Career Pro</h1>
          <p className="text-slate-400">Potencia tu perfil profesional</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-700/50">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-4xl font-extrabold text-white">$9.99</span>
            <span className="text-slate-400">/ pago único</span>
          </div>
          
          <ul className="space-y-3">
            {[
              'Generación de Smart CV con IA',
              'Verificación de Identidad (KYC)',
              'Badge "Candidato Verificado"',
              'Prioridad en búsquedas de reclutadores',
              'Análisis de brecha de habilidades'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <Check className="w-5 h-5 text-green-400 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pagar y Activar
            </>
          )}
        </button>
        
        <p className="text-center text-xs text-slate-500 mt-4">
          <Shield className="w-3 h-3 inline mr-1" />
          Pago seguro procesado por Stripe
        </p>
      </div>
    </div>
  );
};

export default StudentUpgradePage;
