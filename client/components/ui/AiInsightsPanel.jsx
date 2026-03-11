import React from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, Zap, CheckCircle2, XCircle } from 'lucide-react';

const AiInsightsPanel = ({ analysis, onFixRequest }) => {
  if (!analysis) return null;

  const { riskScore, issues } = analysis.details.analysis;
  const { gas } = analysis.details;
  const isSafe = analysis.status === 'safe';

  // Helper para color de score
  const getScoreColor = (score) => {
    if (score > 0.7) return 'text-rose-400';
    if (score > 0.3) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-lg shadow-cyan-900/10 overflow-hidden mb-8 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-50 group-hover:opacity-70 transition-opacity"></div>
      
      <div className="relative z-10 bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30">
            <Sparkles className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">AI Assistant (Pre-Validator)</h3>
            <p className="text-xs text-cyan-400/70 uppercase tracking-wider font-semibold">Gemini 2.0 Flash Powered</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
          isSafe 
            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' 
            : 'bg-amber-950/30 text-amber-400 border-amber-500/30'
        }`}>
          {isSafe ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {isSafe ? 'VALIDACIÓN EXITOSA' : 'ATENCIÓN REQUERIDA'}
        </div>
      </div>

      <div className="relative z-10 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidence Score */}
        <div className="text-center p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group/item">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-2">
            <ShieldCheck size={16} className="text-slate-500 group-hover/item:text-cyan-400 transition-colors" />
            Confidence Score
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(riskScore)} font-mono`}>
            {((1 - riskScore) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wide">Nivel de Seguridad</div>
        </div>

        {/* Gas Optimizer */}
        <div className="text-center p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group/item">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-2">
            <Zap size={16} className="text-slate-500 group-hover/item:text-yellow-400 transition-colors" />
            Gas Optimizer
          </div>
          <div className="flex justify-center items-end gap-4 my-1">
            <div className="text-center">
              <div className="font-bold text-slate-200 text-lg">{gas.hbar} ℏ</div>
              <div className="text-[10px] text-slate-500 uppercase">Hedera</div>
            </div>
            <div className="text-slate-700 text-xl font-light">|</div>
            <div className="text-center">
              <div className="font-bold text-slate-200 text-lg">{gas.algo} A</div>
              <div className="text-[10px] text-slate-500 uppercase">Algorand</div>
            </div>
          </div>
          <div className="text-xs text-emerald-400 mt-2 font-semibold bg-emerald-950/20 px-2 py-0.5 rounded-full inline-block border border-emerald-500/20">
            Est. Total: ${gas.totalUSD} USD
          </div>
        </div>

        {/* Legal Match */}
        <div className="text-center p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group/item">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-2">
            <CheckCircle2 size={16} className="text-slate-500 group-hover/item:text-blue-400 transition-colors" />
            Legal Match
          </div>
          <div className="text-4xl font-bold text-blue-400 font-mono">
            {issues.length === 0 ? '100%' : `${(100 - (issues.length * 10)).toFixed(0)}%`}
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-wide">Integridad de Identidad</div>
        </div>
      </div>

      {/* Issues List */}
      {!isSafe && issues.length > 0 && (
        <div className="relative z-10 px-6 pb-6">
          <div className="bg-amber-950/10 border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} />
              Anomalías Detectadas ({issues.length})
            </h4>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm bg-slate-900/80 p-3 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-colors">
                  <XCircle className="text-rose-500 mt-0.5 shrink-0" size={16} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-200 mb-1">
                      Registro #{issue.index + 1}: <span className="text-amber-300">{issue.type === 'typo_suspicion' ? 'Posible error tipográfico' : 'Nombre sospechoso'}</span>
                    </div>
                    <div className="text-slate-400 flex flex-wrap items-center gap-2 text-xs">
                      <span>Valor actual:</span>
                      <span className="font-mono text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-500/20">{issue.value}</span>
                      <span className="text-slate-600">→</span>
                      <span>Sugerencia:</span>
                      <span className="font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20">{issue.suggestion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {onFixRequest && (
               <div className="mt-4 text-right">
                 <button 
                   onClick={onFixRequest} 
                   className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 ml-auto"
                 >
                   <Sparkles size={14} />
                   Corregir automáticamente con AI
                 </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInsightsPanel;
