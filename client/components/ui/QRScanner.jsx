// QRScanner JSX
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useEffect, useRef, useState, useCallback } from 'react';

const QRScanner = ({ onScan, isActive = true, className = '' }) => {
  const scannerRef = useRef(null);
  const [scannerState, setScannerState] = useState('idle');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const scannerElementId = 'html5qr-scanner';
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Obtener cámaras disponibles
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5QrcodeScanner.listCameras();
      const cameras = devices.map(device => ({
        id: device.id,
        label: device.label || `Cámara ${devices.indexOf(device) + 1}`
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
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_QR_CODE],
        videoConstraints: {
          deviceId: selectedCamera || undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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
      initializeScanner();
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isActive, initializeScanner, cleanupScanner]);

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
    switch (scannerState) {
      case 'starting':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700">Iniciando cámara...</p>
          </div>
        );

      case 'permission_denied':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <h3 className="font-bold text-red-800 text-lg mb-2">Permiso Denegado</h3>
            <p className="text-red-700 text-center mb-4">
              Por favor, permite el acceso a la cámara para escanear códigos QR.
            </p>
            <button
              onClick={handleRetry}
              className="btn-secondary text-red-600 border-red-300 hover:bg-red-50 hover-lift shadow-soft"
            >
              Reintentar
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="font-bold text-yellow-800 text-lg mb-2">Error de Cámara</h3>
            <p className="text-yellow-700 text-center mb-4">
              No se pudo acceder a la cámara. Verifica que esté disponible y no esté en uso.
            </p>
            <button
              onClick={handleRetry}
              className="btn-secondary text-yellow-700 border-yellow-300 hover:bg-yellow-50 hover-lift shadow-soft"
            >
              Reintentar
            </button>
          </div>
        );

      case 'scanning':
        return (
          <div className="space-y-4">
            {/* Selector de cámara */}
            {availableCameras.length > 1 && (
              <div className="flex items-center space-x-2">
                <label htmlFor="camera-select" className="text-sm font-medium text-gray-700">
                  Cámara:
                </label>
                <select
                  id="camera-select"
                  value={selectedCamera}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="relative">
              <div 
                id={scannerElementId} 
                className="rounded-lg overflow-hidden border-2 border-blue-400"
              />
              
              {/* Overlay de guía */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg"></div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Enfoca el código QR dentro del marco
            </p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-gray-600">Listo para escanear</p>
            {!permissionRequested && (
              <button
                onClick={requestCameraPermission}
                className="mt-4 btn-primary"
              >
                Permitir Cámara
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`qr-scanner ${className}`}>
      {renderContent()}
    </div>
  );
};

export default QRScanner;