import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Copy, BookOpen, User, Calendar, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEFAULT_TEMPLATES = [
  {
    id: 'tech_excellence',
    name: 'Excelencia Técnica',
    content: "Felicidades, {{student_name}}. El trayecto en la especialidad de {{degree}} ha sido exigente, pero tu dedicación en los laboratorios finales ha sido excepcional. Como reconocimiento a tu trayectoria académica en nuestra institución, te hacemos entrega de esta credencial inmutable."
  },
  {
    id: 'prof_degree',
    name: 'Grado Profesional',
    content: "Por haber cumplido satisfactoriamente con todos los requisitos académicos del programa de {{degree}}, y haber demostrado un alto compromiso ético y profesional, {{institution}} confiere el presente grado a {{student_name}}."
  },
  {
    id: 'short_course',
    name: 'Cursos Cortos',
    content: "Certificamos que {{student_name}} ha completado con éxito el curso intensivo de {{degree}}, adquiriendo competencias clave para el desarrollo profesional en la industria tecnológica."
  }
];

export default function NarrativeTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '' });
  const [previewData, setPreviewData] = useState({
    student_name: 'Ana García',
    degree: 'Ingeniería de Software',
    institution: 'AcademicChain University',
    fecha_expedicion: new Date().toLocaleDateString()
  });

  useEffect(() => {
    const saved = localStorage.getItem('academicNarratives');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('academicNarratives', JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, []);

  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem('academicNarratives', JSON.stringify(newTemplates));
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData({ name: template.name, content: template.content });
  };

  const handleCreate = () => {
    setEditingId('new');
    setFormData({ name: '', content: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta plantilla?')) {
      const newTemplates = templates.filter(t => t.id !== id);
      saveTemplates(newTemplates);
      toast.success('Plantilla eliminada');
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.content) {
      toast.error('Completa todos los campos');
      return;
    }

    if (editingId === 'new') {
      const newTemplate = {
        id: `tpl_${Date.now()}`,
        name: formData.name,
        content: formData.content
      };
      saveTemplates([...templates, newTemplate]);
      toast.success('Plantilla creada');
    } else {
      const newTemplates = templates.map(t => 
        t.id === editingId ? { ...t, name: formData.name, content: formData.content } : t
      );
      saveTemplates(newTemplates);
      toast.success('Plantilla actualizada');
    }
    setEditingId(null);
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + ` {{${variable}}} `
    }));
  };

  const getPreviewText = (content) => {
    let text = content;
    Object.entries(previewData).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return text;
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-cyan-400" />
            Gestor de Plantillas de Trayecto
          </h2>
          <p className="text-slate-400 text-sm">Crea narrativas personalizadas para tus emisiones masivas</p>
        </div>
        {!editingId && (
          <button 
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Narrativa
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Lista de Plantillas */}
        <div className={`flex-1 overflow-y-auto space-y-3 ${editingId ? 'hidden md:block md:w-1/3 md:flex-none' : ''}`}>
          {templates.map(template => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                editingId === template.id 
                  ? 'bg-cyan-500/10 border-cyan-500/50' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => !editingId && handleEdit(template)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold ${editingId === template.id ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {template.content}
                  </p>
                </div>
                {!editingId && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(template); }}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                      className="p-1.5 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {templates.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No hay plantillas creadas.
            </div>
          )}
        </div>

        {/* Editor */}
        <AnimatePresence mode="wait">
          {editingId && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-[2] bg-slate-900/50 border border-slate-700 rounded-xl p-6 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">
                  {editingId === 'new' ? 'Crear Nueva Plantilla' : 'Editar Plantilla'}
                </h3>
                <button 
                  onClick={() => setEditingId(null)}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nombre de la Plantilla</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input-primary w-full"
                    placeholder="Ej: Reconocimiento al Mérito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Contenido del Mensaje
                    <span className="text-xs text-slate-500 ml-2">(Usa las variables para personalizar)</span>
                  </label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <button onClick={() => insertVariable('student_name')} className="badge badge-outline cursor-pointer hover:bg-cyan-500/20 gap-1">
                      <User size={12} /> {{student_name}}
                    </button>
                    <button onClick={() => insertVariable('degree')} className="badge badge-outline cursor-pointer hover:bg-purple-500/20 gap-1">
                      <Award size={12} /> {{degree}}
                    </button>
                    <button onClick={() => insertVariable('institution')} className="badge badge-outline cursor-pointer hover:bg-blue-500/20 gap-1">
                      <BookOpen size={12} /> {{institution}}
                    </button>
                    <button onClick={() => insertVariable('fecha_expedicion')} className="badge badge-outline cursor-pointer hover:bg-green-500/20 gap-1">
                      <Calendar size={12} /> {{fecha_expedicion}}
                    </button>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="input-primary w-full h-48 font-mono text-sm"
                    placeholder="Escribe el mensaje aquí..."
                  />
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vista Previa</label>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {getPreviewText(formData.content)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setEditingId(null)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={18} /> Guardar Plantilla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
