import React from 'react';

const IssuanceSummary = ({ summary }) => {
  return (
    <div className="border rounded p-3">
      <div className="font-semibold">Resumen</div>
      <div className="text-sm">Total: {summary?.total ?? 0}</div>
      <div className="text-sm">Exitosas: {summary?.successful ?? 0}</div>
      <div className="text-sm">Fallidas: {summary?.failed ?? 0}</div>
      <div className="text-sm">Estado: {summary?.status || 'idle'}</div>
    </div>
  );
};

export default IssuanceSummary;