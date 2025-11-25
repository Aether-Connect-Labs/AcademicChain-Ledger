import React from 'react';
import IssueTitleForm from './IssueTitleForm.jsx';

const CreateDegreePage = () => {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Emitir Título</h1>
      <p className="text-gray-600">Crea un nuevo título académico para un estudiante.</p>
      <div className="mt-8">
        <IssueTitleForm variant="degree" />
      </div>
    </div>
  );
};

export default CreateDegreePage;