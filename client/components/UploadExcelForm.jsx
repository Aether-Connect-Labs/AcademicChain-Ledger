import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios'; // Importar axios

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
      const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
      if (!API_BASE_URL) {
        setMessage('Emisión masiva simulada en modo demostración. Configura VITE_API_URL para enviar al backend.');
        return;
      }
      const response = await axios.post(`${API_BASE_URL}/api/universities/issue-bulk`, { tokenId, credentials: excelData });
      setMessage('Emisión masiva iniciada exitosamente. Revisa el estado en el dashboard.');
      console.log('Backend Response:', response.data);
    } catch (err) {
      setError('Error al iniciar la emisión masiva: ' + (err.response?.data?.message || err.message));
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

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
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
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-8">
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
            className="block w-full border rounded px-3 py-2 text-gray-700 focus:outline-none focus:shadow-outline"
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
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Subir y Procesar'}
          </button>
        </div>
        {isLoading && <p className="mt-4 text-sm text-blue-600">Cargando...</p>}
        {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}
        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
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