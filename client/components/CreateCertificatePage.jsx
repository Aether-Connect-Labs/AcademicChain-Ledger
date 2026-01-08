import React from 'react';
import IssueTitleForm from './IssueTitleForm.jsx';

const CreateCertificatePage = () => {
  return (
    <div className="container-responsive pb-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Emitir Certificado</h1>
      <p className="text-gray-600">Crea un nuevo certificado académico o de curso.</p>
      <div className="mt-8">
        <IssueTitleForm variant="certificate" />
      </div>
    </div>
  );
};

export default CreateCertificatePage;
