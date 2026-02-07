// QRScanner JSX
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState, useCallback } from 'react';

const QRScanner = ({ onScan, isActive = true, className = '' }) => {
  const scannerRef = useRef(null);
  const [scannerState, setScannerState] = useState('idle');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const scannerElementId = 'html5qr-scanner';
  const [permissionRequested, setPermissionRequested] = useState(false);

  const fileInputRef = useRef(null);

  // Manejar subida de imagen QR
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("html5qr-file-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      // Limpiar y notificar éxito
      html5QrCode.clear();
      onScan(decodedText);
    } catch (error) {
      console.error('Error scanning file:', error);
      alert('No se detectó un código QR válido en la imagen. Intenta con otra imagen más clara.');
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Obtener cámaras disponibles
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      const cameras = (devices || []).map((device, idx) => ({
        id: device.id,
        label: device.label || `Cámara ${idx + 1}`
      }));
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].id);
      }
      return cameras;
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  }, [selectedCamera]);

  // Inicializar scanner
  const initializeScanner = useCallback(async () => {
    if (!isActive || scannerRef.current) return;

    setScannerState('starting');

    try {
      const cameras = await getCameras();
      if (cameras.length === 0) {
        throw new Error('No cameras found');
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: selectedCamera
          ? { deviceId: { exact: selectedCamera }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      scannerRef.current = new Html5QrcodeScanner(scannerElementId, config, false);

      await scannerRef.current.render(
        (decodedText) => {
          setScannerState('scanning');
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignorar errores de parsing que son normales durante el escaneo
          if (!errorMessage.includes('No MultiFormat Readers')) {
            console.debug('Scan error:', errorMessage);
          }
        }
      );

      setScannerState('scanning');
    } catch (error) {
      console.error('Scanner initialization failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.name === 'NotAllowedError') {
          setScannerState('permission_denied');
        } else if (error.message.includes('No cameras found')) {
          setScannerState('error');
        }
      } else {
        setScannerState('error');
      }
    }
  }, [isActive, selectedCamera, onScan, getCameras]);

  const requestCameraPermission = useCallback(async () => {
    try {
      setPermissionRequested(true);
      await navigator.mediaDevices.getUserMedia({ video: true });
      setScannerState('starting');
      setTimeout(() => initializeScanner(), 300);
    } catch (error) {
      setScannerState('permission_denied');
    }
  }, [initializeScanner]);

  // Limpiar scanner
  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        console.debug('Cleanup error:', error);
      } finally {
        scannerRef.current = null;
      }
    }
    setScannerState('idle');
  }, []);

  // Effect principal
  useEffect(() => {
    if (isActive) {
      if (!permissionRequested) {
        requestCameraPermission();
      } else {
        initializeScanner();
      }
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isActive, initializeScanner, cleanupScanner, permissionRequested, requestCameraPermission]);

  // Cambiar cámara
  const handleCameraChange = async (cameraId) => {
    setSelectedCamera(cameraId);
    await cleanupScanner();
    setTimeout(() => initializeScanner(), 500);
  };

  // Reintentar inicialización
  const handleRetry = async () => {
    await cleanupScanner();
    setTimeout(() => initializeScanner(), 500);
  };

  // Renderizar estados
  const renderContent = () => {
    const FileUploadButton = ({ className = "btn-secondary" }) => (
      <button
        onClick={triggerFileUpload}
        className={`${className} flex items-center gap-2`}
      >
        <span>📂</span> Subir imagen QR
      </button>
    );

    switch (scannerState) {
      case 'starting':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Iniciando cámara...</p>
          </div>
        );

      case 'permission_denied':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-red-100 shadow-lg min-h-[350px]">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
              <span className="text-4xl">🚫</span>
            </div>
            <h3 className="font-bold text-gray-800 text-xl mb-2">Acceso Denegado</h3>
            <p className="text-gray-600 text-center mb-8 max-w-xs">
              No tenemos permiso para usar la cámara. Por favor actívala en tu navegador o sube una imagen.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={handleRetry}
                className="btn-secondary w-full"
              >
                Reintentar Permiso
              </button>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">O SUBIR ARCHIVO</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              
              <FileUploadButton className="btn-primary w-full" />
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-lg min-h-[350px]">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="font-bold text-gray-800 text-xl mb-2">Problemas de Cámara</h3>
            <p className="text-gray-600 text-center mb-8 max-w-xs">
              No pudimos acceder a tu cámara. Verifica que no esté en uso por otra aplicación.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={handleRetry}
                className="btn-secondary w-full"
              >
                Reintentar Cámara
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">ALTERNATIVAMENTE</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <FileUploadButton className="btn-primary w-full" />
            </div>
          </div>
        );

      case 'scanning':
        return (
          <div className="space-y-4">
            {/* Cabecera con controles */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Cámara Activa
              </div>
              
              <button
                onClick={triggerFileUpload}
                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
              >
                <span>📂</span> Subir imagen
              </button>
            </div>

            {/* Selector de cámara si hay múltiples */}
            {availableCameras.length > 1 && (
              <div className="mb-2">
                <select
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableCameras.map(camera => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Área del scanner */}
            <div className="relative rounded-xl overflow-hidden shadow-inner bg-black">
              <div 
                id={scannerElementId} 
                className="overflow-hidden"
              />
              {/* Overlay decorativo */}
              <div className="absolute inset-0 pointer-events-none border-[20px] border-black/30 rounded-xl"></div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-2">
              Enfoca el código QR o sube una imagen si tienes problemas
            </p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[300px]">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <span className="text-4xl">📷</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Escanear Credencial</h3>
            <p className="text-gray-600 text-center mb-8 max-w-xs">
              Utiliza tu cámara para verificar la autenticidad de una credencial o sube una imagen del código QR.
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {!permissionRequested && (
                <button
                  onClick={requestCameraPermission}
                  className="btn-primary w-full py-3 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Activar Cámara
                </button>
              )}
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">O TAMBIÉN PUEDES</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <FileUploadButton className="btn-white w-full border-gray-300 text-gray-700 hover:bg-gray-100" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`qr-scanner ${className}`}>
      {renderContent()}
      {/* Input oculto para subida de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
      />
      {/* Div oculto para el procesador de archivos */}
      <div id="html5qr-file-reader" className="hidden"></div>
    </div>
  );
};

export default QRScanner;
