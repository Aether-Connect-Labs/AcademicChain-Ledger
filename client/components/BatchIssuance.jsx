// src/components/issuance/BatchIssuance.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './services/config';

import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';
import { useAnalytics } from './useAnalytics';
import { issuanceService } from './services/issuanceService';
import { verificationService } from './services/verificationService';
import { fileParser } from './utils/fileParser';
import { validationService } from './services/validationService';
import { sanitizeString } from './utils/security';
import apiService from './services/apiService';
import ProgressTracker from './ui/ProgressTracker';
import CredentialPreview from './CredentialPreview';
import IssuanceSummary from './IssuanceSummary';
import ErrorReport from './ui/ErrorReport';
import AiInsightsPanel from './ui/AiInsightsPanel';
import { Toaster, toast } from 'react-hot-toast';
import { Table, FileText, Download, AlertTriangle, Check, FileSpreadsheet, UploadCloud, RefreshCw, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  return <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{hash.slice(0, 8)}...</a>;
};

const BatchIssuance = ({ demo = false, plan, emissionsUsed = 0, onEmissionComplete, institutionName }) => {
  const { account, isConnected, connectWallet } = useHedera();
  const location = useLocation();
  const navigate = useNavigate();
  const returnUrl = location.state?.returnUrl;
  const { token, user } = useAuth(); // Obtener el token y usuario
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
      setIssuanceConfig(prev => ({ ...prev, institution: sanitizeString(institutionName) }));
    } else if (user?.institutionName || user?.name) {
      const name = user.institutionName || user.name;
      setIssuanceConfig(prev => ({ ...prev, institution: sanitizeString(name) }));
    } else if (demo) {
      setIssuanceConfig(prev => ({ ...prev, institution: 'Institución Demo' }));
    }
  }, [institutionName, user, demo]);

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

  const handleDownloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'studentId', 'degree', 
      'major', 'gpa', 'graduationDate', 'email', 'honors'
    ];
    const sampleData = [
      ['Juan', 'Perez', 'A00123456', 'Ingeniería de Software', 'IA', '95', '2024-06-15', 'juan@example.com', 'Summa Cum Laude'],
      ['Maria', 'Gomez', 'A00654321', 'Arquitectura', 'Urbanismo', '92', '2024-06-15', 'maria@example.com', '']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "Plantilla_Emision_Masiva_ACL.xlsx");
  };

  const validateRows = (rows) => {
    return rows.map(row => {
      const errors = [];
      if (!row.firstName) errors.push('Falta Nombre');
      if (!row.lastName) errors.push('Falta Apellido');
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Email Inválido');
      if (!row.studentId) errors.push('Falta ID Estudiante');
      if (!row.degree) errors.push('Falta Título');
      
      return { ...row, errors, isValid: errors.length === 0 };
    });
  };

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

      // Use fileParser to get raw data
      const parsedData = await fileParser.parseFile(file);
      
      // Apply our specific validation
      const validatedData = validateRows(parsedData);
      const validCount = validatedData.filter(r => r.isValid).length;
      
      setFileData({
        name: file.name,
        size: file.size,
        type: file.type,
        rowCount: parsedData.length,
        validCount,
        invalidCount: parsedData.length - validCount,
        parsedData: validatedData
      });

      setCurrentStep(2); // Go to preview
      
      trackHederaOperation({
        operation: 'batch_file_processed',
        recordCount: parsedData.length,
        validationErrors: parsedData.length - validCount
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error al procesar archivo: ${error.message}`);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    // Wallet connection is optional for managed issuance
    if (!demo && issuanceConfig.addToHedera && !account) {
       // Optional: Warn user or just proceed if using custodial service
       console.log('Proceeding with managed issuance (no wallet connected)');
    }

    setIsProcessing(true);
    setProcessResult(null);

    // Initialize results accumulator
    const aggregateResults = {
        successful: 0,
        failed: 0,
        details: [],
        startTime: Date.now()
    };
    
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(credentials.length / BATCH_SIZE);

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
           // El backend manejará las redes, pero validamos aquí.
      }

      if (demo) {
        const total = credentials.length || 2;
        const demoCreds = credentials.length ? credentials : [
          { id: 'preview_0', credential: issuanceService.createCredentialTemplate({ studentName: 'Alice Demo', degree: 'CS', credentialType: issuanceConfig.credentialType }) },
          { id: 'preview_1', credential: issuanceService.createCredentialTemplate({ studentName: 'Bob Demo', degree: 'Math', credentialType: issuanceConfig.credentialType }) },
        ];
        setCredentials(demoCreds);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const summary = { total, successful: total, failed: 0, successRate: 100, duration: 1, status: 'completed' };
        setProcessResult({ success: true, data: { total, startTime: aggregateResults.startTime }, summary });
        setCurrentStep(4);
        setIsProcessing(false);
        if (onEmissionComplete) onEmissionComplete(total);
        // Notify Creator Dashboard
        window.dispatchEvent(new CustomEvent('acl:batch-complete', { detail: { count: total } }));
        return;
      }

      // Initialize UI
      setProcessResult({
        summary: {
            status: 'processing',
            progress: 0,
            successful: 0,
            failed: 0,
            batchCurrent: 0,
            batchTotal: totalBatches
        }
      });

      trackCredentialOperation({
        operation: 'batch_issuance_start',
        credentialCount: credentials.length,
        institution: issuanceConfig.institution
      });

      // Real issuance logic with batching (5 items per batch)
      for (let i = 0; i < credentials.length; i += BATCH_SIZE) {
          const chunk = credentials.slice(i, i + BATCH_SIZE);
          const currentBatchIndex = Math.floor(i / BATCH_SIZE) + 1;

          // Update UI for current batch
          setProcessResult(prev => ({
              ...prev,
              summary: {
                  ...prev.summary,
                  batchCurrent: currentBatchIndex,
                  batchTotal: totalBatches,
                  status: `processing_batch_${currentBatchIndex}`,
                  successful: aggregateResults.successful,
                  failed: aggregateResults.failed
              }
          }));

          const batchData = {
            credentials: chunk.map(c => c.credential),
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

          const response = await apiService.submitBatch(batchData);
          const jobId = response.jobId || response.data?.masterJobId;

          if (!jobId) {
             console.warn('No Job ID returned for batch', i);
             continue; 
          }

          // Wait for this batch to complete using polling
          await new Promise((resolve, reject) => {
              const checkInterval = setInterval(async () => {
                  try {
                      const statusRes = await issuanceService.getBatchStatus(jobId);
                      const statusData = statusRes.data || statusRes;
                      
                      if (statusData.status === 'completed' || statusData.status === 'failed') {
                          clearInterval(checkInterval);
                          
                          // Aggregate results
                          const chunkSuccess = statusData.successfulCount || statusData.successful?.length || 0;
                          const chunkFailed = statusData.failedCount || statusData.failed?.length || 0;
                          
                          aggregateResults.successful += chunkSuccess;
                          aggregateResults.failed += chunkFailed;
                          
                          if (statusData.results) {
                              aggregateResults.details.push(...statusData.results);
                          } else if (statusData.successful) {
                              aggregateResults.details.push(...statusData.successful.map(s => ({...s, status: 'success'})));
                          }
                          
                          // Update interim UI
                          setProcessResult(prev => ({
                              ...prev,
                              summary: {
                                  ...prev.summary,
                                  successful: aggregateResults.successful,
                                  failed: aggregateResults.failed,
                                  progress: Math.round(((i + chunk.length) / credentials.length) * 100)
                              }
                          }));
                          
                          resolve(statusData);
                      }
                  } catch (e) {
                      console.error('Polling error in batch:', e);
                      clearInterval(checkInterval);
                      reject(e);
                  }
              }, 2000); // Poll every 2s
          });
      }

      // Finalize
      const finalSummary = {
        total: credentials.length,
        successful: aggregateResults.successful,
        failed: aggregateResults.failed,
        successRate: Math.round((aggregateResults.successful / credentials.length) * 100),
        duration: (Date.now() - aggregateResults.startTime) / 1000,
        status: 'completed',
        batchTotal: totalBatches
      };

      setProcessResult({
        success: true,
        summary: finalSummary,
        data: {
            results: aggregateResults.details
        }
      });

      setCurrentStep(4);

      trackCredentialOperation({
        operation: 'batch_issuance_complete',
        status: 'completed',
        total: credentials.length,
        successful: aggregateResults.successful
      });

      if (onEmissionComplete && aggregateResults.successful > 0) {
          onEmissionComplete(aggregateResults.successful);
      }
      
      if (aggregateResults.successful > 0) {
         window.dispatchEvent(new CustomEvent('acl:batch-complete', { detail: { count: aggregateResults.successful } }));
      }

    } catch (error) {
      console.error('Error in batch issuance:', error);
      
      setProcessResult({
        success: false,
        error: error.message,
        step: 'batch_processing',
        data: aggregateResults // Partial results
      });

      trackHederaOperation({
        operation: 'batch_issuance_failed',
        error: error.message,
        processed: aggregateResults.successful
      });

    } finally {
      setIsProcessing(false);
    }
  };

  

  // Renderizar paso actual
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        if (fileData) {
           // Show Validation Table
           return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-700/50 shadow-lg">
                  <div className="flex items-center gap-5">
                     <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                        <FileSpreadsheet className="text-emerald-400" size={28} />
                     </div>
                     <div>
                        <h3 className="font-bold text-slate-100 text-lg">{fileData.name}</h3>
                        <div className="flex gap-4 text-xs mt-2 uppercase tracking-wider font-medium">
                           <span className="text-slate-400 flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                             {fileData.rowCount} Registros
                           </span>
                           <span className="text-emerald-400 flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             {fileData.validCount} Válidos
                           </span>
                           {fileData.invalidCount > 0 && (
                             <span className="text-rose-400 flex items-center gap-1">
                               <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                               {fileData.invalidCount} Errores
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => { setFileData(null); }}
                        className="p-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-all duration-300"
                        title="Subir otro archivo"
                     >
                        <RefreshCw size={20} />
                     </button>
                  </div>
               </div>
    
               {/* Validation Table */}
               <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-800/80 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Estado</th>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Estudiante</th>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">ID</th>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Título</th>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                           <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Detalles</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700/50">
                        {fileData.parsedData.map((row, idx) => (
                           <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${!row.isValid ? 'bg-rose-900/10' : ''}`}>
                              <td className="px-6 py-4">
                                 {row.isValid ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                       <Check size={12} className="mr-1.5" /> Válido
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                       <AlertTriangle size={12} className="mr-1.5" /> Error
                                    </span>
                                 )}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-200">{row.firstName} {row.lastName}</td>
                              <td className="px-6 py-4 text-slate-400 font-mono text-xs">{row.studentId}</td>
                              <td className="px-6 py-4 text-slate-400">{row.degree}</td>
                              <td className="px-6 py-4 text-slate-400">{row.email}</td>
                              <td className="px-6 py-4">
                                 {!row.isValid && (
                                    <span className="text-rose-400 text-xs font-medium flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                        {row.errors.join(', ')}
                                    </span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
    
               <div className="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
                  <button 
                     onClick={() => { setFileData(null); }}
                     className="px-6 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all text-sm font-medium"
                  >
                     Cancelar
                  </button>
                  <button
                     disabled={fileData.invalidCount > 0}
                     onClick={() => setCurrentStep(2)}
                     className={`px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg ${
                        fileData.invalidCount > 0 
                           ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                           : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/20 hover:shadow-cyan-500/30'
                     }`}
                  >
                     <Eye size={18} />
                     {fileData.invalidCount > 0 ? 'Corrije los errores para continuar' : 'Continuar a Configuración'}
                  </button>
               </div>
            </div>
           );
        }

        return (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-inner backdrop-blur-sm group">
                <UploadCloud size={48} className="text-cyan-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                Carga Masiva de Credenciales
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                Sube un archivo CSV o Excel con los datos de los estudiantes para procesar múltiples emisiones.
              </p>
            </div>

            <div 
                className="border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-2xl p-16 text-center hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload({ target: { files: [file] } });
                }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              
              <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-6 p-4 rounded-full bg-slate-800/50 group-hover:bg-cyan-900/20 transition-colors duration-300">
                    <FileSpreadsheet size={32} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">Arrastra tu archivo aquí</h3>
                  <p className="text-slate-500 mb-8 group-hover:text-slate-400 transition-colors">o haz clic para explorar</p>
                  <button className="px-8 py-3 bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500 hover:text-white transition-all duration-300 font-medium shadow-lg shadow-black/20 group-hover:shadow-cyan-500/20">
                    Seleccionar Archivo
                  </button>
              </div>
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium px-6 py-3 rounded-xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700"
                >
                    <Download size={18} />
                    Descargar Plantilla Excel Estándar
                </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
                Configurar Emisión
              </h2>
              <p className="text-slate-400">
                Archivo: <strong className="text-cyan-400">{fileData?.name}</strong> <span className="text-slate-600">|</span> {fileData?.rowCount} registros
              </p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Plantilla de Diseño
                      </label>
                      {availableTemplates.length === 0 ? (
                        <select
                          value={issuanceConfig.template || 'default'}
                          onChange={(e) => setIssuanceConfig(prev => ({
                            ...prev,
                            template: e.target.value
                          }))}
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
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
                          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                        >
                          <option value="">Selecciona una plantilla guardada</option>
                          {availableTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Tipo de Credencial
                      </label>
                      <select
                        value={issuanceConfig.credentialType}
                        onChange={(e) => setIssuanceConfig(prev => ({
                          ...prev,
                          credentialType: e.target.value
                        }))}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
                      >
                        <option value="degree">Título Universitario</option>
                        <option value="certificate">Certificado</option>
                        <option value="diploma">Diploma</option>
                        <option value="badge">Insignia Digital</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
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
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Fecha de Expiración (opcional)
                      </label>
                      <input
                        type="date"
                        value={issuanceConfig.expirationDate}
                        onChange={(e) => setIssuanceConfig(prev => ({
                          ...prev,
                          expirationDate: e.target.value
                        }))}
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                      />
                    </div>
                  </div>
                
                  <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Mensaje Personalizado (Narrativa del Trayecto)
                        </label>
                        <div className="mb-3">
                            <select
                                onChange={(e) => {
                                    const tmpl = preSignTemplates.find(t => t.id === e.target.value);
                                    if (tmpl) {
                                        setIssuanceConfig(prev => ({ ...prev, customMessage: tmpl.content }));
                                    }
                                }}
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none"
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
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-600 transition-all h-32 resize-none"
                        />
                        <div className="text-xs text-slate-500 mt-2 flex gap-2">
                            <span className="font-bold">Variables:</span> 
                            <code className="bg-slate-800 px-1 rounded text-cyan-400">{'{{student_name}}'}</code>
                            <code className="bg-slate-800 px-1 rounded text-cyan-400">{'{{degree}}'}</code>
                            <code className="bg-slate-800 px-1 rounded text-cyan-400">{'{{institution}}'}</code>
                        </div>
                        {issuanceConfig.customMessage && (
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mt-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vista Previa del Email (Ejemplo)</label>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-serif italic border-l-2 border-cyan-500/50 pl-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-700/50 pt-6">
                    <div className="flex items-center p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setIssuanceConfig(prev => ({ ...prev, addToHedera: !prev.addToHedera }))}>
                      <input
                        type="checkbox"
                        id="addToHedera"
                        checked={issuanceConfig.addToHedera}
                        onChange={(e) => setIssuanceConfig(prev => ({
                          ...prev,
                          addToHedera: e.target.checked
                        }))}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="addToHedera" className="ml-3 block text-sm font-medium text-slate-300 cursor-pointer">
                        Registrar en Hedera Blockchain
                      </label>
                    </div>

                    <div className="flex items-center p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setPreSignPayments(!preSignPayments)}>
                      <input
                        type="checkbox"
                        id="preSignPayments"
                        checked={preSignPayments}
                        onChange={(e) => setPreSignPayments(e.target.checked)}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="preSignPayments" className="ml-3 block text-sm font-medium text-slate-300 cursor-pointer">
                        Pre-firmar pagos (si aplica)
                      </label>
                    </div>

                    <div className="flex items-center p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setIssuanceConfig(prev => ({ ...prev, generateQR: !prev.generateQR }))}>
                      <input
                        type="checkbox"
                        id="generateQR"
                        checked={issuanceConfig.generateQR}
                        onChange={(e) => setIssuanceConfig(prev => ({
                          ...prev,
                          generateQR: e.target.checked
                        }))}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="generateQR" className="ml-3 block text-sm font-medium text-slate-300 cursor-pointer">
                        Generar códigos QR para verificación
                      </label>
                    </div>

                    <div className="flex items-center p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setIssuanceConfig(prev => ({ ...prev, sendEmail: !prev.sendEmail }))}>
                      <input
                        type="checkbox"
                        id="sendEmail"
                        checked={issuanceConfig.sendEmail}
                        onChange={(e) => setIssuanceConfig(prev => ({
                          ...prev,
                          sendEmail: e.target.checked
                        }))}
                        className="h-5 w-5 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="sendEmail" className="ml-3 block text-sm font-medium text-slate-300 cursor-pointer">
                        Enviar notificación por email
                      </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all font-medium"
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
                className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Generando...' : 'Generar Vista Previa →'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl"></div>
              </div>
              <h2 className="relative text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3">
                Vista Previa de Emisión
              </h2>
              <p className="relative text-slate-400 max-w-2xl mx-auto text-lg">
                Revisa las <span className="text-cyan-400 font-semibold">{credentials.length}</span> credenciales antes de emitirlas en Hedera
              </p>
            </div>

            <AiInsightsPanel analysis={aiAnalysis} onFixRequest={handleAiFix} />

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {credentials.slice(0, 6).map((credential, index) => (
                  <div key={credential.id} className="transform transition-all duration-300 hover:scale-[1.01]">
                    <CredentialPreview
                      credential={credential.credential}
                      index={index}
                    />
                  </div>
                ))}
              </div>

              {credentials.length > 6 && (
                <div className="text-center mt-6 pt-6 border-t border-slate-800">
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/50 text-slate-400 text-sm border border-slate-700">
                    Y {credentials.length - 6} credenciales más...
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-800/50">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all font-medium flex items-center gap-2"
              >
                ← Atrás
              </button>
              
              <button
                onClick={handleBatchIssuance}
                disabled={!credentials.length || isProcessing}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 transform hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Procesando Emisión...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🚀</span>
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
          <div className="space-y-8">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <IssuanceSummary 
                summary={processResult?.summary || {}}
                onExport={handleExportCsv}
              />
              
              <div className="mt-8 flex justify-center">
                <button 
                  className="px-8 py-3 rounded-xl bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-all duration-300 font-medium shadow-lg shadow-black/20 hover:shadow-cyan-500/20 flex items-center gap-2" 
                  onClick={() => {
                    setFileData(null);
                    setCredentials([]);
                    setProcessResult(null);
                    setCurrentStep(1);
                    try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
                  }}
                >
                  <RefreshCw size={20} />
                  Iniciar Nuevo Lote
                </button>
              </div>
            </div>

            {processResult?.summary?.status === 'completed' && (() => {
              // const API_BASE_URL = ... (removed in favor of frontend route)
              const items = getResultItems();
              if (!items.length) return null;
              return (
                <div className="mt-8 overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl">
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-200">Credenciales Emitidas</h3>
                    <span className="text-xs font-mono text-cyan-500 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
                      {items.length} items
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 text-left font-semibold">Token ID</th>
                          <th className="px-6 py-4 text-left font-semibold">Serial</th>
                          <th className="px-6 py-4 text-left font-semibold">Acciones</th>
                          <th className="px-6 py-4 text-left font-semibold">Estado XRP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {items.map((it, idx) => {
                          // Point to frontend verification page instead of backend API
                          const verifyUrl = `/verify/${it.tokenId}/${it.serialNumber}`;
                          return (
                            <tr key={`${it.tokenId}-${it.serialNumber}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 text-slate-300 font-mono text-sm">{it.tokenId}</td>
                              <td className="px-6 py-4 text-slate-300 font-mono text-sm">#{it.serialNumber}</td>
                              <td className="px-6 py-4 space-x-2">
                                <a 
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors" 
                                  href={verifyUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                >
                                  <Eye size={14} className="mr-1.5" />
                                  Ver Credencial
                                </a>
                              </td>
                              <td className="px-6 py-4">
                                <XrpAnchorCell tokenId={it.tokenId} serialNumber={it.serialNumber} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {processResult?.summary?.status === 'queued' && isSocketConnected && (
              <div className="text-center p-8 bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-900/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 animate-pulse"></div>
                <div className="relative z-10">
                  <div className="inline-flex p-3 rounded-full bg-cyan-950/50 border border-cyan-500/30 mb-4">
                    <RefreshCw className="animate-spin text-cyan-400" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Procesando Lote</h3>
                  <p className="text-slate-400 mb-4">Conectado al servidor de notificaciones. Tu lote está en la cola de procesamiento.</p>
                  
                  <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 text-xs font-mono text-slate-500 border border-slate-700">
                    {isPolling ? 'Monitoreando vía API...' : 'Esperando actualizaciones...'}
                  </div>
                  
                  {pollError && (
                    <div className="mt-4 p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-sm text-rose-400 flex items-center justify-center gap-2">
                      <AlertTriangle size={16} />
                      {pollError}
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <button 
                      className="text-xs text-slate-500 hover:text-cyan-400 underline decoration-slate-700 hover:decoration-cyan-400 transition-all" 
                      onClick={async () => {
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
                      }}
                    >
                      Forzar actualización de estado
                    </button>
                  </div>
                </div>
              </div>
            )}

            {processResult?.summary?.status === 'awaiting_xrp' && (
              <div className="p-6 bg-amber-950/20 border border-amber-500/30 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-amber-900/30 border border-amber-500/30 text-amber-500">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-400 mb-2">Acción Requerida: Pagos XRP</h3>
                    <p className="text-slate-400 mb-6">Se requieren pagos en la red XRP para completar la emisión de las credenciales. Por favor procesa las siguientes transacciones.</p>
                    
                    <div className="overflow-x-auto bg-slate-900/50 rounded-xl border border-slate-800 mb-6">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800/50 text-slate-400">
                            <th className="px-4 py-3 text-left font-semibold">TxID</th>
                            <th className="px-4 py-3 text-left font-semibold">Destino</th>
                            <th className="px-4 py-3 text-left font-semibold">Drops</th>
                            <th className="px-4 py-3 text-left font-semibold">Memo Hex</th>
                            <th className="px-4 py-3 text-left font-semibold">XRPL Tx Hash</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30 text-slate-300">
                          {xrpBatchIntents.map((it, idx) => (
                            <tr key={`${it.transactionId}-${idx}`} className="hover:bg-slate-800/20">
                              <td className="px-4 py-3 font-mono text-xs">{it.transactionId}</td>
                              <td className="px-4 py-3 font-mono text-xs break-all max-w-[150px]">{it.xrpPaymentIntent.destination}</td>
                              <td className="px-4 py-3 font-mono text-xs text-amber-400">{it.xrpPaymentIntent.amountDrops}</td>
                              <td className="px-4 py-3 font-mono text-xs break-all max-w-[150px] text-slate-500">{it.xrpPaymentIntent.memoHex}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                  placeholder="Pegar Hash de Transacción..."
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
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all flex items-center gap-2"
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
                    >
                      <Check size={18} />
                      Finalizar Lote con XRP
                    </button>
                  </div>
                </div>
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
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <button 
                className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all font-medium flex items-center gap-2"
                onClick={handleAuditBatch}
              >
                <FileText size={18} />
                Auditar Lote en Blockchain
              </button>
              
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
                  <a 
                    className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all font-medium flex items-center gap-2" 
                    href={`/#/verificar?${params.toString()}`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <Eye size={18} />
                    Verificar Último Emitido
                  </a>
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
    <div className="max-w-6xl mx-auto p-8 bg-slate-950/50 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {returnUrl && (
          <button 
            onClick={() => navigate(returnUrl)}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span> Volver al Dashboard
          </button>
      )}
      
      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-200 mb-3 tracking-tight">
          Emisión Masiva de Credenciales
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Gestiona, valida y emite múltiples certificados académicos en la blockchain de Hedera y XRP de forma segura y eficiente.
        </p>
      </div>

      <Toaster position="top-right" toastOptions={{ 
        style: { 
          borderRadius: '16px', 
          padding: '16px 24px', 
          background: 'rgba(15, 23, 42, 0.9)', 
          color: '#fff',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
        } 
      }} />
      
      {/* Progress Tracker */}
      <div className="mb-12">
        <ProgressTracker
          currentStep={currentStep}
          steps={[
            { number: 1, title: 'Cargar Archivo' },
            { number: 2, title: 'Configurar' },
            { number: 3, title: 'Revisar' },
            { number: 4, title: 'Resultados' }
          ]}
        />
      </div>

      {/* Contenido del paso actual */}
      <div className="relative z-10 min-h-[400px]">
        {renderStep()}
      </div>

      {/* Estado de conexión */}
      {currentStep >= 3 && (
        <div className={`mt-8 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${
          isConnected 
            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-900/10' 
            : 'bg-amber-950/20 border-amber-500/20 text-amber-300 shadow-lg shadow-amber-900/10'
        }`}>
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            }`}></div>
            <span className="font-medium font-mono text-sm tracking-wide">
              {isConnected 
                ? `CONECTADO A HEDERA (${account?.accountId})` 
                : 'WALLET DESCONECTADA - CONECTA TU WALLET PARA EMITIR'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchIssuance;

