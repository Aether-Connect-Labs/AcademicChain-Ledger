import React, { useState } from 'react';
import { 
  Palette, 
  Eye, 
  Settings, 
  Layers, 
  Type, 
  QrCode,
  Square
} from 'lucide-react';

const HolographicStudio = () => {
  const [orientation, setOrientation] = useState('horizontal');
  const [docType, setDocType] = useState('Certificado');
 

  return (
    <div className="flex h-screen w-full bg-[#050510] text-white font-sans overflow-hidden selection:bg-pink-500 selection:text-white">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-white/10 bg-[#0a0a16] flex flex-col backdrop-blur-xl relative z-10">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-lg shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 font-display tracking-wide shadow-neon">
              Studio
            </span>
            <span className="text-sm font-medium text-pink-500 tracking-[0.2em] uppercase glow-text">
              Holográfico
            </span>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Preview Button */}
          <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]">
            <Eye className="w-4 h-4 text-pink-400 group-hover:text-pink-300" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">Vista Previa</span>
          </button>

          {/* Page Config */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Configuración de Página</h3>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
              <button 
                onClick={() => setOrientation('horizontal')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  orientation === 'horizontal' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                Horizontal
              </button>
              <button 
                onClick={() => setOrientation('vertical')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  orientation === 'vertical' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                Vertical
              </button>
            </div>
          </div>

          {/* Doc Type */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Documento</h3>
            <div className="space-y-2">
              {['Diploma', 'Certificado', 'Constancia', 'Reconocimiento'].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-300 flex items-center justify-between group ${
                    docType === type
                      ? 'bg-purple-900/20 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{type}</span>
                  {docType === type && <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#a855f7]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Central Work Area */}
      <div className="flex-1 bg-[#050510] relative flex items-center justify-center overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
        
        {/* Canvas Container */}
        <div className="relative group">
           {/* Selection Box (Blue) */}
          <div className="absolute -inset-4 border-2 border-cyan-400 rounded-lg pointer-events-none z-20 flex flex-col justify-between">
            {/* Anchor Points */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-cyan-400 border border-black shadow-[0_0_10px_#22d3ee]" />
          </div>

          {/* Certificate Content */}
          <div className="w-[800px] h-[600px] bg-[#fdfbf7] relative shadow-2xl overflow-hidden rounded-sm">
            {/* Parchment Texture Overlay */}
            <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://img.freepik.com/free-photo/old-paper-texture_1149-1306.jpg?w=1380&t=st=1696623666~exp=1696624266~hmac=5c6a858102324978051772520633857329587425470550186523668858276063')] bg-cover bg-center pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-16 font-serif text-[#1a1a1a]">
              <div className="mb-8">
                 {/* University Logo Placeholder */}
                 <div className="w-20 h-20 mx-auto mb-4 border-2 border-[#1a1a1a] rounded-full flex items-center justify-center opacity-80">
                   <div className="w-16 h-16 border border-[#1a1a1a] rounded-full" />
                 </div>
                 <h1 className="text-2xl font-bold tracking-widest border-b-2 border-[#1a1a1a] pb-2 mb-1 uppercase">Universidad Saeko</h1>
                 <p className="text-sm tracking-[0.2em] uppercase">Campus Pachuca</p>
              </div>

              <div className="my-8 space-y-6">
                <p className="text-lg italic font-medium">Otorga a:</p>
                <h2 className="text-4xl font-bold font-serif tracking-wide text-[#0a0a0a] scale-y-110">
                  KARLA GUZMÁN BATRES
                </h2>
                <div className="w-32 h-px bg-[#1a1a1a] mx-auto opacity-50 my-4" />
                <p className="text-lg italic font-medium">El grado de:</p>
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#1a1a1a]">
                  Maestría en Ingeniería del Software
                </h3>
              </div>

              <div className="mt-12 flex justify-between w-full px-12">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-px bg-[#1a1a1a]" />
                    <p className="text-xs uppercase tracking-widest font-bold">Rectoría</p>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-px bg-[#1a1a1a]" />
                    <p className="text-xs uppercase tracking-widest font-bold">Dirección Académica</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-80 border-l border-white/10 bg-[#0a0a16] flex flex-col backdrop-blur-xl z-10">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Propiedades</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           {/* Background Color */}
           <div className="space-y-4">
             <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-gray-500 uppercase">Color de Fondo</label>
               <div className="w-6 h-6 rounded bg-[#fdfbf7] border border-white/20 shadow-sm" />
             </div>
             <input 
               type="range" 
               className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500" 
             />
           </div>

           {/* Texture Selector */}
           <div className="space-y-4">
             <label className="text-xs font-bold text-gray-500 uppercase">Textura</label>
             <div className="grid grid-cols-4 gap-2">
               <button className="aspect-square rounded-lg border-2 border-pink-500 relative overflow-hidden group">
                 <img src="https://img.freepik.com/free-photo/old-paper-texture_1149-1306.jpg?w=1380&t=st=1696623666~exp=1696624266~hmac=5c6a858102324978051772520633857329587425470550186523668858276063" className="w-full h-full object-cover" alt="Parchment" />
                 <div className="absolute inset-0 bg-pink-500/20" />
               </button>
               {[1,2,3].map(i => (
                 <button key={i} className="aspect-square rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors" />
               ))}
             </div>
           </div>

           {/* Coordinates */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase">Posición X</label>
               <div className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono">
                 114 px
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase">Posición Y</label>
               <div className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono">
                 105 px
               </div>
             </div>
           </div>

           {/* Layers */}
           <div className="space-y-4 pt-4 border-t border-white/5">
             <div className="flex items-center gap-2 mb-2">
               <Layers className="w-4 h-4 text-purple-400" />
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Capas (2)</h3>
             </div>
             <div className="space-y-2">
               <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group">
                 <Type className="w-4 h-4 text-gray-500 group-hover:text-white" />
                 <span className="text-sm text-gray-300 group-hover:text-white">T CERTIFICADO COMPLETO</span>
               </div>
               <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-center gap-3 cursor-pointer">
                 <Square className="w-4 h-4 text-purple-400" />
                 <span className="text-sm text-white font-medium">T FONDO PERSONALIZADO</span>
               </div>
             </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a16]/50">
          <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5" />
            <span>Agregar QR de Transparencia</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolographicStudio;
