import React from 'react';

const ErrorReport = ({ error, failedItems, onRetryFailed }) => {
  if (!error && (!failedItems || failedItems.length === 0)) return null;
  
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded">
      {error && <div>{String(error)}</div>}
      {failedItems && failedItems.length > 0 && (
        <div className="mt-2">
          <h4 className="font-bold">Items Fallidos ({failedItems.length})</h4>
          <ul className="list-disc pl-5 mt-1 text-sm">
            {failedItems.map((item, idx) => (
              <li key={idx}>
                {item.name || item.id || `Item ${idx + 1}`}: {item.error || 'Error desconocido'}
              </li>
            ))}
          </ul>
          {onRetryFailed && (
            <button onClick={onRetryFailed} className="mt-2 text-sm underline hover:text-red-900 dark:hover:text-red-100">
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorReport;
