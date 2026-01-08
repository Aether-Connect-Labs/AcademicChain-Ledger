import React, { useState, useEffect } from 'react';
import issuanceService from './services/issuanceService';
import { verificationService } from './services/verificationService';
import { Toaster, toast } from 'react-hot-toast';
import { toGateway } from './utils/ipfsUtils';

const IssueTitleForm = ({ variant = 'degree', demo = false, networks = ['hedera'] }) => {
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
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenFetchError, setTokenFetchError] = useState('');
  const [didAutoCreate, setDidAutoCreate] = useState(false);
  const [universityName, setUniversityName] = useState('');

  useEffect(() => {
    if (demo) return;
    const loadTokens = async () => {
      setLoadingTokens(true);
      setTokenFetchError('');
      try {
        const data = await issuanceService.getTokens();
        const list = data?.data?.tokens || [];
        const university = data?.data?.university || '';
        setTokens(list);
        setUniversityName(university || '');
        
        if (list.length > 0 && !formData.tokenId) {
          setFormData(prev => ({ ...prev, tokenId: list[0].tokenId }));
        } else if (list.length === 0 && !didAutoCreate && String(import.meta.env.VITE_AUTO_CREATE_DEFAULT_TOKEN || '0') === '1') {
          try {
            const uniAbbr = (university || 'ACAD').replace(/[^A-Za-z]/g, '').slice(0,4).toUpperCase() || 'ACAD';
            const tokenName = university ? `${university} Credenciales` : 'Credenciales Académicas';
            const tokenSymbol = `${uniAbbr}CRED`;
            
            const created = await issuanceService.createToken({ tokenName, tokenSymbol });
            
            if (created && created.success) {
              const newTokenId = created?.data?.tokenId || created?.data?.token?.tokenId;
              setDidAutoCreate(true);
              // Reload tokens
              const data2 = await issuanceService.getTokens();
              const list2 = data2?.data?.tokens || [];
              setTokens(list2);
              if (list2.length > 0) setFormData(prev => ({ ...prev, tokenId: list2[0].tokenId }));
              if (!list2.length && newTokenId) setFormData(prev => ({ ...prev, tokenId: newTokenId }));
            }
          } catch (e) {
            console.warn('Auto-create token failed', e);
          }
        }
      } catch (e) {
        setTokenFetchError(e.message);
      } finally {
        setLoadingTokens(false);
      }
    };
    loadTokens();
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
    const copy = (text) => { try { navigator.clipboard.writeText(text); toast.success('Copiado'); } catch {} };
    const showSuccessToast = (payload) => {
      try {
        const tokenId = String(payload?.tokenId || formData.tokenId || '');
        const serial = String(payload?.mint?.serialNumber || payload?.serialNumber || '');
        const ipfs = payload?.mint?.ipfs;
        const filecoin = payload?.mint?.filecoin;
        const ipfsCid = ipfs?.cid || (String(payload?.mint?.ipfsURI || '').replace('ipfs://','') || '');
        const ipfsGateway = ipfs?.gateway || (ipfsCid ? toGateway(`ipfs://${ipfsCid}`) : '');
        const filecoinCid = filecoin?.cid || '';
        const filecoinGateway = filecoin?.gateway || '';
        toast.custom((t) => (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[360px]">
            <div className="font-semibold text-gray-900">🎉 Credencial Emitida con Éxito</div>
            <div className="text-sm text-gray-700 mt-2">Hedera: {tokenId}-{serial}</div>
            {ipfsCid ? (
              <div className="mt-2 text-sm">
                <div className="text-gray-700">IPFS CID: <span className="font-mono">{ipfsCid}</span></div>
                {ipfsGateway ? (
                  <div className="mt-1">
                    <a className="text-blue-600 underline" href={ipfsGateway} target="_blank" rel="noreferrer">Ver en Gateway</a>
                    <button className="btn-ghost btn-xs ml-2" onClick={() => copy(ipfsGateway)}>Copiar enlace</button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {filecoinCid ? (
              <div className="mt-2 text-sm">
                <div className="text-gray-700">Respaldo Filecoin: <span className="text-green-700 font-semibold">Activo</span></div>
                <div className="text-gray-700">CID: <span className="font-mono">{filecoinCid}</span></div>
                {filecoinGateway ? (
                  <div className="mt-1">
                    <a className="text-blue-600 underline" href={filecoinGateway} target="_blank" rel="noreferrer">Ver en Gateway</a>
                    <button className="btn-ghost btn-xs ml-2" onClick={() => copy(filecoinGateway)}>Copiar enlace</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-600">Respaldo Filecoin: Pendiente</div>
            )}
            <div className="mt-3 flex justify-end">
              <button className="btn-secondary btn-xs" onClick={() => toast.dismiss(t.id)}>Cerrar</button>
            </div>
          </div>
        ), { duration: 8000 });
      } catch {}
    };
    try {
      const uniqueHash = `hash-${Date.now()}`;
      let finalIpfsURI = ipfsURI;
      if (!finalIpfsURI) {
        if (file && !demo) {
          setIsUploading(true);
          try {
            finalIpfsURI = await issuanceService.uploadToIPFS(file);
            setIpfsURI(finalIpfsURI);
          } catch (e) {
            throw new Error('Error subiendo archivo a IPFS: ' + e.message);
          } finally {
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
        showSuccessToast({ tokenId, mint: { serialNumber: demoResult.mint.serialNumber, ipfsURI: finalIpfsURI } });
        setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
        setFile(null);
        setIpfsURI('');
        return;
      }

      const prepareRes = await issuanceService.prepareIssuance({
        type: variant,
        tokenId,
        uniqueHash,
        ipfsURI: finalIpfsURI,
        studentName: formData.studentName,
        degree: formData.courseName,
        graduationDate: formData.issueDate,
        grade: formData.grade,
        recipientAccountId: formData.recipientAccountId || undefined,
        networks,
      });

      const transactionId = prepareRes.data?.transactionId || prepareRes.transactionId;
      const execRes = await issuanceService.executeIssuance({
        transactionId,
        networks,
      });
      
      setResult(execRes.data || execRes);
      setMessage('Título emitido correctamente');
      showSuccessToast(execRes.data || execRes);
      setFormData(prev => ({ ...prev, studentName: '', courseName: '', issueDate: '', grade: '', recipientAccountId: '' }));
      setFile(null);
      setIpfsURI('');
    } catch (err) {
      setError('Error al emitir el título: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', padding: '8px 12px' } }} />
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{variant === 'certificate' ? 'Emitir Certificado' : (variant === 'diploma' ? 'Emitir Diploma' : 'Emitir Título')}</h2>
      {demo && (<div className="badge badge-info mb-4">Emisión en modo demostración</div>)}
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="institution" className="block text-gray-700 text-sm font-bold mb-2">
            Institución:
          </label>
          <input
            type="text"
            id="institution"
            name="institution"
            value={universityName}
            onChange={() => {}}
            className="input-primary"
            placeholder="Institución"
            readOnly
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
          <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200 text-sm space-y-2">
            <div><span className="font-semibold">Serial:</span> {result?.mint?.serialNumber || result?.nftId?.split('-')[1] || 'N/A'}</div>
            <div><span className="font-semibold">Hedera Tx:</span> {result?.mint?.transactionId || result?.mintTxId || 'N/A'}</div>
            {(() => {
              const ipfsObj = result?.mint?.ipfs;
              const ipfsURI = result?.mint?.ipfsURI;
              const cid = ipfsObj?.cid || (ipfsURI ? String(ipfsURI).replace('ipfs://','') : '');
              const gw = ipfsObj?.gateway || (cid ? toGateway(`ipfs://${cid}`) : '');
              return cid ? (
                <>
                  <div><span className="font-semibold">IPFS CID:</span> <span className="font-mono">{cid}</span></div>
                  {gw ? (
                    <div className="flex items-center">
                      <a href={gw} target="_blank" rel="noreferrer" className="text-blue-600 underline">Ver en Gateway</a>
                      <button type="button" className="btn-ghost btn-xs ml-2" onClick={() => { try { navigator.clipboard.writeText(gw); toast.success('Copiado'); } catch {} }}>Copiar enlace</button>
                    </div>
                  ) : null}
                </>
              ) : null;
            })()}
            {(() => {
              const fc = result?.mint?.filecoin;
              const cid = fc?.cid;
              const gw = fc?.gateway;
              return cid ? (
                <>
                  <div><span className="font-semibold">Respaldo Filecoin:</span> <span className="text-green-700 font-semibold">Activo</span></div>
                  <div><span className="font-semibold">CID:</span> <span className="font-mono">{cid}</span></div>
                  {gw ? (
                    <div className="flex items-center">
                      <a href={gw} target="_blank" rel="noreferrer" className="text-blue-600 underline">Ver en Gateway</a>
                      <button type="button" className="btn-ghost btn-xs ml-2" onClick={() => { try { navigator.clipboard.writeText(gw); toast.success('Copiado'); } catch {} }}>Copiar enlace</button>
                    </div>
                  ) : null}
                </>
              ) : <div className="text-gray-600">Respaldo Filecoin: Pendiente</div>;
            })()}
            {(result?.xrpTxHash || result?.data?.xrpTxHash) && (
              <div className="text-blue-600">
                <span className="font-semibold text-gray-700">XRP Anchor:</span> {result.xrpTxHash || result.data.xrpTxHash}
              </div>
            )}
            {(result?.algoTxId || result?.data?.algoTxId) && (
              <div className="text-green-600">
                <span className="font-semibold text-gray-700">Algorand Anchor:</span> {result.algoTxId || result.data.algoTxId}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <a
                className="btn-secondary btn-sm"
                href={(() => {
                  const tokenId = String(result?.mint?.tokenId || formData.tokenId || '');
                  const serial = String(result?.mint?.serialNumber || result?.nftId?.split('-')[1] || '');
                  const params = new URLSearchParams();
                  if (tokenId) params.set('tokenId', tokenId);
                  if (serial) params.set('serialNumber', serial);
                  return `/#/verificar?${params.toString()}`;
                })()}
              >
                🔍 Ver en Verificador Merkle
              </a>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={async () => {
                  try {
                    const cid = (() => {
                      const ipfsObj = result?.mint?.ipfs;
                      const ipfsURI = result?.mint?.ipfsURI;
                      return ipfsObj?.cid || (ipfsURI ? String(ipfsURI).replace('ipfs://','') : '');
                    })();
                    if (!cid) {
                      toast.error('No hay CID para auditar');
                      return;
                    }
                    const resp = await verificationService.merkleBatch({ documents: [{ cid }] });
                    const topicId = resp?.data?.hedera?.topicId || resp?.hedera?.topicId || '';
                    if (topicId) {
                      const params = new URLSearchParams();
                      params.set('hederaTopicId', topicId);
                      window.open(`/#/verificar?${params.toString()}`, '_blank');
                    } else {
                      toast.error('No se obtuvo topicId del backend');
                    }
                  } catch (e) {
                    toast.error(e.message || 'Error al auditar');
                  }
                }}
              >
                📊 Auditar por Merkle
              </button>
            </div>
          </div>
        )}
      </form>
      
    </div>
  );
};

export default IssueTitleForm;
