import React, { useState, useEffect } from 'react';
import { useHedera } from './useHedera';
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

const IssueTitleForm = ({ variant = 'degree', demo = false }) => {
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
  const [paymentMethod, setPaymentMethod] = useState('AUTO');
  const [xrpIntent, setXrpIntent] = useState(null);
  const [pendingTxId, setPendingTxId] = useState('');
  const [xrpTxHash, setXrpTxHash] = useState('');
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsURI, setIpfsURI] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenFetchError, setTokenFetchError] = useState('');
  const [didAutoCreate, setDidAutoCreate] = useState(false);
  const { isConnected, connectWallet, signTransactionBytes } = useHedera();

  useEffect(() => {
    if (demo) return;
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    if (!API_BASE_URL) return;
    setLoadingTokens(true);
    setTokenFetchError('');
    fetch(`${API_BASE_URL}/api/universities/tokens`, { headers: buildAuthHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = data?.data?.tokens || [];
        const university = data?.data?.university || '';
        setTokens(list);
        if (list.length > 0 && !formData.tokenId) {
          setFormData(prev => ({ ...prev, tokenId: list[0].tokenId }));
        } else if (list.length === 0 && !didAutoCreate && String(import.meta.env.VITE_AUTO_CREATE_DEFAULT_TOKEN || '0') === '1') {
          try {
            const uniAbbr = (university || 'ACAD').replace(/[^A-Za-z]/g, '').slice(0,4).toUpperCase() || 'ACAD';
            const tokenName = university ? `${university} Credenciales` : 'Credenciales Académicas';
            const tokenSymbol = `${uniAbbr}CRED`;
            const resCreate = await fetch(`${API_BASE_URL}/api/universities/create-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
              body: JSON.stringify({ tokenName, tokenSymbol })
            });
            const created = await resCreate.json();
            if (resCreate.ok) {
              const newTokenId = created?.data?.tokenId || created?.data?.token?.tokenId;
              setDidAutoCreate(true);
              const res2 = await fetch(`${API_BASE_URL}/api/universities/tokens`, { headers: buildAuthHeaders() });
              const data2 = await res2.json();
              const list2 = data2?.data?.tokens || [];
              setTokens(list2);
              if (list2.length > 0) setFormData(prev => ({ ...prev, tokenId: list2[0].tokenId }));
              if (!list2.length && newTokenId) setFormData(prev => ({ ...prev, tokenId: newTokenId }));
            }
          } catch {}
        }
      })
      .catch((e) => setTokenFetchError(e.message))
      .finally(() => setLoadingTokens(false));
  }, [demo, formData.tokenId, didAutoCreate]);

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
        if (file && !demo) {
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
      if (demo) {
        const demoResult = {
          mint: {
            serialNumber: Math.floor(Math.random() * 1000) + 1,
            transactionId: `demo-tx-${Date.now()}`,
            tokenId,
            ipfsURI: finalIpfsURI,
          }
        };
        setResult(demoResult);
        setMessage('Título emitido correctamente (modo demo)');
        setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
        setFile(null);
        setIpfsURI('');
        return;
      }
    const API_BASE_URL = import.meta.env.VITE_API_URL;
      if (!API_BASE_URL) {
        setMessage('API no disponible en desarrollo. Configura VITE_API_URL para emitir contra el backend.');
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
        paymentMethod: paymentMethod === 'XRP' ? 'XRP' : undefined,
      }, { headers: buildAuthHeaders() });

      const transactionId = prepareRes.data?.data?.transactionId || prepareRes.data?.transactionId;
      const paymentBytes = prepareRes.data?.data?.paymentTransactionBytes || prepareRes.data?.paymentTransactionBytes;
      const xrpPaymentIntent = prepareRes.data?.data?.xrpPaymentIntent || prepareRes.data?.xrpPaymentIntent;
      if (xrpPaymentIntent) {
        setPendingTxId(transactionId);
        setXrpIntent(xrpPaymentIntent);
        setMessage('Intención de pago XRP creada. Realiza el pago y pega el hash.');
        return;
      }
      if (paymentBytes) {
        if (!isConnected) {
          await connectWallet();
        }
        const signed = await signTransactionBytes(paymentBytes);
        const execRes = await axios.post(`${API_BASE_URL}/api/universities/execute-issuance`, {
          transactionId,
          signedPaymentTransactionBytes: signed,
        }, { headers: buildAuthHeaders() });
        setResult(execRes.data?.data || execRes.data);
        setMessage('Título emitido correctamente');
        setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
        setFile(null);
        setIpfsURI('');
      } else {
        const execRes = await axios.post(`${API_BASE_URL}/api/universities/execute-issuance`, {
          transactionId,
        }, { headers: buildAuthHeaders() });
        setResult(execRes.data?.data || execRes.data);
        setMessage('Título emitido correctamente');
        setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
        setFile(null);
        setIpfsURI('');
      }
    } catch (err) {
      setError('Error al emitir el título: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeWithXrp = async () => {
    try {
      setIsLoading(true);
      setError('');
      if (!pendingTxId || !xrpTxHash) {
        setError('Falta transactionId o xrpTxHash');
        return;
      }
      if (!/^[A-Fa-f0-9]{64}$/.test(xrpTxHash)) {
        setError('Formato de hash XRPL inválido (hex de 64 caracteres)');
        return;
      }
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const execRes = await axios.post(`${API_BASE_URL}/api/universities/execute-issuance`, {
        transactionId: pendingTxId,
        xrpTxHash,
      }, { headers: buildAuthHeaders() });
      setResult(execRes.data?.data || execRes.data);
      setMessage('Título emitido correctamente');
      setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
      setFile(null);
      setIpfsURI('');
      setXrpIntent(null);
      setXrpTxHash('');
      setPendingTxId('');
    } catch (err) {
      setError('Error al finalizar con XRP: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{variant === 'certificate' ? 'Emitir Certificado' : (variant === 'diploma' ? 'Emitir Diploma' : 'Emitir Título')}</h2>
      {demo && (<div className="badge badge-info mb-4">Emisión en modo demostración</div>)}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Método de Pago</label>
          <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)} className="input-primary">
            <option value="AUTO">Automático (Hedera/None)</option>
            <option value="XRP">XRP</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="tokenId" className="block text-gray-700 text-sm font-bold mb-2">
            Token ID:
          </label>
          {tokens.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                id="tokenIdSelect"
                value={formData.tokenId}
                onChange={(e) => setFormData(prev => ({ ...prev, tokenId: e.target.value }))}
                className="input-primary"
              >
                {tokens.map((t) => (
                  <option key={t.id || t.tokenId} value={t.tokenId}>{t.tokenName || t.tokenId} ({t.tokenId})</option>
                ))}
              </select>
              <input
                type="text"
                id="tokenId"
                name="tokenId"
                value={formData.tokenId}
                onChange={handleChange}
                className="input-primary"
                placeholder="Escribir manualmente"
              />
            </div>
          ) : (
            <input
              type="text"
              id="tokenId"
              name="tokenId"
              value={formData.tokenId}
              onChange={handleChange}
              className="input-primary"
              required
            />
          )}
          {loadingTokens && (<div className="mt-2 text-xs text-gray-500">Cargando tokens…</div>)}
          {tokenFetchError && (<div className="mt-2 text-xs text-red-600">No se pudieron cargar los tokens ({tokenFetchError})</div>)}
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
      {xrpIntent && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="font-semibold mb-2">Paga en XRP y pega el hash</div>
          <div className="text-sm mb-2">Red: {xrpIntent.network}</div>
          <div className="text-sm mb-2">Destino: <span className="font-mono">{xrpIntent.destination}</span></div>
          <div className="text-sm mb-2">Monto (drops): {xrpIntent.amountDrops}</div>
          <div className="text-sm mb-2">Memo (hex): <span className="font-mono break-all">{xrpIntent.memoHex}</span></div>
          <div className="mt-3">
            <label className="block text-gray-700 text-sm font-bold mb-2">XRPL Tx Hash</label>
            <input type="text" className="input-primary" placeholder="Introduce el hash de la transacción en XRPL" value={xrpTxHash} onChange={(e)=>setXrpTxHash(e.target.value)} />
          </div>
          <button className="btn btn-primary mt-3" onClick={finalizeWithXrp} disabled={isLoading || !xrpTxHash}>Finalizar emisión</button>
        </div>
      )}
    </div>
  );
};

export default IssueTitleForm;
