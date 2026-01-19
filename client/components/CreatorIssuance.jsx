import React, { useState } from 'react';
import { issuanceService } from './services/issuanceService';

const CreatorIssuance = () => {
  const [issuanceMode, setIssuanceMode] = useState('individual'); // 'individual' or 'cohort'
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [cohortData, setCohortData] = useState('');
  const [credentialType, setCredentialType] = useState('Curso');
  const [courseName, setCourseName] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState(null);

  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setIssuing(true);
    setResult(null);

    const commonData = {
      credentialType: `${credentialType}: ${courseName}`,
      courseName,
    };

    try {
      let response;
      if (issuanceMode === 'individual') {
        response = await issuanceService.issueCreatorCredential({
          ...commonData,
          studentName,
          studentEmail,
        });
      } else {
        const students = cohortData.split('\n').map(line => {
          const [name, email] = line.split(',');
          return { studentName: name.trim(), studentEmail: email.trim() };
        }).filter(s => s.studentName && s.studentEmail);

        // For now, we'll use a bulk endpoint if available, or loop.
        // Let's assume a bulk endpoint for creators is desired.
        response = await issuanceService.issueCreatorCredential({
          ...commonData,
          students,
        });
      }

      if (response.success) {
        setResult({ success: true, message: `¡${issuanceMode === 'individual' ? 'Credencial emitida' : 'Lote de credenciales procesado'} con éxito!`, data: response.data });
        // Clear form
        setStudentName('');
        setStudentEmail('');
        setCohortData('');
      } else {
        setResult({ success: false, message: response.message || 'Error al emitir.' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Hubo un error en la conexión.' });
      console.error('Error issuing credential:', error);
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-yellow-500 rounded-xl p-6">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">
        ✨ Emitir Nueva Credencial (EliteProof)
      </h3>
      <p className="text-gray-400 mb-6">
        Completa los datos para certificar a un nuevo alumno. La credencial se generará con tu firma de mentor verificado.
      </p>

      {/* Issuance Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-black rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setIssuanceMode('individual')}
            className={`px-4 py-2 rounded-md font-bold transition-colors ${issuanceMode === 'individual' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Individual
          </button>
          <button
            onClick={() => setIssuanceMode('cohort')}
            className={`px-4 py-2 rounded-md font-bold transition-colors ${issuanceMode === 'cohort' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            Cohorte (Beta)
          </button>
        </div>
      </div>

      <form onSubmit={handleIssueCredential}>
        {issuanceMode === 'individual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Name */}
            <div className="flex flex-col">
              <label htmlFor="studentName" className="text-yellow-400 mb-2 font-semibold">Nombre del Alumno</label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ej: Ada Lovelace"
                className="bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-0"
                required
              />
            </div>

            {/* Student Email */}
            <div className="flex flex-col">
              <label htmlFor="studentEmail" className="text-yellow-400 mb-2 font-semibold">Email del Alumno</label>
              <input
                id="studentEmail"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="Ej: ada@example.com"
                className="bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-0"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="cohortData" className="text-yellow-400 mb-2 font-semibold">Lista de Alumnos (Nombre,Email)</label>
            <textarea
              id="cohortData"
              value={cohortData}
              onChange={(e) => setCohortData(e.target.value)}
              placeholder="Ada Lovelace,ada@example.com&#10;Grace Hopper,grace@example.com"
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-0"
              rows="5"
              required
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">Un alumno por línea, separando nombre y email con una coma.</p>
          </div>
        )}

        <hr className="my-6 border-gray-700" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credential Type */}
          <div className="flex flex-col">
            <label htmlFor="credentialType" className="text-yellow-400 mb-2 font-semibold">Tipo de Certificación</label>
            <select
              id="credentialType"
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              className="bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-0"
            >
              <option>Curso</option>
              <option>Taller</option>
              <option>Bootcamp</option>
              <option>Mentoría</option>
            </select>
          </div>

          {/* Course Name */}
          <div className="flex flex-col">
            <label htmlFor="courseName" className="text-yellow-400 mb-2 font-semibold">Nombre del Curso/Taller</label>
            <input
              id="courseName"
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ej: Blockchain para Desarrolladores"
              className="bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:ring-0"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            type="submit"
            disabled={issuing}
            className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-600"
          >
            {issuing ? 'Emitiendo...' : 'Generar Certificado'}
          </button>
        </div>
      </form>

      {/* Result Message */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          <div className="text-center font-bold">{result.message}</div>
          {result.success && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-black/40 rounded-lg p-3">
                <div className="font-semibold">ID de Emisión</div>
                <div className="font-mono break-all">{result.data?.id || 'N/A'}</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3">
                <div className="font-semibold">TxID</div>
                <div className="font-mono break-all">{result.data?.txId || 'N/A'}</div>
              </div>
              <div className="bg-black/40 rounded-lg p-3 md:col-span-2">
                <div className="font-semibold">Detalle</div>
                <pre className="mt-2 text-xs whitespace-pre-wrap break-words">{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorIssuance;
