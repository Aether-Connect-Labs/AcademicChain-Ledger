import React, { useState, useEffect } from 'react';
import issuanceService from './services/issuanceService';
import n8nService from './services/n8nService';
import { Toaster, toast } from 'react-hot-toast';
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
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [universityName, setUniversityName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [resultData, setResultData] = useState(null);

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  useEffect(() => {
    if (demo) return;
    const loadTokens = async () => {
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
      } finally {
      }
    };
    loadTokens();
  }, [demo, formData.tokenId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const computePlanFromNetworks = () => {
    if (plan && plan.id) {
      const id = String(plan.id).toLowerCase();
      if (id === 'enterprise') return 'triple';
      if (id === 'professional') return 'dual';
      return 'base';
    }
    const nets = Array.isArray(networks) ? networks.map(n => String(n).toLowerCase()) : [];
    const hasHedera = nets.includes('hedera');
    const hasXrp = nets.includes('xrp') || nets.includes('xrpl');
    const hasAlgo = nets.includes('algorand') || nets.includes('algo');
    if (hasHedera && hasXrp && hasAlgo) return 'triple';
    if (hasHedera && hasXrp) return 'dual';
    if (hasHedera) return 'base';
    return 'base';
  };

  const validateStepOne = () => {
    if (!formData.studentName || !formData.courseName || !formData.issueDate) {
      setError('Completa nombre del estudiante, título/curso y fecha de emisión.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStepTwo = () => {
    if (!file && !designStructure) {
      setError('Sube un documento o diseña el certificado antes de continuar.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStepOne()) return;
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!validateStepTwo()) return;
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1 && !isLoading) {
      setCurrentStep(currentStep - 1);
    }
  };

  const readFileAsBase64 = () => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = typeof reader.result === 'string' ? reader.result : null;
        resolve(res);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 3) {
      handleNextStep();
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    setResultData(null);

    try {
      const limit = plan && plan.limit !== Infinity ? plan.limit : null;
      if (limit !== null && emissionsUsed >= limit) {
        setError(`Límite mensual alcanzado (${plan.limit}). Mejora tu plan para continuar.`);
        setIsLoading(false);
        return;
      }

      const baseHash = `hash-${Date.now()}`;
      const pdfBase64 = await readFileAsBase64();
      const effectivePlan = computePlanFromNetworks();

      const orchestratorRes = await n8nService.orchestrateIssuance({
        documentHash: baseHash,
        studentName: formData.studentName,
        plan: effectivePlan,
        pdfUrl: null,
        pdfBase64
      });

      const payloadForLog = {
        documentHash: baseHash,
        userId: 'user-123',
        metadata: { ...formData, designStructure },
        issuanceType: variant,
        networks,
        orchestrator: orchestratorRes
      };

      await n8nService.submitDocument(payloadForLog);

      const data = orchestratorRes && orchestratorRes.data ? orchestratorRes.data : orchestratorRes;
      setResultData(data || null);
      setMessage('Emisión completada y registrada en orquestador multichain.');
      toast.success('Credencial emitida correctamente');
      if (onEmissionComplete) onEmissionComplete(1);

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className={`px-2 py-1 rounded-full ${currentStep === 1 ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'}`}>1 Datos</span>
              <span className={`px-2 py-1 rounded-full ${currentStep === 2 ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'}`}>2 Documento</span>
              <span className={`px-2 py-1 rounded-full ${currentStep === 3 ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'}`}>3 Emisión</span>
            </div>
          </div>

          {currentStep === 1 && (
            <>
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
            </>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              {!file && (
                <div className="p-4 border border-dashed border-slate-600 rounded-lg bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group">
                  <label className="block text-center cursor-pointer">
                    <span className="text-sm text-slate-400 group-hover:text-primary transition-colors">Subir Documento (PDF/Img)</span>
                    <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
                  </label>
                </div>
              )}

              {file && (
                <div className="text-xs text-slate-300">
                  Archivo seleccionado: <span className="font-semibold">{file.name}</span>
                </div>
              )}

              <div className="flex items-center justify-center my-2 relative">
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
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-sm text-slate-200">
                Revisa los datos antes de emitir en redes multichain de prueba.
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
                <div>
                  <div className="text-slate-400">Estudiante</div>
                  <div className="font-semibold">{formData.studentName || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Título / Curso</div>
                  <div className="font-semibold">{formData.courseName || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Fecha Emisión</div>
                  <div className="font-semibold">{formData.issueDate || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400">Plan</div>
                  <div className="font-semibold capitalize">{computePlanFromNetworks()}</div>
                </div>
              </div>
              {resultData && (
                <div className="mt-2 p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-xs text-slate-200">
                  <div className="font-semibold mb-1">Hashes generados</div>
                  <div>uniqueHash: {resultData.uniqueHash}</div>
                  {resultData.ipfsURI && <div>ipfsURI: {resultData.ipfsURI}</div>}
                  {resultData.externalProofs && (
                    <>
                      {resultData.externalProofs.hederaTx && <div>hederaTx: {resultData.externalProofs.hederaTx}</div>}
                      {resultData.externalProofs.xrpTxHash && <div>xrpTxHash: {resultData.externalProofs.xrpTxHash}</div>}
                      {resultData.externalProofs.algoTxId && <div>algoTxId: {resultData.externalProofs.algoTxId}</div>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isLoading}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Atrás
            </button>
            {currentStep < 3 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="btn-primary bg-secondary hover:bg-secondary-400 text-white"
              >
                Siguiente
              </button>
            )}
            {currentStep === 3 && (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(37, 99, 235, 0.5)" }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || isUploading}
                className="btn-primary bg-secondary hover:bg-secondary-400 text-white shadow-neon-purple"
              >
                {isLoading ? 'Procesando en n8n...' : '🚀 Emitir vía n8n (Multichain)'}
              </motion.button>
            )}
          </div>
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
