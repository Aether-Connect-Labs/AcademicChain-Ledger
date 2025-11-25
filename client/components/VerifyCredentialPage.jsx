import React from 'react';
import CredentialVerifier from './credentials/CredentialVerifier.jsx';

const VerifyCredentialPage = () => {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verificar Credencial</h1>
      <p className="text-gray-600">Escanea un código QR o pega datos para verificar.</p>
      <div className="mt-8">
        <CredentialVerifier />
      </div>
    </div>
  );
};

export default VerifyCredentialPage;