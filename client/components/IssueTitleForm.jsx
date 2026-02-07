import React, { useState, useEffect } from 'react';
import issuanceService from './services/issuanceService';
import n8nService from './services/n8nService';
import { verificationService } from './services/verificationService';
import { Toaster, toast } from 'react-hot-toast';
import { toGateway } from './utils/ipfsUtils';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateDesigner from './CertificateDesigner';
import LiveBlockVisualizer from './LiveBlockVisualizer';

const IssueTitleForm = ({ variant = 'degree', demo = false, networks = ['hedera'], plan, emissionsUsed = 0, onEmissionComplete }) => {
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

  const [showDesigner, setShowDesigner] = useState(false);
  const [designStructure, setDesignStructure] = useState(null);

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
  const [universityName, setUniversityName] = useState('');

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

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
  }, [demo, formData.tokenId]);

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

      // Force N8N Flow
      if (true) {
        // Plan Validation
        if (plan && plan.limit !== Infinity) {
            if (emissionsUsed >= plan.limit) {
                setError(`Límite mensual alcanzado (${plan.limit}). Mejora tu plan para continuar.`);
                setIsLoading(false);
                return;
            }
        }

        // N8N Headless Flow (Exclusive)
        await n8nService.submitDocument({
          documentHash: uniqueHash,
          userId: 'user-123', // Demo User
          metadata: { ...formData, designStructure }, // Include structure if available
          issuanceType: variant,
          networks: networks
        });
        setMessage('Enviado a n8n para procesamiento automatizado (Hedera/XRP/Filecoin).');
        toast.success('Solicitud enviada a n8n correctamente');
        if (onEmissionComplete) onEmissionComplete(1);
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

      {/* Visualizer showing Pending Design Block */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <LiveBlockVisualizer pendingTransaction={{ preview: file }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Designer Modal */}
      <AnimatePresence>
        {showDesigner && (
          <CertificateDesigner
            onClose={() => setShowDesigner(false)}
            data={formData}
            onSave={(generatedFile, structure) => {
              setFile(generatedFile);
              setDesignStructure(structure);
              setShowDesigner(false);
              toast.success('Diseño guardado. Previsualización disponible en bloques.');
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="glass-panel p-8 relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradient()}`} />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display text-white">
            {variant === 'certificate' ? 'Emitir Certificado' : 'Emitir Título'}
            <span className="ml-3 text-xs bg-secondary text-white px-2 py-1 rounded-full align-middle">Impulsado por n8n</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Designer Trigger - Available across flows for structure generation */}
          <div className="space-y-2">
            {!file && (
              <div className="p-4 border border-dashed border-slate-600 rounded-lg bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group">
                <label className="block text-center cursor-pointer">
                  <span className="text-sm text-slate-400 group-hover:text-primary transition-colors">Subir Documento (PDF/Img)</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
                </label>
              </div>
            )}

            <div className="flex items-center justify-center my-2">
              <span className="text-xs text-slate-500 uppercase px-2 bg-background z-10">O</span>
              <div className="h-px bg-slate-800 w-full absolute"></div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowDesigner(true)}
              className="w-full py-3 border border-purple-500/50 text-purple-300 rounded-xl hover:bg-purple-900/20 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10"
            >
              <span>🎨</span> Diseñar Certificado (Editor Visual)
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(37, 99, 235, 0.5)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || isUploading}
            className="w-full mt-6 btn-primary bg-secondary hover:bg-secondary-400 text-white shadow-neon-purple"
          >
            {isLoading ? 'Procesando en n8n...' : '🚀 Emitir vía n8n (Automatizado)'}
          </motion.button>
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
      </motion.div>
    </div>
  );
};

export default IssueTitleForm;
