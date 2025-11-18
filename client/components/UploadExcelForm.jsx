import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios'; // Importar axios

const UploadExcelForm = () =\u003e {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para la carga
  const [error, setError] = useState(''); // Nuevo estado para errores

const UploadExcelForm = () =\u003e {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) =\u003e {
    setFile(e.target.files[0]);
    setMessage('');
    setData(null);
  };

  const sendDataToBackend = async (excelData) =\u003e {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      // Assuming the backend expects an array of credential objects
      const response = await axios.post('/api/university/issue-bulk', { credentials: excelData });
      setMessage('Emisión masiva iniciada exitosamente. Revisa el estado en el dashboard.');
      console.log('Backend Response:', response.data);
    } catch (err) {
      setError('Error al iniciar la emisión masiva: ' + (err.response?.data?.message || err.message));
      console.error('Error sending data to backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) =\u003e {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor, selecciona un archivo Excel.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) =\u003e {
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
    \u003cdiv className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-8"\u003e
      \u003ch2 className="text-2xl font-bold mb-6 text-gray-800"\u003eSubir Excel para Emisión Masiva\u003c/h2\u003e
      \u003cform onSubmit={handleSubmit}\u003e
        \u003cdiv className="mb-4"\u003e
          \u003clabel htmlFor="excelFile" className="block text-gray-700 text-sm font-bold mb-2"\u003e
            Seleccionar archivo Excel:
          \u003c/label\u003e
          \u003cinput
            type="file"
            id="excelFile"
            name="excelFile"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          /\u003e
        \u003c/div\u003e
        \u003cdiv className="flex items-center justify-between"\u003e
          \u003cbutton
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          \u003e
            {isLoading ? 'Procesando...' : 'Subir y Procesar'}
          \u003c/button\u003e
        \u003c/div\u003e
        {isLoading \u0026\u0026 \u003cp className="mt-4 text-sm text-blue-600"\u003eCargando...\u003c/p\u003e}
        {error \u0026\u0026 \u003cp className="mt-4 text-sm text-red-600"\u003eError: {error}\u003c/p\u003e}
        {message \u0026\u0026 \u003cp className="mt-4 text-sm text-gray-600"\u003e{message}\u003c/p\u003e}
        {data \u0026\u0026 (
          \u003cdiv className="mt-4 p-4 bg-gray-100 rounded"\u003e
            \u003ch3 className="text-lg font-semibold mb-2"\u003eVista Previa de Datos (Primeras 5 filas):\u003c/h3\u003e
            \u003cpre className="text-xs overflow-auto max-h-40"\u003e{JSON.stringify(data.slice(0, 5), null, 2)}\u003c/pre\u003e
          \u003c/div\u003e
        )}
      \u003c/form\u003e
    \u003c/div\u003e
  );
};

export default UploadExcelForm;