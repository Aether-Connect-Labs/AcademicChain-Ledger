import React from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorHolographicDesigner from './CreatorHolographicDesigner';

const CreatorDesignerPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/portal-creadores');
  };

  const handleSave = (designData) => {
    console.log("Design saved in separate page:", designData);
    navigate('/portal-creadores', { 
        state: { 
            message: "¡Diseño guardado exitosamente!", 
            type: "success" 
        } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
       {/* Simulation Banner */}
       <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex justify-between items-center px-4 py-2 shadow-lg z-50 relative">
        <span className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          Modo Diseñador • EliteProof Studio
        </span>
        <button 
            onClick={handleClose}
            className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all"
        >
          Volver al Dashboard
        </button>
      </div>

      <div className="flex-grow relative overflow-hidden">
        <CreatorHolographicDesigner 
            onClose={handleClose}
            onSave={handleSave}
            onNavigate={(path) => navigate(path)}
        />
      </div>
    </div>
  );
};

export default CreatorDesignerPage;
