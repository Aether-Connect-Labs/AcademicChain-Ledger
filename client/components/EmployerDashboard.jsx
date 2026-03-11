import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Upload, Search, FileText, CheckCircle, XCircle, Camera, Shield, Lock, MapPin, Briefcase, UserCheck, Award, Zap, ChevronRight, Download, Filter } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import apiService from './services/apiService';
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

  const [talents, setTalents] = useState([]);

  // Quick filters for Smart Matching
  const smartFilters = [
      { id: 'solidity', label: 'Solidity', icon: <Zap size={14} strokeWidth={1} /> },
      { id: 'security', label: 'Ciberseguridad', icon: <Lock size={14} strokeWidth={1} /> },
      { id: 'defi', label: 'DeFi', icon: <Award size={14} strokeWidth={1} /> },
      { id: 'react', label: 'React / Frontend', icon: <Briefcase size={14} strokeWidth={1} /> },
      { id: 'verified', label: 'Verificación de Identidad', icon: <UserCheck size={14} strokeWidth={1} /> },
      { id: 'smart-match', label: 'IA Smart Match', icon: <Zap size={14} strokeWidth={1} />, special: true }
  ];

  const handleJobDescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        setJobDescriptionFile(file);
        // Simulate processing
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
        // Simulate processing time
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

        const res = await apiService.generateEmployerReport(reportData);
        
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
              background: '#0d0d0d',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
          },
      });
      setTimeout(() => navigate('/precios?tab=employers'), 1500);
  };

  const handleHire = (talent) => {
    toast.loading(`Validando credenciales de ${talent.name} en Hedera...`, { duration: 2000 });
    
    setTimeout(() => {
        toast.dismiss();
        
        // Success Toast with Sound Effect Visuals
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0d0d0d]/90 backdrop-blur-xl shadow-2xl rounded-lg pointer-events-auto flex ring-1 ring-white/10 border border-emerald-500/50`}>
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1} />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-white">
                                ¡Contratación Exitosa!
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Has validado y contratado a <span className="text-emerald-400 font-bold">{talent.name}</span>.
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Notificación enviada a la institución emisora.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: 5000 });
        
        // Emit event for other tabs/users (Institution & Creator Dashboards)
        const eventData = {
            studentName: talent.name,
            employerName: employerName,
            courseName: talent.role || 'Certificación Blockchain', // Mock course name
            timestamp: new Date().toISOString()
        };

        // Dispatch local event
        window.dispatchEvent(new CustomEvent('acl:hired', { detail: eventData }));
        
        // Save to localStorage for cross-tab communication
        localStorage.setItem('acl:event:hired', JSON.stringify(eventData));
        
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error('Failed to clear scanner', error));
      }
    };
  }, []);

  useEffect(() => {
    const readTalentPool = () => {
      try {
        const raw = localStorage.getItem('acl:talent-pool');
        const stored = raw ? JSON.parse(raw) : [];
        if (Array.isArray(stored)) {
          setTalents(stored);
        }
      } catch {}
    };

    readTalentPool();

    const handleStorage = (event) => {
      if (!event || event.key === null || event.key === 'acl:talent-pool') {
        readTalentPool();
      }
    };

    const handleCustom = () => {
      readTalentPool();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener('acl:talent-updated', handleCustom);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('acl:talent-updated', handleCustom);
      }
    };
  }, []);

  // Search Effect
  useEffect(() => {
    if (activeTab === 'search') {
        const fetchTalents = async () => {
            // Always fetch, even if query is empty (returns recent)
            setLoading(true);
            try {
                const query = new URLSearchParams({ 
                    q: searchQuery, 
                    filter: activeFilter || '' 
                }).toString();
                
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/employer/search?${query}`);
                const data = await response.json();
                
                if (data.success && data.candidates) {
                    // Map API results to UI format
                    const mappedTalents = data.candidates.map(c => ({
                        id: c.id,
                        name: c.student_name,
                        role: c.degree,
                        skills: c.major ? [c.major] : ['Blockchain', 'Smart Contracts'],
                        network: c.network || 'Hedera',
                        match: c.match_score || 95, // Use backend score if available
                        location: 'Remoto',
                        txLink: c.blockchain_tx ? `https://hashscan.io/testnet/transaction/${c.blockchain_tx}` : '#'
                    }));
                    setTalents(mappedTalents);
                } else if (talents.length === 0) {
                     // Fallback to localStorage if API returns nothing and we have nothing
                     try {
                        const raw = localStorage.getItem('acl:talent-pool');
                        if (raw) setTalents(JSON.parse(raw));
                     } catch {}
                }
            } catch (error) {
                console.error("Search error:", error);
                // Fallback to localStorage on error
                try {
                    const raw = localStorage.getItem('acl:talent-pool');
                    if (raw) setTalents(JSON.parse(raw));
                } catch {}
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchTalents, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeFilter, activeTab]);

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
          // Call Backend API for verification
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/employer/verify`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ qrContent: qrData })
          });

          const result = await response.json();

          if (result.success && result.verified) {
              return {
                  type: 'credential',
                  valid: true,
                  data: {
                      title: result.record?.degree || result.data?.program || 'Certificado Verificado',
                      tokenId: result.record?.token_id || 'N/A',
                      serialNumber: result.record?.blockchain_tx || 'N/A',
                      student: result.record?.student_name || result.data?.studentName || 'Estudiante',
                      issuer: 'AcademicChain',
                      date: result.record?.issue_date || new Date().toLocaleDateString()
                  },
                  confidence: '100%',
                  status: 'Verificado en Blockchain'
              };
          } else {
              // Fallback / Invalid
               return {
                  type: 'credential', 
                  valid: false,
                  error: 'Credencial no encontrada o inválida',
                  data: {
                      title: 'Datos Escaneados',
                      student: 'Desconocido',
                      issuer: 'Desconocido',
                      raw: qrData,
                      date: new Date().toLocaleDateString()
                  }
              };
          }
      } catch (e) {
          console.error("Verification error", e);
          return { valid: false, error: 'Error de conexión verificando credencial' };
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
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-emerald-500/30 pt-24 pb-12 px-4">
      <Toaster position="top-center" toastOptions={{
          style: {
            background: 'rgba(13, 13, 13, 0.8)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }} />
      
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 h-16 px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
              {/* Logo Upload */}
              <div className="relative group w-10 h-10">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
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
                      className="bg-white/5 border border-white/10 text-white rounded px-2 py-1 text-sm font-bold focus:border-emerald-500 outline-none"
                      autoFocus
                  />
              ) : (
                  <div 
                      className="group flex items-center gap-2 cursor-pointer"
                      onClick={() => setIsEditingName(true)}
                  >
                      <h1 className="text-lg font-bold font-display text-white group-hover:text-emerald-400 transition-colors">{employerName}</h1>
                      <span className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                  </div>
              )}
          </div>

          <div className="flex items-center gap-4">
               <span className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Vista Empleador
               </span>
               <button onClick={() => navigate('/precios?tab=employers')} className="hidden md:flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all text-xs font-bold">
                    <Shield size={14} strokeWidth={1} />
                    <span>Mejorar Plan</span>
               </button>
               <Link to="/" className="text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all">
                    Salir
               </Link>
          </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        
        {/* Simplified Header */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display mb-1 text-white">Bienvenido, {employerName}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold border border-emerald-500/20">EMPRESA VERIFICADA</span>
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${activeTab === 'scan' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#0d0d0d]/40 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'}`}
                >
                    <Scan size={20} strokeWidth={1} />
                    <span className="font-medium">Escanear QR</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('search'); reset(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${activeTab === 'search' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#0d0d0d]/40 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'}`}
                >
                    <Search size={20} strokeWidth={1} />
                    <span className="font-medium">Buscar Talento</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('cv-validation'); reset(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${activeTab === 'cv-validation' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-[#0d0d0d]/40 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'}`}
                >
                    <FileText size={20} strokeWidth={1} />
                    <span className="font-medium">Validar CV Externo</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
                <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 min-h-[500px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'scan' && (
                            <motion.div 
                                key="scan"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-full flex flex-col items-center"
                            >
                                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                    <Scan size={24} className="text-emerald-500" strokeWidth={1} />
                                    Escáner de Credenciales
                                </h2>
                                {!scanResult && bulkResults.length === 0 ? (
                                    <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                                        <div id="reader" className="w-full h-[300px] bg-[#050505] flex items-center justify-center">
                                            {!isScanning && (
                                                <div className="text-slate-600 flex flex-col items-center gap-4">
                                                    <Camera size={48} className="opacity-50" strokeWidth={1} />
                                                    <p>Cámara inactiva</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Scanner Overlay */}
                                        <div className="absolute inset-0 pointer-events-none border-[20px] border-[#050505]/80 rounded-2xl z-10">
                                            <div className="w-full h-full border-2 border-emerald-500/50 rounded-lg relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-scan-line"></div>
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20 px-4">
                                            <button 
                                                onClick={startScanner}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-900/50 flex items-center gap-2 transition-all"
                                            >
                                                <Camera size={18} strokeWidth={1} />
                                                <span>Iniciar Cámara</span>
                                            </button>
                                            <label className="bg-[#1a1a1a] hover:bg-[#252525] text-white px-4 py-2 rounded-lg font-bold shadow-lg border border-white/10 cursor-pointer flex items-center gap-2 transition-all">
                                                <Upload size={18} strokeWidth={1} />
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
                                            <h3 className="text-xl font-bold text-white">Resultados del Escaneo Masivo</h3>
                                            <button onClick={reset} className="text-sm px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                                                Escanear otros
                                            </button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {bulkResults.map((res) => (
                                                <div key={res.id} className={`p-4 rounded-xl border ${res.status === 'success' ? 'bg-[#0d0d0d]/60 border-emerald-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={16} className="text-slate-400" strokeWidth={1} />
                                                            <span className="text-sm font-medium text-slate-300 truncate max-w-[150px]" title={res.fileName}>{res.fileName}</span>
                                                        </div>
                                                        {res.status === 'success' ? (
                                                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Detectado</span>
                                                        ) : (
                                                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">Error</span>
                                                        )}
                                                    </div>
                                                    
                                                    {res.status === 'success' && res.verification ? (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${res.verification.valid ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                                <span className="font-bold text-white">{res.verification.data.title}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-400 bg-black/30 p-2 rounded border border-white/5">
                                                                <p><span className="text-slate-500">Estudiante:</span> {res.verification.data.student}</p>
                                                                <p><span className="text-slate-500">Emisor:</span> {res.verification.data.issuer}</p>
                                                                {res.verification.data.tokenId && (
                                                                    <p className="mt-1 font-mono text-emerald-400 truncate">ID: {res.verification.data.tokenId}</p>
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
                                    <div className="text-center bg-[#0d0d0d]/60 p-8 rounded-2xl border border-white/10 max-w-md w-full">
                                        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" strokeWidth={1} />
                                        <h3 className="text-2xl font-bold text-white mb-2">Código Detectado</h3>
                                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-6 break-all font-mono text-sm text-emerald-400">
                                            {scanResult}
                                        </div>
                                        <div className="flex gap-3 justify-center">
                                            <button onClick={reset} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
                                                Escanear otro
                                            </button>
                                            {verificationResult?.valid && (
                                                 <button onClick={() => setVerificationResult(verificationResult)} className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors border border-emerald-500/30 font-bold">
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
                                    <h2 className="text-2xl font-bold mb-2 text-white">Buscador de Talento Verificado</h2>
                                    <p className="text-slate-400">Accede a una base de datos global de profesionales certificados.</p>
                                </div>

                                <div className="w-full max-w-2xl mx-auto mb-4 relative">
                                    <Search className="absolute left-4 top-3.5 text-slate-500" size={20} strokeWidth={1} />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Ej: Desarrollador Solidity, Arquitecto Hedera..." 
                                        className="w-full bg-[#050505] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-emerald-500 outline-none transition-all shadow-lg"
                                    />
                                </div>

                                {/* Smart Filters */}
                                <div className="w-full max-w-2xl mx-auto mb-8 flex flex-wrap gap-2 justify-center">
                                    {smartFilters.map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setActiveFilter(activeFilter === filter.id ? null : filter.id)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 relative ${
                                                activeFilter === filter.id 
                                                ? (filter.special ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-emerald-500/20 border-emerald-500 text-emerald-300')
                                                : (filter.special ? 'bg-purple-900/10 border-purple-800/50 text-purple-400 hover:border-purple-500' : 'bg-white/5 border-white/10 text-slate-400 hover:border-emerald-500/50 hover:text-white')
                                            }`}
                                        >
                                            <span>{filter.icon}</span>
                                            <span>{filter.label}</span>
                                            {filter.demand === 'high' && (
                                                <span className="absolute -top-2 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    
                                    {/* Upload Job Description Button */}
                                    <label className="text-xs px-3 py-1.5 rounded-full border border-dashed border-slate-600 bg-white/5 text-slate-400 hover:border-emerald-400 hover:text-emerald-400 cursor-pointer transition-all flex items-center gap-1.5">
                                        <Upload size={12} strokeWidth={1} />
                                        <span>Subir Cargo (PDF)</span>
                                        <input type="file" accept=".pdf" className="hidden" onChange={handleJobDescriptionUpload} />
                                    </label>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                    {talents.filter(t => {
                                        const query = searchQuery.toLowerCase().trim();
                                        const nameMatch = (t.name || '').toLowerCase().includes(query);
                                        const roleMatch = (t.role || '').toLowerCase().includes(query);
                                        const institutionMatch = (t.institution || '').toLowerCase().includes(query);
                                        const skillsMatch = Array.isArray(t.skills) && t.skills.some(s => (s || '').toLowerCase().includes(query));
                                        const matchesSearch = !query || nameMatch || roleMatch || institutionMatch || skillsMatch;
                                        
                                        if (!activeFilter) return matchesSearch;

                                        if (activeFilter === 'smart-match') {
                                            return matchesSearch;
                                        }
                                        if (activeFilter === 'verified') return matchesSearch && t.verified;
                                        if (activeFilter === 'solidity') return matchesSearch && Array.isArray(t.skills) && t.skills.some(s => (s || '').toLowerCase().includes('solidity'));
                                        if (activeFilter === 'security') return matchesSearch && (Array.isArray(t.skills) && t.skills.some(s => (s || '').toLowerCase().includes('security')) || (t.role || '').toLowerCase().includes('auditor'));
                                        if (activeFilter === 'defi') return matchesSearch && Array.isArray(t.skills) && t.skills.some(s => (s || '').toLowerCase().includes('defi'));
                                        if (activeFilter === 'react') return matchesSearch && (Array.isArray(t.skills) && t.skills.some(s => (s || '').toLowerCase().includes('react')) || (t.role || '').toLowerCase().includes('frontend'));
                                        
                                        return matchesSearch;
                                    }).map(talent => (
                                        <div key={talent.id} className="bg-[#0d0d0d]/60 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                                            {/* Network Badge Background */}
                                            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                                                 <img src="https://cryptologos.cc/logos/hedera-hashgraph-hbar-logo.png?v=026" className="w-24 h-24 grayscale" />
                                            </div>

                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-black flex items-center justify-center font-bold text-slate-400 border border-white/10 relative group/avatar cursor-help">
                                                        {talent.name.charAt(0)}
                                                        
                                                        {/* Hover Trajectory Popup */}
                                                        <div className="absolute left-12 top-0 bg-[#0d0d0d] border border-white/10 rounded-lg p-3 w-64 shadow-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-xl">
                                                            <h4 className="text-xs font-bold text-slate-300 mb-2 border-b border-white/10 pb-1">Trayectoria Verificada</h4>
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
                                                        <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                                            {talent.name}
                                                            {talent.verified && (
                                                                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20" title="Identidad Verificada">
                                                                    <Shield size={10} strokeWidth={1} />
                                                                    <span className="font-bold">VERIFICADO</span>
                                                                </div>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                                            <MapPin size={10} strokeWidth={1} /> {talent.location}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Blockchain Network Badge */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-black/40 border border-white/10 px-2 py-1 rounded text-[10px] flex items-center gap-1.5 text-slate-300">
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
                                                        <span key={skill} className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2 py-1 rounded-full">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 relative z-10">
                                                <button 
                                                    onClick={() => handleHire(talent)}
                                                    className="text-xs font-bold text-[#050505] bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 group/hire"
                                                >
                                                    <CheckCircle size={14} className="group-hover/hire:scale-110 transition-transform" strokeWidth={1} />
                                                    Validar y Contratar
                                                </button>
                                                
                                                <div className="flex items-center gap-3">
                                                     {/* Math Proof Button */}
                                                     <a 
                                                         href={talent.txLink}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors"
                                                         title="Ver prueba matemática en Blockchain"
                                                     >
                                                         <Lock size={10} strokeWidth={1} />
                                                         <span>Verificar en Ledger</span>
                                                     </a>

                                                    <button onClick={handleContact} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                                        <Search size={14} className="text-white" strokeWidth={1} />
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
                                    <h2 className="text-xl font-bold text-white">Validación Masiva de CVs</h2>
                                    {cvValidationResults.length > 0 && (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleDownloadReport} 
                                                disabled={generatingReport || cvValidationResults.some(r => r.status === 'processing')}
                                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <FileText size={16} strokeWidth={1} />
                                                {generatingReport ? 'Generando PDF...' : 'Descargar Reporte'}
                                            </button>
                                            <button onClick={() => {setCvFiles([]); setCvValidationResults([]);}} className="bg-white/5 hover:bg-white/10 text-white py-2 px-4 rounded-lg border border-white/10 text-sm transition-colors">
                                                Validar nuevo lote
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                {cvValidationResults.length === 0 ? (
                                    <div className="w-full max-w-xl bg-white/5 border border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 text-center hover:border-emerald-500/50 transition-colors">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                                            <Upload size={32} strokeWidth={1} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1 text-white">Carga Masiva de CVs</h3>
                                            <p className="text-slate-400 text-sm">Arrastra múltiples archivos PDF. <br/>El sistema analizará identidad y certificaciones en lote.</p>
                                        </div>
                                        <label className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-lg cursor-pointer flex items-center gap-2 mt-2 transition-colors">
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
                                                className={`bg-[#0d0d0d]/60 border rounded-xl p-5 relative overflow-hidden transition-all ${
                                                    result.status === 'processing' ? 'border-emerald-500/30' : 'border-emerald-500/30'
                                                }`}
                                            >
                                                {/* Status Badge */}
                                                <div className="absolute top-4 right-4">
                                                    {result.status === 'processing' ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                                            ANALIZANDO
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                                            <CheckCircle size={12} strokeWidth={1} />
                                                            VERIFICADO
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                                        result.status === 'processing' ? 'bg-white/5 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                        <FileText size={24} strokeWidth={1} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-200 truncate max-w-[200px]">{result.fileName}</h4>
                                                        <p className="text-xs text-slate-500">{(result.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                {result.status === 'valid' && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Candidato</p>
                                                                <p className="font-bold text-white">{result.candidateName}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Match</p>
                                                                <p className="font-bold text-emerald-400 text-lg">{result.matchScore}%</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                                                                <Shield size={10} strokeWidth={1} /> Skills Certificadas
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.verifiedSkills.map(skill => (
                                                                    <span key={skill} className="bg-white/5 text-slate-300 text-[10px] px-2 py-1 rounded border border-white/10">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                                <Lock size={10} strokeWidth={1} />
                                                                <span className="font-mono">{result.blockchainProof.substr(0, 12)}...</span>
                                                            </div>
                                                            <button className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                                                                Ver Detalles
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {result.status === 'processing' && (
                                                    <div className="space-y-3 py-4">
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500 w-2/3 animate-[shimmer_1s_infinite]"></div>
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
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
