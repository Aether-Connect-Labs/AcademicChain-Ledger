// src/components/issuance/BatchIssuance.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';
import { useAnalytics } from './useAnalytics';
import { issuanceService } from './services/issuanceService';
import { verificationService } from './services/verificationService';
import { fileParser } from './utils/fileParser';
import { validationService } from './services/validationService';
import n8nService from './services/n8nService';
import ProgressTracker from './ui/ProgressTracker';
import CredentialPreview from './CredentialPreview';
import IssuanceSummary from './IssuanceSummary';
import ErrorReport from './ui/ErrorReport';
import AiInsightsPanel from './ui/AiInsightsPanel';
import { Toaster, toast } from 'react-hot-toast';

const XrpAnchorCell = ({ tokenId, serialNumber }) => {
  const [hash, setHash] = useState(null);
  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!tokenId || !serialNumber) return;
      try {
        setLoading(true);
        setError('');
        const data = await verificationService.getCredentialDetails(tokenId, serialNumber);
        const x = data?.data?.xrpAnchor;
        setHash(x?.xrpTxHash || null);
        setNetwork(x?.network || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tokenId, serialNumber]);

  if (loading) return <span className="badge-info badge">Buscando...</span>;
  if (error) return <span className="badge-error badge">Error</span>;
  if (!hash) return <span className="text-gray-500">N/A</span>;
  const xrplNetwork = (import.meta.env.VITE_XRPL_NETWORK || network || 'testnet');
  const xrplBase = xrplNetwork.includes('main') ? 'https://livenet.xrpl.org' : 'https://testnet.xrpl.org';
  const href = `${xrplBase}/transactions/${hash}`;
  return <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{hash.slice(0, 8)}...</a>;
};

const BatchIssuance = ({ demo = false, plan, emissionsUsed = 0, onEmissionComplete, institutionName }) => {
  const { account, isConnected, connectWallet } = useHedera();
  const { token } = useAuth(); // Obtener el token de autenticación
  const { socket, isConnected: isSocketConnected } = useWebSocket(token); // Usar el token real
  const { trackHederaOperation, trackCredentialOperation } = useAnalytics();
  
  const fileInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Estados principales
  const [fileData, setFileData] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [issuanceConfig, setIssuanceConfig] = useState({
    credentialType: 'degree',
    institution: '',
    expirationDate: '',
    addToHedera: true,
    generateQR: true,
    sendEmail: false,
    template: '',
    customMessage: ''
  });
  const [preSignTemplates, setPreSignTemplates] = useState([]);
  const [preSignPayments, setPreSignPayments] = useState(true);
  const [pollError, setPollError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [xrpBatchIntents, setXrpBatchIntents] = useState([]);
  const [xrpBatchHashes, setXrpBatchHashes] = useState({});
  const [availableTemplates, setAvailableTemplates] = useState([]);

  useEffect(() => {
    if (institutionName) {
      setIssuanceConfig(prev => ({ ...prev, institution: institutionName }));
    }
  }, [institutionName]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    setAvailableTemplates(saved);

    const savedNarratives = JSON.parse(localStorage.getItem('academicNarratives') || '[]');
    if (savedNarratives.length > 0) {
        setPreSignTemplates(savedNarratives);
    } else {
        // Fallback defaults
        setPreSignTemplates([
            {
                id: 'tech_excellence',
                name: 'Excelencia Técnica',
                content: "Felicidades, {{student_name}}. El trayecto en la especialidad de {{degree}} ha sido exigente, pero tu dedicación en los laboratorios finales ha sido excepcional. Como reconocimiento a tu trayectoria académica en nuestra institución, te hacemos entrega de esta credencial inmutable."
            },
            {
                id: 'prof_degree',
                name: 'Grado Profesional',
                content: "Por haber cumplido satisfactoriamente con todos los requisitos académicos del programa de {{degree}}, y haber demostrado un alto compromiso ético y profesional, {{institution}} confiere el presente grado a {{student_name}}."
            }
        ]);
    }
    
    const activeId = localStorage.getItem('activeTemplateId');
    const hasActive = activeId && saved.find(t => t.id === activeId);
    if (hasActive) {
        setIssuanceConfig(prev => ({ ...prev, template: activeId }));
    } else if (saved.length > 0) {
        setIssuanceConfig(prev => ({ ...prev, template: saved[0].id }));
    }
  }, []);

  const getResultItems = useCallback(() => {
    const items = [];
    const prepared = Array.isArray(processResult?.data?.prepared) ? processResult.data.prepared : [];
    for (const p of prepared) {
      const tokenId = p?.tokenId || p?.mint?.tokenId;
      const serialNumber = p?.mint?.serialNumber;
      if (tokenId && serialNumber) items.push({ tokenId, serialNumber, source: 'prepared' });
    }
    const verified = Array.isArray(processResult?.data?.verified) ? processResult.data.verified : [];
    for (const v of verified) {
      const tokenId = v?.credential?.tokenId || v?.tokenId;
      const serialNumber = v?.credential?.serialNumber || v?.serialNumber || v?.mint?.serialNumber;
      if (tokenId && serialNumber) items.push({ tokenId, serialNumber, source: 'verified' });
    }
    const results = Array.isArray(processResult?.data?.results) ? processResult.data.results : [];
    for (const r of results) {
      const tokenId = r?.tokenId;
      const serialNumber = r?.mint?.serialNumber || r?.serialNumber;
      if (tokenId && serialNumber) items.push({ tokenId, serialNumber, source: 'result' });
    }
    return items;
  }, [processResult, issuanceConfig]);

  const handleExportCsv = useCallback(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const items = getResultItems();
    if (!items.length) return;
    const rows = [['tokenId','serialNumber','verificationUrl','source']].concat(
      items.map(it => [it.tokenId, String(it.serialNumber), `${API_BASE_URL}/api/verification/verify/${it.tokenId}/${it.serialNumber}`, it.source])
    );
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getResultItems]);

  const handleAuditBatch = useCallback(async () => {
    try {
      const prepared = Array.isArray(processResult?.data?.prepared) ? processResult.data.prepared : [];
      const verified = Array.isArray(processResult?.data?.verified) ? processResult.data.verified : [];
      const results = Array.isArray(processResult?.data?.results) ? processResult.data.results : [];
      const all = [...prepared, ...verified, ...results];
      const documents = all.map(r => {
        const cid = r?.mint?.ipfs?.cid || (r?.mint?.ipfsURI ? String(r.mint.ipfsURI).replace('ipfs://','') : '');
        return cid ? { cid } : null;
      }).filter(Boolean);
      if (!documents.length) {
        toast.error('No hay documentos con CID para auditar');
        return;
      }
      const resp = await verificationService.merkleBatch({ documents });
      const topicId = resp?.data?.hedera?.topicId || resp?.data?.hedera?.topicId || resp?.data?.hedera?.topicId;
      if (topicId) {
        const params = new URLSearchParams();
        params.set('hederaTopicId', topicId);
        window.open(`/#/verificar?${params.toString()}`, '_blank');
      } else {
        toast.error('No se obtuvo topicId del backend');
      }
    } catch (e) {
      toast.error(e.message || 'Error al auditar lote');
    }
  }, [processResult]);

  // Paso 1: Manejo de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      trackHederaOperation({
        operation: 'batch_file_upload',
        fileType: file.type,
        fileSize: file.size
      });

      const parsedData = await fileParser.parseCSV(file);
      
      // Validar estructura básica
      const validationResult = validationService.validateBatchData(parsedData);
      
      if (!validationResult.isValid) {
        throw new Error(`Errores de validación: ${validationResult.errors.join(', ')}`);
      }

      setFileData({
        name: file.name,
        size: file.size,
        type: file.type,
        rowCount: parsedData.length,
        parsedData
      });

      setCurrentStep(2);
      
      trackHederaOperation({
        operation: 'batch_file_processed',
        recordCount: parsedData.length,
        validationErrors: validationResult.errors.length
      });

    } catch (error) {
      console.error('Error processing file:', error);
      setProcessResult({
        success: false,
        error: error.message,
        step: 'file_processing'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Paso 2: Configuración y preview
  const handleGeneratePreview = useCallback(async () => {
    if (!fileData) return;

    setIsProcessing(true);
    
    try {
      const previewCredentials = fileData.parsedData.map((row, index) => {
        const credential = issuanceService.createCredentialTemplate({
          studentName: `${row.firstName} ${row.lastName}`,
          studentId: row.studentId,
          degree: row.degree,
          major: row.major,
          institution: issuanceConfig.institution,
          issueDate: new Date().toISOString(),
          expirationDate: issuanceConfig.expirationDate,
          credentialType: issuanceConfig.credentialType,
          metadata: {
            gpa: row.gpa,
            graduationDate: row.graduationDate,
            honors: row.honors,
            email: row.email
          }
        });

        return {
          id: `preview_${index}`,
          credential,
          rawData: row,
          status: 'pending',
          errors: [],
          paymentMethod: undefined
        };
      });

      setCredentials(previewCredentials);
      
      // AI Pre-Validation
      try {
        const batchForAi = previewCredentials.map(c => ({
          studentName: c.credential.subject.name,
          studentId: c.credential.subject.studentId,
          ...c.rawData
        }));
        const aiRes = await issuanceService.validateBatchWithAi(batchForAi);
        if (aiRes.success) {
            setAiAnalysis(aiRes.data);
        }
      } catch (e) {
        console.warn('AI Validation failed', e);
      }

      setCurrentStep(3);

      trackHederaOperation({
        operation: 'batch_preview_generated',
        credentialCount: previewCredentials.length,
        credentialType: issuanceConfig.credentialType
      });

    } catch (error) {
      console.error('Error generating preview:', error);
      setProcessResult({
        success: false,
        error: error.message,
        step: 'preview_generation'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [fileData, issuanceConfig, trackHederaOperation]);

  // Efecto para monitorizar el progreso del job vía WebSocket
  useEffect(() => {
    if (!socket || !processResult?.data?.masterJobId) {
      return;
    }

    const masterJobId = processResult.data.masterJobId;
    console.log(`Subscribing to job ${masterJobId}`);
    socket.emit('subscribe-job', masterJobId);

    const handleProgress = (data) => {
      if (data.jobId === masterJobId) {
        console.log('Job Progress:', data);
        setProcessResult(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            status: 'processing',
            progress: data.progress,
          }
        }));
      }
    };

    const handleCompleted = (data) => {
      if (data.jobId === masterJobId) {
        console.log('Job Completed:', data.result);
        const successCount = data.result?.data?.successful?.length || 0;
        
        // Actualizar el resumen final con los datos detallados del resultado del job
        setProcessResult(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            status: 'completed',
            progress: 100,
            successful: successCount,
            failed: data.result?.data?.failed?.length || 0,
            dualOk: (() => {
              const succ = Array.isArray(data.result?.data?.successful) ? data.result.data.successful : [];
              return succ.filter(s => s?.xrpAnchor?.xrpTxHash).length;
            })(),
            duration: data.duration,
          },
          // Guardar los resultados detallados para el reporte
          data: { ...prev.data, ...data.result?.data }
        }));

        if (onEmissionComplete && successCount > 0) {
            onEmissionComplete(successCount);
        }
      }
    };

    socket.on('job-progress', handleProgress);
    socket.on('job-completed', handleCompleted);

    return () => {
      console.log(`Unsubscribing from job ${masterJobId}`);
      socket.emit('unsubscribe-job', masterJobId);
      socket.off('job-progress', handleProgress);
      socket.off('job-completed', handleCompleted);
    };
  }, [socket, processResult?.data?.masterJobId]);

  useEffect(() => {
    const masterJobId = processResult?.data?.masterJobId;
    if (!masterJobId || processResult?.summary?.status !== 'queued') {
      if (isPolling) setIsPolling(false);
      return;
    }
    setIsPolling(true);
    setPollError('');
    const interval = setInterval(async () => {
      try {
        const res = await issuanceService.getBatchStatus(masterJobId);
        const data = res.data || res;
        
        setProcessResult(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            status: data.status,
            progress: data.progress,
            successful: data.successfulCount || data.successful?.length || 0,
            failed: data.failedCount || data.failed?.length || 0,
          },
          data: { ...prev.data, ...data }
        }));

        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          clearInterval(interval);
          
          if (data.status === 'completed' && onEmissionComplete) {
              const count = data.successfulCount || data.successful?.length || 0;
              if (count > 0) onEmissionComplete(count);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
        setPollError('Error al consultar estado: ' + e.message);
      }
    }, 3000);
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [processResult?.data?.masterJobId, processResult?.summary?.status, isPolling]);

  // Paso 3: Procesamiento en lote
  const handleAiFix = useCallback(() => {
    if (!aiAnalysis || !aiAnalysis.details || !aiAnalysis.details.analysis.issues) return;
    
    const newCredentials = [...credentials];
    aiAnalysis.details.analysis.issues.forEach(issue => {
      if (newCredentials[issue.index]) {
         // Apply suggestion
         if (issue.field === 'studentName') {
             newCredentials[issue.index].credential.subject.name = issue.suggestion;
             // Update rawData for consistency
             newCredentials[issue.index].rawData.firstName = issue.suggestion; 
         }
      }
    });
    
    setCredentials(newCredentials);
    // Re-run analysis locally or just clear warnings for demo
    setAiAnalysis({
        ...aiAnalysis,
        status: 'safe',
        details: {
            ...aiAnalysis.details,
            analysis: {
                ...aiAnalysis.details.analysis,
                riskScore: 0,
                issues: []
            }
        }
    });
    toast.success('Correcciones aplicadas por IA');
  }, [aiAnalysis, credentials]);

  const handleBatchIssuance = async () => {
    // Wallet connection is optional for managed issuance via n8n
    if (!demo && issuanceConfig.addToHedera && !account) {
       // Optional: Warn user or just proceed if using custodial service
       console.log('Proceeding with managed issuance (no wallet connected)');
    }

    setIsProcessing(true);
    setProcessResult(null);

    const results = {
      total: credentials.length,
      startTime: Date.now()
    };

    if (!credentials.length) {
      setIsProcessing(false);
      return;
    }

    try {
      // Plan Validation
      if (plan && plan.limit !== Infinity) {
          if (emissionsUsed + credentials.length > plan.limit) {
               throw new Error(`Este lote excede tu límite mensual (${plan.limit}). Has usado ${emissionsUsed}. Actualiza a Plan Enterprise.`);
          }
      }
      if (plan && issuanceConfig.addToHedera && !plan.networks.includes('hedera')) {
           throw new Error(`Tu plan actual (${plan.name}) no incluye emisión en Hedera.`);
      }
      if (plan && !plan.networks.includes('xrp') && plan.networks.includes('hedera') && plan.networks.length === 1) {
           // Si solo tiene Hedera (Esencial), asegurar que no intente usar XRP implícitamente o mostrar warning
           // Por ahora el backend de n8n manejará las redes, pero validamos aquí.
      }

      if (demo) {
        const total = credentials.length || 2;
        const demoCreds = credentials.length ? credentials : [
          { id: 'preview_0', credential: issuanceService.createCredentialTemplate({ studentName: 'Alice Demo', degree: 'CS', credentialType: issuanceConfig.credentialType }) },
          { id: 'preview_1', credential: issuanceService.createCredentialTemplate({ studentName: 'Bob Demo', degree: 'Math', credentialType: issuanceConfig.credentialType }) },
        ];
        setCredentials(demoCreds);
        const summary = { total, successful: total, failed: 0, successRate: 100, duration: 1, status: 'completed' };
        setProcessResult({ success: true, data: { total, startTime: results.startTime }, summary });
        setCurrentStep(4);
        setIsProcessing(false);
        if (onEmissionComplete) onEmissionComplete(total);
        return;
      }

      // Unified Batch Processing via n8n
      // This handles all networks (Hedera, XRP, etc.) centrally
      const batchData = {
        credentials: credentials.map(c => c.credential),
        institution: issuanceConfig.institution,
        templateId: issuanceConfig.template,
        customMessage: issuanceConfig.customMessage,
        networks: plan ? plan.networks : ['hedera'],
        options: {
            addToHedera: issuanceConfig.addToHedera,
            generateQR: issuanceConfig.generateQR,
            sendEmail: issuanceConfig.sendEmail
        }
      };

      trackCredentialOperation({
        operation: 'batch_issuance_start',
        credentialCount: credentials.length,
        institution: issuanceConfig.institution
      });

      // Call n8n service
      const response = await n8nService.submitBatch(batchData);
      const masterJobId = response.jobId || `job-${Date.now()}`;

      // Update UI
      const summary = {
        total: results.total,
        successful: 0,
        failed: 0,
        successRate: 0,
        duration: 0,
        status: 'queued',
        masterJobId: masterJobId
      };

      setProcessResult({
        success: true,
        data: { ...results, masterJobId },
        summary
      });

      setCurrentStep(4);

      trackCredentialOperation({
        operation: 'batch_issuance_complete',
        status: 'queued',
        masterJobId: masterJobId,
        total: results.total
      });

    } catch (error) {
      console.error('Error in batch issuance:', error);
      
      setProcessResult({
        success: false,
        error: error.message,
        step: 'batch_processing',
        data: results // Puede contener datos parciales si la API falla
      });

      trackHederaOperation({
        operation: 'batch_issuance_failed',
        error: error.message,
        processed: results.successful.length
      });

    } finally {
      setIsProcessing(false);
    }
  };

  

  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Carga Masiva de Credenciales
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Sube un archivo CSV con los datos de los estudiantes para emitir credenciales académicas en lote.
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Procesando...' : 'Seleccionar Archivo CSV'}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Formatos soportados: CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Configurar Emisión
              </h2>
              <p className="text-gray-600">
                Archivo: <strong>{fileData?.name}</strong> ({fileData?.rowCount} registros)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantilla de Diseño
                  </label>
                  {availableTemplates.length === 0 ? (
                    <select
                      value={issuanceConfig.template || 'default'}
                      onChange={(e) => setIssuanceConfig(prev => ({
                        ...prev,
                        template: e.target.value
                      }))}
                      className="input-primary"
                    >
                      <option value="default">Por defecto</option>
                    </select>
                  ) : (
                    <select
                      value={issuanceConfig.template}
                      onChange={(e) => setIssuanceConfig(prev => ({
                        ...prev,
                        template: e.target.value
                      }))}
                      className="input-primary"
                    >
                      <option value="">Selecciona una plantilla guardada</option>
                      {availableTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Credencial
                  </label>
                  <select
                    value={issuanceConfig.credentialType}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      credentialType: e.target.value
                    }))}
                    className="input-primary"
                  >
                    <option value="degree">Título Universitario</option>
                    <option value="certificate">Certificado</option>
                    <option value="diploma">Diploma</option>
                    <option value="badge">Insignia Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institución
                  </label>
                  <input
                    type="text"
                    value={issuanceConfig.institution}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      institution: e.target.value
                    }))}
                    placeholder="Nombre de la institución"
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Expiración (opcional)
                  </label>
                  <input
                type="date"
                value={issuanceConfig.expirationDate}
                onChange={(e) => setIssuanceConfig(prev => ({
                  ...prev,
                  expirationDate: e.target.value
                }))}
                className="input-primary"
              />
            </div>
            
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje Personalizado (Narrativa del Trayecto)
                </label>
                <div className="mb-2">
                    <select
                        onChange={(e) => {
                            const tmpl = preSignTemplates.find(t => t.id === e.target.value);
                            if (tmpl) {
                                setIssuanceConfig(prev => ({ ...prev, customMessage: tmpl.content }));
                            }
                        }}
                        className="input-primary text-sm mb-2"
                        defaultValue=""
                    >
                        <option value="" disabled>-- Seleccionar Plantilla de Mensaje --</option>
                        {preSignTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
                <textarea
                    value={issuanceConfig.customMessage}
                    onChange={(e) => setIssuanceConfig(prev => ({
                    ...prev,
                    customMessage: e.target.value
                    }))}
                    placeholder="Escribe tu mensaje personalizado (usa {{student_name}}, {{degree}}, etc.)"
                    className="input-primary h-32"
                />
                <div className="text-sm text-gray-500 mt-1">
                    Variables disponibles: {'{{student_name}}, {{degree}}, {{institution}}, {{fecha_expedicion}}'}
                </div>
                {issuanceConfig.customMessage && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Vista Previa del Email (Ejemplo)</label>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed font-serif italic">
                            {(() => {
                                let text = issuanceConfig.customMessage;
                                const sample = fileData?.parsedData?.[0] || { 
                                    firstName: 'Juan', 
                                    lastName: 'Pérez', 
                                    degree: 'Ingeniería',
                                    institution: issuanceConfig.institution || 'Universidad'
                                };
                                const vars = {
                                    student_name: `${sample.firstName} ${sample.lastName}`,
                                    degree: sample.degree,
                                    institution: issuanceConfig.institution,
                                    fecha_expedicion: new Date().toLocaleDateString()
                                };
                                Object.entries(vars).forEach(([key, val]) => {
                                    text = text.replace(new RegExp(`{{${key}}}`, 'g'), val || `[${key}]`);
                                });
                                return text;
                            })()}
                        </p>
                    </div>
                )}
            </div>
          </div>
          <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="addToHedera"
                    checked={issuanceConfig.addToHedera}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      addToHedera: e.target.checked
                    }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded focus-visible"
                  />
                  <label htmlFor="addToHedera" className="ml-2 block text-sm text-gray-700">
                    Registrar en Hedera Blockchain
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="preSignPayments"
                    checked={preSignPayments}
                    onChange={(e) => setPreSignPayments(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded focus-visible"
                  />
                  <label htmlFor="preSignPayments" className="ml-2 block text-sm text-gray-700">
                    Pre-firmar pagos (si aplica)
                  </label>
                </div>

                

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="generateQR"
                    checked={issuanceConfig.generateQR}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      generateQR: e.target.checked
                    }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded focus-visible"
                  />
                  <label htmlFor="generateQR" className="ml-2 block text-sm text-gray-700">
                    Generar códigos QR para verificación
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={issuanceConfig.sendEmail}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      sendEmail: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded focus-visible"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
                    Enviar notificación por email
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-secondary"
              >
                ← Volver
              </button>
              
              <button
                onClick={handleGeneratePreview}
                disabled={
                  !fileData ||
                  !fileData.rowCount ||
                  !issuanceConfig.institution ||
                  (availableTemplates.length > 0 && !issuanceConfig.template) ||
                  isProcessing
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Generando...' : 'Generar Vista Previa →'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Vista Previa de Emisión
              </h2>
              <p className="text-gray-600">
                Revisa las {credentials.length} credenciales antes de emitirlas en Hedera
              </p>
            </div>

            <AiInsightsPanel analysis={aiAnalysis} onFixRequest={handleAiFix} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto p-2">
              {credentials.slice(0, 6).map((credential, index) => (
                <div key={credential.id} className="space-y-2">
                  <CredentialPreview
                    credential={credential.credential}
                    index={index}
                  />
                  
                </div>
              ))}
            </div>

            {credentials.length > 6 && (
              <div className="text-center text-gray-500">
                Y {credentials.length - 6} credenciales más...
              </div>
            )}

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-secondary hover-lift"
              >
                ← Atrás
              </button>
              
              <button
                onClick={handleBatchIssuance}
                disabled={!credentials.length || isProcessing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 hover-lift"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>
                      {(!demo && issuanceConfig.addToHedera && !account) 
                        ? `Emitir Gestionado (${credentials.length})` 
                        : `Confirmar y Emitir (${credentials.length})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
          <IssuanceSummary 
            summary={processResult?.summary || {}}
            onExport={handleExportCsv}
          />

          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => {
              setFileData(null);
              setCredentials([]);
              setProcessResult(null);
              setCurrentStep(1);
              try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
            }}>Nuevo Lote</button>
          </div>

            {processResult?.summary?.status === 'completed' && (() => {
              const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://academicchain-ledger-b2lu.onrender.com' : 'http://localhost:3001');
              const items = getResultItems();
              if (!items.length) return null;
              return (
                <div className="mt-6 overflow-x-auto bg-white rounded-lg border">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 text-sm">
                        <th className="px-4 py-2 text-left">Token</th>
                        <th className="px-4 py-2 text-left">Serial</th>
                        <th className="px-4 py-2 text-left">Acciones</th>
                        <th className="px-4 py-2 text-left">XRP Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const verifyUrl = `${API_BASE_URL}/api/verification/verify/${it.tokenId}/${it.serialNumber}`;
                        return (
                          <tr key={`${it.tokenId}-${it.serialNumber}-${idx}`} className="border-t text-sm">
                            <td className="px-4 py-2">{it.tokenId}</td>
                            <td className="px-4 py-2">{it.serialNumber}</td>
                            <td className="px-4 py-2 space-x-2">
                              <a className="btn-primary btn-sm" href={verifyUrl} target="_blank" rel="noreferrer">Dual (Hedera+XRP)</a>
                            </td>
                            <td className="px-4 py-2">
                              <XrpAnchorCell tokenId={it.tokenId} serialNumber={it.serialNumber} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {processResult?.summary?.status === 'queued' && isSocketConnected && (
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700">Esperando inicio del proceso... Conectado al servidor de notificaciones.</p>
                <div className="mt-2 text-xs text-gray-600">{isPolling ? 'Monitoreando por API...' : 'Iniciando monitoreo...'}</div>
                {pollError && (
                  <div className="mt-2 text-xs text-red-600">{pollError}</div>
                )}
                <button className="btn-secondary btn-sm mt-3" onClick={async () => {
                  try {
                    const masterJobId = processResult?.data?.masterJobId;
                    if (!masterJobId) return;
                    const res = await issuanceService.getBatchStatus(masterJobId);
                    const data = res.data || res;
                    const st = data?.state;
                    const prog = data?.progress ?? 0;
                    const result = data?.result;
                    setProcessResult(prev => ({
                      ...prev,
                      summary: {
                        ...prev.summary,
                        status: st === 'completed' ? 'completed' : (st === 'failed' ? 'failed' : 'processing'),
                        progress: typeof prog === 'number' ? prog : prev.summary?.progress || 0,
                        successful: Array.isArray(result?.data?.successful) ? result.data.successful.length : (prev.summary?.successful || 0),
                        failed: Array.isArray(result?.data?.failed) ? result.data.failed.length : (prev.summary?.failed || 0),
                      },
                      data: result?.data ? { ...prev.data, ...result.data } : prev.data,
                    }));
                  } catch (e) {
                    setPollError(e.message);
                  }
                }}>Actualizar ahora</button>
              </div>
            )}

            {processResult?.summary?.status === 'awaiting_xrp' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-semibold">Pagos XRP requeridos para completar la emisión</p>
                <div className="mt-3 overflow-x-auto bg-white rounded border">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700">
                        <th className="px-3 py-2 text-left">TxID</th>
                        <th className="px-3 py-2 text-left">Destino</th>
                        <th className="px-3 py-2 text-left">Drops</th>
                        <th className="px-3 py-2 text-left">Memo Hex</th>
                        <th className="px-3 py-2 text-left">XRPL Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xrpBatchIntents.map((it, idx) => (
                        <tr key={`${it.transactionId}-${idx}`} className="border-t">
                          <td className="px-3 py-2 font-mono">{it.transactionId}</td>
                          <td className="px-3 py-2 font-mono break-all">{it.xrpPaymentIntent.destination}</td>
                          <td className="px-3 py-2">{it.xrpPaymentIntent.amountDrops}</td>
                          <td className="px-3 py-2 font-mono break-all">{it.xrpPaymentIntent.memoHex}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              className="input-primary w-full"
                              placeholder="Introduce hash de XRPL"
                              value={xrpBatchHashes[it.transactionId] || ''}
                              onChange={(e) => setXrpBatchHashes(prev => ({ ...prev, [it.transactionId]: e.target.value }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="btn-primary mt-3"
                  onClick={async () => {
                    try {
                      const results = [];
                      const invalids = [];
                      for (const it of xrpBatchIntents) {
                        const h = xrpBatchHashes[it.transactionId];
                        if (!h) continue;
                        if (!/^[A-Fa-f0-9]{64}$/.test(h)) {
                          invalids.push(it.transactionId);
                          continue;
                        }
                        const execRes = await issuanceService.executeIssuance({ transactionId: it.transactionId, xrpTxHash: h });
                        results.push(execRes.data || execRes);
                      }
                      if (invalids.length) {
                        setPollError(`Hash XRPL inválido para ${invalids.length} transacción(es): ${invalids.join(', ')}`);
                      }
                      setProcessResult(prev => ({
                        ...prev,
                        data: { ...prev.data, prepared: results },
                        summary: { ...prev.summary, status: 'completed', successful: results.length, failed: 0, successRate: 100 }
                      }));
                      setXrpBatchIntents([]);
                      setXrpBatchHashes({});
                    } catch (e) {
                      setPollError(e.message);
                    }
                  }}
                >Finalizar lote con XRP</button>
              </div>
            )}
            
            {processResult?.data?.failed && processResult.data.failed.length > 0 && (
              <ErrorReport 
                failedItems={processResult.data.failed}
                onRetryFailed={() => {
                  // Implementar reintento de fallidos
                  console.log('Retry failed items');
                }}
              />
            )}
            <div className="mt-4 flex items-center gap-3">
              <button className="btn-secondary" onClick={handleAuditBatch}>📊 Auditar Lote en Blockchain</button>
              {(() => {
                const prepared = Array.isArray(processResult?.data?.prepared) ? processResult.data.prepared : [];
                const last = prepared[prepared.length - 1] || null;
                const tokenId = last?.tokenId || '';
                const serial = last?.mint?.serialNumber || last?.serialNumber || '';
                if (!tokenId || !serial) return null;
                const params = new URLSearchParams();
                params.set('tokenId', tokenId);
                params.set('serialNumber', String(serial));
                return (
                  <a className="btn-ghost" href={`/#/verificar?${params.toString()}`} target="_blank" rel="noreferrer">🔍 Verificar último emitido</a>
                );
              })()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '8px', padding: '8px 12px' } }} />
      {/* Progress Tracker */}
      <ProgressTracker
        currentStep={currentStep}
        steps={[
          { number: 1, title: 'Cargar Archivo' },
          { number: 2, title: 'Configurar' },
          { number: 3, title: 'Revisar' },
          { number: 4, title: 'Resultados' }
        ]}
      />

      {/* Contenido del paso actual */}
      <div className="mt-8">
        {renderStep()}
      </div>

      {/* Estado de conexión */}
      {currentStep >= 3 && (
        <div className={`mt-6 p-4 rounded-lg border ${
          isConnected 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
            }`}></div>
            <span className="font-medium">
              {isConnected 
                ? `Conectado a Hedera (${account?.accountId})` 
                : 'Wallet no conectado. Conecta tu wallet para emitir credenciales.'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchIssuance;
