import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Shield, Globe } from 'lucide-react';

const PlanUpgrade = ({ open, onClose, currentPlan = 'basic' }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
          >
            {/* Gradient Line */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" strokeWidth={1.5} />
                    Mejora tu Plan
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Desbloquea todo el potencial de AcademicChain</p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {currentPlan === 'basic' ? (
                    <>Sube a <span className="text-white font-bold">Professional</span> para desbloquear XRP Ledger y aumentar la confianza de tus certificados con doble validación.</>
                  ) : (
                    <>Sube a <span className="text-white font-bold">Enterprise</span> para habilitar Algorand y lograr el triple blindaje blockchain definitivo.</>
                  )}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Shield className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Profesional</div>
                      <div className="text-xs text-slate-500">Hedera + XRP</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">$154</div>
                    <div className="text-[10px] text-slate-500">/ mes</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Globe className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Enterprise</div>
                      <div className="text-xs text-slate-500">Hedera + XRP + Algorand</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">Custom</div>
                    <div className="text-[10px] text-slate-500">Consultar</div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-500 mt-4 px-1">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p>Incluye almacenamiento descentralizado con IPFS y respaldo permanente en Filecoin.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                >
                  Cerrar
                </button>
                <Link 
                  to="/pricing" 
                  className="flex-[2] py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-center shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                >
                  Ver Planes Completos
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PlanUpgrade;