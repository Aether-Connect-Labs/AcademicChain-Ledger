import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, Award, Share2, Download, ArrowLeft, Linkedin, AlertCircle, RefreshCw, Zap, QrCode, X, UserCheck, XCircle, FileText, Sparkles, BrainCircuit } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { sanitizeString, isValidLinkedInUrl, isValidId } from './utils/security';

import apiService from './services/apiService';

const SmartCVPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.name || "Alumno Demo";
  
  // States for flow management
  const [step, setStep] = useState('initial'); // initial, survey, scanning, analyzing, feedback, result
  const [progress, setProgress] = useState(0);
  const [feedbackType, setFeedbackType] = useState(null); // 'incomplete' | 'missing_connection' | 'survey_completed' | 'identity_mismatch'
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, checking, success, failed
  const [isGenerating, setIsGenerating] = useState(false);

  // Survey Data State
  const [cvData, setCvData] = useState(null);
  const [surveyData, setSurveyData] = useState({
    specialization: '',
    achievement: '',
    technologies: []
  });

  // LinkedIn & Credential State
  const [linkedInUrl, setLinkedInUrl] = useState(location.state?.linkedInUrl || '');
  const [isVerified] = useState(location.state?.isLinkedInVerified || false);
  const [credentialId, setCredentialId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }
    };
  }, []);

  const startScanner = () => {
    setShowScanner(true);
    setTimeout(async () => {
        try {
            const html5QrCode = new Html5Qrcode("cv-scanner");
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                     // Asumimos que el QR contiene el ID o un JSON con el ID
                     try {
                        const parsed = JSON.parse(decodedText);
                        setCredentialId(sanitizeString(parsed.tokenId || parsed.id || decodedText));
                     } catch {
                        setCredentialId(sanitizeString(decodedText));
                     }
                     stopScanner();
                     toast.success("Credencial vinculada exitosamente");
                },
                () => {}
            );
        } catch (e) {
            console.error(e);
            toast.error("No se pudo acceder a la cámara");
            setShowScanner(false);
        }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
        try {
            await scannerRef.current.stop();
            scannerRef.current = null;
        } catch(e) {}
    }
    setShowScanner(false);
  };

  // Input Validation & Sanitization
  const validateInput = () => {
    if (linkedInUrl && !isValidLinkedInUrl(linkedInUrl)) {
      toast.error("Por favor ingresa una URL de LinkedIn válida");
      return false;
    }
    if (credentialId && !isValidId(credentialId)) {
      toast.error("ID de credencial inválido");
      return false;
    }
    return true;
  };

  const startProcess = () => {
    // Validate inputs first
    if (!validateInput()) return;

    // Sanitize inputs
    setLinkedInUrl(sanitizeString(linkedInUrl));
    setCredentialId(sanitizeString(credentialId));

    // Si hay URL, está verificado o hay credencial, saltamos la encuesta
    if (linkedInUrl || isVerified || credentialId) {
        setStep('scanning');
        startScanningSimulation();
    } else {
        // Si no hay datos, vamos a la encuesta
        setStep('survey');
    }
  };

  const submitSurvey = () => {
    // Sanitize survey data before submission
    const sanitizedData = {
        specialization: sanitizeString(surveyData.specialization),
        achievement: sanitizeString(surveyData.achievement),
        technologies: surveyData.technologies.map(t => sanitizeString(t))
    };
    setSurveyData(sanitizedData);

    // Al enviar la encuesta, simulamos el análisis
    setStep('analyzing');
    setFeedbackType('survey_completed');
    startAnalysis(0);
  };

  const startScanningSimulation = () => {
    let scanProgress = 0;
    const scanInterval = setInterval(() => {
        scanProgress += 2;
        setProgress(scanProgress);
        if (scanProgress >= 50) {
            clearInterval(scanInterval);
            setStep('analyzing');
            startAnalysis(50);
        }
    }, 50);
  };

  const startAnalysis = (startFrom) => {
    let analyzeProgress = startFrom;
    setVerificationStatus('idle');

    const analyzeInterval = setInterval(async () => {
        analyzeProgress += 1;
        setProgress(analyzeProgress);
        
        if (analyzeProgress === 40) {
            setVerificationStatus('checking');
            // Trigger verification in background
            if (credentialId) {
                try {
                    // Use apiService for verification
                    const verificationResult = await apiService.verifyTalent({ credentialId });
                    
                    if (verificationResult.success && verificationResult.verified) {
                        setVerificationStatus('success');
                        setFeedbackType('credential_verified');
                    } else {
                        setVerificationStatus('failed');
                        setFeedbackType('identity_mismatch');
                    }
                } catch (e) {
                    console.error("Verification error:", e);
                    setVerificationStatus('failed');
                    setFeedbackType('identity_mismatch');
                }
            } else {
                // Survey flow - simulate analysis
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate analysis
                    setVerificationStatus('success');
                    setFeedbackType('survey_completed');
                } catch (e) {
                    setVerificationStatus('success'); // Fallback to success for demo
                    setFeedbackType('survey_completed');
                }
            }
        }

        if (analyzeProgress >= 100) {
            clearInterval(analyzeInterval);
            
            // Final check if status wasn't set (should be set by async call above, but just in case)
            if (verificationStatus === 'checking' || verificationStatus === 'idle') {
                 // Fallback if async didn't finish or logic fell through
                 if (credentialId) {
                     // Keep existing simulation as backup
                     const isSimulatedFail = credentialId.includes('FAIL');
                     if (!isSimulatedFail) {
                        setVerificationStatus('success');
                        setFeedbackType('credential_verified');
                     } else {
                        setVerificationStatus('failed');
                        setFeedbackType('identity_mismatch');
                     }
                 } else {
                     setVerificationStatus('success');
                     setFeedbackType('survey_completed');
                 }
            }
            
            setStep('feedback');
        }
    }, 80); // Slower interval to allow async calls
  };


  const finalizeGeneration = async () => {
      setIsGenerating(true);
      
      try {
        const data = await apiService.generateSmartCV({
            specialization: surveyData.specialization,
            technologies: surveyData.technologies,
            achievement: surveyData.achievement || 'Blockchain Certification',
            linkedInUrl,
            credentialId
        });
  
        if (data.success && data.cvData) {
          setCvData(data.cvData);
          toast.success("¡Smart CV generado y optimizado!");
          setStep('result');
        } else {
            console.error("Error generating CV:", data.error);
            toast.error("Error al generar CV, usando modo offline");
            setStep('result');
        }
      } catch (error) {
        console.error("Connection error:", error);
        toast.error("Error de conexión, usando modo offline");
        setStep('result');
      } finally {
        setIsGenerating(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-emerald-500/30 pt-24 pb-12 px-4 relative overflow-hidden flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px]" />
      </div>
      
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 h-16 px-6 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
            >
                <ArrowLeft size={20} strokeWidth={1} />
            </button>
            <div className="flex items-center gap-2">
                <BrainCircuit size={20} className="text-emerald-500" strokeWidth={1} />
                <span className="font-bold text-white tracking-tight">Smart CV Generator</span>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</div>
            </div>
        </div>
        
        <Link 
            to="/precios?tab=students" 
            className="hidden md:flex bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/10 items-center gap-2"
        >
            <Zap size={14} strokeWidth={1} />
            Registrarse
        </Link>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col justify-center min-h-[80vh] relative z-10">
        
        {/* Stepper */}
        {step !== 'result' && (
            <div className="flex justify-center mb-16">
                <div className="flex items-center gap-4">
                    {['Conexión', 'Perfil', 'Análisis', 'Resultado'].map((label, idx) => {
                        const currentIdx = step === 'initial' ? 0 : step === 'survey' ? 1 : (step === 'scanning' || step === 'analyzing') ? 2 : 3;
                        const isActive = idx === currentIdx;
                        const isCompleted = idx < currentIdx;
                        
                        return (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                                    isActive 
                                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                        : isCompleted 
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                                            : 'bg-white/5 text-slate-500 border-white/10'
                                }`}>
                                    {isCompleted ? <CheckCircle size={14} strokeWidth={2} /> : idx + 1}
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'} hidden md:block`}>{label}</span>
                                {idx < 3 && <div className={`w-12 h-[1px] ${isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'}`}></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <AnimatePresence mode="wait">
            {/* Step 1: Initial Input */}
            {step === 'initial' && (
            <motion.div 
                key="initial"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
                <div className="space-y-8">
                <div>
                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight tracking-tight">
                    Tu Carrera, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Impulsada por IA</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-xl font-light">
                    Conecta tu perfil profesional y deja que nuestra IA optimice tu CV con credenciales verificadas en blockchain.
                    </p>
                </div>

                {/* LinkedIn Input Section */}
                <div className="bg-[#0d0d0d]/60 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
                    
                    <div className="flex items-center justify-between text-white font-semibold mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Linkedin size={20} className="text-blue-400" strokeWidth={1} />
                            <span>Conecta tu perfil profesional</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">(Opcional)</span>
                    </div>
                    
                    <div className="relative z-10 mb-8">
                        <input 
                            type="text" 
                            placeholder="https://linkedin.com/in/tu-perfil"
                            value={linkedInUrl}
                            onChange={(e) => setLinkedInUrl(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 font-mono text-sm"
                        />
                        {linkedInUrl && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400">
                                <CheckCircle size={20} strokeWidth={1} />
                            </div>
                        )}
                    </div>
                    
                    <div className="relative flex py-2 items-center mb-8 z-10">
                        <div className="flex-grow border-t border-white/5"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-600 text-[10px] uppercase font-bold tracking-widest">O conecta tu título</span>
                        <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    {/* Credential Input Section */}
                    <div className="space-y-4 relative z-10">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Award size={16} className="text-emerald-400" strokeWidth={1} />
                            ID de Credencial AcademicChain
                        </label>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                placeholder="Ej. AC-2024-XRP-8821"
                                value={credentialId}
                                onChange={(e) => setCredentialId(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 font-mono text-sm"
                            />
                            <button 
                                onClick={startScanner}
                                className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl border border-white/10 transition-colors tooltip"
                                title="Escanear QR del título"
                            >
                                <QrCode size={24} strokeWidth={1} />
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-6 relative z-10 font-mono">
                        <ShieldCheck size={12} strokeWidth={1} />
                        ENCRYPTED & SECURE CONNECTION
                    </p>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startProcess}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 text-lg"
                >
                    {linkedInUrl ? 'Analizar Perfil' : 'Siguiente'}
                    <ArrowLeft size={20} className="rotate-180" strokeWidth={2} />
                </motion.button>
                </div>

                {/* Visual Abstracto */}
                <div className="hidden lg:block relative">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full"></div>
                    <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10"
                    >
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0d0d]/80 backdrop-blur rotate-2 hover:rotate-0 transition-all duration-700">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                             <div className="p-8 space-y-6 opacity-80">
                                <div className="h-20 w-20 rounded-full bg-white/10 mx-auto"></div>
                                <div className="h-4 w-3/4 bg-white/10 mx-auto rounded"></div>
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-white/5 rounded"></div>
                                    <div className="h-2 w-full bg-white/5 rounded"></div>
                                    <div className="h-2 w-5/6 bg-white/5 rounded"></div>
                                </div>
                                <div className="flex gap-2 justify-center pt-4">
                                    <div className="h-8 w-20 bg-emerald-500/20 rounded border border-emerald-500/30"></div>
                                    <div className="h-8 w-20 bg-blue-500/20 rounded border border-blue-500/30"></div>
                                </div>
                             </div>
                        </div>
                        
                        {/* Floating Cards */}
                        <motion.div 
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -left-10 top-1/2 bg-[#0d0d0d]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                <Award size={24} strokeWidth={1} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Certificación</p>
                                <p className="text-sm font-bold text-white">Blockchain Expert</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
            )}

            {/* Step 2: Survey (Optional Fallback) */}
            {step === 'survey' && (
                <motion.div 
                    key="survey"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="bg-[#0d0d0d]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                        <div className="p-8 space-y-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Cuéntanos sobre ti</h2>
                                <p className="text-slate-400 font-light">Completa esta breve encuesta para personalizar tu Smart CV.</p>
                                
                                <div className="mt-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left flex gap-4">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
                                    <div>
                                        <p className="text-amber-200 text-sm font-bold">Trust Score: 60%</p>
                                        <p className="text-amber-500/80 text-xs mt-1 leading-relaxed">
                                            Al no conectar LinkedIn, tu perfil tiene menos validación. 
                                            <button onClick={() => setStep('initial')} className="underline hover:text-amber-400 ml-1 font-bold">Conectar ahora</button> para alcanzar el Top 5% Talento.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">¿En qué áreas te especializas?</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Desarrollo Web, Ciberseguridad, Blockchain..."
                                        value={surveyData.specialization}
                                        onChange={(e) => setSurveyData({...surveyData, specialization: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Tu mayor logro profesional o académico</label>
                                    <textarea 
                                        rows="3"
                                        placeholder="Ej. Lideré la migración de..."
                                        value={surveyData.achievement}
                                        onChange={(e) => setSurveyData({...surveyData, achievement: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Tecnologías que dominas</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {['React', 'Node.js', 'Python', 'Solidity', 'AWS', 'Docker', 'TypeScript', 'SQL'].map(tech => (
                                            <button
                                                key={tech}
                                                onClick={() => {
                                                    const newTechs = surveyData.technologies.includes(tech)
                                                        ? surveyData.technologies.filter(t => t !== tech)
                                                        : [...surveyData.technologies, tech];
                                                    setSurveyData({...surveyData, technologies: newTechs});
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                    surveyData.technologies.includes(tech)
                                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                                }`}
                                            >
                                                {tech}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={submitSurvey}
                                disabled={!surveyData.specialization || !surveyData.achievement}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} strokeWidth={2} />
                                Generar Smart CV
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 2 & 3: Scanning & Analyzing */}
            {(step === 'scanning' || step === 'analyzing') && (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto"
                >
                    <div className="mb-12 relative">
                        {/* Radar Scan Effect */}
                        <div className="w-64 h-64 rounded-full border border-emerald-500/30 relative overflow-hidden flex items-center justify-center bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                            <div className="absolute inset-0 animate-[spin_4s_linear_infinite] bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent"></div>
                            <div className="absolute inset-2 rounded-full border border-emerald-500/20"></div>
                            <div className="absolute inset-16 rounded-full border border-emerald-500/20"></div>
                            <div className="absolute inset-32 rounded-full border border-emerald-500/20"></div>
                            <div className="text-5xl font-bold text-emerald-400 font-mono tracking-tighter">{progress}%</div>
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white mb-6 font-display tracking-tight">
                        {step === 'scanning' ? 'Escaneando perfil profesional...' : 'Verificando credenciales en Blockchain...'}
                    </h3>
                    
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden max-w-md mt-4">
                        <motion.div 
                            className="h-full bg-emerald-500 box-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    <p className="text-slate-400 mt-6 animate-pulse mb-12 font-mono text-sm">
                        {step === 'scanning' ? '> Extracting skills and experience data...' : '> Validating cryptographic signatures on Hedera Hashgraph...'}
                    </p>

                    {step === 'analyzing' && (
                        <div className="bg-[#0d0d0d]/80 backdrop-blur border border-white/5 p-6 rounded-xl w-full max-w-md text-left space-y-4 shadow-2xl">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-4 flex justify-between items-center">
                                Validación de Identidad
                                {verificationStatus === 'checking' && <RefreshCw size={12} className="animate-spin text-emerald-400" />}
                            </h4>
                            
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
                                        <UserCheck size={16} className="text-blue-400" strokeWidth={1} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Solicitante</p>
                                        <p className="text-sm font-bold text-white">{userName}</p>
                                    </div>
                                </div>
                                <CheckCircle size={18} className="text-emerald-500 shadow-lg shadow-emerald-500/20" />
                            </div>

                            {credentialId && (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/5 p-2 rounded-lg group-hover:bg-white/10 transition-colors">
                                            <Award size={16} className="text-emerald-400" strokeWidth={1} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Titular Certificado</p>
                                            <p className="text-sm font-bold text-white">
                                                {verificationStatus === 'idle' ? '...' : 
                                                 verificationStatus === 'failed' ? 'No coincide' : userName}
                                            </p>
                                        </div>
                                    </div>
                                    {verificationStatus === 'checking' ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-emerald-500 animate-spin" />
                                    ) : verificationStatus === 'success' ? (
                                        <CheckCircle size={18} className="text-emerald-500 shadow-lg shadow-emerald-500/20" />
                                    ) : verificationStatus === 'failed' ? (
                                        <XCircle size={18} className="text-red-500 shadow-lg shadow-red-500/20" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-white/10" />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                >
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
                        <button 
                            onClick={stopScanner}
                            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 border border-white/10"
                        >
                            <X size={20} strokeWidth={1} />
                        </button>
                        <div className="p-8 text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Escanear Credencial</h3>
                            <p className="text-slate-400 text-sm mb-8 font-light">Apunta tu cámara al código QR de tu título AcademicChain</p>
                            <div id="cv-scanner" className="w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner"></div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 4: Feedback / Optimization */}
            {step === 'feedback' && (
                <motion.div 
                    key="feedback"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-purple-600"></div>
                        <div className="p-10">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-8 mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                <Zap size={40} strokeWidth={1} />
                            </div>
                            
                            <h2 className="text-3xl font-bold text-center mb-4 text-white">Análisis de Perfil Completado</h2>
                            <p className="text-slate-400 text-center mb-10 font-light">Hemos detectado oportunidades para potenciar tu CV.</p>
                            
                            <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-10 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                                <h4 className="text-white font-bold mb-4 flex items-center gap-3">
                                    <AlertCircle size={20} className="text-amber-400" strokeWidth={1.5} />
                                    Sugerencia de IA
                                </h4>
                                {feedbackType === 'credential_verified' ? (
                                    <p className="text-slate-300 leading-relaxed font-light">
                                        ¡Excelente! Tu credencial <strong className="text-emerald-400 font-medium">AcademicChain</strong> ha sido verificada correctamente y coincide con tu identidad. 
                                        Tu <strong className="text-white font-medium">Trust Score</strong> ha aumentado al <strong className="text-emerald-400 font-medium">98% (Verificado)</strong>.
                                    </p>
                                ) : feedbackType === 'identity_mismatch' ? (
                                    <div className="flex flex-col gap-6">
                                        <p className="text-slate-300 leading-relaxed font-light">
                                            <strong className="text-red-400 font-medium">Error de Verificación:</strong> El titular del certificado no coincide con tu cuenta. 
                                            Tu Trust Score permanece en <strong className="text-amber-400 font-medium">60%</strong>.
                                            Para obtener el badge de <strong className="text-white font-medium">Candidato Verificado</strong>, utiliza una credencial propia válida o actualiza tu plan.
                                        </p>
                                        <button 
                                             onClick={() => navigate('/precios?tab=students')}
                                             className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                         >
                                             <Zap size={18} className="fill-white" />
                                             Actualizar a Career Pro
                                         </button>
                                    </div>
                                ) : feedbackType === 'incomplete' ? (
                                    <p className="text-slate-300 leading-relaxed font-light">
                                        Tu LinkedIn está al <strong className="text-white font-medium">70%</strong>. Agrega tu certificación de <strong className="text-blue-400 font-medium">Smart Contract Auditor</strong> para alcanzar el nivel <strong className="text-purple-400 font-medium">Top 5% Talento</strong>.
                                    </p>
                                ) : feedbackType === 'survey_completed' ? (
                                    <div className="flex flex-col gap-6">
                                        <p className="text-slate-300 leading-relaxed font-light">
                                            Tu perfil se ha generado con un <strong className="text-amber-400 font-medium">Trust Score del 60%</strong>. 
                                            Para alcanzar el <strong className="text-emerald-400 font-medium">98% (Verificado)</strong> y aparecer en búsquedas prioritarias, te recomendamos conectar tu LinkedIn y adquirir el plan <strong className="text-purple-400 font-medium">Career Pro</strong>.
                                        </p>
                                        <button 
                                             onClick={() => navigate('/precios?tab=students')}
                                             className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                         >
                                             <Zap size={18} className="fill-white" />
                                             Actualizar a Career Pro
                                         </button>
                                    </div>
                                ) : (
                                    <p className="text-slate-300 leading-relaxed font-light">
                                        Sincroniza tus títulos de <strong className="text-white font-medium">AcademicChain</strong> para validar tu Historial Académico y aumentar tu <strong className="text-emerald-400 font-medium">Trust Score</strong>.
                                    </p>
                                )}
                            </div>

                            <button 
                                onClick={finalizeGeneration}
                                disabled={isGenerating}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {isGenerating ? (
                                    <RefreshCw size={20} className="animate-spin" />
                                ) : (
                                    <Sparkles size={20} strokeWidth={2} />
                                )}
                                {isGenerating ? 'Generando...' : 'Optimizar y Generar CV Final'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 5: Final Result */}
            {step === 'result' && (
                <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-5xl mx-auto bg-[#0d0d0d] border border-white/10 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative"
                >
                    {/* Sidebar del CV */}
                    <div className="w-full md:w-1/3 bg-black/20 p-10 border-r border-white/5 relative z-10">
                        <div className="w-32 h-32 bg-slate-800 rounded-full mb-8 mx-auto md:mx-0 overflow-hidden border-4 border-[#1a1a1a] shadow-lg relative group">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300" alt="Profile" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            {feedbackType === 'credential_verified' && (
                                <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-4 border-[#0d0d0d]" title="Verificado">
                                    <CheckCircle size={16} className="text-black" strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white text-center md:text-left mb-1 font-display tracking-tight">{userName}</h2>
                        <p className="text-emerald-400 font-bold text-sm mb-8 text-center md:text-left uppercase tracking-widest font-mono">
                            {surveyData.specialization || "Software Engineer"}
                        </p>
                        
                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-4 text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <ShieldCheck size={20} className={feedbackType === 'credential_verified' ? "text-emerald-400" : "text-amber-500"} strokeWidth={1} />
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estado</p>
                                    <p className="font-bold text-sm text-white">
                                        {feedbackType === 'credential_verified' ? 'Identidad Verificada' : 
                                         feedbackType === 'identity_mismatch' ? 'Identidad No Verificada' :
                                         'Verificación Pendiente'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <Award size={20} className="text-purple-400" strokeWidth={1} />
                                <div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nivel</p>
                                    <p className="font-bold text-sm text-white">Top 5% Talento</p>
                                </div>
                            </div>
                        </div>

                        {/* Survey Technologies */}
                        {surveyData.technologies.length > 0 && (
                            <div className="mb-10">
                                <h4 className="font-bold text-slate-500 mb-4 text-[10px] uppercase tracking-widest">Habilidades</h4>
                                <div className="flex flex-wrap gap-2">
                                    {surveyData.technologies.map(tech => (
                                        <span key={tech} className="bg-white/5 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/5">{tech}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-white/5 pt-8">
                            <h4 className="font-bold text-slate-500 mb-6 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                Contacto
                            </h4>
                            <div className="space-y-3 text-sm text-slate-400 font-light">
                                <p className="flex items-center gap-3"><span className="w-5 text-center">📧</span> alumno@demo.com</p>
                                <p className="flex items-center gap-3"><span className="w-5 text-center">📱</span> +1 234 567 890</p>
                                <p className="flex items-center gap-3"><span className="w-5 text-center">📍</span> Madrid, España</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal del CV */}
                    <div className="w-full md:w-2/3 p-12 bg-[#0d0d0d] relative z-10">
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                            <Award size={150} className="text-white" />
                        </div>

                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 border-b border-white/5 pb-4 font-display">
                                <span className="text-emerald-500">●</span>
                                Historial Certificado
                            </h3>

                            <div className="space-y-10 pl-2">
                                {/* Scanned/Entered Credential */}
                                {credentialId && (
                                    <div className="relative pl-10 border-l border-white/10 pb-2 group">
                                        <div className="absolute -left-[6.5px] top-0 w-3 h-3 rounded-full bg-[#0d0d0d] border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:scale-125 transition-transform"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Credencial Vinculada</h4>
                                            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">2024</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4 font-light">AcademicChain Certified</p>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/20">
                                                <Award size={12} strokeWidth={2} />
                                                ID: {credentialId}
                                            </div>
                                            <div className="inline-flex items-center gap-2 bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
                                                <CheckCircle size={12} className="text-emerald-500" strokeWidth={2} />
                                                Validado On-Chain
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="relative pl-10 border-l border-white/10 pb-2 group">
                                    <div className="absolute -left-[6.5px] top-0 w-3 h-3 rounded-full bg-[#0d0d0d] border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Master en Blockchain Development</h4>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">2024</span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4 font-light">AcademicChain University</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500/20">
                                            <img src="https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png" className="w-3 h-3 invert opacity-80" alt="Hedera" />
                                            Credencial ID: 0.0.482910
                                        </div>
                                        <div className="inline-flex items-center gap-2 bg-white/5 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
                                            <Linkedin size={12} className="text-blue-500" strokeWidth={2} />
                                            Verificado
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-10 border-l border-white/10 pb-2 group">
                                    <div className="absolute -left-[6.5px] top-0 w-3 h-3 rounded-full bg-[#0d0d0d] border-2 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] group-hover:scale-125 transition-transform"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Certified Smart Contract Auditor</h4>
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded border border-white/5">2023</span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4 font-light">DeFi Security Institute</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/20">
                                            <img src="https://cryptologos.cc/logos/xrp-xrp-logo.png" className="w-3 h-3 invert opacity-80" alt="XRP" />
                                            Credencial ID: r9cZA1...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-8 border border-white/10 mb-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            
                            <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-3">
                                <Zap size={16} className="text-amber-500 fill-amber-500" />
                                Análisis de IA de Reclutamiento
                            </h4>
                            <div className="text-slate-400 text-sm leading-relaxed mb-6 font-light italic border-l-2 border-white/10 pl-4">
                                {cvData?.personalProfile || (credentialId 
                                    ? `"La vinculación directa de credenciales AcademicChain eleva significativamente la confiabilidad del perfil. El ID ${credentialId.substring(0,8)}... confirma competencias técnicas validadas, posicionando al candidato en el percentil superior."`
                                    : feedbackType === 'survey_completed' 
                                        ? `Perfil generado a partir de datos declarados. El candidato indica especialización en ${surveyData.specialization} y destaca por: "${surveyData.achievement}". Se recomienda validación externa (LinkedIn) para confirmar historial.` 
                                        : `"Este perfil demuestra una trayectoria verificable en tecnologías Web3. La consistencia de las credenciales on-chain aumenta el Trust Score en un 98%, colocándolo como candidato prioritario para roles Fintech."`
                                )}
                            </div>

                            {/* Skills from Backend */}
                            {cvData?.skills && cvData.skills.length > 0 && (
                                <div className="mb-6">
                                    <h5 className="font-bold text-[10px] text-slate-500 uppercase mb-3 tracking-widest">Habilidades Detectadas</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {cvData.skills.map((skill, i) => (
                                            <span key={i} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-medium border border-blue-500/20">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cvData?.marketFit && (
                                <div className="mb-6 p-4 bg-black/20 rounded-xl border border-white/5">
                                    <h5 className="font-bold text-[10px] text-blue-400 uppercase mb-2 tracking-widest">Market Fit</h5>
                                    <p className="text-xs text-slate-400">{cvData.marketFit}</p>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-4">
                                <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${cvData?.trustScore ? 'bg-emerald-500' : credentialId ? 'bg-emerald-500' : feedbackType === 'survey_completed' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: cvData?.trustScore ? `${cvData.trustScore}%` : credentialId ? '90%' : feedbackType === 'survey_completed' ? '60%' : '98%' }}
                                    ></div>
                                </div>
                                <span className={`text-xs font-bold ${feedbackType === 'survey_completed' && !credentialId ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {cvData?.trustScore ? `${cvData.trustScore}/100 Trust Score` : credentialId ? '90/100 Trust Score (Verificado)' : feedbackType === 'survey_completed' ? '60/100 Trust Score' : '98/100 Trust Score'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <button className="col-span-1 bg-white text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
                                <Download size={18} strokeWidth={2} /> Descargar PDF
                            </button>
                            <button className="col-span-1 border border-white/20 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                <Share2 size={18} strokeWidth={2} /> Compartir Link
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default SmartCVPage;
