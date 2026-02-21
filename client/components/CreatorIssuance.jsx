import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CreatorIssuance = () => {
  const navigate = useNavigate();
  const [issuanceMode, setIssuanceMode] = useState('individual'); // 'individual', 'mass'
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [cohortFile, setCohortFile] = useState(null);
  const [credentialType, setCredentialType] = useState('Curso');
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState(null);

  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setIssuing(true);
    setResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Response
    const mockData = {
      id: `cert_${Math.random().toString(36).substr(2, 9)}`,
      txId: `0x${Math.random().toString(16).substr(2, 40)}`,
      status: 'success',
      issuedAt: new Date().toISOString(),
      student: issuanceMode === 'individual' ? studentName : 'Lote de 50 Estudiantes (Simulado)'
    };

    setResult({ 
      success: true, 
      message: `¡${issuanceMode === 'individual' ? 'Credencial emitida' : 'Lote de credenciales procesado'} con éxito! (Simulación)`, 
      data: mockData 
    });

    setIssuing(false);
    
    // Clear form partially
    setStudentName('');
    setStudentEmail('');
    setCohortFile(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10 gap-4">
        <div>
            <h3 className="text-xl font-bold text-white mb-2">
                ✨ Emitir Nueva Credencial (EliteProof)
            </h3>
            <p className="text-slate-400 text-sm">
                Completa los datos para certificar a un nuevo alumno.
            </p>
        </div>
        <button 
            onClick={() => navigate('/portal-creadores/designer')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-lg hover:shadow-purple-500/10"
        >
            <span className="text-lg">🎨</span>
            Diseñador Holográfico
        </button>
      </div>

      {/* Issuance Mode Toggle */}
      <div className="flex justify-center mb-8 relative z-10">
        <div className="bg-slate-950 rounded-lg p-1 flex space-x-1 border border-slate-800">
          <button
            onClick={() => setIssuanceMode('individual')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${issuanceMode === 'individual' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            Individual
          </button>
          <button
            onClick={() => setIssuanceMode('mass')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${issuanceMode === 'mass' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            Masiva (CSV)
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <form onSubmit={handleIssueCredential}>
            <AnimatePresence mode="wait">
                {issuanceMode === 'individual' ? (
                <motion.div 
                    key="individual"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* Student Name */}
                    <div className="flex flex-col">
                    <label htmlFor="studentName" className="text-cyan-400 mb-2 font-semibold text-sm uppercase tracking-wider">Nombre del Alumno</label>
                    <input
                        id="studentName"
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ej: Ada Lovelace"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        required
                    />
                    </div>

                    {/* Student Email */}
                    <div className="flex flex-col">
                    <label htmlFor="studentEmail" className="text-cyan-400 mb-2 font-semibold text-sm uppercase tracking-wider">Email del Alumno</label>
                    <input
                        id="studentEmail"
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="Ej: ada@example.com"
                        className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        required
                    />
                    </div>

                        {/* Credential Type */}
                        <div className="flex flex-col md:col-span-2">
                        <label htmlFor="credentialType" className="text-cyan-400 mb-2 font-semibold text-sm uppercase tracking-wider">Tipo de Credencial</label>
                        <select
                            id="credentialType"
                            value={credentialType}
                            onChange={(e) => setCredentialType(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all appearance-none"
                        >
                            <option value="Curso">Certificado de Curso</option>
                            <option value="Taller">Constancia de Taller</option>
                            <option value="Bootcamp">Diploma de Bootcamp</option>
                            <option value="Mentoria">Acreditación de Mentoría</option>
                        </select>
                    </div>
                </motion.div>
                ) : (
                <motion.div 
                    key="mass"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors bg-slate-950/50">
                        <div className="text-4xl mb-4">📂</div>
                        <h4 className="text-lg font-semibold text-white mb-2">Sube tu archivo CSV</h4>
                        <p className="text-slate-400 text-sm mb-6">
                            Arrastra tu archivo aquí o haz clic para seleccionar. El formato debe incluir columnas: Nombre, Email, Curso.
                        </p>
                        <input 
                            type="file" 
                            id="csvUpload" 
                            className="hidden" 
                            onChange={(e) => setCohortFile(e.target.files[0])}
                            accept=".csv,.xlsx"
                        />
                        <label 
                            htmlFor="csvUpload"
                            className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-cyan-400 px-6 py-2 rounded-lg font-bold transition-colors inline-block"
                        >
                            Seleccionar Archivo
                        </label>
                        {cohortFile && (
                            <div className="mt-4 text-green-400 font-mono text-sm">
                                ✓ {cohortFile.name} seleccionado
                            </div>
                        )}
                    </div>
                </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
                <button
                    type="submit"
                    disabled={issuing || (issuanceMode === 'mass' && !cohortFile)}
                    className={`
                        px-8 py-3 rounded-lg font-bold text-white transition-all transform hover:-translate-y-1 shadow-lg
                        ${issuing 
                            ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/25'
                        }
                    `}
                >
                    {issuing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Procesando...
                        </span>
                    ) : (
                        issuanceMode === 'mass' ? 'Procesar Lote Masivo' : 'Emitir Credencial'
                    )}
                </button>
            </div>
        </form>

        {/* Success Message */}
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-500 text-black rounded-full p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="font-bold text-lg">¡Emisión Exitosa!</span>
                    </div>
                    <p className="text-slate-300 mb-2">{result.message}</p>
                    <div className="bg-black/50 p-3 rounded font-mono text-xs text-slate-400 break-all">
                        TX ID: {result.data.txId}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorIssuance;
