import React from 'react';

const IssuanceSummary = ({ summary, onExport }) => {
  const progress = typeof summary?.progress === 'number' ? Math.max(0, Math.min(100, summary.progress)) : null;
  const total = summary?.total ?? 0;
  const ok = summary?.successful ?? 0;
  const ko = summary?.failed ?? 0;
  const dualOk = summary?.dualOk ?? 0;
  const dualPending = ok > dualOk ? (ok - dualOk) : 0;
  return (
    <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-bold text-lg text-gray-900 dark:text-white">Resumen de Emisión</div>
        <div className={`badge ${summary?.status === 'completed' ? 'badge-success' : summary?.status === 'failed' ? 'badge-error' : 'badge-info'}`}>{summary?.status || 'idle'}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 p-3">
          <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">{total}</div>
        </div>
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 p-3">
          <div className="text-xs text-green-700 dark:text-green-400">Exitosas</div>
          <div className="text-xl font-semibold text-green-800 dark:text-green-300">{ok}</div>
        </div>
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-3">
          <div className="text-xs text-red-700 dark:text-red-400">Fallidas</div>
          <div className="text-xl font-semibold text-red-800 dark:text-red-300">{ko}</div>
        </div>
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-3">
          <div className="text-xs text-blue-700 dark:text-blue-400">Emitidos</div>
          <div className="text-xl font-semibold text-blue-800 dark:text-blue-300">{dualOk}</div>
          {dualPending > 0 && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">En proceso: {dualPending}</div>}
        </div>
      </div>
      {progress != null && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded">
            <div className="h-2 bg-blue-600 dark:bg-blue-500 rounded" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{progress}%</div>
        </div>
      )}
      {typeof onExport === 'function' && summary?.status === 'completed' && (
        <div className="mt-4">
          <button className="btn-secondary btn-sm" onClick={onExport}>Exportar CSV</button>
        </div>
      )}
    </div>
  );
};

export default IssuanceSummary;