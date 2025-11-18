import React, { useState } from 'react';
import axios from 'axios'; // Importar axios

const IssueTitleForm = () =\u003e {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    issueDate: '',
    grade: '',
  });
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para la carga
  const [error, setError] = useState(''); // Nuevo estado para errores
  const [message, setMessage] = useState(''); // Estado para mensajes de éxito


  const handleChange = (e) =\u003e {
    const { name, value } = e.target;
    setFormData(prevState =\u003e ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) =\u003e {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      // Aquí deberías generar el uniqueHash y el ipfsURI. Por ahora, usaremos placeholders.
      // En un escenario real, el uniqueHash se generaría a partir de los datos del título
      // y el ipfsURI se obtendría después de subir los metadatos a IPFS.
      const uniqueHash = `hash-${Date.now()}`;
      const ipfsURI = `ipfs://QmVg...`; // Placeholder
      const tokenId = '0.0.123456'; // Placeholder: Este debería venir de la configuración o selección del usuario

      const response = await axios.post('/api/university/prepare-issuance', {
        tokenId,
        uniqueHash,
        ipfsURI,
        studentName: formData.studentName,
        courseName: formData.courseName,
        issueDate: formData.issueDate,
        grade: formData.grade,
      });

      setMessage('Título preparado para emisión exitosamente. Transacción ID: ' + response.data.transactionId);
      console.log('Backend Response:', response.data);

      setFormData({
        studentName: '',
        courseName: '',
        issueDate: '',
        grade: '',
      });
    } catch (err) {
      setError('Error al emitir el título: ' + (err.response?.data?.message || err.message));
      console.error('Error issuing title:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    \u003cdiv className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md"\u003e
      \u003ch2 className="text-2xl font-bold mb-6 text-gray-800"\u003eEmitir Título Individual\u003c/h2\u003e
      \u003cform onSubmit={handleSubmit}\u003e
        \u003cdiv className="mb-4"\u003e
          \u003clabel htmlFor="studentName" className="block text-gray-700 text-sm font-bold mb-2"\u003e
            Nombre del Estudiante:
          \u003c/label\u003e
          \u003cinput
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          /\u003e
        \u003c/div\u003e
        \u003cdiv className="mb-4"\u003e
          \u003clabel htmlFor="courseName" className="block text-gray-700 text-sm font-bold mb-2"\u003e
            Nombre del Curso/Título:
          \u003c/label\u003e
          \u003cinput
            type="text"
            id="courseName"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          /\u003e
        \u003c/div\u003e
        \u003cdiv className="mb-4"\u003e
          \u003clabel htmlFor="issueDate" className="block text-gray-700 text-sm font-bold mb-2"\u003e
            Fecha de Emisión:
          \u003c/label\u003e
          \u003cinput
            type="date"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          /\u003e
        \u003c/div\u003e
        \u003cdiv className="mb-6"\u003e
          \u003clabel htmlFor="grade" className="block text-gray-700 text-sm font-bold mb-2"\u003e
            Calificación/Nota:
          \u003c/label\u003e
          \u003cinput
            type="text"
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          /\u003e
        \u003c/div\u003e
        \u003cdiv className="flex items-center justify-between"\u003e
          \u003cbutton
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          \u003e
            {isLoading ? 'Emitiendo...' : 'Emitir Título'}
          \u003c/button\u003e
        \u003c/div\u003e
        {isLoading \u0026\u0026 \u003cp className="mt-4 text-sm text-blue-600"\u003eCargando...\u003c/p\u003e}
        {error \u0026\u0026 \u003cp className="mt-4 text-sm text-red-600"\u003eError: {error}\u003c/p\u003e}
        {message \u0026\u0026 \u003cp className="mt-4 text-sm text-green-600"\u003e{message}\u003c/p\u003e}
      \u003c/form\u003e
    \u003c/div\u003e
  );
};

export default IssueTitleForm;