import React from 'react';
import IssueTitleForm from './IssueTitleForm';
import UploadExcelForm from './UploadExcelForm';

function InstitutionDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard de la Institución</h1>
      <p>Bienvenido al portal de la institución. Aquí podrás emitir títulos y subir archivos Excel.</p>
      <div className="mt-8">
        <IssueTitleForm />
      </div>
      <div className="mt-8">
        <UploadExcelForm />
      </div>
    </div>
  );
}

export default InstitutionDashboard;