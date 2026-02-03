import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // v6 import style
import { Toaster, toast } from 'react-hot-toast';

const CertificateDesigner = ({ onClose, onSave }) => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [text, setText] = useState('Nuevo Texto');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });
      setFabricCanvas(canvas);

      // Add selection event listener
      canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
      canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
      canvas.on('selection:cleared', () => setSelectedObject(null));

      return () => {
        canvas.dispose();
      };
    }
  }, [canvasRef]); // Removed fabricCanvas from dependency to avoid loop

  const addText = (initialText = text) => {
    if (!fabricCanvas) return;
    const textObj = new fabric.IText(initialText, {
      left: 100,
      top: 100,
      fill: color,
      fontSize: fontSize,
      fontFamily: 'Arial',
    });
    
    // Check if it's a smart placeholder
    if (initialText.startsWith('{{') && initialText.endsWith('}}')) {
       textObj.set({
           fill: '#2563eb', // Blue for smart fields
           fontStyle: 'italic'
       });
    }

    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
  };

  const addSmartField = (field) => {
      addText(field);
  };

  const analyzeImageAndApplyPalette = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    const imageObj = objects.find(o => o.type === 'image');
    
    if (imageObj) {
        // Mock AI Palette extraction (In real app, analyze pixel data)
        // For now, we generate a professional academic palette
        const palettes = [
            ['#1e3a8a', '#1e40af', '#60a5fa'], // Blue Academic
            ['#064e3b', '#065f46', '#34d399'], // Green Ivy
            ['#7f1d1d', '#991b1b', '#f87171']  // Red Prestige
        ];
        const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
        
        toast.success('🎨 IA: Paleta detectada y aplicada');
        
        // Apply to existing text objects
        const textObjects = objects.filter(o => o.type === 'i-text' || o.type === 'text');
        textObjects.forEach((obj, index) => {
            obj.set({ fill: randomPalette[index % randomPalette.length] });
        });
        fabricCanvas.requestRenderAll();
    } else {
        toast.error('Sube un logo o imagen primero para que la IA analice.');
    }
  };

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new fabric.Rect({
      left: 200,
      top: 200,
      fill: color,
      width: 100,
      height: 100,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data).then((img) => {
        img.scaleToWidth(200);
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
    });
    // Convert DataURL to Blob
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "certificate-design.png", { type: "image/png" });
        if (onSave) {
            onSave(file);
        } else {
            // Download fallback
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'certificate-design.png';
            link.click();
        }
        toast.success('Diseño exportado correctamente');
      });
  };

  // Update selected object properties
  useEffect(() => {
    if (selectedObject && fabricCanvas) {
      if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
        selectedObject.set({ fill: color, fontSize: parseInt(fontSize) });
      } else {
        selectedObject.set({ fill: color });
      }
      fabricCanvas.requestRenderAll();
    }
  }, [color, fontSize]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl flex overflow-hidden shadow-2xl">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Diseñador</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Texto</label>
            <div className="flex gap-2">
              <input 
                className="input-primary text-sm flex-1" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
              />
              <button className="btn-secondary px-3" onClick={() => addText(text)}>+</button>
            </div>
          </div>

          {/* Smart Fields Section */}
          <div className="space-y-2">
             <label className="text-xs font-semibold text-blue-600 uppercase flex items-center gap-1">
                ⚡ Datos Dinámicos (Web3)
             </label>
             <div className="grid grid-cols-2 gap-2">
                 <button className="btn-xs border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => addSmartField('{{STUDENT_NAME}}')}>Nombre</button>
                 <button className="btn-xs border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => addSmartField('{{DEGREE}}')}>Título</button>
                 <button className="btn-xs border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => addSmartField('{{ISSUE_DATE}}')}>Fecha</button>
                 <button className="btn-xs border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => addSmartField('{{TX_HASH}}')}>TxHash</button>
                 <button className="btn-xs border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => addSmartField('{{IPFS_CID}}')}>IPFS CID</button>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-purple-600 uppercase">Plantillas Modernas (Web3)</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-xs bg-gray-900 text-white" onClick={() => {
                  if(!fabricCanvas) return;
                  fabricCanvas.clear();
                  fabricCanvas.backgroundColor = '#f3f4f6';
                  addText('{{STUDENT_NAME}}');
                  // Mock minimal layout
                  toast.success('Plantilla Minimalista aplicada');
              }}>Minimal</button>
              <button className="btn-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white" onClick={() => {
                  if(!fabricCanvas) return;
                  fabricCanvas.clear();
                  fabricCanvas.backgroundColor = '#ffffff';
                  // Add border
                  const rect = new fabric.Rect({ left: 20, top: 20, width: 760, height: 560, fill: 'transparent', stroke: 'purple', strokeWidth: 5 });
                  fabricCanvas.add(rect);
                  addText('{{STUDENT_NAME}}');
                  toast.success('Plantilla Blockchain aplicada');
              }}>Blockchain</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Formas</label>
            <button className="btn-outline w-full text-left" onClick={addRect}>🟦 Rectángulo</button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Imagen & IA</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            <button 
                className="w-full mt-2 py-1 px-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded shadow-sm hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-1"
                onClick={analyzeImageAndApplyPalette}
            >
                ✨ Generar Paleta (IA)
            </button>
          </div>

          <hr className="border-gray-300" />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">Propiedades</label>
            <div className="flex items-center gap-2">
              <span className="text-sm w-12">Color:</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full rounded cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-12">Size:</span>
              <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="input-primary h-8 w-full" />
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <button className="btn-primary w-full bg-red-600 hover:bg-red-700 text-white" onClick={deleteSelected} disabled={!selectedObject}>
              Eliminar Selección
            </button>
            <button className="btn-primary w-full" onClick={handleExport}>
              Guardar Diseño
            </button>
            <button className="btn-secondary w-full" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-auto">
          <div className="shadow-lg">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default CertificateDesigner;
