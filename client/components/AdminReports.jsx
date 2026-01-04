import React from 'react';
import AdminAPI from './services/adminAPI';

const AdminReports = () => {
  const download = (path) => {
    const url = AdminAPI.reportUrl(path);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reportes y descargas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
          <div className="font-semibold text-gray-800 mb-2">CSV: Credenciales y Anclajes</div>
          <p className="text-sm text-gray-600 mb-4">Listado de credenciales con indicadores de anclaje en XRPL y Algorand.</p>
          <button className="btn-primary" onClick={() => download('/api/admin/reports/credentials.csv')}>Descargar CSV</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
          <div className="font-semibold text-gray-800 mb-2">CSV: Reporte de Cumplimiento</div>
          <p className="text-sm text-gray-600 mb-4">Reporte para auditorías sobre cobertura de anclajes por credencial.</p>
          <button className="btn-primary" onClick={() => download('/api/admin/reports/compliance.csv')}>Descargar CSV</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
          <div className="font-semibold text-gray-800 mb-2">PDF: Estadísticas de Respaldo</div>
          <p className="text-sm text-gray-600 mb-4">Resumen de credenciales totales, triple respaldo y Hedera-only.</p>
          <button className="btn-primary" onClick={() => download('/api/admin/reports/backup-stats.pdf')}>Descargar PDF</button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

