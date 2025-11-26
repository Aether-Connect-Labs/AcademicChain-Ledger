import React, { useState } from 'react';
import axios from 'axios';
import { create as createIpfsClient } from 'ipfs-http-client';

const buildAuthHeaders = () => {
  try {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const IssueTitleForm = ({ variant = 'degree' }) => {
  const [formData, setFormData] = useState({
    tokenId: '0.0.123456',
    studentName: '',
    courseName: '',
    issueDate: '',
    grade: '',
    recipientAccountId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsURI, setIpfsURI] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const uniqueHash = `hash-${Date.now()}`;
      let finalIpfsURI = ipfsURI;
      if (!finalIpfsURI) {
        if (file) {
          setIsUploading(true);
          const pinataJwt = import.meta.env.VITE_PINATA_JWT || '';
          const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || '';
          const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY || '';
          if (pinataJwt || (pinataApiKey && pinataSecretKey)) {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('pinataMetadata', JSON.stringify({ name: file.name }));
            fd.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));
            const headers = pinataJwt ? { Authorization: `Bearer ${pinataJwt}` } : { pinata_api_key: pinataApiKey, pinata_secret_api_key: pinataSecretKey };
            const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', { method: 'POST', headers, body: fd });
            if (!res.ok) throw new Error('Pinata upload failed');
            const data = await res.json();
            finalIpfsURI = `ipfs://${data.IpfsHash}`;
            setIpfsURI(finalIpfsURI);
            setIsUploading(false);
          } else {
            const endpoint = import.meta.env.VITE_IPFS_ENDPOINT || 'https://ipfs.infura.io:5001/api/v0';
            const projectId = import.meta.env.VITE_IPFS_PROJECT_ID || '';
            const projectSecret = import.meta.env.VITE_IPFS_PROJECT_SECRET || '';
            const authHeader = projectId && projectSecret ? 'Basic ' + btoa(`${projectId}:${projectSecret}`) : undefined;
            const client = createIpfsClient({ url: endpoint, headers: authHeader ? { Authorization: authHeader } : undefined });
            const added = await client.add(file);
            finalIpfsURI = `ipfs://${added.cid.toString()}`;
            setIpfsURI(finalIpfsURI);
            setIsUploading(false);
          }
        } else {
          finalIpfsURI = `ipfs://QmVg...`;
        }
      }
      const tokenId = formData.tokenId.trim();

      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
      if (!API_BASE_URL) {
        setMessage('Título preparado en modo demostración. Configura VITE_API_URL para emitir contra el backend.');
        setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
        return;
      }
      const prepareRes = await axios.post(`${API_BASE_URL}/api/universities/prepare-issuance`, {
        type: variant,
        tokenId,
        uniqueHash,
        ipfsURI: finalIpfsURI,
        studentName: formData.studentName,
        degree: formData.courseName,
        graduationDate: formData.issueDate,
        grade: formData.grade,
        recipientAccountId: formData.recipientAccountId || undefined,
      }, { headers: buildAuthHeaders() });

      const transactionId = prepareRes.data?.data?.transactionId || prepareRes.data?.transactionId;
      setMessage(`Preparado. Transacción: ${transactionId}. Ejecutando emisión...`);

      const execRes = await axios.post(`${API_BASE_URL}/api/universities/execute-issuance`, {
        transactionId,
      }, { headers: buildAuthHeaders() });

      setResult(execRes.data?.data || execRes.data);
      setMessage('Título emitido correctamente');
      setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
      setFile(null);
      setIpfsURI('');
    } catch (err) {
      setError('Error al emitir el título: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{variant === 'certificate' ? 'Emitir Certificado' : (variant === 'diploma' ? 'Emitir Diploma' : 'Emitir Título')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tokenId" className="block text-gray-700 text-sm font-bold mb-2">
            Token ID:
          </label>
          <input
            type="text"
            id="tokenId"
            name="tokenId"
            value={formData.tokenId}
            onChange={handleChange}
            className="input-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="studentName" className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del Estudiante:
          </label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            className="input-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="courseName" className="block text-gray-700 text-sm font-bold mb-2">
            {variant === 'certificate' ? 'Nombre del Certificado' : (variant === 'diploma' ? 'Nombre del Diploma' : 'Nombre del Título')}
          </label>
          <input
            type="text"
            id="courseName"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            className="input-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="issueDate" className="block text-gray-700 text-sm font-bold mb-2">
            Fecha de Graduación/Emisión:
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            className="input-primary"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="grade" className="block text-gray-700 text-sm font-bold mb-2">
            Calificación/Nota:
          </label>
          <input
            type="text"
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="input-primary"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="recipientAccountId" className="block text-gray-700 text-sm font-bold mb-2">
            Cuenta Hedera del Estudiante (opcional):
          </label>
          <input
            type="text"
            id="recipientAccountId"
            name="recipientAccountId"
            value={formData.recipientAccountId}
            onChange={handleChange}
            className="input-primary"
            placeholder="0.0.xxxxxx"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="credentialFile" className="block text-gray-700 text-sm font-bold mb-2">
            Archivo de Credencial (PDF/Imagen):
          </label>
          <input
            type="file"
            id="credentialFile"
            name="credentialFile"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {ipfsURI && <p className="mt-2 text-xs text-gray-600">IPFS: {ipfsURI}</p>}
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="btn-primary hover-lift"
            disabled={isLoading || isUploading}
          >
            {isLoading || isUploading ? 'Procesando...' : (variant === 'certificate' ? 'Emitir Certificado' : (variant === 'diploma' ? 'Emitir Diploma' : 'Emitir Título'))}
          </button>
        </div>
        {(isLoading || isUploading) && <p className="mt-4 text-sm badge-info badge">Cargando...</p>}
        {error && <p className="mt-4 text-sm badge-error badge">Error: {error}</p>}
        {message && <p className="mt-4 text-sm badge-success badge">{message}</p>}
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="text-sm">Serial: {result?.mint?.serialNumber}</div>
            <div className="text-sm">TxID: {result?.mint?.transactionId}</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default IssueTitleForm;