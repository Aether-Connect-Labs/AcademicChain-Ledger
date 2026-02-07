import React, { useEffect, useRef, useState } from 'react';
import { Canvas, IText, Rect, Shadow, Image as FabricImage } from 'fabric';
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trash2, FileText, Upload, LayoutTemplate, Type, FileUp, Layers, Move, Maximize, Minimize, ChevronUp, ChevronDown, Lock, Unlock, Eye, EyeOff, BringToFront, SendToBack, Grid, Image as ImageIcon, Eraser, MousePointer2, PenTool, Stamp } from 'lucide-react';
import n8nService from './services/n8nService';
import { mockCredentials, templates } from '../utils/mockData';

const CreatorHolographicDesigner = ({ onClose, onSave, onNavigate, data = {} }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [pageSize, setPageSize] = useState('Landscape');
  const [selectedObject, setSelectedObject] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [text, setText] = useState('Nuevo Texto');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);

  /* Search & Template State */
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [customTemplates, setCustomTemplates] = useState([]);
  const [docType, setDocType] = useState('Certificado');
  const [signatures, setSignatures] = useState([]);
  const [, setForceUpdate] = useState(0); // For real-time property updates

  /* Layer State */
  const [layers, setLayers] = useState([]);

  const updateLayers = () => {
    if (fabricCanvas) {
      const objects = fabricCanvas.getObjects();
      // Reverse to show top layer first in list
      setLayers([...objects].reverse());
      setForceUpdate(prev => prev + 1);
    }
  };

  const getLayerName = (obj) => {
    if (obj.data?.name) return obj.data.name;
    if (obj.data?.isBackground) return 'Fondo del Documento';
    if (obj.data?.isQR) return 'QR de Verificación';
    if (obj.data?.dataType === 'competence') return `🧠 Comp: ${obj.text?.substring(0, 10)}...`;
    if (obj.data?.dataType === 'project') return `🚀 Proj: ${obj.text?.substring(0, 10)}...`;
    if (obj.text) return obj.text.length > 20 ? obj.text.substring(0, 20) + '...' : obj.text;
    if (obj.type === 'image') return 'Imagen / Logo';
    if (obj.type === 'rect') return 'Forma (Rectángulo)';
    return `Elemento ${obj.type}`;
  };

  const handleLayerAction = (action, obj) => {
    if (!fabricCanvas || !obj) return;
    
    switch(action) {
      case 'bringToFront':
        obj.bringToFront();
        break;
      case 'sendToBack':
        if (obj.data?.isBackground) {
             obj.sendToBack(); // Background always back
        } else {
             obj.sendToBack();
             // Ensure background stays at 0 if it exists
             const bg = fabricCanvas.getObjects().find(o => o.data?.isBackground);
             if (bg) bg.sendToBack();
        }
        break;
      case 'bringForward':
        obj.bringForward();
        break;
      case 'sendBackward':
        obj.sendBackward();
        // Ensure background stays at bottom
        const bg = fabricCanvas.getObjects().find(o => o.data?.isBackground);
        if (bg) bg.sendToBack();
        break;
      case 'delete':
        if (obj.data?.isBackground) {
            if (confirm("¿Estás seguro de eliminar el fondo?")) {
                fabricCanvas.remove(obj);
            }
        } else {
            fabricCanvas.remove(obj);
        }
        break;
      case 'lock':
        const isLocked = !obj.lockMovementX;
        obj.set({
            lockMovementX: isLocked,
            lockMovementY: isLocked,
            lockScalingX: isLocked,
            lockScalingY: isLocked,
            lockRotation: isLocked
        });
        toast(isLocked ? 'Capa bloqueada' : 'Capa desbloqueada', { icon: isLocked ? '🔒' : '🔓' });
        break;
    }
    fabricCanvas.requestRenderAll();
    updateLayers();
  };

  const updateObjectProperty = (prop, value) => {
    if (!fabricCanvas || !selectedObject) return;
    
    if (prop === 'scale') {
        let val = parseFloat(value);
        if (selectedObject.data?.isQR && val < 0.5) {
            val = 0.5;
            toast('Escala mínima del QR bloqueada para legibilidad', { icon: '🛡️' });
        }
        selectedObject.scale(val);
    } else if (prop === 'width') {
        if (selectedObject.type === 'image') {
            selectedObject.scaleToWidth(parseFloat(value));
        } else {
            selectedObject.set('width', parseFloat(value));
        }
    } else if (prop === 'height') {
        if (selectedObject.type === 'image') {
            selectedObject.scaleToHeight(parseFloat(value));
        } else {
            selectedObject.set('height', parseFloat(value));
        }
    } else {
        selectedObject.set(prop, value);
    }
    
    selectedObject.setCoords();
    fabricCanvas.requestRenderAll();
    updateLayers();
  };

  /* Canva Integration State */
  const [canvaUrl, setCanvaUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCanvaInput, setShowCanvaInput] = useState(false);

  const handleCanvaImport = async () => {
    if (!canvaUrl) {
        toast.error('Por favor ingresa un enlace de Canva');
        return;
    }
    setIsProcessing(true);
    const result = await n8nService.processCanvaDesign(canvaUrl);
    setIsProcessing(false);
    
    if (result.success && result.imageUrl) {
        FabricImage.fromURL(result.imageUrl, { crossOrigin: 'anonymous' }).then(img => {
            const scale = Math.max(fabricCanvas.width / img.width, fabricCanvas.height / img.height);
            img.set({
               originX: 'center', 
               originY: 'center',
               scaleX: scale,
               scaleY: scale,
               top: fabricCanvas.height / 2,
               left: fabricCanvas.width / 2,
               data: { isBackground: true, name: 'Fondo Importado' },
               selectable: false,
               evented: false
           });
           const oldBg = fabricCanvas.getObjects().find(o => o.data?.isBackground);
           if (oldBg) fabricCanvas.remove(oldBg);

           fabricCanvas.add(img);
           img.sendToBack();
           fabricCanvas.requestRenderAll();
           updateLayers();
           toast.success('Diseño de Canva importado exitosamente');
           setShowCanvaInput(false);
           setCanvaUrl('');
        });
    } else if (result.mockUrl) {
         FabricImage.fromURL(result.mockUrl, { crossOrigin: 'anonymous' }).then(img => {
            const scale = Math.max(fabricCanvas.width / img.width, fabricCanvas.height / img.height);
            img.set({
                originX: 'center', 
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
                top: fabricCanvas.height / 2,
                left: fabricCanvas.width / 2,
                data: { isBackground: true, name: 'Fondo Demo' },
                selectable: false,
                evented: false
            });
            const oldBg = fabricCanvas.getObjects().find(o => o.data?.isBackground);
            if (oldBg) fabricCanvas.remove(oldBg);

            fabricCanvas.add(img);
            img.sendToBack();
            fabricCanvas.requestRenderAll();
            updateLayers();
            toast('Modo Demo: Diseño de ejemplo cargado', { icon: 'ℹ️' });
            setShowCanvaInput(false);
         });
    } else {
        toast.error(result.message || 'Error al importar');
    }
  };

  useEffect(() => {
      const saved = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      setCustomTemplates(saved);
  }, []);

  // Load Default if empty
  useEffect(() => {
      if (fabricCanvas && !data?.designStructure) {
          if (fabricCanvas.getObjects().length === 0) {
              loadTemplate(templates[0].id);
              toast('Plantilla predeterminada cargada', { icon: 'ℹ️' });
          }
      }
  }, [fabricCanvas]);

  useEffect(() => {
    if (fabricCanvas) {
      const update = () => {
        const objects = fabricCanvas.getObjects();
        setLayers([...objects].reverse());
      };

      fabricCanvas.on('object:added', update);
      fabricCanvas.on('object:removed', update);
      fabricCanvas.on('object:modified', update);
      fabricCanvas.on('selection:updated', update);
      
      const realtimeUpdate = () => setForceUpdate(prev => prev + 1);
      fabricCanvas.on('object:moving', realtimeUpdate);
      fabricCanvas.on('object:scaling', realtimeUpdate);
      fabricCanvas.on('object:rotating', realtimeUpdate);
      fabricCanvas.on('object:skewing', realtimeUpdate);

      update();

      return () => {
        fabricCanvas.off('object:added', update);
        fabricCanvas.off('object:removed', update);
        fabricCanvas.off('object:modified', update);
        fabricCanvas.off('selection:updated', update);
        
        fabricCanvas.off('object:moving', realtimeUpdate);
        fabricCanvas.off('object:scaling', realtimeUpdate);
        fabricCanvas.off('object:rotating', realtimeUpdate);
        fabricCanvas.off('object:skewing', realtimeUpdate);
      };
    }
  }, [fabricCanvas]);

  /* Preview Mode State */
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const togglePreviewMode = () => {
    if (!fabricCanvas) return;

    const newMode = !isPreviewMode;
    setIsPreviewMode(newMode);

    if (newMode) {
      // Enter Preview
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      
      const objects = fabricCanvas.getObjects();
      objects.forEach(obj => {
        obj.selectable = false;
        obj.evented = false;

        if (obj.type === 'i-text' || obj.type === 'text') {
           if (obj.text.includes('{{nombre_alumno}}')) {
               obj.data = { ...obj.data, originalText: obj.text };
               obj.text = 'JUAN PÉREZ';
           } else if (obj.text.includes('{{nombre_institucion}}')) {
               obj.data = { ...obj.data, originalText: obj.text };
               obj.text = 'UNIVERSIDAD ACADEMIC CHAIN';
           } else if (obj.text.includes('{{fecha}}')) {
               obj.data = { ...obj.data, originalText: obj.text };
               obj.text = new Date().toLocaleDateString();
           } else if (obj.data?.isSmart) {
                obj.data = { ...obj.data, originalText: obj.text };
                obj.text = obj.text.replace(/{{|}}/g, '').toUpperCase();
           }
        }
      });
    } else {
      // Exit Preview
      const objects = fabricCanvas.getObjects();
      objects.forEach(obj => {
        // Unlock if not explicitly locked by user (simplified: unlock all except background)
        if (!obj.data?.isBackground) {
            obj.selectable = true;
            obj.evented = true;
        }

        if (obj.data?.originalText) {
            obj.text = obj.data.originalText;
            delete obj.data.originalText;
        }
      });
    }
    fabricCanvas.requestRenderAll();
  };

  /* Snap & Alignment Logic */
  useEffect(() => {
      if (!fabricCanvas) return;

      fabricCanvas.selectionColor = 'rgba(125, 42, 232, 0.1)';
      fabricCanvas.selectionBorderColor = '#7D2AE8';
      fabricCanvas.selectionLineWidth = 1;

      const customizeObject = (obj) => {
          obj.set({
              transparentCorners: false,
              cornerColor: '#ffffff',
              cornerStrokeColor: '#7D2AE8',
              borderColor: '#00C4CC',
              cornerSize: 10,
              padding: 5,
              cornerStyle: 'circle',
              borderDashArray: [4, 4]
          });
      };

      fabricCanvas.getObjects().forEach(customizeObject);
      const handleAdded = (e) => customizeObject(e.target);
      fabricCanvas.on('object:added', handleAdded);

      const snapThreshold = 10;
      let verticalGuide = null;
      let horizontalGuide = null;
      
      const handleObjectMoving = (e) => {
          if (isPreviewMode) return; 

          const obj = e.target;
          const canvasWidth = fabricCanvas.width;
          const canvasHeight = fabricCanvas.height;
          let snappedX = false;
          let snappedY = false;

          // Snap to Center X
          if (Math.abs(obj.left + (obj.width * obj.scaleX) / 2 - canvasWidth / 2) < snapThreshold) {
              obj.set({ left: canvasWidth / 2 - (obj.width * obj.scaleX) / 2 });
              snappedX = true;
          }

          // Snap to Center Y
          if (Math.abs(obj.top + (obj.height * obj.scaleY) / 2 - canvasHeight / 2) < snapThreshold) {
              obj.set({ top: canvasHeight / 2 - (obj.height * obj.scaleY) / 2 });
              snappedY = true;
          }

          if (snappedX) {
              if (!verticalGuide) {
                  verticalGuide = new Rect({
                      left: canvasWidth / 2, top: 0, width: 1, height: canvasHeight,
                      fill: '#ff00ff', selectable: false, evented: false, opacity: 0.8
                  });
                  fabricCanvas.add(verticalGuide);
              }
          } else {
              if (verticalGuide) { fabricCanvas.remove(verticalGuide); verticalGuide = null; }
          }

          if (snappedY) {
              if (!horizontalGuide) {
                  horizontalGuide = new Rect({
                      left: 0, top: canvasHeight / 2, width: canvasWidth, height: 1,
                      fill: '#ff00ff', selectable: false, evented: false, opacity: 0.8
                  });
                  fabricCanvas.add(horizontalGuide);
              }
          } else {
              if (horizontalGuide) { fabricCanvas.remove(horizontalGuide); horizontalGuide = null; }
          }

          if (obj.data?.isSmart) {
            setActiveTooltip({
                x: obj.left + (obj.width * obj.scaleX) / 2,
                y: obj.top - 40,
                text: obj.text
            });
          }
      };

      const clearGuides = () => {
          if (verticalGuide) { fabricCanvas.remove(verticalGuide); verticalGuide = null; }
          if (horizontalGuide) { fabricCanvas.remove(horizontalGuide); horizontalGuide = null; }
      };

      fabricCanvas.on('object:moving', handleObjectMoving);
      fabricCanvas.on('mouse:up', clearGuides);

      return () => {
          fabricCanvas.off('object:moving', handleObjectMoving);
          fabricCanvas.off('mouse:up', clearGuides);
      };
  }, [fabricCanvas, isPreviewMode]);

  useEffect(() => {
    if (containerRef.current && canvasRef.current) {
      const containerWidth = containerRef.current.clientWidth - 64; 
      const aspect = 4 / 3;
      const height = containerWidth / aspect;

      const canvas = new Canvas(canvasRef.current, {
        width: containerWidth,
        height: height,
        backgroundColor: '#ffffff',
        selection: true
      });

      canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
      canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
      canvas.on('selection:cleared', () => setSelectedObject(null));

      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (obj && obj.data && obj.data.isSmart) {
          setActiveTooltip({
            x: obj.left + (obj.width * obj.scaleX) / 2,
            y: obj.top - 40,
            text: obj.text
          });
        }
      });

      canvas.on('mouse:up', () => setActiveTooltip(null));
      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    }
  }, []);

  useEffect(() => {
    if (selectedObject) {
      if (selectedObject.type === 'i-text') {
        if (color) selectedObject.set('fill', color);
        if (fontSize) selectedObject.set('fontSize', parseInt(fontSize));
      } else if (selectedObject.type === 'rect') {
        if (color) selectedObject.set('fill', color);
      }
      fabricCanvas.requestRenderAll();
    }
  }, [color, fontSize]);


  const addText = (initialText = text) => {
    if (!fabricCanvas) return;
    const textObj = new IText(initialText, {
      left: fabricCanvas.width / 2 - 100,
      top: fabricCanvas.height / 2,
      fill: color,
      fontSize: fontSize,
      fontFamily: 'Outfit',
      originX: 'left',
      originY: 'top'
    });
    fabricCanvas.add(textObj);
    fabricCanvas.setActiveObject(textObj);
  };

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({ left: 100, top: 100, fill: color, width: 100, height: 100 });
    fabricCanvas.add(rect);
  };

  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (f) => {
        FabricImage.fromURL(f.target.result).then(img => {
          img.scaleToWidth(200);
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
        });
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSignatureUpload = (e) => {
    const f = e.target.files[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (f) => {
        const newSig = {
            id: `sig-${Date.now()}`,
            url: f.target.result,
            name: `Firma ${signatures.length + 1}`
        };
        setSignatures([...signatures, newSig]);
        toast.success('Firma añadida a la biblioteca');
      };
      reader.readAsDataURL(f);
    }
  };

  const addSignatureToCanvas = (sig) => {
      if (!fabricCanvas) return;
      FabricImage.fromURL(sig.url).then(img => {
          img.scaleToWidth(150);
          img.set({
              left: fabricCanvas.width / 2,
              top: fabricCanvas.height - 200,
              originX: 'center',
              originY: 'center',
              data: { name: `Firma: ${sig.name}` }
          });
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          toast.success('Firma estampada');
      });
  };

  const autoStampSignatures = () => {
      if (!fabricCanvas || signatures.length === 0) {
          toast.error('No hay firmas disponibles para estampar');
          return;
      }
      
      const bottomY = fabricCanvas.height - 150;
      const spacing = fabricCanvas.width / (signatures.length + 1);

      signatures.forEach((sig, index) => {
          FabricImage.fromURL(sig.url).then(img => {
              img.scaleToWidth(120);
              img.set({
                  left: spacing * (index + 1),
                  top: bottomY,
                  originX: 'center',
                  originY: 'center',
                  data: { name: `Firma: ${sig.name}` }
              });
              fabricCanvas.add(img);
          });
      });
      fabricCanvas.requestRenderAll();
      toast.success('Estampado automático completado');
  };

  const handleBackgroundUpload = (e) => {
    const f = e.target.files[0];
    if (f && fabricCanvas) {
      const reader = new FileReader();
      reader.onload = (f) => {
        FabricImage.fromURL(f.target.result).then(img => {
           const scaleX = fabricCanvas.width / img.width;
           const scaleY = fabricCanvas.height / img.height;
           const scale = Math.max(scaleX, scaleY);
           
           img.set({
               originX: 'center', 
               originY: 'center',
               scaleX: scale,
               scaleY: scale,
               top: fabricCanvas.height / 2,
               left: fabricCanvas.width / 2,
               selectable: false,
               evented: false,
               data: { isBackground: true, name: 'Fondo' }
           });
           
           const oldBg = fabricCanvas.getObjects().find(o => o.data?.isBackground);
           if (oldBg) fabricCanvas.remove(oldBg);

           fabricCanvas.add(img);
           img.sendToBack();
           fabricCanvas.requestRenderAll();
           updateLayers();
           toast.success('Fondo actualizado');
        });
      };
      reader.readAsDataURL(f);
    }
  };

  const handleLogoUpload = (e) => {
    const f = e.target.files[0];
    if (f && fabricCanvas) {
      const reader = new FileReader();
      reader.onload = (f) => {
        FabricImage.fromURL(f.target.result).then(img => {
           img.scaleToWidth(150);
           img.set({
               left: fabricCanvas.width / 2,
               top: fabricCanvas.height / 2,
               originX: 'center', 
               originY: 'center',
               data: { name: 'Logo Institucional' }
           });
           fabricCanvas.add(img);
           fabricCanvas.setActiveObject(img);
           fabricCanvas.requestRenderAll();
           updateLayers();
           toast.success('Logo añadido');
        });
      };
      reader.readAsDataURL(f);
    }
  };

  const clearCanvas = () => {
      if (confirm("¿Estás seguro de limpiar todo el diseño?")) {
          fabricCanvas.clear();
          fabricCanvas.backgroundColor = '#ffffff';
          setLayers([]);
          setSelectedObject(null);
          toast.success('Lienzo limpiado');
      }
  };

  const loadStructure = (type) => {
      if (!fabricCanvas) return;
      if (!confirm("Esto reemplazará tu diseño actual. ¿Continuar?")) return;

      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      
      const cx = fabricCanvas.width / 2;
      const cy = fabricCanvas.height / 2;

      if (type === 'Titulo') {
          fabricCanvas.add(new IText('TÍTULO PROFESIONAL', { left: cx, top: 100, fontSize: 40, fontFamily: 'Orbitron', originX: 'center', data: { name: 'Título Doc' } }));
          fabricCanvas.add(new IText('{{nombre_alumno}}', { left: cx, top: 250, fontSize: 30, fontFamily: 'Inter', originX: 'center', data: { isSmart: true, name: 'Nombre Alumno' } }));
          fabricCanvas.add(new IText('{{carrera}}', { left: cx, top: 320, fontSize: 24, fontFamily: 'Inter', originX: 'center', fill: '#666', data: { isSmart: true, name: 'Carrera' } }));
          
          const sigY = fabricCanvas.height - 150;
          [-200, 0, 200].forEach((offset, i) => {
             fabricCanvas.add(new Rect({ left: cx + offset - 60, top: sigY, width: 120, height: 1, fill: '#000', originX: 'left', data: { name: `Línea Firma ${i+1}` } }));
             fabricCanvas.add(new IText('Autoridad', { left: cx + offset, top: sigY + 10, fontSize: 12, originX: 'center', data: { name: `Cargo Firma ${i+1}` } }));
          });
      } else if (type === 'Diploma') {
          fabricCanvas.add(new IText('DIPLOMA TÉCNICO', { left: cx, top: 100, fontSize: 40, fontFamily: 'Orbitron', originX: 'center', data: { name: 'Título Doc' } }));
          fabricCanvas.add(new IText('{{nombre_alumno}}', { left: cx, top: 250, fontSize: 30, fontFamily: 'Inter', originX: 'center', data: { isSmart: true, name: 'Nombre Alumno' } }));
          
          fabricCanvas.add(new Rect({ left: cx + 300, top: cy, width: 100, height: 100, fill: '#eee', stroke: '#000', strokeDashArray: [5, 5], originX: 'center', data: { name: 'Placeholder QR' } }));
          fabricCanvas.add(new IText('QR', { left: cx + 300, top: cy, fontSize: 20, originX: 'center', originY: 'center', fill: '#999', selectable: false }));
      } else if (type === 'Constancia') {
           fabricCanvas.add(new IText('CONSTANCIA DE ESTUDIOS', { left: cx, top: 100, fontSize: 30, fontFamily: 'Inter', originX: 'center', data: { name: 'Título Doc' } }));
           fabricCanvas.add(new IText('Por la presente se hace constar que:', { left: cx, top: 180, fontSize: 16, originX: 'center' }));
           fabricCanvas.add(new IText('{{nombre_alumno}}', { left: cx, top: 220, fontSize: 24, fontFamily: 'Inter', originX: 'center', fontWeight: 'bold', data: { isSmart: true, name: 'Nombre Alumno' } }));
      }

      fabricCanvas.requestRenderAll();
      updateLayers();
  };


  const saveAsTemplate = async () => {
      if (isPreviewMode) {
          togglePreviewMode();
          toast('Vista Previa desactivada para guardar', { icon: 'ℹ️' });
      }

      const name = prompt("Nombre para tu plantilla:");
      if (!name) return false;
      
      const json = fabricCanvas.toJSON(['data', 'id', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'shadow', 'stroke', 'strokeWidth', 'opacity']);
      
      // Extract AI Metadata for easier indexing in n8n
      const aiMetadata = {
          competencies: [],
          projects: [],
          smartFields: []
      };

      json.objects.forEach(obj => {
          if (obj.data?.dataType === 'competence') {
              aiMetadata.competencies.push(obj.text);
          } else if (obj.data?.dataType === 'project') {
              aiMetadata.projects.push(obj.text);
          } else if (obj.data?.isSmart) {
              aiMetadata.smartFields.push(obj.text);
          }
      });

      const newTemplate = {
          id: `custom-${Date.now()}`,
          name: name,
          thumbnail: 'bg-slate-800 border-dashed border-cyan-500', 
          category: 'Personal',
          bg: fabricCanvas.backgroundColor,
          objects: json.objects,
          tags: ['personal', ...aiMetadata.competencies], // Auto-tag with competencies
          aiMetadata: aiMetadata, // Save metadata for "Perfect Match"
          pageSize: pageSize,
          docType: docType
      };
      
      const updated = [...customTemplates, newTemplate];
      setCustomTemplates(updated);
      localStorage.setItem('customTemplates', JSON.stringify(updated));
      
      try {
          await n8nService.saveTemplate({
              ...newTemplate,
              canvasJson: json 
          });
          toast.success('Plantilla guardada en Studio Cloud');
      } catch (e) {
          console.warn('Cloud save failed', e);
          toast.success('Plantilla guardada localmente');
      }

      setActiveCategory('Personal');
      return newTemplate.id;
  };

  const deleteSelected = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.remove(selectedObject);
      setSelectedObject(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricCanvas && fabricCanvas.getActiveObject()) {
           const active = fabricCanvas.getActiveObject();
           if (active.isEditing) return;
           deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, selectedObject]);

  const changePageSize = (size) => {
      if (!fabricCanvas) return;
      setPageSize(size);
      
      let width = 800;
      let height = 600;

      if (size === 'Landscape') {
          width = 1123;
          height = 794;
      } else if (size === 'Portrait') {
          width = 794;
          height = 1123;
      } else if (size === 'Square') {
          width = 800;
          height = 800;
      }

      fabricCanvas.setDimensions({ width, height });
      
      if (fabricCanvas.backgroundImage) {
           const img = fabricCanvas.backgroundImage;
           const scale = Math.max(width / img.width, height / img.height);
           img.set({
               scaleX: scale,
               scaleY: scale,
               top: height / 2,
               left: width / 2
           });
      }
      fabricCanvas.requestRenderAll();
      toast.success(`Tamaño ajustado a ${size}`);
  };

  const updateDocType = (type) => {
      setDocType(type);
      if (!fabricCanvas) return;
      
      const objects = fabricCanvas.getObjects();
      let titleObj = objects.find(o => o.data && o.data.isTitle);
      let instObj = objects.find(o => o.data && o.data.isInstitution);
      
      if (!titleObj) {
          titleObj = objects.find(o => 
              (o.type === 'i-text' || o.type === 'text') && 
              o.fontSize >= 40 && 
              o.top < fabricCanvas.height / 3
          );
      }

      if (titleObj) {
          titleObj.set('text', type.toUpperCase());
          if (!titleObj.data) titleObj.data = {};
          titleObj.data.isTitle = true;
      } else {
          const text = new IText(type.toUpperCase(), {
              left: fabricCanvas.width / 2,
              top: 100,
              fontSize: 40,
              fontFamily: 'Orbitron',
              fill: '#000000',
              originX: 'center',
              originY: 'center',
              fontWeight: 'bold',
              data: { isTitle: true }
          });
          fabricCanvas.add(text);
      }

      if (!instObj) {
          const instText = new IText('{{nombre_institucion}}', {
              left: fabricCanvas.width / 2,
              top: 150,
              fontSize: 20,
              fontFamily: 'Inter',
              fill: '#333333',
              originX: 'center',
              originY: 'center',
              fontWeight: 'normal',
              data: { isInstitution: true, isSmart: true }
          });
          fabricCanvas.add(instText);
      }

      fabricCanvas.requestRenderAll();
  };

  const addSmartField = (field) => {
    if (!fabricCanvas) return;
    const text = new IText(field, {
      left: fabricCanvas.width / 2,
      top: fabricCanvas.height / 2,
      fontSize: 20, 
      fontFamily: 'JetBrains Mono',
      fill: '#2563eb', 
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold',
      data: { isSmart: true },
      editable: false,
      shadow: new Shadow({ color: '#2563eb', blur: 2 })
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.requestRenderAll();
    toast.success(`Variable ${field} agregada`);
  };

  const handlePdfUpload = async (e) => {
      toast.error('La importación de PDF está temporalmente deshabilitada para mantenimiento.');
  };

  const loadTemplate = (templateId) => {
    if (!fabricCanvas) return;
    const allTemplates = [...templates, ...customTemplates];
    const tmpl = allTemplates.find(t => t.id === templateId);
    if (!tmpl) return;

    if (tmpl.pageSize) changePageSize(tmpl.pageSize);
    if (tmpl.docType) setDocType(tmpl.docType);

    fabricCanvas.clear();
           fabricCanvas.backgroundColor = tmpl.bg;
           fabricCanvas.requestRenderAll();

    tmpl.objects.forEach(obj => {
      const { type, text, ...options } = obj;
      let textContent = text;

      if (type === 'rect') {
        fabricCanvas.add(new Rect(options));
      } else if (type === 'i-text' || type === 'text') {
        const textOptions = { ...options };
        
        if (textContent && textContent.includes('{{')) {
          textOptions.data = { isSmart: true };
          textOptions.editable = false;
          if (tmpl.category === 'Holographic') {
            textOptions.shadow = new Shadow({ color: textOptions.fill, blur: 10 });
          }
        }
        fabricCanvas.add(new IText(textContent || 'Texto', textOptions));
      }
    });

    toast.success(`Plantilla cargada: ${tmpl.name}`);
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 0.8 });

    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "certificate-design.png", { type: "image/png" });
        const jsonStructure = fabricCanvas.toJSON(['data']);
        onSave(file, jsonStructure);
        onClose();
      });
  };

  const allTemplates = [...templates, ...customTemplates];
  const filteredTemplates = allTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Personal', 'Modern', 'Sovereign', 'Holographic', 'Classic', 'Signatures'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl flex overflow-hidden shadow-2xl border border-slate-700"
      >

        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-slate-950/90 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎨</span>
            <h2 className="text-xl font-display font-bold text-white">Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Holográfico</span></h2>
          </div>
          
          <div className="flex gap-2">
            <button
                onClick={togglePreviewMode}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all border ${isPreviewMode ? 'bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
                {isPreviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
                {isPreviewMode ? 'Editar' : 'Vista Previa'}
            </button>
            {isPreviewMode && (
                <button
                    onClick={handleExport}
                    className="flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                >
                    <Upload size={14} /> Exportar
                </button>
            )}
          </div>

          {!isPreviewMode && (
          <>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-4">
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Configuración de Página</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => changePageSize('Landscape')}
                        className={`flex-1 py-1.5 rounded text-xs font-medium border ${pageSize === 'Landscape' ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                        Horizontal
                    </button>
                    <button 
                        onClick={() => changePageSize('Portrait')}
                        className={`flex-1 py-1.5 rounded text-xs font-medium border ${pageSize === 'Portrait' ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                        Vertical
                    </button>
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo de Documento</label>
                <div className="flex flex-wrap gap-2">
                   {['Diploma', 'Certificado', 'Constancia', 'Reconocimiento'].map(type => (
                    <button
                        key={type}
                        onClick={() => updateDocType(type)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${docType === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {type}
                    </button>
                ))}
             </div>
          </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#00C4CC] to-[#7D2AE8] p-0.5 rounded-lg mb-2 shadow-lg shadow-cyan-500/20 group hover:scale-[1.02] transition-transform cursor-default">
            <div className="bg-slate-900 rounded-[6px] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm tracking-wide">CANVA CONNECT™</span>
                  <span className="px-1.5 py-0.5 rounded bg-white text-black text-[9px] font-bold">PRO</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Conexión Activa"></div>
              </div>
              <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                Diseña en Canva y conecta automáticamente o sube tu diseño.
              </p>
              
              {!showCanvaInput ? (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <a
                        href="https://www.canva.com/create/certificates/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-[#00C4CC] hover:bg-[#00b0b8] text-black font-bold text-[10px] rounded text-center transition-colors flex items-center justify-center gap-1"
                        >
                        <span>🖌️</span> 1. Abrir Canva
                        </a>
                        <button 
                            onClick={() => setShowCanvaInput(true)}
                            className="flex-1 py-1.5 bg-[#7D2AE8] hover:bg-[#6b23c7] text-white font-bold text-[10px] rounded text-center transition-colors border border-[#7D2AE8] flex items-center justify-center gap-1"
                        >
                            <span>⚡</span> 2. Conectar
                        </button>
                    </div>
                     <div className="flex gap-2 mt-1">
                        <label className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded text-center transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-1">
                            <FileUp size={12} /> Subir Fondo
                            <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                        </label>
                        <label className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded text-center transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-1">
                            <FileText size={12} /> Subir PDF
                            <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                        </label>
                     </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                    <input 
                        type="text" 
                        placeholder="Pega tu enlace público de Canva..." 
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#7D2AE8]"
                        value={canvaUrl}
                        onChange={(e) => setCanvaUrl(e.target.value)}
                    />
                    <div className="flex gap-2">
                         <button 
                            onClick={handleCanvaImport}
                            disabled={isProcessing}
                            className="flex-1 py-1.5 bg-[#7D2AE8] hover:bg-[#6b23c7] text-white font-bold text-[10px] rounded flex items-center justify-center gap-1"
                        >
                            {isProcessing ? 'Procesando...' : 'Confirmar Importación'}
                        </button>
                         <button 
                            onClick={() => setShowCanvaInput(false)}
                            className="w-8 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] rounded flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-800 mb-4" />

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-sm text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-3 text-slate-500">🔍</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${activeCategory === cat ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeCategory === 'Signatures' ? (
              <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                      <span>Gestor de Firmas ({signatures.length})</span>
                  </label>
                  
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-3">
                      <label className="flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-700 rounded-lg hover:border-purple-500 hover:bg-slate-800 transition-colors cursor-pointer group">
                          <div className="text-center">
                              <PenTool className="mx-auto h-6 w-6 text-slate-500 group-hover:text-purple-400" />
                              <span className="mt-2 block text-xs font-medium text-slate-400 group-hover:text-purple-300">Subir Firma</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                      </label>
                      
                      <button 
                          onClick={autoStampSignatures}
                          disabled={signatures.length === 0}
                          className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded flex items-center justify-center gap-2 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Stamp size={14} /> Estampado Automático
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      {signatures.map(sig => (
                          <div key={sig.id} className="relative group bg-white/5 rounded-lg p-2 border border-slate-700 hover:border-purple-500 transition-colors">
                              <div className="aspect-[3/2] flex items-center justify-center bg-white/10 rounded mb-2 overflow-hidden">
                                  <img src={sig.url} alt="Firma" className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="flex gap-1">
                                  <button 
                                      onClick={() => addSignatureToCanvas(sig)}
                                      className="flex-1 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded"
                                  >
                                      Usar
                                  </button>
                                  <button 
                                      onClick={() => setSignatures(signatures.filter(s => s.id !== sig.id))}
                                      className="py-1 px-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded"
                                  >
                                      <Trash2 size={12} />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
          <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
              <span>Resultados ({filteredTemplates.length})</span>
              {searchTerm && <span className="text-purple-400 cursor-pointer" onClick={() => setSearchTerm('')}>Limpiar</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {filteredTemplates.map(t => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => loadTemplate(t.id)}
                  className={`aspect-[4/3] rounded-lg border border-slate-700 hover:border-purple-500 transition-all flex flex-col items-center justify-end p-2 overflow-hidden relative group ${t.thumbnail || 'bg-slate-800'}`}
                >
                  <div className={`absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity ${t.thumbnail}`}></div>
                  <span className="relative z-10 text-[10px] font-bold text-white text-center bg-black/60 px-2 py-1 rounded backdrop-blur-sm w-full truncate">
                    {t.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
          )}

          <hr className="border-slate-800" />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Variables Inteligentes</label>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Conectado a Blockchain"></span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button className="flex items-center justify-between p-2 rounded bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-blue-200 text-xs transition-colors group" onClick={() => addSmartField('{{student_name}}')}>
                <span>👤 Estudiante</span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-400">+ Agregar</span>
              </button>
              <button className="flex items-center justify-between p-2 rounded bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 text-purple-200 text-xs transition-colors group" onClick={() => addSmartField('{{institution_name}}')}>
                <span>🏛️ Institución</span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-400">+ Agregar</span>
              </button>
              <button className="flex items-center justify-between p-2 rounded bg-pink-900/20 border border-pink-500/30 hover:bg-pink-900/40 text-pink-200 text-xs transition-colors group" onClick={() => addSmartField('{{course_name}}')}>
                <span>🎓 Curso/Título</span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-pink-400">+ Agregar</span>
              </button>
              <button className="flex items-center justify-between p-2 rounded bg-orange-900/20 border border-orange-500/30 hover:bg-orange-900/40 text-orange-200 text-xs transition-colors group" onClick={() => addSmartField('{{completion_date}}')}>
                <span>📅 Fecha</span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-orange-400">+ Agregar</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Herramientas</label>
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-800 border-none rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary" value={text} onChange={e => setText(e.target.value)} placeholder="Texto libre..." />
              <button onClick={() => addText(text)} className="w-10 bg-slate-700 rounded hover:bg-slate-600 text-white">+</button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={addRect} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300">Cuadrado</button>
              <label className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 text-center cursor-pointer">
                Imagen
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
          </>
          )}

          <div className="mt-auto pt-4 flex flex-col gap-3">
             <button onClick={saveAsTemplate} className="w-full py-2 rounded-lg border border-purple-500/50 text-purple-300 hover:bg-purple-900/20 font-medium text-xs flex items-center justify-center gap-2 transition-colors">
                <span>💾</span> Guardar como Plantilla
             </button>
             
             <button 
                onClick={() => {
                    const templateId = saveAsTemplate();
                    if (templateId) {
                        localStorage.setItem('activeTemplateId', templateId);
                        if(onNavigate) onNavigate('masiva');
                    }
                }} 
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
             >
                <span>🚀</span> Guardar y Continuar a Emisión
             </button>

             <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-medium text-xs">Cancelar</button>
                <button onClick={handleExport} className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 font-medium text-xs">
                   Usar (1 Vez)
                </button>
             </div>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 bg-slate-900 relative flex items-center justify-center p-8 bg-grid-slate-800/[0.2]" ref={containerRef}>
          <div className="shadow-2xl ring-1 ring-slate-700/50">
            <canvas ref={canvasRef} />
          </div>

          {activeTooltip && (
            <div
              className="absolute pointer-events-none z-50 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-bounce"
              style={{ top: activeTooltip.y, left: activeTooltip.x }}
            >
              <span className="text-sm">🔗</span> {activeTooltip.text}
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties & Layers */}
        {!isPreviewMode && (
        <div className="w-80 bg-slate-950/90 border-l border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-md">
            
            {/* Properties Panel */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">⚙️</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Propiedades</h3>
                </div>
                
                {selectedObject ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-900 rounded border border-slate-800">
                             <div className="flex items-center gap-2 mb-2">
                                 <span className="text-xs text-slate-400 font-mono">ID: {selectedObject.type}</span>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">X</label>
                                    <input 
                                        type="number" 
                                        value={Math.round(selectedObject.left || 0)} 
                                        onChange={(e) => updateObjectProperty('left', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Y</label>
                                    <input 
                                        type="number" 
                                        value={Math.round(selectedObject.top || 0)} 
                                        onChange={(e) => updateObjectProperty('top', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                </div>
                             </div>

                             <div className="mb-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Escala ({Math.round((selectedObject.scaleX || 1) * 100)}%)</label>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="3" 
                                    step="0.1"
                                    value={selectedObject.scaleX || 1} 
                                    onChange={(e) => updateObjectProperty('scale', e.target.value)}
                                    className="w-full accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Ancho</label>
                                    <input 
                                        type="number" 
                                        value={Math.round(selectedObject.getScaledWidth())} 
                                        onChange={(e) => updateObjectProperty('width', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Alto</label>
                                    <input 
                                        type="number" 
                                        value={Math.round(selectedObject.getScaledHeight())} 
                                        onChange={(e) => updateObjectProperty('height', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                </div>
                             </div>

                             <div className="pt-2 border-t border-slate-800 mb-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Opacidad ({Math.round((selectedObject.opacity || 1) * 100)}%)</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01"
                                    value={selectedObject.opacity ?? 1} 
                                    onChange={(e) => updateObjectProperty('opacity', parseFloat(e.target.value))}
                                    className="w-full accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                             </div>

                             <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Borde</label>
                                    <div className="flex gap-1 items-center">
                                         <input 
                                            type="color" 
                                            value={selectedObject.stroke || '#000000'} 
                                            onChange={(e) => updateObjectProperty('stroke', e.target.value)}
                                            className="h-6 w-8 bg-transparent cursor-pointer rounded border border-slate-600"
                                        />
                                        <button onClick={() => updateObjectProperty('stroke', null)} className="text-[10px] text-red-400 hover:bg-slate-800 p-1 rounded" title="Quitar Borde">✕</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Grosor</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={selectedObject.strokeWidth || 0} 
                                        onChange={(e) => updateObjectProperty('strokeWidth', parseFloat(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    />
                                </div>
                             </div>

                             <div className="pt-2 border-t border-slate-800 mb-2">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Sombra</label>
                                <div className="flex gap-2 items-center mb-2">
                                    <input 
                                        type="checkbox" 
                                        checked={!!selectedObject.shadow} 
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                updateObjectProperty('shadow', new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 }));
                                            } else {
                                                updateObjectProperty('shadow', null);
                                            }
                                        }}
                                        className="accent-purple-500 rounded sm:w-4 sm:h-4"
                                    />
                                    <span className="text-xs text-slate-300">Activar Sombra</span>
                                </div>
                                {selectedObject.shadow && (
                                    <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-slate-800">
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Color</label>
                                            <input 
                                                type="color" 
                                                value={selectedObject.shadow.color || '#000000'} 
                                                onChange={(e) => {
                                                    const s = selectedObject.shadow;
                                                    s.color = e.target.value;
                                                    // Re-assign to trigger update
                                                    updateObjectProperty('shadow', new Shadow(s));
                                                }}
                                                className="h-5 w-full bg-transparent cursor-pointer rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Blur</label>
                                            <input 
                                                type="number" 
                                                value={selectedObject.shadow.blur || 0} 
                                                onChange={(e) => {
                                                    const s = selectedObject.shadow;
                                                    s.blur = parseFloat(e.target.value);
                                                    updateObjectProperty('shadow', new Shadow(s));
                                                }}
                                                className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase block mb-0.5">X Offset</label>
                                            <input 
                                                type="number" 
                                                value={selectedObject.shadow.offsetX || 0} 
                                                onChange={(e) => {
                                                    const s = selectedObject.shadow;
                                                    s.offsetX = parseFloat(e.target.value);
                                                    updateObjectProperty('shadow', new Shadow(s));
                                                }}
                                                className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Y Offset</label>
                                            <input 
                                                type="number" 
                                                value={selectedObject.shadow.offsetY || 0} 
                                                onChange={(e) => {
                                                    const s = selectedObject.shadow;
                                                    s.offsetY = parseFloat(e.target.value);
                                                    updateObjectProperty('shadow', new Shadow(s));
                                                }}
                                                className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                             </div>

                             {(selectedObject.type === 'i-text' || selectedObject.type === 'text') && (
                                 <div className="space-y-2 pt-2 border-t border-slate-800">
                                     <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Texto</label>
                                        <input 
                                            type="text" 
                                            value={selectedObject.text} 
                                            onChange={(e) => updateObjectProperty('text', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                            disabled={selectedObject.data?.isSmart}
                                        />
                                     </div>
                                     <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Color</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                value={selectedObject.fill} 
                                                onChange={(e) => updateObjectProperty('fill', e.target.value)}
                                                className="h-6 w-8 bg-transparent cursor-pointer rounded"
                                            />
                                            <input 
                                                type="text" 
                                                value={selectedObject.fill} 
                                                onChange={(e) => updateObjectProperty('fill', e.target.value)}
                                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                            />
                                        </div>
                                     </div>
                                     <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Fuente</label>
                                        <select 
                                            value={selectedObject.fontFamily} 
                                            onChange={(e) => updateObjectProperty('fontFamily', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                        >
                                            {['Inter', 'Roboto', 'Orbitron', 'JetBrains Mono', 'Dancing Script', 'Pinyon Script', 'Arial', 'Times New Roman'].map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                     </div>
                                     <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tipo de Dato (IA)</label>
                                        <select 
                                            value={selectedObject.data?.dataType || 'text'} 
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                selectedObject.data = { ...selectedObject.data, dataType: val };
                                                if (val === 'competence') {
                                                    toast('Elemento marcado como Competencia para IA', { icon: '🧠' });
                                                }
                                                fabricCanvas.requestRenderAll();
                                                updateLayers();
                                            }}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                        >
                                            <option value="text">Texto Simple</option>
                                            <option value="student_name">Nombre Estudiante</option>
                                            <option value="institution">Institución</option>
                                            <option value="date">Fecha</option>
                                            <option value="competence">Competencia / Habilidad</option>
                                            <option value="project">Proyecto Destacado</option>
                                        </select>

                                     </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tamaño Fuente</label>
                                        <input 
                                            type="number" 
                                            value={selectedObject.fontSize} 
                                            onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                        />
                                     </div>
                                 </div>
                             )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleLayerAction('bringForward', selectedObject)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 flex items-center justify-center gap-1" title="Subir una capa">
                                <ChevronUp size={14} /> Subir
                            </button>
                            <button onClick={() => handleLayerAction('sendBackward', selectedObject)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 flex items-center justify-center gap-1" title="Bajar una capa">
                                <ChevronDown size={14} /> Bajar
                            </button>
                            <button onClick={() => handleLayerAction('bringToFront', selectedObject)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 flex items-center justify-center gap-1" title="Traer al frente">
                                <BringToFront size={14} /> Al Frente
                            </button>
                            <button onClick={() => handleLayerAction('sendToBack', selectedObject)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 flex items-center justify-center gap-1" title="Enviar al fondo">
                                <SendToBack size={14} /> Al Fondo
                            </button>
                             <button onClick={() => handleLayerAction('delete', selectedObject)} className="col-span-2 p-2 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 rounded text-xs text-red-400 flex items-center justify-center gap-1">
                                <Trash2 size={14} /> Eliminar Elemento
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-slate-900/50 rounded border border-slate-800 border-dashed text-center text-slate-500 text-xs">
                        Selecciona un elemento para editar sus propiedades.
                    </div>
                )}
            </div>

            <hr className="border-slate-800" />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📚</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Capas ({layers.length})</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {layers.map((layer, index) => {
                        const isSelected = selectedObject === layer;
                        return (
                            <div 
                                key={index}
                                onClick={() => {
                                    fabricCanvas.setActiveObject(layer);
                                    fabricCanvas.requestRenderAll();
                                }}
                                className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-purple-900/30 border-purple-500/50' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}
                            >
                                <div className="text-slate-500">
                                    {layer.type === 'i-text' || layer.type === 'text' ? <Type size={14} /> : 
                                     layer.type === 'image' ? <ImageIcon size={14} /> : 
                                     <LayoutTemplate size={14} />}
                                </div>
                                <span className={`text-xs font-medium truncate flex-1 ${isSelected ? 'text-purple-300' : 'text-slate-300'}`}>
                                    {getLayerName(layer)}
                                </span>
                                
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleLayerAction('lock', layer); }}
                                        className={`p-1 rounded hover:bg-slate-700 ${layer.lockMovementX ? 'text-orange-400' : 'text-slate-500'}`}
                                        title={layer.lockMovementX ? "Desbloquear" : "Bloquear"}
                                    >
                                        {layer.lockMovementX ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleLayerAction('delete', layer); }}
                                        className="p-1 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {layers.length === 0 && (
                        <div className="text-center py-4 text-slate-600 text-xs italic">
                            Lienzo vacío. Agrega elementos.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
                 <button 
                    onClick={() => {
                        if (!fabricCanvas) return;
                        const qrSize = 100;
                        FabricImage.fromURL('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Demo', { crossOrigin: 'anonymous' }).then(img => {
                             img.set({
                                 left: fabricCanvas.width - 100,
                                 top: fabricCanvas.height - 100,
                                 originX: 'center',
                                 originY: 'center',
                                 scaleX: 0.8,
                                 scaleY: 0.8,
                                 data: { name: 'QR de Verificación', isQR: true }
                             });
                             fabricCanvas.add(img);
                             fabricCanvas.setActiveObject(img);
                             updateLayers();
                             toast.success('Widget QR de Transparencia añadido (Enlace a Smart CV)');
                        });
                    }}
                    className="w-full py-3 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg flex items-center justify-center gap-3 text-slate-300 hover:text-blue-400 transition-all group"
                 >
                    <div className="bg-white p-1 rounded">
                        <div className="w-4 h-4 bg-black"></div>
                    </div>
                    <span className="text-xs font-bold">Agregar QR de Transparencia</span>
                 </button>
            </div>

        </div>
        )}

      </motion.div>
    </motion.div>
  );
};

export default CreatorHolographicDesigner;
