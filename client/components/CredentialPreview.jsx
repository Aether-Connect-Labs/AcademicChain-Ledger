import React from 'react';
import { User, Award, Calendar } from 'lucide-react';

const CredentialPreview = ({ credential, index }) => {
  if (!credential) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg shadow-black/20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
              <User size={16} />
            </div>
            <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">
              {credential.subject?.name || 'Nombre del Estudiante'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 mb-3 pl-1">
            <Award size={14} className="text-slate-500" />
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
              {credential.subject?.degree || 'Título Académico'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pl-1">
             <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               ID: {credential.subject?.id || 'N/A'}
             </div>
             {credential.issuanceDate && (
               <div className="flex items-center gap-1.5">
                 <Calendar size={12} />
                 {new Date(credential.issuanceDate).toLocaleDateString()}
               </div>
             )}
          </div>
        </div>

        {typeof index !== 'undefined' && (
          <div className="text-xs font-mono font-bold text-slate-600 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            #{String(index + 1).padStart(3, '0')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialPreview;
