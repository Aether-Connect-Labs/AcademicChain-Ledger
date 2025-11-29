import React from 'react';

const IssuanceSummary = ({ summary, onExport }) => {
  const progress = typeof summary?.progress === 'number' ? Math.max(0, Math.min(100, summary.progress)) : null;
  return (
    <div className="border rounded p-3">
      <div className="font-semibold">Resumen</div>
      <div className="text-sm">Total: {summary?.total ?? 0}</div>
      <div className="text-sm">Exitosas: {summary?.successful ?? 0}</div>
      <div className="text-sm">Fallidas: {summary?.failed ?? 0}</div>
      <div className="text-sm">Estado: {summary?.status || 'idle'}</div>
      {progress != null && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded">
            <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">{progress}%</div>
        </div>
      )}
      {typeof onExport === 'function' && summary?.status === 'completed' && (
        <button className="btn-secondary btn-sm mt-3" onClick={onExport}>Exportar CSV</button>
      )}
    </div>
  );
};

export default IssuanceSummary;