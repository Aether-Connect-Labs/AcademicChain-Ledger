import React, { useEffect, useRef, useState } from 'react';
import { Canvas, IText, Rect, Shadow, Circle, Image as FabricImage } from 'fabric';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trash2, FileText, Upload, LayoutTemplate, Type, FileUp, ChevronUp, ChevronDown, Lock, Unlock, Eye, EyeOff, BringToFront, SendToBack, Image as ImageIcon, MousePointer2, PenTool, Stamp, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, ArrowRightFromLine, ArrowDownFromLine, Undo2, Redo2 } from 'lucide-react';
import n8nService from './services/n8nService';
import { mockCredentials, templates } from '../utils/mockData';

const CertificateDesigner = ({ onClose, onSave, onNavigate, data = {}, initialDesign, institutionName = 'AcademicChain Ledger' }) => {
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
  const [, setForceUpdate] = useState(0);


  /* AI Chat State */
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
      { role: 'ai', text: '¡Hola! Soy tu diseñador inteligente. 🤖\n\nPuedo crear diseños completos o ajustar detalles. Prueba con:\n• "Un certificado moderno en azul"\n• "Añadir un sello y un borde"\n• "Cambiar título a DIPLOMA DE HONOR"\n• "Estilo futurista para blockchain"' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
      if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
  }, [chatMessages, showAIChat]);

  /* History State (Undo/Redo) */
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [isHistoryProcessing, setIsHistoryProcessing] = useState(false);
  const skipHistoryRef = useRef(false);

  /* Layers State */
  const [layers, setLayers] = useState([]);

  /* History & Layer Management */
  const updateLayers = () => {
    if (fabricCanvas) {
      const objects = fabricCanvas.getObjects();
      // Reverse to show top layer first in list
      setLayers([...objects].reverse());
      setForceUpdate(prev => prev + 1);
    }
  };

  const saveHistory = () => {
    if (!fabricCanvas || isHistoryProcessing || skipHistoryRef.current) return;
    
    // STRICT: Never save an empty canvas state
    if (fabricCanvas.getObjects().length === 0) return;

    try {
        const json = JSON.stringify(fabricCanvas.toJSON(['data', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'id', 'name']));
        
        setHistory(prev => {
            if (prev.length > 0 && prev[prev.length - 1] === json) return prev;
            const newHistory = [...prev, json];
            if (newHistory.length > 30) newHistory.shift();
            return newHistory;
        });
        setRedoHistory([]); 
    } catch (e) {
        console.error("Error saving history", e);
    }
  };

  const undo = () => {
    if (history.length === 0 || !fabricCanvas) return;
    
    setIsHistoryProcessing(true);
    skipHistoryRef.current = true;
    
    // Find the last valid state that is NOT the current one
    let targetIndex = history.length - 2;
    
    // If we only have 1 state (initial), and user wants to undo, 
    // it implies they want to go back to "empty" or "default", 
    // but usually we keep the initial state.
    // If history has 1 item, we can't undo further unless we want to clear.
    if (targetIndex < 0) {
        // Nothing to undo to
        setIsHistoryProcessing(false);
        skipHistoryRef.current = false;
        toast('No hay más acciones para deshacer', { icon: 'ℹ️' });
        return;
    }

    let targetState = null;
    let foundValid = false;

    // Search backwards for a valid state
    while (targetIndex >= 0) {
        const candidate = history[targetIndex];
        try {
            const parsed = JSON.parse(candidate);
            if (parsed.objects) { // Allow empty objects if that was the state
                targetState = candidate;
                foundValid = true;
                break;
            }
        } catch (e) {
            console.warn("Invalid history state encountered", e);
        }
        targetIndex--;
    }

    if (!foundValid) {
        // If we can't find a valid previous state, don't just clear everything.
        // Stay where we are or warn user.
        console.warn("No valid history found to undo to.");
        setIsHistoryProcessing(false);
        skipHistoryRef.current = false;
        toast.error('No se pudo deshacer');
        return;
    }
    
    // Save current state to redo history before switching
    const currentState = history[history.length - 1];
    setRedoHistory(prev => [...prev, currentState]);
    
    // Update history to remove the current state and any skipped invalid ones
    setHistory(prev => prev.slice(0, targetIndex + 1));
    
    try {
        const parsedState = JSON.parse(targetState);
        fabricCanvas.loadFromJSON(parsedState, () => {
            fabricCanvas.renderAll();
            updateLayers();
            setIsHistoryProcessing(false);
            skipHistoryRef.current = false;
            toast.success('Deshacer realizado');
        });
    } catch (e) {
        console.error("Error undoing", e);
        setIsHistoryProcessing(false);
        skipHistoryRef.current = false;
        toast.error('Error al restaurar estado');
    }
  };

  const redo = () => {
    if (redoHistory.length === 0 || !fabricCanvas) return;
    
    setIsHistoryProcessing(true);
    skipHistoryRef.current = true;
    
    const nextState = redoHistory[redoHistory.length - 1];
    
    setHistory(prev => [...prev, nextState]);
    setRedoHistory(prev => prev.slice(0, -1));
    
    try {
        const parsedState = JSON.parse(nextState);
        fabricCanvas.loadFromJSON(parsedState, () => {
            fabricCanvas.renderAll();
            updateLayers();
            setIsHistoryProcessing(false);
            skipHistoryRef.current = false;
            toast.success('Rehacer realizado');
        });
    } catch (e) {
        console.error("Error doing redo", e);
        setIsHistoryProcessing(false);
        skipHistoryRef.current = false;
    }
  };

  const applyAIModifications = (mods) => {
      if (!fabricCanvas) return;
      
      // Handle Template first (if any)
      const templateMod = mods.find(m => m.type === 'template');
      if (templateMod) {
          loadTemplate(templateMod.templateId || templateMod.id, true);
      }

      // Handle Layout
      const layoutMod = mods.find(m => m.type === 'layout');
      if (layoutMod) {
           if (layoutMod.mode === 'Landscape' && pageSize !== 'Landscape') setPageSize('Landscape');
           if (layoutMod.mode === 'Portrait' && pageSize !== 'Portrait') setPageSize('Portrait');
      }

      mods.forEach(mod => {
          if (mod.type === 'template' || mod.type === 'layout') return;

          if (mod.type === 'color-theme') {
              // Apply background
              if (fabricCanvas.backgroundColor) fabricCanvas.backgroundColor = mod.colors.bg;
              
              // Apply to objects
              fabricCanvas.getObjects().forEach(obj => {
                  // Text Colors
                  if (obj.type === 'i-text' || obj.type === 'text') {
                      if (['title-main', 'student-name', 'degree-name', 'institution-name'].includes(obj.data?.type)) {
                          obj.set('fill', mod.colors.text);
                      } else {
                          // Secondary text
                          obj.set('fill', '#64748b'); // Slate-500 default
                      }
                  }
                  
                  // Accents
                  if (obj.data?.type === 'header-bar' || obj.data?.type === 'logo-bg' || obj.data?.type?.startsWith('corner-')) {
                      obj.set('fill', mod.colors.primary);
                  }
                  if (obj.data?.type === 'logo-text') {
                      obj.set('fill', '#ffffff');
                  }
              });
          }
          
          if (mod.type === 'add-element') {
              const center = fabricCanvas.getCenter();
              const w = fabricCanvas.width;
              const h = fabricCanvas.height;

              if (mod.element === 'signature-line') {
                  const line = new Rect({
                      left: w * 0.75,
                      top: h * 0.85,
                      width: 200,
                      height: 2,
                      fill: '#334155',
                      originX: 'center',
                      originY: 'center'
                  });
                  const text = new IText('Firma Autorizada', {
                      left: w * 0.75,
                      top: h * 0.85 + 20,
                      fontSize: 14,
                      originX: 'center',
                      fill: '#64748b',
                      fontFamily: 'Inter'
                  });
                  fabricCanvas.add(line, text);
              }
              if (mod.element === 'seal') {
                   const circle = new Circle({
                       left: w * 0.25,
                       top: h * 0.85,
                       radius: 45,
                       fill: 'transparent',
                       stroke: '#334155',
                       strokeWidth: 4,
                       originX: 'center',
                       originY: 'center'
                   });
                   const inner = new Circle({
                       left: w * 0.25,
                       top: h * 0.85,
                       radius: 35,
                       fill: 'transparent',
                       stroke: '#334155',
                       strokeWidth: 1,
                       originX: 'center',
                       originY: 'center'
                   });
                   const text = new IText('VALIDADO', {
                       left: w * 0.25,
                       top: h * 0.85,
                       fontSize: 10,
                       originX: 'center',
                       originY: 'center',
                       fontFamily: 'Orbitron',
                       fill: '#334155',
                       fontWeight: 'bold'
                   });
                   fabricCanvas.add(circle, inner, text);
              }
              if (mod.element === 'border') {
                  const border = new Rect({
                      left: w / 2,
                      top: h / 2,
                      width: w - 60,
                      height: h - 60,
                      fill: 'transparent',
                      stroke: '#334155', 
                      strokeWidth: 8,
                      originX: 'center',
                      originY: 'center',
                      selectable: false,
                      evented: false,
                      data: { type: 'ornamental-border' }
                  });
                  fabricCanvas.add(border);
                  // Ensure it's not covering interactions but visible
                  fabricCanvas.sendToBack(border);
                  // If background exists, move border in front of it
                  const bg = fabricCanvas.getObjects().find(o => o.data?.type === 'background-main');
                  if (bg) border.bringToFront(); // Actually we want it on top of BG but behind content. 
                  // Simply adding it last puts it on top. We want it safe.
                  border.moveTo(1); // Just above background
              }
          }

          if (mod.type === 'update-text') {
              const obj = fabricCanvas.getObjects().find(o => o.data?.type === mod.target);
              if (obj) {
                  obj.set('text', mod.value);
                  // Re-center if needed
                  if (obj.originX === 'center') {
                      obj.centerH();
                  }
              }
          }
      });
      
      fabricCanvas.requestRenderAll();
      updateLayers();
      saveHistory(); 
  };

  const processAICommand = (input) => {
      const text = input.toLowerCase();
      let response = "He aplicado cambios según tu solicitud.";
      let templateId = null;
      let modifications = [];
      
      // Check for Reset Intent
      const shouldReset = text.includes('borrar') || text.includes('reiniciar') || text.includes('desde cero') || text.includes('nuevo documento');

      // 1. Detect Template/Style
      if (text.includes('moderno') || text.includes('minimal') || text.includes('limpio')) {
          templateId = 'minimal';
          response = "He cargado un diseño **Moderno y Minimalista**. Ideal para tecnología y cursos cortos.";
      } else if (text.includes('blockchain') || text.includes('crypto') || text.includes('bitcoin')) {
          templateId = 'blockchain';
          response = "Aplicando estilo **Blockchain Elite**. Incluye nodos decorativos y estructura de bloque.";
      } else if (text.includes('futuro') || text.includes('futurista') || text.includes('holografico') || text.includes('neon') || text.includes('oscuro')) {
          templateId = 'holographic-1';
          response = "¡Viajando al futuro! 🚀 He cargado el tema **Holographic Future** con efectos neón.";
      } else if (text.includes('clasico') || text.includes('elegante') || text.includes('gold') || text.includes('dorado') || text.includes('oro')) {
          // Use minimal as base but apply gold theme
          templateId = 'minimal'; 
          response = "He aplicado un estilo **Clásico y Elegante** con toques dorados.";
          modifications.push({ type: 'color-theme', colors: { bg: '#fffbf0', primary: '#b45309', text: '#451a03' } });
      }

      // 2. Detect Layout
      if (text.includes('horizontal') || text.includes('paisaje')) {
          if (pageSize !== 'Landscape') {
             setPageSize('Landscape');
             response += " Y he cambiado la orientación a **Horizontal**.";
             // Force update if template is already loaded to re-layout
             if (!templateId) {
                 const current = templates.find(t => t.id === 'minimal'); // Fallback
                 if (current) loadTemplate(current.id, true, !shouldReset); 
             }
          }
      } else if (text.includes('vertical') || text.includes('retrato')) {
          if (pageSize !== 'Portrait') {
             setPageSize('Portrait');
             response += " Y he cambiado la orientación a **Vertical**.";
          }
      }

      // 3. Detect Modifications
      // Colors
      if (text.includes('azul') || text.includes('blue')) {
           modifications.push({ type: 'color-theme', colors: { bg: '#eff6ff', primary: '#2563eb', text: '#1e3a8a' } });
           response += " He ajustado la paleta a tonos azules profesionales.";
      } else if (text.includes('rojo') || text.includes('red') || text.includes('vino')) {
           modifications.push({ type: 'color-theme', colors: { bg: '#fff1f2', primary: '#be123c', text: '#881337' } });
           response += " He aplicado una paleta en tonos vino y rojo.";
      } else if (text.includes('verde') || text.includes('green') || text.includes('eco')) {
           modifications.push({ type: 'color-theme', colors: { bg: '#f0fdf4', primary: '#15803d', text: '#14532d' } });
           response += " He aplicado un estilo ecológico en verde.";
      }

      // Elements
      if (text.includes('firma') || text.includes('firmas')) {
          modifications.push({ type: 'add-element', element: 'signature-line' });
          response += " He añadido una línea de firma adicional.";
      }
      if (text.includes('sello') || text.includes('seal') || text.includes('logo')) {
          modifications.push({ type: 'add-element', element: 'seal' });
          response += " He añadido un sello de validación.";
      }
      if (text.includes('borde') || text.includes('marco')) {
          modifications.push({ type: 'add-element', element: 'border' });
          response += " He añadido un borde ornamental.";
      }

      // Text Content
      if (text.includes('cambiar titulo') || (text.includes('titulo') && text.includes('sea'))) {
          // Try to extract content between quotes first
          let newTitle = null;
          const quoteMatch = text.match(/["']([^"']+)["']/);
          if (quoteMatch) {
              newTitle = quoteMatch[1];
          } else {
             // Fallback: try to get text after "titulo"
             const parts = text.split('titulo');
             if (parts.length > 1) {
                 const potential = parts[1].trim().replace(/^a |^sea |^por /, '');
                 if (potential.length > 3) newTitle = potential;
             }
          }
          
          if (newTitle) {
              modifications.push({ type: 'update-text', target: 'title-main', value: newTitle.toUpperCase() });
              response += ` He actualizado el título a "${newTitle}".`;
          }
      }

      // Institution Name
      if (text.includes('institucion') || text.includes('universidad') || text.includes('colegio') || text.includes('escuela') || text.includes('instituto') || text.includes('academia')) {
          let newInstitution = null;
          const quoteMatch = text.match(/["']([^"']+)["']/);
          if (quoteMatch) {
              newInstitution = quoteMatch[1];
          } else {
             // Fallback: try to get text after keywords
             const keywords = ['institucion', 'universidad', 'colegio', 'escuela', 'instituto', 'academia'];
             for (const keyword of keywords) {
                 if (text.includes(keyword)) {
                     const parts = text.split(keyword);
                     if (parts.length > 1) {
                         const potential = parts[1].trim().replace(/^a |^la |^el |^del |^de |^sea |^por |^cambia |^nombre /, '');
                         if (potential.length > 3) {
                             newInstitution = potential;
                             break;
                         }
                     }
                 }
             }
          }
          
          if (newInstitution) {
              modifications.push({ type: 'update-text', target: 'institution-name', value: newInstitution.toUpperCase() });
              response += ` He actualizado el nombre de la institución a "${newInstitution}".`;
          }
      }

      // Execute Template Load
      if (templateId) {
          loadTemplate(templateId, false, !shouldReset);
      } else if (modifications.length === 0 && !text.includes('horizontal') && !text.includes('vertical')) {
          // Fallback for unknown commands
          const random = templates[Math.floor(Math.random() * templates.length)];
          loadTemplate(random.id, false, !shouldReset);
          response = `He creado algo único basado en el estilo **${random.name}**. ¿Qué te parece?`;
      }

      // Apply Modifications
      if (modifications.length > 0) {
          setTimeout(() => {
              applyAIModifications(modifications);
          }, templateId ? 800 : 100); // Wait for template load if needed
      }
      
      return response;
  };

  const handleAISend = async () => {
      if (!chatInput.trim()) return;
      
      const userText = chatInput;
      setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
      setChatInput('');
      setIsAiTyping(true);

      // Try n8n AI First
      const n8nResponse = await n8nService.processAIChat(userText, {
          currentPageSize: pageSize,
          currentTemplate: selectedObject?.id || 'unknown',
          institutionName: institutionName
      });

      if (n8nResponse) {
          setIsAiTyping(false);
          setChatMessages(prev => [...prev, { role: 'ai', text: n8nResponse.message || "He procesado tu solicitud." }]);
          
          if (n8nResponse.modifications && Array.isArray(n8nResponse.modifications)) {
              applyAIModifications(n8nResponse.modifications);
              toast.success('Diseño actualizado por IA (Nube)', { icon: '☁️' });
          }
      } else {
          // Local Simulation Fallback
          const aiResponse = processAICommand(userText);
          setIsAiTyping(false);
          setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
          toast.success('Diseño actualizado por IA (Local)', { icon: '✨' });
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
            if (window.confirm("¿Estás seguro de eliminar el fondo?")) {
                fabricCanvas.remove(obj);
            }
        } else {
            // Check if object is ActiveSelection (multi-selection)
            if (obj.type === 'activeSelection' && obj._objects) {
                const objectsToDelete = [...obj._objects]; // Clone array
                fabricCanvas.discardActiveObject();
                objectsToDelete.forEach(o => fabricCanvas.remove(o));
            } else {
                fabricCanvas.remove(obj);
            }
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

  const loadDefaultDesign = (type = 'Certificado') => {
      if (!fabricCanvas || !fabricCanvas.contextContainer) return;

      try {
        skipHistoryRef.current = true;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = '#fdfbf7'; // Cream/Parchment color
        
        // Ensure A4 Landscape dimensions
        const width = 1123;
        const height = 794;
        fabricCanvas.setDimensions({ width, height });
        setPageSize('Landscape');
        
        // Round to nearest integer for pixel-perfect rendering
        const cx = Math.round(width / 2);
        const cy = Math.round(height / 2);

        // Helper for sharp rendering (odd strokes need 0.5 offset to land on pixels)
        const sharp = (val, stroke) => stroke % 2 !== 0 ? val + 0.5 : val;

        // 1. Ornamental Border (Elegant Double Border)
        // Using center origin for perfect symmetry
        const outerStroke = 5;
        const outerBorder = new Rect({
            left: sharp(cx, outerStroke), 
            top: sharp(cy, outerStroke),
            width: width - 80, height: height - 80,
            fill: 'transparent',
            stroke: '#d4af37', // Gold
            strokeWidth: outerStroke,
            selectable: false,
            evented: false,
            rx: 10, ry: 10,
            originX: 'center', originY: 'center',
            data: { name: 'Borde Exterior' }
        });
        
        const innerStroke = 2;
        const innerBorder = new Rect({
            left: sharp(cx, innerStroke), 
            top: sharp(cy, innerStroke),
            width: width - 110, height: height - 110,
            fill: 'transparent',
            stroke: '#1a1a1a', // Black detail
            strokeWidth: innerStroke,
            selectable: false,
            evented: false,
            rx: 5, ry: 5,
            originX: 'center', originY: 'center',
            data: { name: 'Borde Interior' }
        });

        fabricCanvas.add(outerBorder, innerBorder);

        // 2. Header / Institution (Top Section)
        const displayInstitutionName = institutionName === '444' ? 'AcademicChain Ledger' : institutionName;
        const institutionText = new IText(displayInstitutionName.toUpperCase(), {
            left: cx, top: 120,
            fontSize: 32,
            fontFamily: 'Times New Roman',
            fill: '#2c3e50',
            fontWeight: 'bold',
            originX: 'center',
            charSpacing: 100, 
            data: { name: 'Institución', isInstitution: true }
        });

        // 3. Document Title
        const titleText = new IText(type.toUpperCase(), {
            left: cx, top: 220,
            fontSize: 56,
            fontFamily: 'Helvetica', 
            fill: '#1a1a1a',
            fontWeight: 'bold',
            originX: 'center',
            shadow: new Shadow({ color: 'rgba(0,0,0,0.1)', blur: 4, offsetX: 2, offsetY: 2 }),
            data: { name: 'Título Principal', isTitle: true }
        });

        // 4. Presentation Line
        const presentText = new IText('Se otorga el presente reconocimiento a:', {
            left: cx, top: 320,
            fontSize: 20,
            fontFamily: 'Times New Roman',
            fontStyle: 'italic',
            fill: '#555',
            originX: 'center',
            data: { name: 'Texto Presentación' }
        });

        // 5. Student Name 
        const studentName = new IText('{{STUDENT_NAME}}', {
            left: cx, top: 380,
            fontSize: 48,
            fontFamily: 'Times New Roman',
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: '#d4af37', 
            originX: 'center',
            underline: false,
            data: { isSmart: true, name: 'Nombre Alumno' }
        });
        
        // Underline for name
        const nameLineH = 2; // Even height
        const nameLine = new Rect({
             left: cx, top: sharp(440, nameLineH),
             width: 500, height: nameLineH,
             fill: '#d4af37',
             originX: 'center', originY: 'center',
             selectable: false,
             data: { name: 'Línea Nombre' }
        });

        // 6. Reason / Degree
        const reasonText = new IText('Por haber completado satisfactoriamente el programa de:', {
            left: cx, top: 480,
            fontSize: 20,
            fontFamily: 'Times New Roman',
            fill: '#555',
            originX: 'center',
            data: { name: 'Texto Razón' }
        });
        
        const degreeText = new IText('{{DEGREE}}', {
            left: cx, top: 530,
            fontSize: 32,
            fontWeight: 'bold',
            fontFamily: 'Helvetica',
            fill: '#2c3e50',
            originX: 'center',
            data: { isSmart: true, name: 'Grado/Curso' }
        });

        // 7. Date
        const dateText = new IText('Expedido el: {{DATE}}', {
            left: cx, top: 600,
            fontSize: 16,
            fontFamily: 'Times New Roman',
            fill: '#777',
            originX: 'center',
            data: { isSmart: true, name: 'Fecha' }
        });

        // 8. Signatures (Perfectly aligned)
      const sigY = height - 120;
      const sig1X = Math.round(width * 0.25);
      const sig2X = Math.round(width * 0.75);
      const sigLineH = 1; // Odd height

      const sigLine1 = new Rect({
          left: sig1X, top: sharp(sigY, sigLineH),
          width: 260, height: sigLineH,
          fill: '#333',
          originX: 'center', originY: 'center',
          data: { type: 'sig-line-1' }
      });
      const sigText1 = new IText('Firma del Director', {
          left: sig1X, top: sigY + 15,
          fontSize: 16, originX: 'center', fill: '#444', fontFamily: 'Times New Roman',
          data: { type: 'sig-text-1' }
      });

      const sigLine2 = new Rect({
          left: sig2X, top: sharp(sigY, sigLineH),
          width: 260, height: sigLineH,
          fill: '#333',
          originX: 'center', originY: 'center',
          data: { type: 'sig-line-2' }
      });
      const sigText2 = new IText('Firma del Instructor', {
          left: sig2X, top: sigY + 15,
          fontSize: 16, originX: 'center', fill: '#444', fontFamily: 'Times New Roman',
          data: { type: 'sig-text-2' }
      });

      // 9. QR Code 
      const qrSize = 100;
      const qrX = cx; 
      const qrY = height - 120;

      // QR Background (White box with gold border)
      const qrBg = new Rect({
          left: qrX, top: qrY,
          width: qrSize + 10, height: qrSize + 10,
          fill: '#ffffff',
          stroke: '#d4af37',
          strokeWidth: 2,
          originX: 'center', originY: 'center',
          rx: 5, ry: 5,
          data: { isQR: true, name: 'Fondo QR', type: 'qr-bg' }
      });

      // Add all static elements first
      fabricCanvas.add(
        institutionText, titleText, presentText, 
        studentName, nameLine, reasonText, degreeText, dateText,
        sigLine1, sigText1, sigLine2, sigText2,
        qrBg
      );

      // Add verification text below QR
      const qrLabel = new IText('ESCANEAR', {
          left: qrX, top: qrY + 60,
          fontSize: 10, fill: '#777',
          originX: 'center',
          fontFamily: 'Helvetica',
          data: { name: 'Etiqueta QR' }
      });
      fabricCanvas.add(qrLabel);

      // Try to load QR Image
      FabricImage.fromURL('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/200px-QR_code_for_mobile_English_Wikipedia.svg.png', {
        crossOrigin: 'anonymous'
      }).then(img => {
          img.set({
              left: qrX, top: qrY,
              originX: 'center', originY: 'center',
              width: qrSize, height: qrSize,
              data: { isQR: true, name: 'QR Code', type: 'qr-placeholder' }
          });
          fabricCanvas.add(img);
          fabricCanvas.requestRenderAll();
          updateLayers();
          
          skipHistoryRef.current = false;
          saveHistory();
      }).catch(err => {
          console.warn("Could not load QR image, skipping", err);
          fabricCanvas.requestRenderAll();
          updateLayers();
          skipHistoryRef.current = false;
          saveHistory();
      });

      } catch(e) {
        console.error("Error loading default design", e);
        skipHistoryRef.current = false;
      }
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

  // Load Default or Initial Design
  useEffect(() => {
      if (fabricCanvas && !data?.designStructure) {
          if (fabricCanvas.getObjects().length === 0) {
              if (initialDesign && initialDesign.structure) {
                  try {
                      skipHistoryRef.current = true;
                      fabricCanvas.loadFromJSON(initialDesign.structure, () => {
                          fabricCanvas.renderAll();
                          if (initialDesign.structure.background) {
                              fabricCanvas.backgroundColor = initialDesign.structure.background;
                          }
                          // Manually trigger layer update
                          const objects = fabricCanvas.getObjects();
                          setLayers([...objects].reverse());
                          
                          skipHistoryRef.current = false;
                          saveHistory();
                          toast.success('Diseño anterior restaurado');
                      });
                  } catch (e) {
                      console.error("Error loading initial design", e);
                      skipHistoryRef.current = false;
                      loadDefaultDesign('Certificado');
                  }
              } else {
                  loadDefaultDesign('Certificado');
                  toast('Plantilla predeterminada cargada', { icon: 'ℹ️' });
              }
          }
      }
  }, [fabricCanvas, initialDesign]);

  useEffect(() => {
    if (fabricCanvas) {
      const update = () => {
        const objects = fabricCanvas.getObjects();
        setLayers([...objects].reverse());
      };

      const handleModification = () => {
          update();
          saveHistory();
      };

      fabricCanvas.on('object:added', handleModification);
      fabricCanvas.on('object:removed', handleModification);
      fabricCanvas.on('object:modified', handleModification);
      fabricCanvas.on('selection:updated', update);
      
      const realtimeUpdate = () => setForceUpdate(prev => prev + 1);
      fabricCanvas.on('object:moving', realtimeUpdate);
      fabricCanvas.on('object:scaling', realtimeUpdate);
      fabricCanvas.on('object:rotating', realtimeUpdate);
      fabricCanvas.on('object:skewing', realtimeUpdate);

      // Initial save removed to prevent empty state in history
      update();

      return () => {
        fabricCanvas.off('object:added', handleModification);
        fabricCanvas.off('object:removed', handleModification);
        fabricCanvas.off('object:modified', handleModification);
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
              obj.text = institutionName.toUpperCase();
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

  // Canvas scale for "Zoom to Fit"
  const [scaleFactor, setScaleFactor] = useState(1);

  // Auto-fit calculation
  useEffect(() => {
    if (!containerRef.current || !fabricCanvas) return;

    const resizeObserver = new ResizeObserver(() => {
        const containerWidth = containerRef.current.clientWidth - 80; // Padding
        const containerHeight = containerRef.current.clientHeight - 80;
        
        // Dynamic target based on orientation
        const targetWidth = pageSize === 'Portrait' ? 794 : 1123;
        const targetHeight = pageSize === 'Portrait' ? 1123 : 794;

        const scaleX = containerWidth / targetWidth;
        const scaleY = containerHeight / targetHeight;
        
        // Use the smaller scale to fit entirely
        let newScale = Math.min(scaleX, scaleY);
        // Cap max scale to avoid pixelation but allow full view
        if (newScale > 1.2) newScale = 1.2; 
        
        setScaleFactor(newScale);
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [fabricCanvas, pageSize]);

  useEffect(() => {
    if (containerRef.current && canvasRef.current) {
      // Initialize with a temporary size, will be resized by loadDefaultDesign or changePageSize
      const canvas = new Canvas(canvasRef.current, {
        width: 800, 
        height: 600,
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

  /* funciones no usadas eliminadas para limpiar advertencias */




  const deleteSelected = () => {
    if (fabricCanvas && selectedObject) {
      if (selectedObject.type === 'activeSelection' && selectedObject._objects) {
          const objectsToDelete = [...selectedObject._objects];
          fabricCanvas.discardActiveObject();
          objectsToDelete.forEach(o => fabricCanvas.remove(o));
          setSelectedObject(null);
      } else {
          fabricCanvas.remove(selectedObject);
          setSelectedObject(null);
      }
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
      
      const oldWidth = fabricCanvas.width;
      const oldHeight = fabricCanvas.height;

      // Prevent redundant updates
      if ((size === 'Landscape' && oldWidth > oldHeight) || 
          (size === 'Portrait' && oldWidth < oldHeight)) {
           // Double check exact dimensions
           if (size === 'Landscape' && oldWidth === 1123) return;
           if (size === 'Portrait' && oldWidth === 794) return;
      }

      setPageSize(size);
      
      let width = 1123;
      let height = 794;

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
      
      const cx = width / 2;
      const cy = height / 2;
      
      const oldCx = oldWidth / 2;
      
      // Sidebar Detection
      const sidebarObj = fabricCanvas.getObjects().find(o => o.data?.type === 'sidebar-left');
      const sidebarWidth = sidebarObj ? (sidebarObj.width * sidebarObj.scaleX) : 0;
      
      // Printable Center (center of the area to the right of sidebar)
      const printableCx = sidebarObj ? (sidebarWidth + (width - sidebarWidth) / 2) : cx;
      const oldPrintableCx = sidebarObj ? (sidebarWidth + (oldWidth - sidebarWidth) / 2) : oldCx;

      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;

      // Smart Recenter & Resize Logic
      fabricCanvas.getObjects().forEach(obj => {
          let type = obj.data?.type || '';

          // Heuristics for legacy objects
          if (!type) {
            if (obj.data?.isQR) type = 'qr-placeholder';
            else if (obj.text === 'Firma del Director' || obj.text === 'Firma del Instructor') type = 'sig-text';
            else if (obj.type === 'rect' && obj.width === 260 && obj.height === 1 && obj.fill === '#333') type = 'sig-line';
          }

          // 1. Backgrounds & Full Size Overlays
          if (['background-shape', 'background-main'].includes(type)) {
              obj.set({ width: width, height: height, left: cx, top: cy, scaleX: 1, scaleY: 1 });
          }
          else if (['grid-border', 'glow-border', 'background-panel', 'border-outer', 'border-mid', 'border-inner'].includes(type)) {
              // Maintain margins
              const marginX = oldWidth - (obj.width * obj.scaleX);
              const marginY = oldHeight - (obj.height * obj.scaleY);
              
              const newW = width - marginX;
              const newH = height - marginY;
              
              obj.set({ 
                  width: newW, 
                  height: newH, 
                  left: cx, 
                  top: cy,
                  scaleX: 1,
                  scaleY: 1
              });
          }
          
          // 2. Sidebars
          else if (type === 'sidebar-left') {
              obj.set({ height: height, top: cy, left: (obj.width * obj.scaleX) / 2 }); 
          }
          
          // 3. Header Bars / Top Bars
          else if (['header-bar', 'top-bar', 'header-bg', 'hud-bg'].includes(type)) {
               // If it's a full width header or specific bar
               if (type === 'header-bar') {
                   const margin = oldWidth - (obj.width * obj.scaleX);
                   const isCenteredOnPage = Math.abs(obj.left - oldCx) < 10;
                   const isCenteredOnPrintable = Math.abs(obj.left - oldPrintableCx) < 10;

                   obj.set({ width: width - margin });
                   
                   if (isCenteredOnPage) {
                       obj.set({ left: cx });
                   } else if (isCenteredOnPrintable) {
                       obj.set({ left: printableCx });
                   } else {
                       obj.set({ left: sidebarObj ? printableCx : cx });
                   }
               } else {
                   obj.set({ left: printableCx });
               }
          }
          else if (['logo-sidebar', 'logo-bg', 'logo-text'].includes(type)) {
               if (sidebarObj) {
                   obj.set({ left: sidebarWidth / 2 });
               } else {
                   obj.set({ left: 50 });
               }
          }
          
          // 4. Background Lines
          else if (['bg-line-h'].includes(type)) {
               obj.set({ x2: width, top: cy });
          }
          else if (['bg-line-v'].includes(type)) {
               obj.set({ y2: height, left: cx });
          }

          // 5. Corners (Smart Anchors)
          else if (type.startsWith('corner-')) {
               const isLeft = type.includes('-l') || obj.left < oldWidth / 2;
               const isTop = type.includes('-t') || obj.top < oldHeight / 2;
               
               const marginX = isLeft ? obj.left : (oldWidth - obj.left);
               const marginY = isTop ? obj.top : (oldHeight - obj.top);
               
               obj.set({ 
                   left: isLeft ? marginX : (width - marginX),
                   top: isTop ? marginY : (height - marginY)
               });
          }

          // 6. QR / Signatures / Footer (Bottom Anchored)
          else if (type.includes('qr-') || type.includes('sig-') || type.includes('text-footer') || obj.top > oldHeight * 0.75) {
               if (obj.top > oldHeight * 0.6) { 
                   const bottomMargin = oldHeight - obj.top;
                   const newTop = height - bottomMargin;
                   
                   if (type.includes('qr-')) {
                       if (size === 'Portrait') {
                           // Ensure QR is well below signatures but above footer
                           obj.set({ left: printableCx, top: height - 140 });
                           // Scale down slightly to fit better
                           obj.scale(0.8); 
                       } else {
                            // Center QR in Landscape (Gold Standard Layout)
                            obj.set({ left: printableCx, top: height - 114 });
                            obj.scale(1); // Restore size
                        }
                   } else if (type.includes('sig-')) {
                       // Reset width for lines to ensure consistency
                       if (type.includes('line')) {
                           obj.set({ width: 220, scaleX: 1 });
                       }

                       const isLine = type.includes('line');
                       const offset = isLine ? 0 : 20;

                       // Check for explicit Left/Right signatures (-1, -2)
                       if (type.includes('-1')) {
                           // Left Signature
                           if (size === 'Portrait') {
                               // Side-by-Side Tighter (Vertical Mode)
                               obj.set({ left: printableCx - 180, top: height - 250 + offset });
                           } else {
                               // Side-by-Side Wider (Horizontal Mode)
                               obj.set({ left: printableCx - 220, top: height - 150 + offset });
                           }
                       } else if (type.includes('-2')) {
                           // Right Signature
                           if (size === 'Portrait') {
                               // Side-by-Side Tighter (Vertical Mode)
                               obj.set({ left: printableCx + 180, top: height - 250 + offset });
                           } else {
                               // Side-by-Side Wider (Horizontal Mode)
                               obj.set({ left: printableCx + 220, top: height - 150 + offset });
                           }
                       } else {
                           // Single / Center Signature (e.g., Minimal Template)
                           if (size === 'Portrait') {
                               obj.set({ left: printableCx, top: height - 320 + offset });
                           } else {
                               obj.set({ left: printableCx, top: height - 150 + offset });
                           }
                       }
                   } else {
                        // Footer Text
                        if (size === 'Portrait') {
                            if (type.includes('text-footer')) {
                                if (type === 'text-footer-1') {
                                    obj.set({ top: height - 80, left: printableCx });
                                } else if (type === 'text-footer-2') {
                                    obj.set({ top: height - 50, left: printableCx });
                                } else {
                                    obj.set({ top: height - 50, left: printableCx });
                                }
                            } else {
                                // For other bottom elements (like seal), maintain margin
                                obj.set({ top: newTop, left: printableCx });
                            }
                        } else {
                            obj.set({ top: newTop, left: printableCx });
                        }
                    }
               }
          }

          // 7. General Content
          else {
              const offset = obj.left - oldPrintableCx;
              
              // Apply proportional vertical scaling to maintain relative layout
              const newTop = obj.top * scaleY;
              
              obj.set({ 
                  left: printableCx + offset,
                  top: newTop
              });
              
              // Maintain original text scale to prevent cumulative resizing issues
              // logic removed: if (size === 'Portrait' ...) obj.scale(...)
          }

          // Fallbacks
          if (obj.data?.name === 'Borde Exterior') {
              obj.set({ width: width - 80, height: height - 80, top: cy, left: cx });
          }
          if (obj.data?.name === 'Borde Interior') {
               obj.set({ width: width - 110, height: height - 110, top: cy, left: cx });
          }
          
          obj.setCoords();
      });

      fabricCanvas.requestRenderAll();
      toast.success(`Tamaño ajustado a ${size}`);
      saveHistory();
  };

  const updateDocType = (type) => {
      setDocType(type);
      if (!fabricCanvas || !fabricCanvas.contextContainer) return;
      
      const objects = fabricCanvas.getObjects();
      
      // 1. Find Title Object (Smart Search)
      // Look for explicit type 'title-main' or 'isTitle' flag
      let titleObj = objects.find(o => o.data?.type === 'title-main' || o.data?.isTitle);
      
      // Fallback: Try to find by content heuristic if explicit type is missing
      if (!titleObj) {
          titleObj = objects.find(o => 
             (o.type === 'i-text' || o.type === 'text') && 
             (o.text?.includes('CERTIFICADO') || o.text?.includes('DIPLOMA') || o.text?.includes('CREDENCIAL') || o.text?.includes('CONSTANCIA'))
          );
      }

      if (titleObj) {
          const current = titleObj.text;
          const upperType = type.toUpperCase();
          
          let newText = upperType;
          
          // Smart Context Preservation (Mantener el formato y sufijos)
          if (current.includes('FINALIZACIÓN')) newText += ' DE FINALIZACIÓN';
          else if (current.includes('HONOR')) newText += ' DE HONOR';
          else if (current.includes('ACTIVO DIGITAL')) newText += ' DE ACTIVO DIGITAL';
          else if (current.includes('EXCELENCIA')) newText += ' DE EXCELENCIA';
          else if (current.includes('PARTICIPACIÓN')) newText += ' DE PARTICIPACIÓN';
          else if (current.includes('MÉRITO')) newText += ' AL MÉRITO';
          
          // Gender handling for "Verificada/o"
          else if (current.includes('VERIFICADA') || current.includes('VERIFICADO')) {
              const isFem = ['CONSTANCIA', 'CREDENCIAL'].includes(upperType);
              newText += isFem ? ' VERIFICADA' : ' VERIFICADO';
          }
          
          // Apply change
          titleObj.set('text', newText);
          
          // Ensure metadata is set for future reference
          if (!titleObj.data) titleObj.data = {};
          titleObj.data.isTitle = true;
          titleObj.data.type = 'title-main'; 
          
          fabricCanvas.requestRenderAll();
          toast.success(`Título actualizado a: ${newText}`);
          saveHistory();
      } else {
          // If absolutely no title found, add one (fallback)
          const text = new IText(type.toUpperCase(), {
              left: fabricCanvas.width / 2,
              top: 100,
              fontSize: 40,
              fontFamily: 'Orbitron',
              fill: '#000000',
              originX: 'center',
              originY: 'center',
              fontWeight: 'bold',
              data: { type: 'title-main', isTitle: true }
          });
          fabricCanvas.add(text);
          fabricCanvas.requestRenderAll();
          toast.success(`Título creado: ${type.toUpperCase()}`);
          saveHistory();
      }
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

  const loadTemplate = (templateId, skipConfirm = false, preserveContent = true) => {
    if (!fabricCanvas) return;
    const allTemplates = [...templates, ...customTemplates];
    const tmpl = allTemplates.find(t => t.id === templateId);
    if (!tmpl) return;

    if (!skipConfirm && !window.confirm(`¿Cargar plantilla "${tmpl.name}"? Se reemplazará el diseño actual.`)) return;

    skipHistoryRef.current = true;
    try {
        // 1. Preserve content if requested
        const preservedData = {};
        if (preserveContent) {
            fabricCanvas.getObjects().forEach(obj => {
                if (obj.data?.type) {
                    // Save text content for semantic types
                    if (obj.type === 'i-text' || obj.type === 'text') {
                        preservedData[obj.data.type] = obj.text;
                    }
                }
            });
        }

        let targetObjects = tmpl.objects;
        let targetSize = tmpl.pageSize || 'Portrait';

        // Smart Layout Selection: Use specific layout if available and matches current orientation
        // This ensures "Gold Standard" loads its optimized landscape version if user is in landscape mode
        if (pageSize === 'Landscape' && tmpl.layouts && tmpl.layouts.landscape) {
             targetObjects = tmpl.layouts.landscape;
             targetSize = 'Landscape';
        }

        // Set dimensions directly
        setPageSize(targetSize);
        const width = targetSize === 'Landscape' ? 1123 : 794;
        const height = targetSize === 'Landscape' ? 794 : 1123;
        fabricCanvas.setDimensions({ width, height });

        if (tmpl.docType) setDocType(tmpl.docType);

        fabricCanvas.clear();
        fabricCanvas.backgroundColor = tmpl.bg;
        fabricCanvas.requestRenderAll();

        targetObjects.forEach(obj => {
        const { type, text, ...options } = obj;
        let textContent = text;

        // 2. Restore preserved content or apply defaults
        if (preserveContent && options.data?.type && preservedData[options.data.type]) {
            textContent = preservedData[options.data.type];
        } else if (options.data?.type === 'institution-name') {
             textContent = (institutionName === '444' ? 'AcademicChain Ledger' : institutionName).toUpperCase();
        }

        if (type === 'rect') {
            fabricCanvas.add(new Rect(options));
        } else if (type === 'i-text' || type === 'text') {
            const textOptions = { ...options };
            
            if (textContent && textContent.includes('{{')) {
            textOptions.data = { ...textOptions.data, isSmart: true };
            textOptions.editable = false;
            if (tmpl.category === 'Holographic') {
                textOptions.shadow = new Shadow({ color: textOptions.fill, blur: 10 });
            }
            }
            fabricCanvas.add(new IText(textContent || 'Texto', textOptions));
        } else if (type === 'image') {
             // Support for image objects (like QR codes in templates)
             FabricImage.fromURL(options.src, { crossOrigin: 'anonymous' }).then(img => {
                 img.set(options);
                 fabricCanvas.add(img);
             });
        } else if (type === 'circle') {
            fabricCanvas.add(new Circle(options));
        }
        });

        // Helper to ensure image loading doesn't race
        setTimeout(() => {
            fabricCanvas.requestRenderAll();
            saveHistory();
        }, 500);

        toast.success(`Plantilla cargada: ${tmpl.name}`);
        skipHistoryRef.current = false;
    } catch(e) {
        console.error("Error loading template", e);
        skipHistoryRef.current = false;
    }
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    
    // 1. Generate High Quality Image
    const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1.0, multiplier: 2 });

    // 2. Generate PDF
    const orientation = pageSize === 'Landscape' ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'pt', 'a4');
    
    // Add Metadata
    pdf.setProperties({
        title: 'Certificado Digital Verificable',
        subject: `Certificado emitido por ${institutionName}`,
        author: institutionName,
        keywords: 'certificado, blockchain, academicchain, verifiable credential, did',
        creator: 'AcademicChain Decentralized Ledger',
        producer: 'AcademicChain Designer'
    });
    
    // A4 dimensions in points: 595.28 x 841.89
    // Landscape: 841.89 x 595.28
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfBlob = pdf.output('blob');
    
    // Extract Student Name for filename
    let filenameStudent = '';
    const studentObj = fabricCanvas.getObjects().find(o => o.data?.type === 'student-name');
    if (studentObj && studentObj.text && !studentObj.text.includes('{{')) {
        filenameStudent = `-${studentObj.text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
    }
    
    // Auto-download for user
    const safeInstitution = institutionName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `certificado-${safeInstitution}${filenameStudent}-${Date.now()}.pdf`;
    
    pdf.save(filename);

    const jsonStructure = fabricCanvas.toJSON(['data']);
    const file = new File([pdfBlob], filename, { type: "application/pdf" });
    
    onSave(file, jsonStructure);
    onClose();
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
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-slate-900 w-full h-full flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden shadow-2xl"
      >

        {/* Left Sidebar - Controls */}
        <div className="w-full lg:w-80 h-auto lg:h-full bg-slate-950/90 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-md flex-shrink-0 order-2 lg:order-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎨</span>
            <h2 className="text-xl font-display font-bold text-white">Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Holográfico</span></h2>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
                onClick={handleExport}
                className="w-full py-4 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-900/20 group"
            >
                <Upload size={20} className="group-hover:scale-110 transition-transform" /> 
                <span>Guardar y Continuar</span>
            </button>

            <button
                onClick={togglePreviewMode}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border ${isPreviewMode ? 'bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
                {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                {isPreviewMode ? 'Volver a Editar' : 'Vista Previa'}
            </button>
          </div>

          {!isPreviewMode && (
          <>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-4">
             <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Configuración de Página</label>
                <div className="flex gap-2">
                    <button 
                        onClick={() => changePageSize('Landscape')}
                        className={`flex-1 py-2 rounded text-xs font-medium border ${pageSize === 'Landscape' ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                        Horizontal
                    </button>
                    <button 
                        onClick={() => changePageSize('Portrait')}
                        className={`flex-1 py-2 rounded text-xs font-medium border ${pageSize === 'Portrait' ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
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
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors border ${docType === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {type}
                    </button>
                ))}
             </div>
          </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <label className="flex-1 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-base rounded-xl text-center transition-all cursor-pointer border border-slate-700 hover:border-purple-500/50 flex items-center justify-center gap-2 group shadow-sm hover:shadow-purple-500/10">
                <FileUp size={20} className="text-purple-400 group-hover:text-purple-300 transition-colors" /> 
                <span className="group-hover:text-white transition-colors">Subir Fondo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
            </label>
            <label className="flex-1 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-base rounded-xl text-center transition-all cursor-pointer border border-slate-700 hover:border-cyan-500/50 flex items-center justify-center gap-2 group shadow-sm hover:shadow-cyan-500/10">
                <FileText size={20} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" /> 
                <span className="group-hover:text-white transition-colors">Subir PDF</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
            </label>
          </div>
          
          <button 
              onClick={() => {
                  loadDefaultDesign();
                  toast.success('Plantilla Recomendada cargada');
              }}
              className="w-full mb-2 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-base rounded-xl text-center transition-all cursor-pointer border border-orange-500/50 flex items-center justify-center gap-2 group shadow-lg shadow-orange-900/20"
          >
              <span className="text-xl">⭐</span>
              <span className="group-hover:text-white transition-colors">Recomendado</span>
          </button>

          <button 
              onClick={() => setShowAIChat(true)}
              className="w-full mb-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base rounded-xl text-center transition-all cursor-pointer border border-purple-500/50 flex items-center justify-center gap-2 group shadow-lg shadow-purple-900/20"
          >
              <span className="text-xl">✨</span>
              <span className="group-hover:text-white transition-colors">Generar con IA</span>
          </button>

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


          </>
          )}


        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 min-w-0 w-full min-h-[50vh] lg:min-h-0 bg-slate-900 relative flex items-center justify-center p-8 bg-grid-slate-800/[0.2] order-1 lg:order-2" ref={containerRef}>
          <div 
             className="shadow-2xl ring-1 ring-slate-700/50 transition-transform duration-300 origin-center"
             style={{ transform: `scale(${scaleFactor})` }}
          >
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
        <div className="flex w-full lg:w-auto h-auto lg:h-full backdrop-blur-md bg-slate-950/90 border-l border-slate-800 z-20 flex-shrink-0 order-3 lg:order-3">
             <div className="w-full lg:w-80 flex flex-col bg-slate-950/50 overflow-hidden">
            
             {/* Horizontal Quick Tools Strip */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800 bg-slate-900/80 items-center">
                <div className="flex items-center gap-2 mr-auto">
                    <button onClick={undo} disabled={history.length <= 1} className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-700" title="Deshacer">
                        <Undo2 size={18} />
                        <span className="absolute top-full mt-1 left-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Deshacer</span>
                    </button>
                    
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    
                    <button onClick={redo} disabled={redoHistory.length === 0} className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-700" title="Rehacer">
                        <Redo2 size={18} />
                        <span className="absolute top-full mt-1 left-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Rehacer</span>
                    </button>
                </div>

                <div className="w-px bg-slate-700 mx-2 self-stretch"></div>
                <button onClick={() => addText()} className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center" title="Agregar Texto">
                    <Type size={18} />
                    <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Texto</span>
                </button>
                <button onClick={addRect} className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center" title="Agregar Rectángulo">
                    <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                    <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Rectángulo</span>
                </button>
                <label className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center" title="Subir Imagen">
                    <ImageIcon size={18} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Imagen</span>
                </label>
                <button onClick={() => fabricCanvas?.discardActiveObject().requestRenderAll()} className="group relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center" title="Deseleccionar">
                    <MousePointer2 size={18} />
                    <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700">Deseleccionar</span>
                </button>
                <button onClick={() => {
                    const activeObj = fabricCanvas?.getActiveObject();
                    if (activeObj) handleLayerAction('delete', activeObj);
                }} className="group relative p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors flex items-center justify-center" title="Eliminar (Supr)">
                    <Trash2 size={18} />
                    <span className="absolute top-full mt-1 right-0 px-2 py-1 bg-slate-900 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-slate-700 text-red-300">Eliminar</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
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
                             
                             <div className="grid grid-cols-2 gap-3 mb-4">
                               <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                   <label className="text-[10px] text-blue-400 uppercase font-bold flex items-center gap-1 mb-1">
                                       <ArrowRightFromLine size={10} /> Horizontal (X)
                                   </label>
                                   <input 
                                       type="number" 
                                       value={Math.round(selectedObject.left || 0)} 
                                       onChange={(e) => updateObjectProperty('left', parseFloat(e.target.value))}
                                       className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 transition-colors"
                                   />
                               </div>
                               <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                   <label className="text-[10px] text-purple-400 uppercase font-bold flex items-center gap-1 mb-1">
                                       <ArrowDownFromLine size={10} /> Vertical (Y)
                                   </label>
                                   <input 
                                       type="number" 
                                       value={Math.round(selectedObject.top || 0)} 
                                       onChange={(e) => updateObjectProperty('top', parseFloat(e.target.value))}
                                       className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-purple-500 transition-colors"
                                   />
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button 
                                    onClick={() => {
                                        if (fabricCanvas && selectedObject) {
                                            selectedObject.centerH();
                                            fabricCanvas.requestRenderAll();
                                            updateLayers();
                                        }
                                    }}
                                    className="py-2 px-3 bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 rounded text-[10px] text-slate-300 hover:text-blue-300 flex items-center justify-center gap-2 transition-all group"
                                    title="Centrar Horizontalmente"
                                >
                                    <AlignHorizontalJustifyCenter size={14} className="group-hover:scale-110 transition-transform" /> 
                                    <span>Centrar Horiz.</span>
                                </button>
                                <button 
                                    onClick={() => {
                                        if (fabricCanvas && selectedObject) {
                                            selectedObject.centerV();
                                            fabricCanvas.requestRenderAll();
                                            updateLayers();
                                        }
                                    }}
                                    className="py-2 px-3 bg-slate-800 hover:bg-purple-900/30 border border-slate-700 hover:border-purple-500/50 rounded text-[10px] text-slate-300 hover:text-purple-300 flex items-center justify-center gap-2 transition-all group"
                                    title="Centrar Verticalmente"
                                >
                                    <AlignVerticalJustifyCenter size={14} className="group-hover:scale-110 transition-transform" /> 
                                    <span>Centrar Vert.</span>
                                </button>
                            </div>

                            <div className="mb-4 bg-slate-900/50 p-2 rounded border border-slate-800">
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

                             <div className="grid grid-cols-2 gap-3 mb-4">
                               <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                   <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Ancho (W)</label>
                                   <input 
                                       type="number" 
                                       value={Math.round(selectedObject.getScaledWidth())} 
                                       onChange={(e) => updateObjectProperty('width', parseFloat(e.target.value))}
                                       className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 transition-colors"
                                   />
                               </div>
                               <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                                   <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Alto (H)</label>
                                   <input 
                                       type="number" 
                                       value={Math.round(selectedObject.getScaledHeight())} 
                                       onChange={(e) => updateObjectProperty('height', parseFloat(e.target.value))}
                                       className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-purple-500 transition-colors"
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
        </div>
        </div>
        )}

        {/* AI Chat Modal Overlay */}
        {showAIChat && (
            <div className="absolute bottom-4 right-4 z-50 w-80 md:w-96 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-purple-500/20">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border-b border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl animate-pulse">✨</span>
                        <div>
                            <h3 className="font-bold text-white text-sm">Asistente IA</h3>
                            <p className="text-[10px] text-purple-200">Diseño Generativo</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAIChat(false)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Chat Area */}
                <div 
                    ref={chatScrollRef}
                    className="flex-1 h-80 overflow-y-auto p-4 space-y-4 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-700"
                >
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-purple-600 text-white rounded-br-none' 
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                }`}
                            >
                                <div className="whitespace-pre-line">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    
                    {isAiTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-slate-900 border-t border-purple-500/20">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                            placeholder="Describe tu diseño ideal..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                            autoFocus
                        />
                        <button 
                            onClick={handleAISend}
                            disabled={!chatInput.trim() || isAiTyping}
                            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                        >
                            <ArrowRightFromLine className="rotate-180" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}

      </motion.div>
    </motion.div>
  );
};

export default CertificateDesigner;
