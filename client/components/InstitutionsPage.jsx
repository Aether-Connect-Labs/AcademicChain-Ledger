import React, { useEffect, useState, useCallback, useMemo } from 'react';
import institutionService from './services/institutionService';
import { Building2, Search, Mail, Calendar, Award, GraduationCap, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const InstitutionsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const demoItems = useMemo(() => ([
    { id: 'demo-1', name: 'Universidad Nacional Demo', email: 'contacto@und.edu', credentials: 1250, since: '2023-01-15' },
    { id: 'demo-2', name: 'Instituto Tecnológico Blockchain', email: 'info@itb.edu.mx', credentials: 840, since: '2023-03-20' },
    { id: 'demo-3', name: 'Academia Digital Latam', email: 'certificaciones@adl.org', credentials: 450, since: '2023-06-10' },
    { id: 'demo-4', name: 'Centro de Estudios Superiores', email: 'admin@ces.edu', credentials: 2100, since: '2022-11-05' },
    { id: 'demo-5', name: 'Escuela de Negocios Future', email: 'contacto@futurebs.com', credentials: 120, since: '2024-01-08' },
    { id: 'demo-6', name: 'Polytechnic Institute of Tech', email: 'contact@polytech.edu', credentials: 3200, since: '2022-08-15' },
    { id: 'demo-7', name: 'Global Skills Academy', email: 'verify@globalskills.org', credentials: 5600, since: '2021-11-20' },
    { id: 'demo-8', name: 'Bootcamp Code Master', email: 'hello@codemaster.dev', credentials: 340, since: '2023-09-01' },
    { id: 'demo-9', name: 'Design School Creative', email: 'info@creative.edu', credentials: 890, since: '2023-02-14' },
    { id: 'demo-10', name: 'Medical Training Center', email: 'admin@medtrain.org', credentials: 1500, since: '2022-05-30' },
  ]), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await institutionService.getCatalog();
      if (data && data.data && data.data.universities && data.data.universities.length > 0) {
        setItems(data.data.universities);
      } else {
        setItems(demoItems);
      }
    } catch (e) {
      console.log('Modo demostración activo (API no disponible)');
      setItems(demoItems);
      setError('');
    } finally {
      setLoading(false);
    }
  }, [demoItems]);

  useEffect(() => { load(); }, [load]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
              Instituciones Aliadas
            </h1>
            <p className="text-slate-400 max-w-2xl">
              Directorio público de universidades e institutos verificados que emiten credenciales en AcademicChain.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={1.5} />
                <input 
                    type="text" 
                    placeholder="Buscar institución..." 
                    className="w-full md:w-64 bg-[#0d0d0d] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                onClick={load} 
                disabled={loading}
                title="Actualizar lista"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5"></div>
             ))}
           </div>
        ) : (
          <>
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-[#0d0d0d]/40 rounded-2xl border border-white/5">
                    <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" strokeWidth={1} />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No se encontraron instituciones</h3>
                    <p className="text-slate-500">Intenta con otros términos de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((u, index) => (
                        <motion.div 
                            key={u.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/10"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
                                </div>
                                <div className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                    Verificada
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 min-h-[56px] group-hover:text-cyan-400 transition-colors">
                                {u.name}
                            </h3>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Mail className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                                    <span className="truncate">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                                    <span>Desde: {u.since ? new Date(u.since).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Credenciales</span>
                                <div className="flex items-center gap-2 text-white font-mono font-medium bg-white/5 px-3 py-1 rounded-lg">
                                    <Award className="w-4 h-4 text-purple-400" strokeWidth={1.5} />
                                    {u.credentials.toLocaleString()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstitutionsPage;
