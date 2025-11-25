import React from 'react';
import IssueTitleForm from './IssueTitleForm.jsx';

const CreateDiplomaPage = () => {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Emitir Diploma</h1>
      <p className="text-gray-600">Crea un nuevo diploma académico oficial.</p>
      <div className="mt-8">
        <IssueTitleForm variant="diploma" />
      </div>
    </div>
  );
};

export default CreateDiplomaPage;