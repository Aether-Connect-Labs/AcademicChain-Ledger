import React from 'react';
import { Link } from 'react-router-dom';
import StudentCredentials from './StudentCredentials.jsx';
import CredentialVerifier from './credentials/CredentialVerifier.jsx';

const StudentPortal = ({ demo = false }) => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Portal del Alumno</h1>
      {demo && (<div className="badge badge-info mb-4">Vista demo</div>)}
      <StudentCredentials demo={demo} />
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Verificar con Cámara</h2>
        <CredentialVerifier />
      </div>
      <div className="mt-6">
        <Link to="/agenda" className="btn-primary">Agendar Asesoría</Link>
      </div>
    </div>
  );
};

export default StudentPortal;
