// src/components/issuance/BatchIssuance.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useHedera } from './useHedera';
import { useAuth } from './useAuth';
import { useWebSocket } from './useWebSocket';
import { useAnalytics } from './useAnalytics';
import { issuanceService } from './services/issuanceService';
import { fileParser } from './utils/fileParser';
import { validationService } from './services/validationService';
import ProgressTracker from './ui/ProgressTracker';
import CredentialPreview from './CredentialPreview';
import IssuanceSummary from './IssuanceSummary';
import ErrorReport from './ui/ErrorReport';

const BatchIssuance = () => {
  const { account, isConnected, executeTransaction } = useHedera();
  const { token } = useAuth(); // Obtener el token de autenticación
  const { socket, isConnected: isSocketConnected } = useWebSocket(token); // Usar el token real
  const { trackHederaOperation, trackCredentialOperation } = useAnalytics();
  
  const fileInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);

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
    template: 'default'
  });

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
            honors: row.honors
          }
        });

        return {
          id: `preview_${index}`,
          credential,
          rawData: row,
          status: 'pending',
          errors: []
        };
      });

      setCredentials(previewCredentials);
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
  }, [fileData, issuanceConfig]);

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
        // Actualizar el resumen final con los datos detallados del resultado del job
        setProcessResult(prev => ({
          ...prev,
          summary: {
            ...prev.summary,
            status: 'completed',
            progress: 100,
            successful: data.result?.data?.successful?.length || 0,
            failed: data.result?.data?.failed?.length || 0,
            duration: data.duration,
          },
          // Guardar los resultados detallados para el reporte
          data: { ...prev.data, ...data.result?.data }
        }));
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

  // Paso 3: Procesamiento en lote
  const handleBatchIssuance = async () => {
    if (!isConnected || !account) {
      alert('Por favor, conecta tu wallet de Hedera primero');
      return;
    }

    setIsProcessing(true);
    setProcessResult(null);

    const results = {
      total: credentials.length,
      startTime: Date.now()
    };

    try {
      // Track del inicio de la operación
      trackCredentialOperation({
        operation: 'batch_issuance_start',
        credentialCount: credentials.length,
        institution: issuanceConfig.institution
      });

      // Enviar una única solicitud al backend para que encole el trabajo masivo
      const bulkPayload = {
        credentials: credentials.map(c => c.credential),
        config: issuanceConfig
      };

      // Asumimos que issuanceService tiene un método para esto
      const bulkJobResult = await issuanceService.issueBulkCredentials(bulkPayload);

      // El backend devuelve el ID del job maestro.
      // El frontend ahora puede suscribirse a las actualizaciones de este job por WebSocket.
      const masterJobId = bulkJobResult.jobId;

      // Actualizar UI para mostrar que el proceso está encolado
      const summary = {
        total: results.total,
        successful: 0, // Se actualizará via WebSocket
        failed: 0,     // Se actualizará via WebSocket
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

      // Track del evento de encolado
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

  // Reiniciar el proceso
  const handleReset = () => {
    setFileData(null);
    setCredentials([]);
    setProcessResult(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Descargar reporte
  const downloadReport = () => {
    if (!processResult?.data) return;

    const report = {
      timestamp: new Date().toISOString(),
      institution: issuanceConfig.institution,
      ...processResult.data
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_issuance_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Procesando...' : 'Seleccionar Archivo CSV'}
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                Formatos soportados: CSV, Excel (.xlsx, .xls)
              </p>
              
              <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Estructura esperada del CSV:</h4>
                <pre className="text-xs text-gray-600 bg-white p-3 rounded border">
{`firstName,lastName,studentId,degree,major,gpa,graduationDate
Juan,Pérez,2023001,Ingeniería Civil,Construcción,3.8,2023-12-15
María,González,2023002,Medicina,Cardiología,3.9,2023-12-15`}
                </pre>
              </div>
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
                    Tipo de Credencial
                  </label>
                  <select
                    value={issuanceConfig.credentialType}
                    onChange={(e) => setIssuanceConfig(prev => ({
                      ...prev,
                      credentialType: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="addToHedera" className="ml-2 block text-sm text-gray-700">
                    Registrar en Hedera Blockchain
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Volver
              </button>
              
              <button
                onClick={handleGeneratePreview}
                disabled={!issuanceConfig.institution || isProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto p-2">
              {credentials.slice(0, 6).map((credential, index) => (
                <CredentialPreview
                  key={credential.id}
                  credential={credential.credential}
                  index={index}
                />
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
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Atrás
              </button>
              
              <button
                onClick={handleBatchIssuance}
                disabled={!isConnected || isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Encolar {credentials.length} Credenciales</span>
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
              result={processResult}
              initialCredentials={credentials} // Pasar las credenciales iniciales
              onDownloadReport={downloadReport}
              onReset={handleReset}
            />

            {processResult?.summary?.status === 'queued' && isSocketConnected && (
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700">Esperando inicio del proceso... Conectado al servidor de notificaciones.</p>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
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