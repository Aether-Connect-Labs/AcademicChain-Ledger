import React from 'react';
import IssueTitleForm from './IssueTitleForm';
import UploadExcelForm from './UploadExcelForm';

const InstitutionDashboard = () =\u003e {
  return (
    \u003cdiv className="container mx-auto p-4"\u003e
      \u003ch1 className="text-2xl font-bold mb-4"\u003eDashboard de la Institución\u003c/h1\u003e
      \u003cp\u003eBienvenido al portal de la institución. Aquí podrás emitir títulos y subir archivos Excel.\u003c/p\u003e
      \u003cdiv className="mt-8"\u003e
        \u003cIssueTitleForm /\u003e
      \u003c/div\u003e
      \u003cdiv className="mt-8"\u003e
        \u003cUploadExcelForm /\u003e
      \u003c/div\u003e
    \u003c/div\u003e
  );
};

export default InstitutionDashboard;