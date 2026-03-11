import React from 'react';
import { Check } from 'lucide-react';

const ProgressTracker = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-600 to-blue-600 -z-10 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isPending = currentStep < step.number;

          return (
            <div key={step.number} className="flex flex-col items-center relative group">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                  isCompleted 
                    ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-110' 
                    : isCurrent 
                      ? 'bg-slate-900 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20 scale-125 ring-4 ring-cyan-500/20' 
                      : 'bg-slate-900 border-slate-700 text-slate-500 group-hover:border-slate-600'
                }`}
              >
                {isCompleted ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <span className={`text-sm font-bold ${isCurrent ? 'animate-pulse' : ''}`}>{step.number}</span>
                )}
              </div>
              <div className={`absolute top-14 w-32 text-center transition-all duration-300 ${
                isCurrent ? 'opacity-100 transform translate-y-0' : 'opacity-70 group-hover:opacity-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                  isCurrent ? 'text-cyan-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;
