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
import { sanitizeString } from './utils/security';
import { Check, Rocket, Upload, FileText, User, Calendar, Award, Shield, ChevronRight, ChevronLeft, LayoutTemplate, CheckCircle, ExternalLink, RefreshCw, Terminal, Activity, Lock, Server } from 'lucide-react';

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
  // Styles based on variant - Agency Dark Mode
  const getGradient = () => {
    return 'from-white/10 to-transparent'; // Minimalist separator
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
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
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
      setUniversityName(institutionName === '444' ? 'AcademicChain Ledger' : sanitizeString(institutionName));
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
    // 🔒 Security: Sanitize input immediately
    const sanitizedValue = sanitizeString(value);
    
    if (onFormDataChange) {
      onFormDataChange(prevState => ({ ...prevState, [name]: sanitizedValue }));
    } else {
      setLocalFormData(prevState => ({ ...prevState, [name]: sanitizedValue }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
            toast.error('Solo se permiten archivos PDF');
            return;
        }
        // 🔒 Security: Check file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('El archivo es demasiado grande (máx 10MB)');
            return;
        }
        setFile(selectedFile);
        if (onFileChange) onFileChange(selectedFile);
    }
  };

  const validateStepOne = () => {
    if (!file) {
      toast.error('Por favor diseña o sube un certificado primero');
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!formData.studentName || !formData.courseName || !formData.issueDate) {
      toast.error('Por favor completa todos los campos requeridos');
      return false;
    }
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

  const computePlanFromNetworks = () => {
    if (networks.includes('hedera') && networks.includes('xrpl')) return 'Híbrido (Hedera + XRPL)';
    if (networks.includes('hedera')) return 'Estándar (Hedera)';
    if (networks.includes('xrpl')) return 'Rápido (XRPL)';
    return 'Básico';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    setResultData(null);
    
    // Reset process status
    setProcessStatus({ step: 1, total: 7, message: 'Iniciando proceso de emisión...' });

    try {
      // 1. Generate QR
      setProcessStatus({ step: 2, total: 7, message: 'Generando Código QR de verificación...' });
      const qrData = JSON.stringify({
        student: formData.studentName,
        course: formData.courseName,
        date: formData.issueDate,
        issuer: universityName
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);

      // 2. Embed QR into PDF
      setProcessStatus({ step: 3, total: 7, message: 'Incrustando QR en el documento...' });
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();
      
      // Calculate QR position based on layout
      // Default to bottom center if no specific layout found
      let qrX = width / 2 - 25;
      let qrY = 50;

      // If we have design structure, try to find a better spot or use configured position
      if (designStructure?.layout === 'landscape') {
          // Center bottom for landscape
           qrX = width / 2 - 25;
           qrY = 40;
      }

      firstPage.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: 50,
        height: 50,
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfFileWithQr = new File([pdfBlob], "certificate_with_qr.pdf", { type: 'application/pdf' });

      // 3. Upload to IPFS
      setProcessStatus({ step: 4, total: 7, message: 'Subiendo documento a IPFS...' });
      setIsUploading(true);
      const ipfsResult = await issuanceService.uploadToIPFS(pdfFileWithQr);
      setIsUploading(false);

      if (!ipfsResult.success) {
        throw new Error('Error al subir a IPFS: ' + ipfsResult.error);
      }
      const ipfsHash = ipfsResult.ipfsHash;

      // 4. Generate Hash (SHA-256)
      setProcessStatus({ step: 5, total: 7, message: 'Generando Hash criptográfico...' });
      const fileReader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        fileReader.onload = (e) => resolve(e.target.result);
        fileReader.readAsDataURL(pdfFileWithQr);
      });
      const base64File = await base64Promise;
      const wordArray = CryptoJS.lib.WordArray.create(pdfBytes);
      const hash = CryptoJS.SHA256(wordArray).toString();

      // 5. Blockchain Emission
      setProcessStatus({ step: 6, total: 7, message: 'Registrando en Blockchain...' });
      const payload = {
        studentName: formData.studentName,
        courseName: formData.courseName,
        issueDate: formData.issueDate,
        grade: formData.grade,
        ipfsHash: ipfsHash,
        fileHash: hash,
        networks: networks,
        recipientAccountId: formData.recipientAccountId,
        institutionName: universityName
      };

      const response = await apiService.submitMultiChainCredential(payload);

      if (response.success) {
        setProcessStatus({ step: 7, total: 7, message: '¡Emisión completada con éxito!' });
        setMessage('Título emitido correctamente en la blockchain.');
        setResultData({
            txId: response.txId || response.transactionId,
            ipfsHash: ipfsHash,
            explorerUrl: response.explorerUrl
        });
        toast.success('Título emitido exitosamente');
        if (onEmissionComplete) onEmissionComplete(response);
      } else {
        throw new Error(response.message || 'Error en la emisión');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error desconocido');
      toast.error(err.message || 'Error en la emisión');
      setProcessStatus({ step: 0, total: 7, message: 'Error: ' + (err.message || 'Desconocido') });
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d0d0d',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />

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
        className="bg-[#050505] backdrop-blur-xl border border-white/5 rounded-2xl p-8 relative overflow-hidden shadow-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Minimalist Top Gradient Line */}
        <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent`} />

        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 tracking-tighter flex items-center gap-4">
              {variant === 'certificate' ? <Award className="text-white" size={48} strokeWidth={1} /> : <Shield className="text-white" size={48} strokeWidth={1} />}
              {variant === 'certificate' ? 'EMITIR CERTIFICADO' : 'EMITIR TÍTULO'}
            </h2>
            <p className="text-slate-500 text-xs mt-2 font-medium tracking-widest uppercase">
              AcademicChain AI <span className="text-slate-700">|</span> Sistema de Emisión Descentralizada
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#0d0d0d] border border-white/10 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            v2.0.0
          </div>
        </div>

        {!resultData && (
          <>
            <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10 relative px-4">
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-slate-800/50 -z-10 transform -translate-y-1/2"></div>
            <div className={`absolute left-0 top-1/2 h-[1px] bg-white/20 -z-10 transform -translate-y-1/2 transition-all duration-700 ease-out`} style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
            
            {[
              { num: 1, label: 'DISEÑO', icon: LayoutTemplate },
              { num: 2, label: 'DATOS', icon: User },
              { num: 3, label: 'EMISIÓN', icon: Rocket }
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-3 bg-[#050505] px-4 py-2 z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                    currentStep >= step.num 
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110' 
                      : 'bg-[#0d0d0d] text-slate-600 border-slate-800'
                  }`}
                >
                  <step.icon size={16} strokeWidth={currentStep >= step.num ? 1.5 : 1} />
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold transition-colors duration-500 ${
                  currentStep >= step.num ? 'text-white' : 'text-slate-700'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-white/30 rounded-xl p-10 transition-all group bg-[#0d0d0d]/40 backdrop-blur-sm">
                    <LayoutTemplate size={48} strokeWidth={1} className="text-slate-600 group-hover:text-white mb-6 transition-colors duration-500" />
                    <h3 className="text-white font-bold tracking-tight mb-2 text-lg">Diseño del Documento</h3>
                    <p className="text-slate-500 text-xs text-center max-w-xs mb-8 leading-relaxed">
                        Selecciona una plantilla predefinida o crea un diseño personalizado para tu credencial académica.
                    </p>
                    
                    <div className="flex gap-3 w-full max-w-sm">
                        <button
                            type="button"
                            onClick={() => document.getElementById('file-upload').click()}
                            className="flex-1 px-4 py-3 rounded-lg border border-white/10 text-slate-400 hover:border-white/30 hover:text-white text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 bg-transparent hover:bg-white/5"
                        >
                            <Upload size={14} strokeWidth={1} /> SUBIR PDF
                        </button>
                        <input
                            id="file-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => {
                        if (typeof onOpenDesigner === 'function') {
                            onOpenDesigner();
                        } else {
                            setShowDesigner(true);
                        }
                    }}
                    className="w-full px-6 py-5 rounded-xl bg-gradient-to-r from-[#0d0d0d] to-[#151515] border border-white/5 hover:border-white/20 text-white font-medium text-sm flex items-center justify-between group transition-all shadow-lg hover:shadow-xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></div>
                        <span className="tracking-wide">Abrir Editor Holográfico</span>
                    </div>
                    <ChevronRight size={16} strokeWidth={1} className="text-slate-500 group-hover:text-white transition-colors" />
                </motion.button>

                {savedTemplates.length > 0 && (
                  <div className="mt-6 border border-white/5 rounded-xl bg-[#0d0d0d]/40 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} strokeWidth={1} /> Diseños Guardados
                      </div>
                      <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-mono">{savedTemplates.length}</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                      {savedTemplates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/5 transition-all group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors">
                              <LayoutTemplate size={14} strokeWidth={1} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200 text-xs">{t.name || 'Diseño sin nombre'}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                  {t.docType || t.category || 'Certificado'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-bold tracking-wide transition-all"
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
                            CARGAR
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {file && (
                  <div className="flex items-center justify-between p-4 bg-emerald-900/10 border border-emerald-500/10 rounded-xl animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-4 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <Check size={18} strokeWidth={1} />
                          </div>
                          <div className="overflow-hidden">
                              <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Archivo Seleccionado</p>
                              <p className="text-xs text-emerald-500/70 truncate font-mono mt-0.5">{file.name}</p>
                          </div>
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
                        className="relative z-10 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-colors"
                      >
                        Editar
                      </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="group">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2 group-focus-within:text-white transition-colors">
                        <User size={12} strokeWidth={1} /> Estudiante
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            name="studentName" 
                            value={formData.studentName} 
                            onChange={handleChange} 
                            className="w-full bg-[#0d0d0d]/60 border border-white/5 rounded-xl px-4 py-4 pl-11 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-black transition-all placeholder-slate-700 shadow-inner backdrop-blur-sm" 
                            placeholder="Nombre completo del estudiante" 
                            required 
                        />
                         <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-white transition-colors">
                            <User size={16} strokeWidth={1} />
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2 group-focus-within:text-white transition-colors">
                        <Award size={12} strokeWidth={1} /> Título / Curso
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            name="courseName" 
                            value={formData.courseName} 
                            onChange={handleChange} 
                            className="w-full bg-[#0d0d0d]/60 border border-white/5 rounded-xl px-4 py-4 pl-11 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-black transition-all placeholder-slate-700 shadow-inner backdrop-blur-sm" 
                            placeholder="Ej. Ingeniería de Software" 
                            required 
                        />
                        <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-white transition-colors">
                            <Award size={16} strokeWidth={1} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="group">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2 group-focus-within:text-white transition-colors">
                            <Calendar size={12} strokeWidth={1} /> Fecha Emisión
                        </label>
                        <div className="relative">
                            <input 
                                type="date" 
                                name="issueDate" 
                                value={formData.issueDate} 
                                onChange={handleChange} 
                                className="w-full bg-[#0d0d0d]/60 border border-white/5 rounded-xl px-4 py-4 pl-11 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-black transition-all placeholder-slate-700 shadow-inner backdrop-blur-sm" 
                                required 
                            />
                            <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-white transition-colors">
                                <Calendar size={16} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                    <div className="group">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2 group-focus-within:text-white transition-colors">
                            <Award size={12} strokeWidth={1} /> Nota (0-100)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="grade" 
                                value={formData.grade} 
                                onChange={handleChange} 
                                className="w-full bg-[#0d0d0d]/60 border border-white/5 rounded-xl px-4 py-4 pl-11 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-black transition-all placeholder-slate-700 shadow-inner backdrop-blur-sm" 
                                placeholder="Opcional" 
                            />
                            <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-white transition-colors">
                                <Award size={16} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-2 group-focus-within:text-white transition-colors">
                        <User size={12} strokeWidth={1} /> Cuenta Receptora (Opcional)
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            name="recipientAccountId" 
                            value={formData.recipientAccountId} 
                            onChange={handleChange} 
                            className="w-full bg-[#0d0d0d]/60 border border-white/5 rounded-xl px-4 py-4 pl-11 text-white text-sm focus:outline-none focus:border-white/20 focus:bg-black transition-all placeholder-slate-700 shadow-inner font-mono backdrop-blur-sm" 
                            placeholder="0.0.XXXXX" 
                        />
                        <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-white transition-colors">
                            <User size={16} strokeWidth={1} />
                        </div>
                    </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 p-5 rounded-xl bg-blue-900/10 border border-blue-500/10 text-blue-200 text-xs font-light tracking-wide leading-relaxed">
                   <Shield size={18} strokeWidth={1} className="text-blue-400 shrink-0" />
                   <p>Confirma los detalles finales. Esta acción registrará la credencial permanentemente en la red distribuida a través del Triple Shield Consensus.</p>
                </div>
  
                {file && (
                   <div className="w-full h-56 bg-[#0d0d0d]/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative group shadow-inner">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Vista previa del título" 
                        className="h-full object-contain shadow-2xl transform group-hover:scale-105 transition-transform duration-700 relative z-10"
                      />
                      <div className="absolute bottom-4 right-4 z-20">
                          <span className="text-[10px] text-white font-mono bg-black/80 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2 uppercase tracking-widest">
                              <Rocket size={10} className="text-emerald-500" /> Vista Previa
                          </span>
                      </div>
                   </div>
                )}
  
                <div className="bg-[#0d0d0d]/40 rounded-xl p-6 border border-white/5 space-y-5 backdrop-blur-sm">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={12} strokeWidth={1} /> Resumen de Datos
                    </h4>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                      <div>
                        <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Estudiante</div>
                        <div className="font-medium text-slate-200">{formData.studentName || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Título / Curso</div>
                        <div className="font-medium text-slate-200">{formData.courseName || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Fecha Emisión</div>
                        <div className="font-medium text-slate-200 font-mono">{formData.issueDate || '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Plan de Emisión</div>
                        <div className="font-bold text-emerald-400 capitalize flex items-center gap-2">
                            <Rocket size={12} strokeWidth={2} /> {computePlanFromNetworks()}
                        </div>
                      </div>
                    </div>
                </div>
  
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading || isUploading}
                  className={`w-full px-8 py-5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-xl transition-all relative overflow-hidden group border
                      ${isLoading 
                          ? 'bg-[#1a1a1a] text-slate-600 cursor-not-allowed border-white/5' 
                          : 'bg-gradient-to-r from-emerald-600/90 to-teal-700/90 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-500/20 shadow-lg shadow-emerald-900/20'
                      }`}
                >
                  {isLoading ? (
                      <>
                          <span>Procesando Emisión...</span>
                      </>
                  ) : (
                      <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          <Rocket size={18} strokeWidth={1} className="group-hover:animate-bounce" />
                          <span className="text-sm tracking-widest uppercase">CONFIRMAR Y EMITIR</span>
                      </>
                  )}
                </motion.button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-8 border-t border-white/5">
             {currentStep > 1 && (
                <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                    <ChevronLeft size={14} strokeWidth={1} /> Atrás
                </button>
             )}
             {currentStep < 3 && (
                <button
                    type="button"
                    onClick={handleNextStep}
                    className="ml-auto px-6 py-3 rounded-lg bg-white text-black hover:bg-slate-200 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-white/10 flex items-center gap-2"
                >
                    Siguiente <ChevronRight size={14} strokeWidth={1} />
                </button>
             )}
          </div>
        </form>

        {/* Process Status Overlay - Terminal Style */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-10 font-mono">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-2 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Terminal size={32} strokeWidth={1} className="text-emerald-500 animate-pulse" />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-white mb-2 tracking-tighter uppercase">TRIPLE SHIELD CONSENSUS</h3>
             <p className="text-emerald-500 text-xs mb-8 text-center max-w-xs animate-pulse">
               {'>'} {processStatus.message}_
             </p>
             
             <div className="w-full max-w-sm bg-slate-900/50 rounded-none h-1 overflow-hidden border border-slate-800">
                <div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-300"
                    style={{ width: `${(processStatus.step / processStatus.total) * 100}%` }}
                ></div>
             </div>
             <div className="flex justify-between w-full max-w-sm mt-3 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                <span>Init_Sequence</span>
                <span>Finalize</span>
             </div>
             
             {/* Triple Shield Consensus Terminal */}
             <div className="mt-12 w-full max-w-lg bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-[10px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[length:100%_4px,6px_100%] z-0"></div>
                
                <div className="flex justify-between items-center mb-3 relative z-10 border-b border-white/5 pb-2">
                    <span className="text-emerald-500 font-bold tracking-widest">TRIPLE_SHIELD_CONSENSUS</span>
                    <span className="text-slate-500">STATUS: <span className="text-emerald-400 animate-pulse">LIVE</span></span>
                </div>
                
                <div className="grid grid-cols-3 gap-px bg-white/5 border border-white/5 relative z-10">
                    <div className="bg-black/40 p-2 text-center group/node hover:bg-emerald-900/10 transition-colors">
                        <div className="text-slate-600 mb-1">NODE_01 [HEDERA]</div>
                        <div className="text-emerald-400 font-bold tracking-wider">ACTIVE</div>
                        <div className="text-[8px] text-slate-700 mt-1">LATENCY: 12ms</div>
                    </div>
                    <div className="bg-black/40 p-2 text-center group/node hover:bg-blue-900/10 transition-colors">
                        <div className="text-slate-600 mb-1">NODE_02 [XRPL]</div>
                        <div className="text-blue-400 font-bold tracking-wider">SYNCING</div>
                        <div className="text-[8px] text-slate-700 mt-1">LATENCY: 45ms</div>
                    </div>
                    <div className="bg-black/40 p-2 text-center group/node hover:bg-cyan-900/10 transition-colors">
                        <div className="text-slate-600 mb-1">NODE_03 [ALGO]</div>
                        <div className="text-cyan-400 font-bold tracking-wider">READY</div>
                        <div className="text-[8px] text-slate-700 mt-1">LATENCY: 28ms</div>
                    </div>
                </div>
                
                <div className="mt-2 text-slate-600 text-[9px] flex justify-between relative z-10">
                    <span>HASH_RATE: 450 TH/s</span>
                    <span>ENCRYPTION: AES-256-GCM</span>
                </div>
             </div>
          </div>
        )}
          </>
        )}

        {resultData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "circOut" }}
              className="bg-[#0d0d0d]/60 backdrop-blur-xl rounded-xl p-8 border border-emerald-500/20 shadow-2xl shadow-emerald-900/10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
              
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CheckCircle size={40} strokeWidth={1} className="text-emerald-400" />
              </div>
              
              <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">EMISIÓN COMPLETADA</h3>
              <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto font-light leading-relaxed">
                La credencial ha sido registrada inmutablemente en la red distribuida.
              </p>

              <div className="bg-black/40 rounded-lg p-5 border border-white/5 text-left space-y-4 mb-8 relative z-10 font-mono text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-slate-500 uppercase tracking-wider">Transacción ID</span>
                  <div className="flex items-center gap-2">
                     <span className="text-emerald-400 truncate max-w-[120px]" title={resultData.txId}>{resultData.txId}</span>
                     <Activity size={12} strokeWidth={1} className="text-emerald-500/50" />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 uppercase tracking-wider">IPFS Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 truncate max-w-[120px]" title={resultData.ipfsHash}>{resultData.ipfsHash}</span>
                    <Server size={12} strokeWidth={1} className="text-blue-500/50" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <a 
                  href={resultData.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-4 bg-[#151515] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-xl text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all group"
                >
                  <ExternalLink size={14} strokeWidth={1} className="group-hover:text-emerald-400 transition-colors" />
                  <span>Explorador</span>
                </a>
                <button 
                  onClick={() => {
                    setResultData(null);
                    setCurrentStep(1);
                    setFile(null);
                    setLocalFormData({
                      studentName: '',
                      courseName: '',
                      issueDate: '',
                      grade: '',
                      recipientAccountId: '',
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-4 bg-white hover:bg-slate-200 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-white/5 transition-all"
                >
                  <RefreshCw size={14} strokeWidth={1} />
                  <span>Nueva Emisión</span>
                </button>
              </div>
            </motion.div>
        )}

      </motion.div>
    </div>
  );
};

export default IssueTitleForm;
