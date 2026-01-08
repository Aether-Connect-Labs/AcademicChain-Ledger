import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import IssueTitleForm from './IssueTitleForm.jsx';

const CreateCredentialsPage = () => {
  return (
    <div className="container-responsive pb-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 gradient-text">Crear Credenciales</h1>
      <p className="text-gray-600">Elige el tipo de credencial a emitir o usa la carga masiva.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 flex flex-col">
          <div className="text-3xl mb-3">🎓</div>
          <div className="font-semibold text-lg mb-1">Emitir Título</div>
          <p className="text-sm text-gray-600 mb-4">Emite títulos académicos con metadatos verificables.</p>
          <Link to="/institution/emitir/titulo" className="btn-primary mt-auto">Continuar</Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 flex flex-col">
          <div className="text-3xl mb-3">📜</div>
          <div className="font-semibold text-lg mb-1">Emitir Certificado</div>
          <p className="text-sm text-gray-600 mb-4">Certificados de cursos, capacitaciones y logros.</p>
          <Link to="/institution/emitir/certificado" className="btn-primary mt-auto">Continuar</Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 flex flex-col">
          <div className="text-3xl mb-3">🏅</div>
          <div className="font-semibold text-lg mb-1">Emitir Diploma</div>
          <p className="text-sm text-gray-600 mb-4">Diplomas y reconocimientos oficiales.</p>
          <Link to="/institution/emitir/diploma" className="btn-primary mt-auto">Continuar</Link>
        </div>
    </div>

    <div className="mt-10">
      <div className="rounded-xl border border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900">¿Necesitas emitir muchas credenciales?</div>
            <div className="text-sm text-gray-600">Usa la carga masiva con archivo CSV y seguimiento de progreso.</div>
          </div>
          <Link to="/institution/emitir/masivo" className="btn-secondary">Cargar en Lote</Link>
        </div>
      </div>
    </div>

    <QuickIssueSection />
  </div>
  );
};

const QuickIssueSection = () => {
  const [variant, setVariant] = useState('degree');
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Emisión Rápida</h2>
      <p className="text-gray-600 mb-4">Completa los datos básicos y emite una credencial sin salir de esta página.</p>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-sm text-gray-600">Tipo</div>
        <select value={variant} onChange={(e) => setVariant(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="degree">Título</option>
          <option value="certificate">Certificado</option>
          <option value="diploma">Diploma</option>
        </select>
      </div>
      <IssueTitleForm variant={variant} />
    </div>
  );
};

export default CreateCredentialsPage;
