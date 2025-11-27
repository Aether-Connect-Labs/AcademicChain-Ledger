import React from 'react';

const ApiDocsLanding = () => {
  return (
    <div className="container-responsive py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Documentación de la API</h1>
      <p className="text-gray-600 mb-6">Explora y prueba la API REST v1 de AcademicChain-Ledger.</p>
      <div className="mb-6">
        <a href="/demo" className="btn-primary">Agendar Demo</a>
      </div>

      <div className="card p-6 mb-6">
        <div className="font-semibold mb-2">Swagger UI</div>
        <p className="text-sm text-gray-600">Abre el explorador interactivo en <a href="/api/docs" className="text-blue-600">/api/docs</a>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="font-semibold mb-2">Verificación Pública</div>
          <pre className="text-xs bg-gray-50 p-3 rounded border">{`curl -X POST http://localhost:3001/api/v1/verification/verify-credential \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.123456","serialNumber":"1"}'`}</pre>
        </div>
        <div className="card p-6">
          <div className="font-semibold mb-2">Emisión con API Key</div>
          <pre className="text-xs bg-gray-50 p-3 rounded border">{`curl -X POST http://localhost:3001/api/v1/credentials/issue \
  -H 'x-api-key: ak_prefix_secret' \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":"0.0.123456","uniqueHash":"hash-123","ipfsURI":"ipfs://cid","studentName":"Alice","degree":"CS","recipientAccountId":"0.0.999"}'`}</pre>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsLanding;
