import React from 'react';

const AiInsightsPanel = ({ analysis, onFixRequest }) => {
  if (!analysis) return null;

  const { riskScore, confidence, issues } = analysis.details.analysis;
  const { gas } = analysis.details;
  const isSafe = analysis.status === 'safe';

  // Helper para color de score
  const getScoreColor = (score) => {
    if (score > 0.7) return 'text-red-600';
    if (score > 0.3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold text-indigo-900">AI Assistant (Pre-Validator)</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSafe ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {isSafe ? '✅ VALIDACIÓN EXITOSA' : '⚠️ ATENCIÓN REQUERIDA'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confidence Score */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Confidence Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(riskScore)}`}>
            {((1 - riskScore) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Nivel de Seguridad</div>
        </div>

        {/* Gas Optimizer */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Gas Optimizer</div>
          <div className="flex justify-center items-end gap-2">
            <div>
              <div className="font-bold text-gray-800">{gas.hbar} ℏ</div>
              <div className="text-xs text-gray-400">Hedera</div>
            </div>
            <div className="text-gray-300">|</div>
            <div>
              <div className="font-bold text-gray-800">{gas.algo} A</div>
              <div className="text-xs text-gray-400">Algorand</div>
            </div>
          </div>
          <div className="text-xs text-green-600 mt-1 font-semibold">Est. Total: ${gas.totalUSD} USD</div>
        </div>

        {/* Legal Match */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Legal Match</div>
          <div className="text-3xl font-bold text-blue-600">
            {issues.length === 0 ? '100%' : `${(100 - (issues.length * 10)).toFixed(0)}%`}
          </div>
          <div className="text-xs text-gray-400 mt-1">Integridad de Identidad</div>
        </div>
      </div>

      {/* Issues List */}
      {!isSafe && issues.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-bold text-yellow-800 mb-2">Anomalías Detectadas ({issues.length})</h4>
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm bg-white p-2 rounded border border-yellow-100">
                  <span className="text-red-500 mt-0.5">●</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      Registro #{issue.index + 1}: {issue.type === 'typo_suspicion' ? 'Posible error tipográfico' : 'Nombre sospechoso'}
                    </div>
                    <div className="text-gray-600">
                      Valor actual: <span className="font-mono text-red-600 bg-red-50 px-1 rounded">{issue.value}</span>
                      {' → '}
                      Sugerencia: <span className="font-mono text-green-600 bg-green-50 px-1 rounded">{issue.suggestion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {onFixRequest && (
               <div className="mt-3 text-right">
                 <button onClick={onFixRequest} className="text-sm text-blue-600 hover:text-blue-800 underline font-medium">
                   Corregir automáticamente (Demo)
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
