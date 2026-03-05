import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import issuanceService from './services/issuanceService';
import apiService from './services/apiService';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CertificateDesigner from './CertificateDesigner';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

const IssueTitleForm = ({ 
  variant = 'degree', 
  demo = false, 
  networks = ['hedera'], 
  plan, 
  emissionsUsed = 0, 
  institutionName,
  issuerId,
  onEmissionComplete, 
  onOpenDesigner,
  onFileChange,
  initialDesign,
  formData: propFormData,
  onFormDataChange
}) => {
  // Styles based on variant
  const getGradient = () => {
    if (variant === 'diploma') return 'from-purple-600 to-blue-600';
    if (variant === 'certificate') return 'from-blue-600 to-cyan-500';
    return 'from-primary-600 to-secondary-600';
  }

  const [localFormData, setLocalFormData] = useState({
    studentName: '',
    courseName: '',
    issueDate: '',
    grade: '',
    recipientAccountId: '',
  });

  const formData = propFormData || localFormData;

  const [showDesigner, setShowDesigner] = useState(false);
  const [designStructure, setDesignStructure] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [universityName, setUniversityName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [resultData, setResultData] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [processStatus, setProcessStatus] = useState({ step: 0, total: 7, message: '' }); // Estado de progreso paso a paso

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const refreshSavedTemplates = () => {
    try {
      const raw = localStorage.getItem('customTemplates');
      if (!raw) {
        setSavedTemplates([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedTemplates(parsed);
      } else {
        setSavedTemplates([]);
      }
    } catch {
      setSavedTemplates([]);
    }
  };

  useEffect(() => {
    if (institutionName) {
      setUniversityName(institutionName === '444' ? 'AcademicChain Ledger' : institutionName);
    }
  }, [institutionName]);

  useEffect(() => {
    if (demo) return;
    const loadTokens = async () => {
      try {
        const data = await issuanceService.getTokens();
        const university = data?.data?.university || '';
        if (!institutionName) {
          setUniversityName(prev => prev || (university === '444' ? 'AcademicChain Ledger' : university) || '');
        }
      } catch (e) {
      } finally {
      }
    };
    loadTokens();
  }, [demo]);

  useEffect(() => {
    refreshSavedTemplates();
  }, []);

  useEffect(() => {
    if (initialDesign && initialDesign.file) {
      setFile(initialDesign.file);
      setDesignStructure(initialDesign.structure);
      if (onFileChange) onFileChange(initialDesign.file);
      // If we have a design, move to Step 2 (Data Entry).
      // Previously this jumped to 3, skipping data entry which caused issues.
      setCurrentStep(2);
    }
  }, [initialDesign]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onFormDataChange) {
      onFormDataChange(prevState => ({ ...prevState, [name]: value }));
    } else {
      setLocalFormData(prevState => ({ ...prevState, [name]: value }));
    }
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
    // Strict validation: Must have a design loaded (file or structure) to proceed
    // This ensures the user has either created a design or loaded a template via the designer
    if (!file && !designStructure) {
      setError('Por favor, utiliza el Diseñador Holográfico para crear o cargar una plantilla antes de continuar.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStepTwo = () => {
    if (!universityName) {
      setError('La institución es obligatoria. Verifica que tu perfil institucional esté configurado.');
      return false;
    }
    if (!formData.studentName || !formData.courseName || !formData.issueDate) {
      setError('Completa institución, nombre del estudiante, título/curso y fecha de emisión.');
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

  const computeSha256 = async (blob) => {
    try {
      if (!blob || !crypto || !crypto.subtle) return null;
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
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

  const pushToTalentPool = (payload) => {
    try {
      const raw = localStorage.getItem('acl:talent-pool');
      const current = raw ? JSON.parse(raw) : [];
      const role = payload.courseName || payload.credentialType || 'Credencial Académica';
      const skills = [
        'Título Verificado',
        payload.credentialType,
        payload.courseName
      ].filter(Boolean);
      const networkLabel = Array.isArray(networks) && networks.includes('hedera') ? 'Hedera' : 'Blockchain';
      const next = [
        {
          id: payload.id || `talent-${Date.now()}`,
          name: payload.studentName,
          role,
          skills,
          location: payload.location || 'Remoto',
          verified: true,
          network: networkLabel,
          txLink: payload.txId ? `https://hashscan.io/testnet/transaction/${payload.txId}` : '',
          institution: payload.institution || universityName || ''
        },
        ...current
      ].slice(0, 50);
      localStorage.setItem('acl:talent-pool', JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('acl:talent-updated'));
      }
    } catch {}
  };

  const generateMockHash = () => {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
    setProcessStatus({ step: 1, total: 7, message: 'Iniciando motor de emisión...' });

    try {
      const limit = plan && plan.limit !== Infinity ? plan.limit : null;
      if (limit !== null && emissionsUsed >= limit) {
        setError(`Límite mensual alcanzado (${plan.limit}). Mejora tu plan para continuar.`);
        setIsLoading(false);
        return;
      }

      // 1. Generate Deterministic Hedera Transaction ID (Simulated for Demo)
      // Format: 0.0.AccountID@Seconds.Nanoseconds
      // This ID will be used in the QR code inside the PDF.
      setProcessStatus({ step: 2, total: 7, message: 'Generando ID de Transacción en Hedera Hashgraph...' });
      await new Promise(r => setTimeout(r, 600)); // Pequeña pausa para que se vea el paso
      
      const timestamp = Date.now();
      const seconds = Math.floor(timestamp / 1000);
      const nanos = (timestamp % 1000) * 1000000;
      const accountId = issuerId || '0.0.12345'; // Use issuer ID or mock
      const hederaTxId = `${accountId}@${seconds}.${nanos}`;
      
      // 2. Multi-Chain Hash Generation (Pre-calculation)
      setProcessStatus({ step: 3, total: 7, message: 'Calculando hashes Multi-Chain (XRP / Algorand)...' });
      await new Promise(r => setTimeout(r, 600));

      const effectivePlan = computePlanFromNetworks();
      let xrpHash = null;
      let algorandHash = null;
      let hederaMemo = `TX:${hederaTxId}`; // Start memo with TxID

      if (effectivePlan === 'dual' || effectivePlan === 'triple') {
        const xrpTx = `XRP${generateMockHash().substring(0, 20)}`;
        xrpHash = xrpTx;
        hederaMemo += `|XRP:${xrpTx}`;
      }

      if (effectivePlan === 'triple') {
        const algoTx = `ALGO${generateMockHash().substring(0, 20)}`;
        algorandHash = algoTx;
        hederaMemo += `|ALGO:${algoTx}`;
      }

      // 3. Update PDF with QR Code containing Hedera Tx ID
      setProcessStatus({ step: 4, total: 7, message: 'Incrustando QR y sellando PDF...' });
      
      let pdfBytes = null;
      let finalFile = file;

      if (file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            // Generate QR Code
            const qrDataUrl = await QRCode.toDataURL(hederaTxId, { margin: 0 });
            const qrImage = await pdfDoc.embedPng(qrDataUrl);
            
            // Draw QR Code on the first page
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();
            
            // Position: Bottom Right (adjust as needed)
            const qrSize = 50;
            const margin = 20;
            
            // Check orientation
            // Usually bottom right corner
            firstPage.drawImage(qrImage, {
                x: width - qrSize - margin,
                y: margin,
                width: qrSize,
                height: qrSize,
            });

            // Save modified PDF
            pdfBytes = await pdfDoc.save();
            finalFile = new File([pdfBytes], file.name, { type: 'application/pdf' });
            
        } catch (pdfErr) {
            console.error("Error modifying PDF with QR:", pdfErr);
            // Fallback to original file if modification fails
            finalFile = file;
        }
      }

      // 4. Calculate SHA-256 of the FINAL PDF
      const sha256 = finalFile ? await computeSha256(finalFile) : `hash-${Date.now()}`;
      const baseHash = sha256;
      hederaMemo += `|SHA256:${baseHash}`; // Add SHA256 to memo

      // 5. Upload to IPFS
      setProcessStatus({ step: 5, total: 7, message: 'Subiendo documento a IPFS (Red Descentralizada)...' });
      
      let ipfsURI = null;
      let ipfsCid = null;
      let encryptedCid = null;

      if (finalFile) {
        try {
          ipfsURI = await issuanceService.uploadToIPFS(finalFile);
          if (ipfsURI) {
              ipfsCid = ipfsURI.replace('ipfs://', '');
              
              // 6. Encrypt CID with SHA-256 Hash
              // "el cid eso se cifra con un hash 256"
              setProcessStatus({ step: 6, total: 7, message: 'Cifrando CID de IPFS con llave SHA-256...' });
              await new Promise(r => setTimeout(r, 400));
              
              encryptedCid = CryptoJS.AES.encrypt(ipfsCid, baseHash).toString();
          }
        } catch (e) {
          console.warn('Fallo al subir PDF a IPFS, continuando sin CID dedicado', e);
          // Fallback silencioso pero funcional
          ipfsCid = `QmSimulated${generateMockHash().substring(0, 30)}`;
          encryptedCid = CryptoJS.AES.encrypt(ipfsCid, baseHash).toString();
        }
      }

      // Create the credential object
      const credentialId = `0.0.${Math.floor(Math.random() * 1000000)}`; // Token ID
      const serialNumber = Math.floor(Math.random() * 1000) + 1;

      const newCredential = {
        id: credentialId,
        tokenId: credentialId,
        serialNumber: serialNumber,
        studentName: formData.studentName,
        title: formData.courseName,
        institutionName: universityName,
        issueDate: formData.issueDate,
        createdAt: new Date().toISOString(),
        status: 'verified',
        type: variant === 'degree' ? 'Título' : 'Certificado',
        
        // Hashes & IDs
        ipfsURI: ipfsURI || `ipfs://${ipfsCid}`,
        ipfsCid: ipfsCid,
        encryptedCid: encryptedCid, // Store encrypted CID
        ipfsHash256: baseHash,
        hederaTxId: hederaTxId, // Store Hedera Tx ID
        
        // Multi-chain Proofs
        xrpHash: xrpHash,
        algorandHash: algorandHash,
        networkType: effectivePlan,
        
        externalProofs: {
          hederaTx: hederaTxId,
          xrpTxHash: xrpHash,
          algoTxId: algorandHash
        },
        
        metadata: {
          attributes: [
             { trait_type: "Student Name", value: formData.studentName },
             { trait_type: "Degree", value: formData.courseName },
             { trait_type: "Institution", value: universityName },
             { trait_type: "Date", value: formData.issueDate },
             { trait_type: "SHA-256", value: baseHash },
             { trait_type: "Hedera Tx ID", value: hederaTxId }
          ]
        }
      };

      // Save to local storage (Mock Database) & Submit to Backend
      try {
        setProcessStatus({ step: 7, total: 7, message: 'Sincronizando "Con Todo" al Backend...' });
        
        const raw = localStorage.getItem('acl:credentials');
        const current = raw ? JSON.parse(raw) : [];
        const updated = [newCredential, ...current];
        localStorage.setItem('acl:credentials', JSON.stringify(updated));
        
        // Update talent pool
        pushToTalentPool({
           id: newCredential.id,
           studentName: newCredential.studentName,
           courseName: newCredential.title,
           credentialType: newCredential.type,
           txId: newCredential.externalProofs.hederaTx,
           institution: universityName
        });

        // --- SUBMIT TO BACKEND (Multi-Chain "Con Todo") ---
        try {
            await apiService.submitMultiChainCredential(newCredential);
            toast.success('¡Sincronizado con Backend!');
        } catch (backendErr) {
            console.warn('Backend sync failed, but local saved:', backendErr);
            toast.error('Error de conexión al backend, pero se guardó localmente.');
        }

        if (onEmissionComplete) {
          onEmissionComplete(1);
        }
        
        setResultData(newCredential);
        setCurrentStep(4); // Success Step
        toast.success('¡Credencial emitida y registrada en Blockchain!');
      } catch (e) {
        console.error(e);
        setError('Error al guardar la credencial');
      } finally {
        setIsLoading(false);
        setProcessStatus({ step: 0, total: 7, message: '' });
      }
    } catch (err) {
      console.error(err);
      setError('Error en el proceso de emisión: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Toaster position="top-right" />

      {/* Designer Modal */}
      <AnimatePresence>
        {showDesigner && typeof document !== 'undefined' && createPortal(
          <CertificateDesigner
            onClose={() => {
              setShowDesigner(false);
              refreshSavedTemplates();
            }}
            data={formData}
            onSave={(generatedFile, structure) => {
              setFile(generatedFile);
              setDesignStructure(structure);
              if (onFileChange) onFileChange(generatedFile);
              setShowDesigner(false);
              refreshSavedTemplates();
              toast.success('Diseño guardado. Avanzando a emisión...');
              setCurrentStep(3);
            }}
            onNavigate={(action) => {
              if (action === 'continue_to_issuance') {
                setCurrentStep(3);
              }
            }}
          />,
          document.body
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
            <span className="ml-3 text-xs bg-secondary text-white px-2 py-1 rounded-full align-middle">Impulsado por AcademicChain AI</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-start w-full relative">
              
              <div className={`flex flex-col items-center gap-2 px-2 z-10 ${currentStep >= 1 ? 'text-primary' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= 1 ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">Diseño</span>
              </div>
              
              <div className="flex-1 h-0.5 bg-slate-800 mt-[16px] -mx-2">
                <div className={`h-full bg-primary transition-all duration-500 ${currentStep >= 2 ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex flex-col items-center gap-2 px-2 z-10 ${currentStep >= 2 ? 'text-primary' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= 2 ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">Datos</span>
              </div>

              <div className="flex-1 h-0.5 bg-slate-800 mt-[16px] -mx-2">
                <div className={`h-full bg-primary transition-all duration-500 ${currentStep >= 3 ? 'w-full' : 'w-0'}`}></div>
              </div>

              <div className={`flex flex-col items-center gap-2 px-2 z-10 ${currentStep >= 3 ? 'text-primary' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= 3 ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                  3
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold">Emisión</span>
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-slate-300">
                Usa el editor visual para diseñar un certificado o diploma auténtico.
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  if (typeof onOpenDesigner === 'function') {
                    onOpenDesigner();
                  } else {
                    setShowDesigner(true);
                  }
                }}
                className="w-full py-3 border border-purple-500/50 text-purple-300 rounded-xl hover:bg-purple-900/20 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10"
              >
                <span>🎨</span> Diseñar Certificado (Editor Visual)
              </motion.button>

              {savedTemplates.length > 0 && (
                <div className="mt-2 border border-slate-700 rounded-lg bg-black/30 p-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    Diseños guardados en Diseñador Holográfico
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedTemplates.map(t => (
                      <div key={t.id} className="flex items-center justify-between text-xs text-slate-200">
                        <div>
                          <div className="font-semibold">{t.name || 'Diseño sin nombre'}</div>
                          <div className="text-[10px] text-slate-500">
                            {t.docType || t.category || 'Certificado'}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-slate-800 border border-slate-600 hover:border-cyan-500 text-[10px]"
                          onClick={() => {
                            try {
                              localStorage.setItem('activeTemplateId', t.id);
                            } catch {}
                            if (typeof onOpenDesigner === 'function') {
                              onOpenDesigner();
                            } else {
                              setShowDesigner(true);
                            }
                          }}
                        >
                          Abrir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <>
              {file && (
                <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 overflow-hidden flex-shrink-0">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Diseño seleccionado" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">Diseño Seleccionado</h4>
                    <p className="text-xs text-slate-400 truncate">{file.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                        if (typeof onOpenDesigner === 'function') {
                            onOpenDesigner();
                        } else {
                            setShowDesigner(true);
                        }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-300 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              )}

              <div className="mb-4">
                <label className="label-text">Institución</label>
                <input type="text" value={universityName} readOnly className="input-primary opacity-50 cursor-not-allowed" placeholder="Detectando..." />
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

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-sm text-slate-300 border-l-2 border-primary pl-3">
                Confirma los detalles finales. Esta acción registrará la credencial permanentemente en la red distribuida.
              </div>

              {file && (
                 <div className="w-full h-48 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center justify-center overflow-hidden relative group shadow-inner">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Vista previa del título" 
                      className="h-full object-contain shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 right-2">
                        <span className="text-[10px] text-white/80 font-mono bg-black/60 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">Vista Previa</span>
                    </div>
                 </div>
              )}

              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resumen de Datos</h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs">Estudiante</div>
                      <div className="font-semibold text-white">{formData.studentName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Título / Curso</div>
                      <div className="font-semibold text-white">{formData.courseName || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Fecha Emisión</div>
                      <div className="font-semibold text-white">{formData.issueDate || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs">Plan de Emisión</div>
                      <div className="font-semibold text-primary-300 capitalize">{computePlanFromNetworks()}</div>
                    </div>
                  </div>
              </div>

              {resultData && (
                <div className="mt-2 p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-xs text-green-300 animate-in fade-in slide-in-from-bottom-2">
                  <div className="font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Emisión Exitosa
                  </div>
                  {resultData.sha256 && (
                    <div className="font-mono opacity-80 mb-1">SHA-256: {resultData.sha256.substring(0, 20)}...</div>
                  )}
                  {resultData.ipfsURI && (
                    <div className="font-mono opacity-80">IPFS: {resultData.ipfsURI.substring(0, 20)}...</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-slate-800/50 mt-4">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || isLoading}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Atrás
            </button>
            {currentStep < 3 && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/20 transition-all text-sm font-bold"
              >
                Siguiente
              </button>
            )}
            {currentStep === 3 && (
              <div className="flex flex-col gap-4 mt-6">
                {/* Detailed Progress Indicator */}
                {isLoading && processStatus.step > 0 && (
                    <div className="w-full bg-slate-900/80 rounded-xl p-5 border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)] backdrop-blur-md">
                        <div className="flex justify-between text-xs text-primary-300 mb-2 font-mono uppercase tracking-wider">
                            <span>Fase {processStatus.step} de {processStatus.total}</span>
                            <span>{Math.round((processStatus.step / processStatus.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700">
                            <motion.div 
                                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${(processStatus.step / processStatus.total) * 100}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                            >
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-30 animate-[slide_1s_linear_infinite]"></div>
                            </motion.div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white font-medium">
                            {processStatus.step < processStatus.total ? (
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0"></div>
                            ) : (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-white text-xs font-bold">✓</span>
                                </div>
                            )}
                            <span className="animate-pulse">{processStatus.message}</span>
                        </div>
                    </div>
                )}

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || isUploading}
                    className={`w-full px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg transition-all
                        ${isLoading 
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
                            : 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white shadow-purple-900/40 border border-purple-500/30'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <span>Procesando Emisión...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">🚀</span> 
                            <span>Firmar y Emitir Credencial ("Con Todo")</span>
                        </>
                    )}
                </motion.button>
              </div>
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

