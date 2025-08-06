// apps/web/pages/index.tsx
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [credentialId, setCredentialId] = useState('');

  const handleVerify = async () => {
    const response = await fetch(`/api/credentials/verify?id=${credentialId}`);
    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>AcademicChain Ledger</title>
      </Head>

      <main className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          AcademicChain Ledger
        </h1>
        
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Verify Credential</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Credential ID</label>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleVerify}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Verify
          </button>
        </div>
      </main>
    </div>
  );
}