// src/components/credentials/CredentialVerifier.tsx
import { useState } from 'react';
import { verifyCredential } from '../../lib/hedera/verification';
import QRScanner from '../ui/QRScanner';

const CredentialVerifier = () => {
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    data?: any;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScan = async (data: string) => {
    if (!data) return;
    
    setIsLoading(true);
    try {
      const result = await verifyCredential(data);
      setVerificationResult({ valid: true, data: result });
    } catch (error) {
      setVerificationResult({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid credential' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Verify Academic Credential
      </h2>
      
      <QRScanner onScan={handleScan} />
      
      {isLoading && (
        <div className="mt-4 text-center">
          <p className="text-blue-500">Verifying credential...</p>
        </div>
      )}
      
      {verificationResult && (
        <div className={`mt-4 p-4 rounded ${verificationResult.valid ? 'bg-green-100' : 'bg-red-100'}`}>
          {verificationResult.valid ? (
            <>
              <h3 className="font-bold text-green-800">Valid Credential</h3>
              <div className="mt-2">
                <p><strong>Name:</strong> {verificationResult.data.studentName}</p>
                <p><strong>Degree:</strong> {verificationResult.data.degree}</p>
                <p><strong>Institution:</strong> {verificationResult.data.institution}</p>
                <p><strong>Issued On:</strong> {new Date(verificationResult.data.issuedAt).toLocaleDateString()}</p>
              </div>
            </>
          ) : (
            <p className="text-red-800">{verificationResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CredentialVerifier;