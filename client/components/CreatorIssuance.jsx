import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import { issuanceService } from './services/issuanceService';
import CertificateDesigner from './CertificateDesigner';
import { sanitizeString } from './utils/security';

const CreatorIssuance = () => {
  const navigate = useNavigate();
  const [issuanceMode, setIssuanceMode] = useState('individual');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [cohortFile, setCohortFile] = useState(null);
  const [credentialType, setCredentialType] = useState('Curso');
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  // Designer State
  const [showDesigner, setShowDesigner] = useState(false);
  const [designStructure, setDesignStructure] = useState(null);
  const [designFile, setDesignFile] = useState(null);

  const [parsedStudents, setParsedStudents] = useState([]);

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          if (lines.length < 2) return resolve([]); // Empty or just header
          
          const headers = lines[0].split(',').map(h => sanitizeString(h.trim().toLowerCase()));
          const students = [];
          
          for(let i=1; i<lines.length; i++) {
            const values = lines[i].split(',').map(v => sanitizeString(v.trim()));
            if(values.length < 2) continue;
            
            const nameIdx = headers.findIndex(h => h.includes('nom') || h.includes('name'));
            const emailIdx = headers.findIndex(h => h.includes('mail') || h.includes('correo') || h.includes('email'));
            const courseIdx = headers.findIndex(h => h.includes('curs') || h.includes('titul') || h.includes('course'));
            
            const student = {
                name: nameIdx >= 0 ? values[nameIdx] : values[0],
                email: emailIdx >= 0 ? values[emailIdx] : values[1],
                course: courseIdx >= 0 ? values[courseIdx] : (values[2] || credentialType)
            };
            
            if(student.name && student.email) students.push(student);
          }
          resolve(students);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const resetForm = () => {
    setStudentName('');
    setStudentEmail('');
    setCohortFile(null);
    setParsedStudents([]);
    setCredentialType('Curso');
    setStep(1);
    setDesignFile(null);
    setDesignStructure(null);
  };

  const validateCurrentStep = async () => {
    if (issuanceMode === 'individual') {
      if (!studentName.trim() || !studentEmail.trim()) {
        setError('Completa nombre y email del alumno antes de continuar.');
        return false;
      }
      setError('');
      return true;
    }
    if (!cohortFile) {
      setError('Sube el archivo CSV o Excel del lote antes de continuar.');
      return false;
    }
    
    // Parse immediately for validation
    try {
        const students = await parseCSV(cohortFile);
        if (students.length === 0) {
            setError('El archivo CSV no contiene datos válidos o está vacío.');
            return false;
        }
        setParsedStudents(students);
    } catch (e) {
        setError('Error al leer el archivo CSV.');
        return false;
    }

    setError('');
    return true;
  };

  const handleNextStep = async () => {
    const valid = await validateCurrentStep();
    if (!valid) return;
    setStep(2);
  };

  const pushToTalentPool = (payload) => {
    try {
      const raw = localStorage.getItem('acl:talent-pool');
      const current = raw ? JSON.parse(raw) : [];
      const next = [
        {
          id: payload.id || `talent-${Date.now()}`,
          name: payload.studentName,
          role: payload.credentialType || 'Certificación',
          skills: ['Certificación Verificada', payload.credentialType].filter(Boolean),
          location: 'Remoto',
          verified: true,
          network: 'Hedera',
          txLink: payload.txId ? `https://hashscan.io/testnet/transaction/${payload.txId}` : ''
        },
        ...current
      ].slice(0, 50);
      localStorage.setItem('acl:talent-pool', JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('acl:talent-updated'));
      }
    } catch {}
  };

  const handleIssueCredential = async () => {
    if (!validateCurrentStep()) {
      setStep(1);
      return;
    }

    setIssuing(true);
    setResult(null);
    setError('');

    try {
      if (issuanceMode === 'individual') {
        let file;
        const fileName = `credential-${studentName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;

        if (designFile) {
          // Rename the file to match the generated fileName
          file = new File([designFile], fileName, { type: designFile.type });
        } else {
          const pdf = new jsPDF('p', 'pt', 'a4');
          const title = credentialType === 'Curso' ? 'Certificado de Curso' : credentialType;
          pdf.setFillColor(6, 148, 162);
          pdf.rect(0, 0, 595, 80, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(20);
          pdf.text(title, 40, 50);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(14);
          pdf.text(`Alumno: ${studentName}`, 40, 120);
          pdf.text(`Email: ${studentEmail}`, 40, 150);
          pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 40, 180);
          pdf.text('Emitido a través de AcademicChain', 40, 230);
  
          const blob = pdf.output('blob');
          file = new File([blob], fileName, { type: 'application/pdf' });
        }

        let ipfsURI = null;
        try {
          ipfsURI = await issuanceService.uploadToIPFS(file);
        } catch (e) {
          console.warn('Fallo al subir a IPFS, continuando sin enlace persistente', e);
        }

        const payload = {
          credentialType,
          studentName,
          studentEmail,
          ipfsURI,
          issuedAt: new Date().toISOString()
        };

        const res = await issuanceService.issueCreatorCredential(payload);
        const success = !!res && res.success !== false;
        const data = res && res.data ? res.data : res || {};
        const merged = { ...data, ipfsURI, pdfFileName: fileName };

        if (success) {
          pushToTalentPool({
            id: merged.id,
            studentName,
            credentialType,
            txId: merged.txId
          });
        }

        setResult({
          success,
          message: success ? '¡Credencial emitida con éxito!' : 'No se pudo emitir la credencial.',
          data: merged
        });
      } else {
        // Mass Issuance using parsedStudents
        if (!parsedStudents || parsedStudents.length === 0) {
             throw new Error('No hay estudiantes válidos para procesar.');
        }

        const batchPayload = {
             credentials: parsedStudents.map(s => ({
                 studentName: s.name,
                 studentEmail: s.email,
                 credentialType: s.course || credentialType,
                 issueDate: new Date().toISOString()
             })),
             options: {
                 addToHedera: true,
                 notifyStudents: true,
                 issuerType: 'creator'
             }
        };

        const res = await issuanceService.issueBulkCredentials(batchPayload);

        setResult({
          success: true,
          message: `¡Lote recibido! Se están procesando ${parsedStudents.length} credenciales.`,
          data: res
        });
      }
      resetForm();
    } catch (err) {
      setResult({
        success: false,
        message: 'Ocurrió un error al emitir la credencial.',
        data: { error: err.message }
      });
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden max-w-3xl mx-auto w-full">
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
            type="button"
            onClick={() => setShowDesigner(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-lg hover:shadow-purple-500/10"
        >
            <span className="text-lg">🎨</span>
            Diseñador Holográfico
        </button>
      </div>

      <div className="flex justify-center mb-8 relative z-10">
        <div className="bg-slate-950 rounded-lg p-1 flex space-x-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setIssuanceMode('individual')}
            className={`px-4 py-2 rounded-md font-bold transition-all ${issuanceMode === 'individual' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal-creadores/batch', { state: { returnUrl: '/portal-creadores' } })}
            className={`px-4 py-2 rounded-md font-bold transition-all text-slate-400 hover:bg-slate-800 hover:text-white flex items-center gap-2`}
          >
            <span>🚀</span> Masiva (Excel/CSV)
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-mono text-slate-400">
            Paso {step} de 2 • {issuanceMode === 'individual' ? 'Emisión Individual' : 'Emisión Masiva'}
          </span>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
        <div>
            <AnimatePresence mode="wait">
                {issuanceMode === 'individual' ? (
                <motion.div 
                    key="individual"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {step === 1 ? (
                        <>
                            {/* Student Name */}
                            <div className="flex flex-col">
                            <label htmlFor="studentName" className="text-cyan-400 mb-2 font-semibold text-sm uppercase tracking-wider">Nombre del Alumno</label>
                            <input
                                id="studentName"
                                type="text"
                                value={studentName}
                                onChange={(e) => setStudentName(sanitizeString(e.target.value))}
                                placeholder="Ej: Ada Lovelace"
                                className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                            />
                            </div>

                            {/* Student Email */}
                            <div className="flex flex-col">
                            <label htmlFor="studentEmail" className="text-cyan-400 mb-2 font-semibold text-sm uppercase tracking-wider">Email del Alumno</label>
                            <input
                                id="studentEmail"
                                type="email"
                                value={studentEmail}
                                onChange={(e) => setStudentEmail(sanitizeString(e.target.value))}
                                placeholder="Ej: ada@example.com"
                                className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
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
                        </>
                    ) : (
                        <div className="md:col-span-2 space-y-4">
                             <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-700">
                                <h4 className="text-cyan-400 font-bold mb-2">Resumen de Emisión</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                                    <div><span className="text-slate-500">Alumno:</span> {studentName}</div>
                                    <div><span className="text-slate-500">Email:</span> {studentEmail}</div>
                                    <div><span className="text-slate-500">Tipo:</span> {credentialType}</div>
                                    <div><span className="text-slate-500">Diseño:</span> {designFile ? 'Personalizado' : 'Estándar'}</div>
                                </div>
                             </div>
                        </div>
                    )}
                </motion.div>
                ) : (
                <motion.div 
                    key="mass"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {step === 1 ? (
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
                    ) : (
                        <div className="space-y-4">
                            <h4 className="text-cyan-400 font-bold">Vista Previa del Lote ({parsedStudents.length} estudiantes)</h4>
                            <div className="max-h-60 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg">
                                <table className="w-full text-sm text-left text-slate-400">
                                    <thead className="text-xs text-slate-200 uppercase bg-slate-900 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Nombre</th>
                                            <th className="px-4 py-2">Email</th>
                                            <th className="px-4 py-2">Curso/Título</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedStudents.map((s, i) => (
                                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-900/50">
                                                <td className="px-4 py-2 text-white">{s.name}</td>
                                                <td className="px-4 py-2">{s.email}</td>
                                                <td className="px-4 py-2">{s.course}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-xs text-slate-500 text-right">
                                * Se procesarán {parsedStudents.length} credenciales en la red Hedera
                            </div>
                        </div>
                    )}
                </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-8 flex justify-between items-center">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all"
                >
                  Volver atrás
                </button>
              )}
              <div className="flex-1 flex justify-end">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={issuing}
                    className={`
                      px-8 py-3 rounded-lg font-bold text-white transition-all transform hover:-translate-y-1 shadow-lg
                      ${issuing
                        ? 'bg-slate-700 cursor-not-allowed opacity-70'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/25'
                      }
                    `}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleIssueCredential}
                    disabled={issuing}
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
                      issuanceMode === 'mass' ? 'Confirmar emisión masiva' : 'Confirmar y emitir'
                    )}
                  </button>
                )}
              </div>
            </div>
        </div>

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

      {showDesigner && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full h-full max-w-[1400px] max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col">
            <div className="absolute top-4 right-4 z-50">
                <button 
                onClick={() => setShowDesigner(false)}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                <CertificateDesigner 
                onSave={(file, structure) => {
                    setDesignFile(file);
                    setDesignStructure(structure);
                    setShowDesigner(false);
                    // Only advance if data is valid
                    if (validateCurrentStep()) {
                        setStep(2);
                    }
                }}
                onNavigate={(action) => {
                    if (action === 'continue_to_issuance') {
                        setStep(2);
                    }
                }}
                onClose={() => setShowDesigner(false)}
                initialDesign={designStructure}
                />
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
};

export default CreatorIssuance;
