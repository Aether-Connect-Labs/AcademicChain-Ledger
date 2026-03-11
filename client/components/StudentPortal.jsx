import React from 'react';
import { Link } from 'react-router-dom';
import StudentCredentials from './StudentCredentials.jsx';
import CredentialVerifier from './credentials/CredentialVerifier.jsx';
import { Calendar, Shield, Camera } from 'lucide-react';

const StudentPortal = ({ demo = false }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Portal del <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Alumno</span>
            </h1>
            <p className="text-slate-400">Gestiona y verifica tus credenciales académicas</p>
          </div>
          
          <div className="flex items-center gap-3">
            {demo && (
              <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Vista Demo
              </div>
            )}
            <Link 
              to="/agenda" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-900/20"
            >
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              <span>Agendar Asesoría</span>
            </Link>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="space-y-8">
          <section>
            <StudentCredentials demo={demo} />
          </section>

          {/* Verification Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl blur-3xl -z-10" />
            <div className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Camera className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Verificar con Cámara</h2>
                  <p className="text-slate-400 text-sm">Escanea un código QR para validar una credencial en tiempo real</p>
                </div>
              </div>
              
              <CredentialVerifier />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
