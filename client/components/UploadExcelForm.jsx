import React, { useState } from 'react';
import { readSafe, sheetToSanitizedJSON } from './utils/xlsxSanitizer.js';
import { issuanceService } from './services/issuanceService';

const UploadExcelForm = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para la carga
  const [error, setError] = useState(''); // Nuevo estado para errores
  const [tokenId, setTokenId] = useState('0.0.123456');

  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setData(null);
  };

  const sendDataToBackend = async (excelData) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await issuanceService.issueBulkCredentials({ tokenId, credentials: excelData });
      setMessage('Emisión masiva iniciada exitosamente. Revisa el estado en el dashboard.');
      console.log('Backend Response:', response);
    } catch (err) {
      setError('Error al iniciar la emisión masiva: ' + err.message);
      console.error('Error sending data to backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor, selecciona un archivo Excel.');
      return;
    }
    const MAX_FILE_BYTES = 10 * 1024 * 1024;
    if (file.size && file.size > MAX_FILE_BYTES) {
      setError('El archivo excede el límite de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const binaryStr = event.target.result;
        const { ws } = readSafe(binaryStr);
        const json = sheetToSanitizedJSON(ws);
        setData(json);
        setMessage('Archivo cargado y procesado exitosamente. Se simulará la emisión masiva.');
        console.log('Datos del Excel:', json);
        // Aquí se integrará la lógica para interactuar con la red Hedera para emisión masiva
        await sendDataToBackend(json);

      } catch (error) {
        setMessage('Error al procesar el archivo Excel. Asegúrate de que sea un formato válido.');
        console.error('Error processing excel file:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-md mx-auto card mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Subir Excel para Emisión Masiva</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tokenId" className="block text-gray-700 text-sm font-bold mb-2">
            Token ID:
          </label>
          <input
            type="text"
            id="tokenId"
            name="tokenId"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="input-primary"
            placeholder="0.0.xxxxxx"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="excelFile" className="block text-gray-700 text-sm font-bold mb-2">
            Seleccionar archivo Excel:
          </label>
          <input
            type="file"
            id="excelFile"
            name="excelFile"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="btn-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Subir y Procesar'}
          </button>
        </div>
        {isLoading && <p className="mt-4 text-sm badge-info badge">Cargando...</p>}
        {error && <p className="mt-4 text-sm badge-error badge">Error: {error}</p>}
        {message && <p className="mt-4 text-sm badge-success badge">{message}</p>}
        {data && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Vista Previa de Datos (Primeras 5 filas):</h3>
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(data.slice(0, 5), null, 2)}</pre>
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadExcelForm;
