import React from 'react';
import IssueTitleForm from './IssueTitleForm';
import UploadExcelForm from './UploadExcelForm';

function InstitutionDashboard() {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Dashboard de la Institución</h1>
      <p className="text-gray-600">Bienvenido al portal de la institución. Aquí podrás emitir títulos y subir archivos Excel.</p>
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