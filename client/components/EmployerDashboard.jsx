import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Upload, Search, FileText, CheckCircle, XCircle, Camera, Shield, Lock, MapPin } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import n8nService from './services/n8nService';
import { toast, Toaster } from 'react-hot-toast';
import { toGateway } from './utils/ipfsUtils';

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scan'); // scan, search, cv-validation
  const [verificationResult, setVerificationResult] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null); // Filter state
  const [, setJobDescriptionFile] = useState(null);
  const [, setCvFiles] = useState([]);
  const [cvValidationResults, setCvValidationResults] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const scannerRef = useRef(null);

  // Employer Branding State
  const [employerName, setEmployerName] = useState('Tech Recruiters Inc.');
  const [employerLogo, setEmployerLogo] = useState(toGateway('ipfs://bafkreicickkyjjn3ztitciypfh635lqowdskzbv54fiqbrhs4zbmwhjv4q'));
  const [isEditingName, setIsEditingName] = useState(false);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmployerLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock Talents Data with Blockchain Info
  const mockTalents = [];

  // Quick filters for Smart Matching
  const smartFilters = [
      { id: 'solidity', label: 'Solidity', icon: '⚡' },
      { id: 'security', label: 'Ciberseguridad', icon: '🔒' },
      { id: 'defi', label: 'DeFi', icon: '💸' },
      { id: 'react', label: 'React / Frontend', icon: '🎨' },
      { id: 'verified', label: 'Verificación de Identidad', icon: '✅' },
      { id: 'smart-match', label: 'IA Smart Match', icon: '🧠', special: true }
  ];

  const handleJobDescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        setJobDescriptionFile(file);
        // Simulate n8n processing
        toast.loading('Analizando descripción del cargo con IA...');
        setTimeout(() => {
            toast.dismiss();
            toast.success('Perfil de cargo analizado. Filtrando candidatos...');
            setActiveFilter('smart-match');
            setSearchQuery(''); 
        }, 2000);
    }
  };

  const handleCvValidation = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setCvFiles(files);
    setLoading(true);
    toast.loading(`Analizando ${files.length} documentos...`);

    // Initialize results
    const results = files.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        fileName: f.name,
        size: f.size,
        status: 'processing'
    }));
    setCvValidationResults(results);

    // Simulate sequential processing
    const finalResults = [...results];
    
    for (let i = 0; i < files.length; i++) {
        // Simulate n8n processing time
        await new Promise(r => setTimeout(r, 1200));
        
        // Generate generic data based on file
        const candidate = {
            name: `Candidato ${i + 1}`,
            skills: ['Verificado', 'Blockchain', 'Smart Contracts'],
            score: Math.floor(Math.random() * (99 - 85) + 85)
        };

        finalResults[i] = {
            ...finalResults[i],
            status: 'valid',
            candidateName: candidate.name,
            matchScore: candidate.score,
            verifiedSkills: candidate.skills,
            identityVerified: true,
            blockchainProof: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        };
        
        setCvValidationResults([...finalResults]);
    }

    setLoading(false);
    toast.dismiss();
    toast.success(`${files.length} CVs validados y procesados`);
  };

  const handleDownloadReport = async () => {
    if (cvValidationResults.length === 0) return;
    
    setGeneratingReport(true);
    toast.loading('Generando Reporte de Veracidad Consolidado...');

    try {
        const reportData = {
            recruiterId: 'employer-123',
            totalFiles: cvValidationResults.length,
            validCount: cvValidationResults.filter(r => r.status === 'valid').length,
            results: cvValidationResults
        };

        const res = await n8nService.generateEmployerReport(reportData);
        
        if (res.success) {
            toast.dismiss();
            toast.success('Reporte generado y enviado a tu correo', { duration: 5000 });
            // In a real app, we might open the PDF URL directly:
            // window.open(res.reportUrl, '_blank');
        } else {
            throw new Error(res.message);
        }
    } catch (error) {
        console.error('Report error:', error);
        toast.dismiss();
        toast.error('Error generando reporte');
    } finally {
        setGeneratingReport(false);
    }
  };

  const handleContact = () => {
      toast('🔒 Función Premium: Suscríbete para contactar talento verificado', {
          icon: '💎',
          style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
          },
      });
      setTimeout(() => navigate('/precios?tab=employers'), 1500);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error('Failed to clear scanner', error));
      }
    };
  }, []);

  const startScanner = async () => {
    try {
        const scannerId = "reader";
        if (!document.getElementById(scannerId)) return;
        
        // If already running, stop first
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (e) { 
                // ignore stop error 
            }
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            (decodedText) => {
                console.log('QR Code scanned:', decodedText);
                setScanResult(decodedText);
                html5QrCode.stop().then(() => {
                    scannerRef.current = null;
                    setIsScanning(false);
                });
                toast.success('Código QR detectado');
                verifyCredential(decodedText);
            },
            (errorMessage) => {
                // ignore
            }
        );
        setIsScanning(true);
    } catch (err) {
        console.error("Error starting scanner", err);
        toast.error("No se pudo acceder a la cámara");
        setIsScanning(false);
    }
  };

  const handleBulkScan = async (e) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const files = Array.from(e.target.files);
      
      // Stop scanner if running
      if (scannerRef.current && scannerRef.current.isScanning) {
          try {
              await scannerRef.current.stop();
          } catch (e) { }
          setIsScanning(false);
      }
      
      setLoading(true);
      setBulkResults([]);
      setScanResult(null); 
      setVerificationResult(null);

      toast.loading(`Procesando ${files.length} imágenes...`);

      const results = [];
      const scannerId = "reader";
      let html5QrCode = scannerRef.current;
      
      if (!html5QrCode) {
          try {
              html5QrCode = new Html5Qrcode(scannerId);
              scannerRef.current = html5QrCode;
          } catch (e) {
               // Ignore if already exists
          }
      }

      for (const file of files) {
          try {
              const decodedText = await html5QrCode.scanFile(file, false);
              const verification = await getVerificationData(decodedText);
              
              results.push({
                  id: Math.random().toString(36).substr(2, 9),
                  fileName: file.name,
                  status: 'success',
                  qrData: decodedText,
                  verification: verification
              });
          } catch (err) {
              console.error(`Error scanning ${file.name}`, err);
              results.push({
                  id: Math.random().toString(36).substr(2, 9),
                  fileName: file.name,
                  status: 'error',
                  error: 'No se detectó código QR'
              });
          }
      }

      setBulkResults(results);
      setLoading(false);
      toast.dismiss();
      
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount > 0) {
          toast.success(`${successCount} de ${files.length} códigos detectados`);
          
          // If only 1 file and success, use single result view
          if (files.length === 1 && results[0].status === 'success') {
              setScanResult(results[0].qrData);
              setVerificationResult(results[0].verification);
              setBulkResults([]); 
          }
      } else {
          toast.error("No se detectaron códigos QR");
      }
  };

  const getVerificationData = async (qrData) => {
      try {
          // Try to parse JSON for Certificate Data
          let credentialData = null;
          try {
              const parsed = JSON.parse(qrData);
              if (parsed.tokenId && parsed.serialNumber) {
                  credentialData = parsed;
              }
          } catch (e) {
              // Not JSON, treat as raw string or URL
          }

          if (credentialData) {
              // It's a certificate!
              // For demo purposes, we'll simulate a fetch using the parsed data
              await new Promise(r => setTimeout(r, 500));
              
              return {
                  type: 'credential',
                  valid: true,
                  data: {
                      title: 'Certificado Blockchain',
                      tokenId: credentialData.tokenId,
                      serialNumber: credentialData.serialNumber,
                      student: 'Estudiante Verificado', 
                      issuer: 'Institución Verificada',
                      date: new Date().toLocaleDateString()
                  }
              };
          } else {
               await new Promise(r => setTimeout(r, 200));
               return {
                  type: 'credential', 
                  valid: true,
                  data: {
                      title: 'Datos Escaneados',
                      student: 'Información Cruda',
                      issuer: 'Desconocido',
                      raw: qrData,
                      date: new Date().toLocaleDateString()
                  }
              };
          }
      } catch (e) {
          return { valid: false, error: 'Error verificando credencial' };
      }
  };

  const verifyCredential = async (qrData) => {
      setLoading(true);
      try {
          const result = await getVerificationData(qrData);
          setVerificationResult(result);
      } catch (e) {
          toast.error('Error verificando credencial');
      } finally {
          setLoading(false);
      }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  };

  const reset = async () => {
      setVerificationResult(null);
      setScanResult(null);
      setBulkResults([]);
      setCvFiles([]);
      setCvValidationResults([]);
      if (activeTab === 'scan' && scannerRef.current) {
          try {
              if (scannerRef.current.isScanning) {
                  await scannerRef.current.stop();
              }
              scannerRef.current = null;
          } catch (e) {
              console.error("Error stopping scanner", e);
          }
      }
      setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-12 px-4">
      <Toaster position="top-center" />
      
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 h-16 px-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
              {/* Logo Upload */}
              <div className="relative group w-10 h-10">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden flex items-center justify-center">
                      <img src={employerLogo} alt="Employer logo" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-[8px] font-bold text-white">EDIT</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
              </div>

              {/* Editable Name */}
              {isEditingName ? (
                  <input
                      type="text"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 text-sm font-bold focus:border-blue-500 outline-none"
                      autoFocus
                  />
              ) : (
                  <div 
                      className="group flex items-center gap-2 cursor-pointer"
                      onClick={() => setIsEditingName(true)}
                  >
                      <h1 className="text-lg font-bold font-display text-white group-hover:text-blue-400 transition-colors">{employerName}</h1>
                      <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-4">
               <span className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Vista Empleador
               </span>
               <button onClick={() => navigate('/precios?tab=employers')} className="hidden md:flex items-center gap-2 btn-primary text-xs px-3 py-1.5">
                    <Shield size={14} />
                    <span>Mejorar Plan</span>
               </button>
               <Link to="/" className="text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all">
                    Salir
               </Link>
          </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        
        {/* Simulation Banner - Removed as it's now in top bar / redundant */}

        {/* Simplified Header */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4">
                {/* Branding moved to Top Bar, keeping simplified welcome or stats here if needed, or removing */}
                <div>
                    <h2 className="text-2xl font-bold font-display mb-1">Bienvenido, {employerName}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/20">EMPRESA VERIFICADA</span>
                        <span>•</span>
                        <span>Portal de Gestión de Talento</span>
                    </div>
                </div>
            </div>
        </header>

        <div className="grid md:grid-cols-4 gap-6">
            {/* Sidebar / Tabs */}
            <div className="md:col-span-1 space-y-2">
                <button 
                    onClick={() => { setActiveTab('scan'); reset(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'scan' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                >
                    <Scan size={20} />
                    <span className="font-medium">Escanear QR</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('search'); reset(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                >
                    <Search size={20} />
                    <span className="font-medium">Buscar Talento</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('cv-validation'); reset(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'cv-validation' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
                >
                    <FileText size={20} />
                    <span className="font-medium">Validar CV Externo</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
                <div className="glass-panel p-8 min-h-[500px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'scan' && (
                            <motion.div 
                                key="scan"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col items-center"
                            >
                                <h2 className="text-xl font-bold mb-6">Escáner de Credenciales</h2>
                                {!scanResult && bulkResults.length === 0 ? (
                                    <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 relative group">
                                        <div id="reader" className="w-full h-[300px] bg-slate-900 flex items-center justify-center">
                                            {!isScanning && (
                                                <div className="text-slate-500 flex flex-col items-center gap-4">
                                                    <Camera size={48} className="opacity-50" />
                                                    <p>Cámara inactiva</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Scanner Overlay */}
                                        <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-900/50 rounded-2xl z-10">
                                            <div className="w-full h-full border-2 border-blue-500/50 rounded-lg relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan-line"></div>
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20 px-4">
                                            <button 
                                                onClick={startScanner}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 transition-all"
                                            >
                                                <Camera size={18} />
                                                <span>Iniciar Cámara</span>
                                            </button>
                                            <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg border border-slate-600 cursor-pointer flex items-center gap-2 transition-all">
                                                <Upload size={18} />
                                                <span>Subir (Masivo)</span>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleBulkScan}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ) : bulkResults.length > 0 ? (
                                    <div className="w-full max-w-4xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold">Resultados del Escaneo Masivo</h3>
                                            <button onClick={reset} className="btn-secondary text-sm">
                                                Escanear otros
                                            </button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {bulkResults.map((res) => (
                                                <div key={res.id} className={`p-4 rounded-xl border ${res.status === 'success' ? 'bg-slate-900/50 border-slate-700' : 'bg-red-900/10 border-red-900/30'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={16} className="text-slate-400" />
                                                            <span className="text-sm font-medium text-slate-300 truncate max-w-[150px]" title={res.fileName}>{res.fileName}</span>
                                                        </div>
                                                        {res.status === 'success' ? (
                                                            <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">Detectado</span>
                                                        ) : (
                                                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Error</span>
                                                        )}
                                                    </div>
                                                    
                                                    {res.status === 'success' && res.verification ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${res.verification.valid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                                <span className="font-bold text-white">{res.verification.data.title}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-400 bg-black/30 p-2 rounded">
                                                                <p><span className="text-slate-500">Estudiante:</span> {res.verification.data.student}</p>
                                                                <p><span className="text-slate-500">Emisor:</span> {res.verification.data.issuer}</p>
                                                                {res.verification.data.tokenId && (
                                                                    <p className="mt-1 font-mono text-blue-400 truncate">ID: {res.verification.data.tokenId}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-red-400">{res.error}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center bg-slate-900/50 p-8 rounded-2xl border border-slate-700 max-w-md w-full">
                                        <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
                                        <h3 className="text-2xl font-bold text-white mb-2">Código Detectado</h3>
                                        <div className="bg-black/30 p-4 rounded-xl border border-slate-800 mb-6 break-all font-mono text-sm text-blue-400">
                                            {scanResult}
                                        </div>
                                        <div className="flex gap-3 justify-center">
                                            <button onClick={reset} className="btn-secondary">
                                                Escanear otro
                                            </button>
                                            {verificationResult?.valid && (
                                                 <button onClick={() => setVerificationResult(verificationResult)} className="btn-primary">
                                                    Ver Detalles
                                                 </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <p className="text-slate-500 text-sm mt-6 max-w-sm text-center">
                                    Apunta tu cámara al código QR del certificado o sube una imagen para verificar su autenticidad en la blockchain.
                                </p>
                            </motion.div>
                        )}

                        {activeTab === 'search' && (
                            <motion.div 
                                key="search"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Buscador de Talento Verificado</h2>
                                    <p className="text-slate-400">Accede a una base de datos global de profesionales certificados.</p>
                                </div>

                                <div className="w-full max-w-2xl mx-auto mb-4 relative">
                                    <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ej: Desarrollador Solidity, Arquitecto Hedera..." 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-lg"
                                    />
                                </div>

                                {/* Smart Filters */}
                                <div className="w-full max-w-2xl mx-auto mb-8 flex flex-wrap gap-2 justify-center">
                                    {smartFilters.map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                                                activeFilter === filter.id 
                                                ? (filter.special ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-blue-500/20 border-blue-500 text-blue-300')
                                                : (filter.special ? 'bg-purple-900/20 border-purple-800 text-purple-400 hover:border-purple-500' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500')
                                            }`}
                                        >
                                            <span>{filter.icon}</span>
                                            <span>{filter.label}</span>
                                        </button>
                                    ))}
                                    
                                    {/* Upload Job Description Button */}
                                    <label className="text-xs px-3 py-1.5 rounded-full border border-dashed border-slate-600 bg-slate-900/30 text-slate-400 hover:border-slate-400 hover:text-white cursor-pointer transition-all flex items-center gap-1.5">
                                        <Upload size={12} />
                                        <span>Subir Cargo (PDF)</span>
                                        <input type="file" accept=".pdf" className="hidden" onChange={handleJobDescriptionUpload} />
                                    </label>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                    {mockTalents.filter(t => {
                                        const matchesSearch = t.role.toLowerCase().includes(searchQuery.toLowerCase()) || t.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
                                        
                                        if (!activeFilter) return matchesSearch;

                                        // Apply filters
                                        if (activeFilter === 'smart-match') {
                                            // Simulate AI matching: return top 2 candidates
                                            return t.id === 1 || t.id === 3; 
                                        }
                                        if (activeFilter === 'verified') return matchesSearch && t.verified;
                                        if (activeFilter === 'solidity') return matchesSearch && t.skills.some(s => s.toLowerCase().includes('solidity'));
                                        if (activeFilter === 'security') return matchesSearch && (t.skills.some(s => s.toLowerCase().includes('security')) || t.role.toLowerCase().includes('auditor'));
                                        if (activeFilter === 'defi') return matchesSearch && t.skills.some(s => s.toLowerCase().includes('defi'));
                                        if (activeFilter === 'react') return matchesSearch && (t.skills.some(s => s.toLowerCase().includes('react')) || t.role.toLowerCase().includes('frontend'));
                                        
                                        return matchesSearch;
                                    }).map(talent => (
                                        <div key={talent.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                            {/* Network Badge Background */}
                                            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                                 <img src="https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png?v=026" className="w-24 h-24 grayscale" />
                                            </div>

                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-600 relative group/avatar cursor-help">
                                                        {talent.name.charAt(0)}
                                                        
                                                        {/* Hover Trajectory Popup */}
                                                        <div className="absolute left-12 top-0 bg-slate-900 border border-slate-700 rounded-lg p-3 w-64 shadow-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50">
                                                            <h4 className="text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">Trayectoria Verificada</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-white">Master en Blockchain</span>
                                                                    <span className="text-slate-500">2023</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-white">Solidity Advanced</span>
                                                                    <span className="text-slate-500">2022</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-[10px]">
                                                                    <span className="text-white">React Certification</span>
                                                                    <span className="text-slate-500">2021</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                            {talent.name}
                                                            {talent.verified && (
                                                                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded text-[10px] border border-green-500/20" title="Identidad Verificada">
                                                                    <Shield size={10} />
                                                                    <span className="font-bold">VERIFICADO</span>
                                                                </div>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                                            <MapPin size={10} /> {talent.location}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Blockchain Network Badge */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1.5 text-slate-300">
                                                        {talent.network === 'Hedera' && <img alt="Hedera" src="https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png?v=026" className="w-3 h-3" />}
                                                        {talent.network === 'Ethereum' && <img alt="Ethereum" src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026" className="w-3 h-3" />}
                                                        {talent.network === 'Algorand' && <img alt="Algorand" src="https://cryptologos.cc/logos/algorand-algo-logo.png?v=026" className="w-3 h-3" />}
                                                        <span>{talent.network}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4 relative z-10">
                                                <p className="text-sm text-slate-300 font-medium mb-2">{talent.role}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {talent.skills.map(skill => (
                                                        <span key={skill} className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-1 rounded-full">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 relative z-10">
                                                <button onClick={handleContact} className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                                                    Contactar
                                                </button>
                                                
                                                <div className="flex items-center gap-3">
                                                     {/* Math Proof Button */}
                                                     <a 
                                                         href={talent.txLink}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors"
                                                         title="Ver prueba matemática en Blockchain"
                                                     >
                                                         <Lock size={10} />
                                                         <span>Verificar en Ledger</span>
                                                     </a>

                                                    <button onClick={handleContact} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30">
                                                        <Search size={14} className="text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'cv-validation' && (
                            <motion.div 
                                key="cv-validation"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col items-center"
                            >
                                <div className="flex justify-between items-center w-full max-w-5xl mb-6">
                                    <h2 className="text-xl font-bold">Validación Masiva de CVs</h2>
                                    {cvValidationResults.length > 0 && (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleDownloadReport} 
                                                disabled={generatingReport || cvValidationResults.some(r => r.status === 'processing')}
                                                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <FileText size={16} />
                                                {generatingReport ? 'Generando PDF...' : 'Descargar Reporte'}
                                            </button>
                                            <button onClick={() => {setCvFiles([]); setCvValidationResults([]);}} className="btn-secondary text-sm">
                                                Validar nuevo lote
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {cvValidationResults.length === 0 ? (
                                    <div className="w-full max-w-xl bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center hover:border-blue-500/50 transition-colors">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
                                            <Upload size={32} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">Carga Masiva de CVs</h3>
                                            <p className="text-slate-400 text-sm">Arrastra múltiples archivos PDF. <br/>El sistema analizará identidad y certificaciones en lote.</p>
                                        </div>
                                        <label className="btn-primary cursor-pointer flex items-center gap-2 mt-2">
                                            <span>Seleccionar Archivos</span>
                                            <input type="file" accept=".pdf" multiple className="hidden" onChange={handleCvValidation} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-5xl grid md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                        {cvValidationResults.map((result) => (
                                            <motion.div 
                                                key={result.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={`bg-slate-950 border rounded-xl p-5 relative overflow-hidden transition-all ${
                                                    result.status === 'processing' ? 'border-blue-500/30' : 'border-green-500/30'
                                                }`}
                                            >
                                                {/* Status Badge */}
                                                <div className="absolute top-4 right-4">
                                                    {result.status === 'processing' ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                                            ANALIZANDO
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                                                            <CheckCircle size={12} />
                                                            VERIFICADO
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        result.status === 'processing' ? 'bg-slate-900 text-slate-500' : 'bg-gradient-to-br from-green-500/20 to-emerald-900/20 text-green-400'
                                                    }`}>
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-200 truncate max-w-[200px]">{result.fileName}</h4>
                                                        <p className="text-xs text-slate-500">{(result.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                {result.status === 'valid' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Candidato</p>
                                                                <p className="font-bold text-white">{result.candidateName}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Match</p>
                                                                <p className="font-bold text-green-400 text-lg">{result.matchScore}%</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                                <Shield size={10} /> Skills Certificadas
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.verifiedSkills.map(skill => (
                                                                    <span key={skill} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                <Lock size={10} />
                                                                <span className="font-mono">{result.blockchainProof.substr(0, 12)}...</span>
                                                            </div>
                                                            <button className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                                                Ver Detalles
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {result.status === 'processing' && (
                                                    <div className="space-y-3 py-4">
                                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 w-2/3 animate-[shimmer_1s_infinite]"></div>
                                                        </div>
                                                        <p className="text-xs text-center text-slate-500 animate-pulse">Buscando identidad en blockchain...</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Result Card (Shared) */}
                    {verificationResult && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`absolute inset-0 bg-slate-900/95 z-10 flex items-center justify-center p-6 backdrop-blur-sm`}
                        >
                            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        {verificationResult.valid ? (
                                            <div className="bg-green-500/20 p-2 rounded-full">
                                                <Shield size={24} className="text-green-500" />
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/20 p-2 rounded-full">
                                                <XCircle size={24} className="text-red-500" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-white">
                                                {verificationResult.valid ? 'Verificado Exitosamente' : 'Verificación Fallida'}
                                            </h3>
                                            <p className="text-sm text-slate-400">Resultados del análisis Triple Shield</p>
                                        </div>
                                    </div>
                                    <button onClick={reset} className="text-slate-400 hover:text-white">✕</button>
                                </div>

                                {verificationResult.valid ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                            <div className="text-sm text-slate-500 mb-1">Nombre</div>
                                            <div className="font-medium text-lg text-white">{verificationResult.name || verificationResult.data?.student}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                                <div className="text-sm text-slate-500 mb-1">Confianza IA</div>
                                                <div className="font-mono text-green-400">{verificationResult.confidence || '100%'}</div>
                                            </div>
                                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                                <div className="text-sm text-slate-500 mb-1">Estado</div>
                                                <div className="text-blue-400 flex items-center gap-1">
                                                    <CheckCircle size={14} /> {verificationResult.status || 'Confirmado'}
                                                </div>
                                            </div>
                                        </div>
                                        {verificationResult.credentials && (
                                            <div>
                                                <div className="text-sm text-slate-500 mb-2">Credenciales Encontradas</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {verificationResult.credentials.map((cred, i) => (
                                                        <span key={i} className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs border border-blue-500/30">
                                                            {cred}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 text-red-200">
                                        {verificationResult.message}
                                    </div>
                                )}
                                
                                <button onClick={reset} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
                                    Nueva Verificación
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
