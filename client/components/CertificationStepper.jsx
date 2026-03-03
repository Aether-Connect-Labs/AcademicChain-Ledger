
import React from 'react';
import { CheckCircle, Loader2, Circle, PenTool, Database, Rocket } from 'lucide-react';

const defaultSteps = [
  { id: 1, label: 'DISEÑO', desc: 'Selecciona o edita tu plantilla', icon: PenTool },
  { id: 2, label: 'DATOS', desc: 'Carga individual o masiva', icon: Database },
  { id: 3, label: 'EMISIÓN', desc: 'Confirmación y anclaje Blockchain', icon: Rocket }
];

const CertificationStepper = ({ currentStep = 1, transactionId = null, steps = defaultSteps }) => {
  return (
    <div className="w-full max-w-5xl mx-auto py-6 mb-6">
      <div className="flex flex-col md:flex-row items-start justify-between relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-6 left-0 w-full h-1 bg-slate-800 -z-10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-1000 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;
          const Icon = step.icon || Circle;

          return (
            <div key={step.id} className="flex flex-row md:flex-col items-center md:items-center w-full md:w-1/3 mb-4 md:mb-0 relative group">
              {/* Icon Container */}
              <div className={`
                flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-500 z-10 shrink-0 bg-[#0f172a]
                ${isCompleted ? 'border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}
                ${isCurrent ? 'border-purple-500 text-purple-400 animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]' : ''}
                ${isPending ? 'border-slate-700 text-slate-600' : ''}
              `}>
                {isCompleted ? <CheckCircle size={28} /> : isCurrent ? <Icon size={28} /> : <Icon size={28} />}
              </div>

              {/* Text Content */}
              <div className="ml-4 md:ml-0 md:mt-3 md:text-center w-full">
                <h3 className={`font-bold text-sm tracking-wider uppercase transition-colors ${isPending ? 'text-slate-600' : 'text-white'}`}>
                  {step.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[150px] md:mx-auto leading-tight">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CertificationStepper;
