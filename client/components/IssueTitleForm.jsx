import React, { useState } from 'react';
import axios from 'axios';

const IssueTitleForm = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    issueDate: '',
    grade: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const uniqueHash = `hash-${Date.now()}`;
      const ipfsURI = `ipfs://QmVg...`;
      const tokenId = '0.0.123456';

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_BASE_URL}/api/universities/prepare-issuance`, {
        tokenId,
        uniqueHash,
        ipfsURI,
        studentName: formData.studentName,
        courseName: formData.courseName,
        issueDate: formData.issueDate,
        grade: formData.grade,
      });

      setMessage('Título preparado para emisión exitosamente. Transacción ID: ' + response.data.transactionId);
      setFormData({ studentName: '', courseName: '', issueDate: '', grade: '' });
    } catch (err) {
      setError('Error al emitir el título: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Emitir Título Individual</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="studentName" className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del Estudiante:
          </label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            value={formData.studentName}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="courseName" className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del Curso/Título:
          </label>
          <input
            type="text"
            id="courseName"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="issueDate" className="block text-gray-700 text-sm font-bold mb-2">
            Fecha de Emisión:
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="grade" className="block text-gray-700 text-sm font-bold mb-2">
            Calificación/Nota:
          </label>
          <input
            type="text"
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Emitiendo...' : 'Emitir Título'}
          </button>
        </div>
        {isLoading && <p className="mt-4 text-sm text-blue-600">Cargando...</p>}
        {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
};

export default IssueTitleForm;