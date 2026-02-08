import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, Search, CheckCircle, Award, Share2, Download, Eye, ArrowLeft, Linkedin, AlertCircle, RefreshCw, Zap, QrCode, Camera, X, UserCheck, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';

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

  // Survey Data State
  const [surveyData, setSurveyData] = useState({
    specialization: '',
    achievement: '',
    technologies: []
  });

  // LinkedIn & Credential State
  const [linkedInUrl, setLinkedInUrl] = useState(location.state?.linkedInUrl || '');
  const [isVerified, setIsVerified] = useState(location.state?.isLinkedInVerified || false);
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
                        setCredentialId(parsed.tokenId || parsed.id || decodedText);
                     } catch {
                        setCredentialId(decodedText);
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

  const startProcess = () => {
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
            // Trigger n8n verification in background
            if (credentialId) {
                try {
                    const result = await n8nService.verifyTalent({ credentialId });
                    if (result.success && result.verified) {
                        setVerificationStatus('success');
                        setFeedbackType('credential_verified');
                    } else {
                        setVerificationStatus('failed');
                        setFeedbackType('identity_mismatch');
                    }
                } catch (e) {
                    setVerificationStatus('failed');
                    setFeedbackType('identity_mismatch');
                }
            } else {
                // Survey flow - trigger generation
                try {
                    await n8nService.generateSmartCV(surveyData);
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

  const finalizeGeneration = () => {
      toast.success("¡Smart CV generado y optimizado!");
      setStep('result');
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 50%)' }}></div>
      
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/5 border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-400">Smart CV Generator</span>
              <div className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30">PRO</div>
            </div>
            <Link 
              to="/precios?tab=students" 
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-purple-500/25 border border-purple-400/20"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl flex flex-col justify-center min-h-[80vh]">
        
        {/* Stepper */}
        {step !== 'result' && (
            <div className="flex justify-center mb-12">
                <div className="flex items-center gap-4">
                    {['Conexión', 'Perfil', 'Análisis', 'Resultado'].map((label, idx) => {
                        const steps = ['initial', 'survey', 'scanning', 'feedback']; // scanning/analyzing map to 2
                        const currentIdx = step === 'initial' ? 0 : step === 'survey' ? 1 : (step === 'scanning' || step === 'analyzing') ? 2 : 3;
                        const isActive = idx === currentIdx;
                        const isCompleted = idx < currentIdx;
                        
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : isCompleted ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {isCompleted ? <CheckCircle size={14} /> : idx + 1}
                                </div>
                                <span className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'} hidden md:block`}>{label}</span>
                                {idx < 3 && <div className={`w-12 h-0.5 ${isCompleted ? 'bg-slate-600' : 'bg-slate-800'}`}></div>}
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
                <div className="space-y-8">
                <div>
                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 leading-tight">
                    Tu Carrera, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Impulsada por IA</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                    Conecta tu perfil profesional y deja que nuestra IA optimice tu CV con credenciales verificadas en blockchain.
                    </p>
                </div>

                {/* LinkedIn Input Section */}
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between text-white font-semibold">
                        <div className="flex items-center gap-2">
                            <Linkedin size={20} className="text-blue-400" />
                            <span>Conecta tu perfil profesional</span>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">(Opcional)</span>
                    </div>
                    
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="https://linkedin.com/in/tu-perfil"
                            value={linkedInUrl}
                            onChange={(e) => setLinkedInUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-4 pr-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                        />
                        {linkedInUrl && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                                <CheckCircle size={20} />
                            </div>
                        )}
                    </div>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">O conecta tu título</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    {/* Credential Input Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Award size={16} className="text-purple-400" />
                            ID de Credencial AcademicChain
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Ej. AC-2024-XRP-8821"
                                value={credentialId}
                                onChange={(e) => setCredentialId(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                            />
                            <button 
                                onClick={startScanner}
                                className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl border border-slate-600 transition-colors tooltip"
                                title="Escanear QR del título"
                            >
                                <QrCode size={24} />
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-4">
                        <ShieldCheck size={12} />
                        Tus datos se procesan de forma segura y privada.
                    </p>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startProcess}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 text-lg"
                >
                    {linkedInUrl ? 'Analizar Perfil' : 'Siguiente'}
                    <ArrowLeft size={20} className="rotate-180" />
                </motion.button>
                </div>

                {/* Visual Abstracto */}
                <div className="hidden lg:block relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full"></div>
                    <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800" 
                            alt="CV Preview" 
                            className="rounded-2xl shadow-2xl border border-slate-700/50 opacity-90 rotate-2 hover:rotate-0 transition-all duration-700"
                        />
                        
                        {/* Floating Cards */}
                        <motion.div 
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -left-10 top-1/2 bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <Award size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Certificación</p>
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
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-white mb-2">Cuéntanos sobre ti</h2>
                                <p className="text-slate-400">Completa esta breve encuesta para personalizar tu Smart CV.</p>
                                
                                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-left flex gap-3">
                                    <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-yellow-200 text-sm font-bold">Trust Score: 60%</p>
                                        <p className="text-yellow-500/80 text-xs mt-1">
                                            Al no conectar LinkedIn, tu perfil tiene menos validación. 
                                            <button onClick={() => setStep('initial')} className="underline hover:text-yellow-400 ml-1">Conectar ahora</button> para alcanzar el Top 5% Talento.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">¿En qué áreas te especializas?</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. Desarrollo Web, Ciberseguridad, Blockchain..."
                                        value={surveyData.specialization}
                                        onChange={(e) => setSurveyData({...surveyData, specialization: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Tu mayor logro profesional o académico</label>
                                    <textarea 
                                        rows="3"
                                        placeholder="Ej. Lideré la migración de..."
                                        value={surveyData.achievement}
                                        onChange={(e) => setSurveyData({...surveyData, achievement: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none resize-none"
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
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
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
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
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
                    <div className="mb-10 relative">
                        {/* Radar Scan Effect */}
                        <div className="w-48 h-48 rounded-full border border-blue-500/30 relative overflow-hidden flex items-center justify-center bg-blue-500/5">
                            <div className="absolute inset-0 animate-[spin_4s_linear_infinite] bg-gradient-to-t from-blue-500/20 via-transparent to-transparent"></div>
                            <div className="absolute inset-2 rounded-full border border-blue-500/20"></div>
                            <div className="absolute inset-12 rounded-full border border-blue-500/20"></div>
                            <div className="text-4xl font-bold text-blue-400">{progress}%</div>
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-white mb-4 font-display">
                        {step === 'scanning' ? 'Escaneando perfil profesional...' : 'Verificando credenciales en Blockchain...'}
                    </h3>
                    
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-md mt-4">
                        <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    <p className="text-slate-400 mt-6 animate-pulse mb-8">
                        {step === 'scanning' ? 'Extrayendo experiencia y habilidades...' : 'Validando firmas criptográficas en Hedera Hashgraph...'}
                    </p>

                    {step === 'analyzing' && (
                        <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-6 rounded-xl w-full max-w-md text-left space-y-4 shadow-2xl">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
                                Validación de Identidad
                                {verificationStatus === 'checking' && <RefreshCw size={12} className="animate-spin text-blue-400" />}
                            </h4>
                            
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 transition-colors">
                                        <UserCheck size={16} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Solicitante</p>
                                        <p className="text-sm font-bold text-white">{userName}</p>
                                    </div>
                                </div>
                                <CheckCircle size={18} className="text-green-500 shadow-lg shadow-green-500/20" />
                            </div>

                            {credentialId && (
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 transition-colors">
                                            <Award size={16} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Titular Certificado</p>
                                            <p className="text-sm font-bold text-white">
                                                {verificationStatus === 'idle' ? '...' : 
                                                 verificationStatus === 'failed' ? 'No coincide' : userName}
                                            </p>
                                        </div>
                                    </div>
                                    {verificationStatus === 'checking' ? (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin" />
                                    ) : verificationStatus === 'success' ? (
                                        <CheckCircle size={18} className="text-green-500 shadow-lg shadow-green-500/20" />
                                    ) : verificationStatus === 'failed' ? (
                                        <XCircle size={18} className="text-red-500 shadow-lg shadow-red-500/20" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative">
                        <button 
                            onClick={stopScanner}
                            className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                        >
                            <X size={20} />
                        </button>
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-white mb-2">Escanear Credencial</h3>
                            <p className="text-slate-400 text-sm mb-6">Apunta tu cámara al código QR de tu título AcademicChain</p>
                            <div id="cv-scanner" className="w-full bg-black rounded-lg overflow-hidden"></div>
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
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1"></div>
                        <div className="p-8">
                            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-6 mx-auto border border-yellow-500/30">
                                <Zap size={32} />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-center mb-2">Análisis de Perfil Completado</h2>
                            <p className="text-slate-400 text-center mb-8">Hemos detectado oportunidades para potenciar tu CV.</p>
                            
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-yellow-400" />
                                    Sugerencia de IA
                                </h4>
                                {feedbackType === 'credential_verified' ? (
                                    <p className="text-slate-300 leading-relaxed">
                                        ¡Excelente! Tu credencial <strong className="text-green-400">AcademicChain</strong> ha sido verificada correctamente y coincide con tu identidad. 
                                        Tu <strong className="text-white">Trust Score</strong> ha aumentado al <strong className="text-green-400">98% (Verificado)</strong>.
                                    </p>
                                ) : feedbackType === 'identity_mismatch' ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-slate-300 leading-relaxed">
                                            <strong className="text-red-400">Error de Verificación:</strong> El titular del certificado no coincide con tu cuenta. 
                                            Tu Trust Score permanece en <strong className="text-yellow-400">60%</strong>.
                                            Para obtener el badge de <strong className="text-white">Candidato Verificado</strong>, utiliza una credencial propia válida o actualiza tu plan.
                                        </p>
                                        <button 
                                             onClick={() => navigate('/precios?tab=students')}
                                             className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                         >
                                             <Zap size={18} className="fill-white" />
                                             Actualizar a Career Pro
                                         </button>
                                    </div>
                                ) : feedbackType === 'incomplete' ? (
                                    <p className="text-slate-300 leading-relaxed">
                                        Tu LinkedIn está al <strong className="text-white">70%</strong>. Agrega tu certificación de <strong className="text-blue-400">Smart Contract Auditor</strong> para alcanzar el nivel <strong className="text-purple-400">Top 5% Talento</strong>.
                                    </p>
                                ) : feedbackType === 'survey_completed' ? (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-slate-300 leading-relaxed">
                                            Tu perfil se ha generado con un <strong className="text-yellow-400">Trust Score del 60%</strong>. 
                                            Para alcanzar el <strong className="text-green-400">98% (Verificado)</strong> y aparecer en búsquedas prioritarias, te recomendamos conectar tu LinkedIn y adquirir el plan <strong className="text-purple-400">Career Pro</strong>.
                                        </p>
                                        <button 
                                             onClick={() => navigate('/precios?tab=students')}
                                             className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                         >
                                             <Zap size={18} className="fill-white" />
                                             Actualizar a Career Pro
                                         </button>
                                    </div>
                                ) : (
                                    <p className="text-slate-300 leading-relaxed">
                                        Sincroniza tus títulos de <strong className="text-white">AcademicChain</strong> para validar tu Historial Académico y aumentar tu <strong className="text-green-400">Trust Score</strong>.
                                    </p>
                                )}
                            </div>

                            <button 
                                onClick={finalizeGeneration}
                                className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                            >
                                <RefreshCw size={20} />
                                Optimizar y Generar CV Final
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
                    className="w-full max-w-5xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
                >
                    {/* Sidebar del CV */}
                    <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r border-slate-200">
                        <div className="w-32 h-32 bg-slate-200 rounded-full mb-6 mx-auto md:mx-0 overflow-hidden border-4 border-white shadow-lg relative group">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300" alt="Profile" className="w-full h-full object-cover" />
                            {feedbackType === 'credential_verified' && (
                                <div className="absolute bottom-0 right-0 bg-green-500 p-1.5 rounded-full border-2 border-white" title="Verificado">
                                    <CheckCircle size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 text-center md:text-left mb-1">{userName}</h2>
                        <p className="text-blue-600 font-bold text-sm mb-6 text-center md:text-left uppercase tracking-wide">
                            {surveyData.specialization || "Software Engineer"}
                        </p>
                        
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <ShieldCheck size={18} className={feedbackType === 'credential_verified' ? "text-green-600" : "text-yellow-500"} />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado</p>
                                    <p className="font-bold text-sm">
                                        {feedbackType === 'credential_verified' ? 'Identidad Verificada' : 
                                         feedbackType === 'identity_mismatch' ? 'Identidad No Verificada' :
                                         'Verificación Pendiente'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <Award size={18} className="text-purple-600" />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nivel</p>
                                    <p className="font-bold text-sm">Top 5% Talento</p>
                                </div>
                            </div>
                        </div>

                        {/* Survey Technologies */}
                        {surveyData.technologies.length > 0 && (
                            <div className="mb-8">
                                <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider">Habilidades</h4>
                                <div className="flex flex-wrap gap-2">
                                    {surveyData.technologies.map(tech => (
                                        <span key={tech} className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">{tech}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                                Contacto
                            </h4>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p className="flex items-center gap-2"><span className="w-4">📧</span> alumno@demo.com</p>
                                <p className="flex items-center gap-2"><span className="w-4">📱</span> +1 234 567 890</p>
                                <p className="flex items-center gap-2"><span className="w-4">📍</span> Madrid, España</p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido Principal del CV */}
                    <div className="w-full md:w-2/3 p-10 bg-white relative">
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Award size={100} className="text-slate-900" />
                        </div>

                        <div className="mb-10">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b-2 border-slate-100 pb-3">
                                <span className="text-blue-600">●</span>
                                Historial Certificado
                            </h3>

                            <div className="space-y-8 pl-2">
                                {/* Scanned/Entered Credential */}
                                {credentialId && (
                                    <div className="relative pl-8 border-l-2 border-slate-100 pb-2">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-green-500 shadow-sm"></div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-lg font-bold text-slate-900">Credencial Vinculada</h4>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">2024</span>
                                        </div>
                                        <p className="text-slate-600 text-sm mb-3 font-medium">AcademicChain Certified</p>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded text-xs font-medium border border-green-100">
                                                <Award size={12} />
                                                ID: {credentialId}
                                            </div>
                                            <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded text-xs font-medium border border-slate-200">
                                                <CheckCircle size={12} className="text-green-600" />
                                                Validado On-Chain
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="relative pl-8 border-l-2 border-slate-100 pb-2">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-600 shadow-sm"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-lg font-bold text-slate-900">Master en Blockchain Development</h4>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">2024</span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3 font-medium">AcademicChain University</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs font-medium border border-blue-100">
                                            <img src="https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png" className="w-3 h-3" alt="Hedera" />
                                            Credencial ID: 0.0.482910
                                        </div>
                                        <div className="inline-flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded text-xs font-medium border border-slate-200">
                                            <Linkedin size={12} className="text-blue-600" />
                                            Verificado
                                        </div>
                                    </div>
                                </div>

                                <div className="relative pl-8 border-l-2 border-slate-100 pb-2">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-purple-600 shadow-sm"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-lg font-bold text-slate-900">Certified Smart Contract Auditor</h4>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">2023</span>
                                    </div>
                                    <p className="text-slate-600 text-sm mb-3 font-medium">DeFi Security Institute</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded text-xs font-medium border border-purple-100">
                                            <img src="https://cryptologos.cc/logos/xrp-xrp-logo.png" className="w-3 h-3" alt="XRP" />
                                            Credencial ID: r9cZA1...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 border border-blue-100 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            
                            <h4 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                                <Zap size={16} className="text-yellow-500 fill-yellow-500" />
                                Análisis de IA de Reclutamiento
                            </h4>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                {credentialId 
                                    ? `"La vinculación directa de credenciales AcademicChain eleva significativamente la confiabilidad del perfil. El ID ${credentialId.substring(0,8)}... confirma competencias técnicas validadas, posicionando al candidato en el percentil superior."`
                                    : feedbackType === 'survey_completed' 
                                        ? `Perfil generado a partir de datos declarados. El candidato indica especialización en ${surveyData.specialization} y destaca por: "${surveyData.achievement}". Se recomienda validación externa (LinkedIn) para confirmar historial.` 
                                        : `"Este perfil demuestra una trayectoria verificable en tecnologías Web3. La consistencia de las credenciales on-chain aumenta el Trust Score en un 98%, colocándolo como candidato prioritario para roles Fintech."`
                                }
                            </p>
                            
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${credentialId ? 'bg-green-500 w-[90%]' : feedbackType === 'survey_completed' ? 'bg-yellow-500 w-[60%]' : 'bg-green-500 w-[98%]'}`}
                                    ></div>
                                </div>
                                <span className={`text-xs font-bold ${feedbackType === 'survey_completed' && !credentialId ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {credentialId ? '90/100 Trust Score (Verificado)' : feedbackType === 'survey_completed' ? '60/100 Trust Score' : '98/100 Trust Score'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="col-span-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/10">
                                <Download size={18} /> Descargar PDF
                            </button>
                            <button className="col-span-1 border-2 border-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors hover:border-slate-200 hover:text-slate-900">
                                <Share2 size={18} /> Compartir Link
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
