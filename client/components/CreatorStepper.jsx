import React from 'react';
import { CheckCircle, Loader2, Circle, PenTool, Globe, Server, QrCode } from 'lucide-react';

const steps = [
  { 
    id: 1, 
    label: 'Firma de Autor', 
    desc: 'Generando Sello ACL vinculado a tu billetera',
    icon: <PenTool size={20} />
  },
  { 
    id: 2, 
    label: 'Dispersión Multichain', 
    desc: 'Anclaje en XRPL y Algorand (Fe Pública)',
    icon: <Globe size={20} />
  },
  { 
    id: 3, 
    label: 'Notaría en Hedera', 
    desc: 'Confirmación en Topic 0.0.4576394 (Arkhia)',
    icon: <Server size={20} />
  },
  { 
    id: 4, 
    label: 'Entrega al Alumno', 
    desc: 'Liberación con QR de validación instantánea',
    icon: <QrCode size={20} />
  }
];

const CreatorStepper = ({ currentStep = 0 }) => {
  return (
    <div className="w-full py-8">
      <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start w-full">
        
        {/* Progress Bar Background (Desktop) */}
        <div className="hidden md:block absolute top-6 left-0 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
        
        {/* Active Progress Bar (Desktop) */}
        <div 
          className="hidden md:block absolute top-6 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700 ease-out -z-10 rounded-full"
          style={{ width: `${Math.min(((currentStep - 1) / (steps.length - 1)) * 100, 100)}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex flex-col items-center w-full md:w-1/4 relative group">
              
              {/* Step Circle */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10
                ${isCompleted ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : ''}
                ${isCurrent ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' : ''}
                ${isPending ? 'bg-slate-900 border-slate-700 text-slate-600' : ''}
              `}>
                {isCompleted ? <CheckCircle size={24} /> : isCurrent ? <Loader2 size={24} className="animate-spin" /> : step.icon}
              </div>

              {/* Text Info */}
              <div className="mt-4 text-center px-2">
                <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${isPending ? 'text-slate-600' : 'text-slate-200'}`}>
                  {step.label}
                </h3>
                <p className={`text-xs mt-1 transition-colors ${isPending ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.desc}
                </p>
                
                {/* Status Badge */}
                {isCurrent && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                    EN PROCESO...
                  </span>
                )}
                {isCompleted && step.id === 3 && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-900/30 border border-cyan-500/30">
                    HCS Confirmed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreatorStepper;
