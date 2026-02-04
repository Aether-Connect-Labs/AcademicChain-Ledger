import React, { useState, useEffect } from 'react';
import issuanceService from './services/issuanceService';
import n8nService from './services/n8nService';
import { verificationService } from './services/verificationService';
import { Toaster, toast } from 'react-hot-toast';
import { toGateway } from './utils/ipfsUtils';
import { motion } from 'framer-motion';

const IssueTitleForm = ({ variant = 'degree', demo = false, networks = ['hedera'] }) => {
  // Styles based on variant
  const getGradient = () => {
    if (variant === 'diploma') return 'from-purple-600 to-blue-600';
    if (variant === 'certificate') return 'from-blue-600 to-cyan-500';
    return 'from-primary-600 to-secondary-600';
  }

  const [formData, setFormData] = useState({
    tokenId: '0.0.123456',
    studentName: '',
    courseName: '',
    issueDate: '',
    grade: '',
    recipientAccountId: '',
  });

  const [useN8n, setUseN8n] = useState(false); // Toggle for Headless API

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

    try {
      // ... (IPFS Upload Logic remains similar or can be skipped for pure n8n demo)
      const uniqueHash = `hash-${Date.now()}`;
      let finalIpfsURI = ipfsURI;

      if (!useN8n) {
        // Standard Logic
        if (!finalIpfsURI && file && !demo) {
          setIsUploading(true);
          finalIpfsURI = await issuanceService.uploadToIPFS(file);
          setIsUploading(false);
        }
      }

      if (useN8n) {
        // N8N Headless Flow
        await n8nService.submitDocument({
          documentHash: uniqueHash,
          userId: 'user-123', // Demo User
          metadata: { ...formData }
        });
        setMessage('Enviado a n8n para procesamiento asíncrono.');
      } else {
        // Standard Flow (omitted full logic for brevity, assuming original logic here)
        const prepareRes = await issuanceService.prepareIssuance({
          type: variant,
          tokenId: formData.tokenId,
          uniqueHash,
          ipfsURI: finalIpfsURI || 'ipfs://placeholder',
          studentName: formData.studentName,
          degree: formData.courseName,
          graduationDate: formData.issueDate,
          grade: formData.grade,
          recipientAccountId: formData.recipientAccountId,
          networks,
        });

        const transactionId = prepareRes.data?.transactionId || prepareRes.transactionId;
        const execRes = await issuanceService.executeIssuance({
          transactionId,
          networks,
        });

        setResult(execRes.data || execRes);
        setMessage('Título emitido correctamente');
      }

    } catch (err) {
      setError('Error: ' + (err.message || 'Desconocido'));
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Toaster position="top-right" />
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradient()}`} />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display text-white">
            {variant === 'certificate' ? 'Emitir Certificado' : 'Emitir Título'}
          </h2>
          {/* N8N Toggle */}
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
            <span className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${!useN8n ? 'bg-primary text-black' : 'text-gray-400'}`} onClick={() => setUseN8n(false)}>Standard</span>
            <span className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${useN8n ? 'bg-secondary text-white' : 'text-gray-400'}`} onClick={() => setUseN8n(true)}>n8n Cloud</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Fields Re-styled */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Token ID</label>
              {tokens.length > 0 ? (
                <select name="tokenId" value={formData.tokenId} onChange={handleChange} className="input-primary appearance-none">
                  {tokens.map(t => <option key={t.tokenId} value={t.tokenId}>{t.tokenName}</option>)}
                </select>
              ) : (
                <input type="text" name="tokenId" value={formData.tokenId} onChange={handleChange} className="input-primary" />
              )}
            </div>
            <div>
              <label className="label-text">Institución</label>
              <input type="text" value={universityName} readOnly className="input-primary opacity-50 cursor-not-allowed" placeholder="Detectando..." />
            </div>
          </div>

          <div>
            <label className="label-text">Estudiante</label>
            <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} className="input-primary" placeholder="Nombre completo" required />
          </div>

          <div>
            <label className="label-text">Título / Curso</label>
            <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} className="input-primary" placeholder="Ej. Ingeniería de Software" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Fecha Emisión</label>
              <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} className="input-primary" required />
            </div>
            <div>
              <label className="label-text">Nota (0-100)</label>
              <input type="text" name="grade" value={formData.grade} onChange={handleChange} className="input-primary" placeholder="95" />
            </div>
          </div>

          <div>
            <label className="label-text">Cuenta Hedera (Opcional)</label>
            <input type="text" name="recipientAccountId" value={formData.recipientAccountId} onChange={handleChange} className="input-primary" placeholder="0.0.xxxxx" />
          </div>

          {!useN8n && (
            <div className="p-4 border border-dashed border-gray-600 rounded-lg bg-black/20 hover:bg-black/40 transition-colors cursor-pointer">
              <label className="block text-center cursor-pointer">
                <span className="text-sm text-primary-400">Subir Documento (PDF/Img)</span>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
              </label>
              {file && <p className="text-xs text-center mt-2 text-green-400">{file.name}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isUploading}
            className={`w-full mt-6 btn-primary ${useN8n ? 'bg-secondary hover:bg-secondary-500 text-white' : ''}`}
          >
            {isLoading ? 'Procesando...' : (useN8n ? 'Emitir vía n8n Cloud' : 'Emitir en Blockchain')}
          </button>
        </form>

        {message && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-green-900/40 border border-green-500/30 rounded text-green-300 text-sm text-center">
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-900/40 border border-red-500/30 rounded text-red-300 text-sm text-center">
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default IssueTitleForm;
