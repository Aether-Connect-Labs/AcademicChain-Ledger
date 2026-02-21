import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Activity, Target, Brain, Lock, 
  Briefcase, AlertCircle, BarChart2
} from 'lucide-react';
import n8nService from './services/n8nService';

const InstitutionAnalytics = ({ plan, onUpgrade }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
        const result = await n8nService.getInstitutionAnalytics('inst-123');
        if (result.success) {
            setData(result);
        }
    } catch (error) {
        console.error('Failed to load analytics', error);
    } finally {
        setLoading(false);
    }
  };

  const isLocked = plan?.analytics === 'basic';

  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Activity className="animate-spin mb-4 text-blue-500" size={32} />
              <p>Analizando datos de mercado con IA...</p>
          </div>
      );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
            title="Tasa de Empleabilidad Real" 
            value={`${data.employability.rate}%`} 
            subtitle="Alumnos validados por empresas"
            icon={<Briefcase className="text-blue-400" />} 
            trend={data.employability.trend}
        />
        <StatCard 
            title="Apariciones en Top Ranking" 
            value={data.perfectMatchStats.topRankCount} 
            subtitle="Perfect Match en búsquedas"
            icon={<Target className="text-purple-400" />} 
            trend="+12%"
        />
        <StatCard 
            title="Alumnos con Identidad Validada" 
            value={`${data.identityStats.percentage}%`} 
            subtitle={`${data.identityStats.verifiedStudents}/${data.identityStats.totalStudents} estudiantes`}
            icon={<Lock className="text-green-400" />} 
            trend="+8%"
        />
         <StatCard 
            title="Interés de Mercado" 
            value="Alto" 
            subtitle="Sectores activos: Fintech, Energy"
            icon={<TrendingUp className="text-orange-400" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Skills Gap Analysis */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Brain size={20} className="text-pink-500" />
                        Mapa de Habilidades Demandadas (IA)
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Comparativa: Lo que enseñas vs. Lo que buscan</p>
                </div>
            </div>

            <div className="space-y-6">
                {data.skillsGap.marketDemand.map((skill) => (
                    <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-slate-300">{skill.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${skill.gap < -10 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {skill.gap < 0 ? `Déficit ${Math.abs(skill.gap)}%` : 'Alineado'}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                            {/* Supply Bar */}
                            <div 
                                className="h-full bg-blue-500 rounded-l-full" 
                                style={{ width: `${skill.supply}%` }}
                                title={`Oferta Académica: ${skill.supply}%`}
                            ></div>
                             {/* Gap/Demand Indicator */}
                            <div 
                                className={`h-full ${skill.gap < 0 ? 'bg-red-500/50' : 'bg-green-500/50'}`} 
                                style={{ width: `${Math.abs(skill.gap)}%` }}
                                title={`Demanda de Mercado: ${skill.demand}%`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>Oferta Académica</span>
                            <span>Demanda Mercado</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                <AlertCircle className="text-yellow-500 shrink-0" size={20} />
                <div>
                    <h4 className="text-yellow-500 font-bold text-sm">Insight de Mercado</h4>
                    <p className="text-xs text-yellow-200/80 mt-1">
                        {data.skillsGap.insight}
                    </p>
                </div>
            </div>
        </div>

        {/* Industry Interest & Connection (Heatmap) */}
        <div className="space-y-6 relative">
             {isLocked && (
                <div className="absolute inset-0 z-20 backdrop-blur-sm bg-slate-900/60 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                    <Lock className="text-purple-500 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-white mb-2">Analíticas Avanzadas Bloqueadas</h3>
                    <p className="text-slate-300 text-center max-w-xs mb-6">
                        Actualiza al Plan Profesional para ver el Heatmap de Empleabilidad en tiempo real.
                    </p>
                    <button 
                        onClick={onUpgrade}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/50 transition-all"
                    >
                        Desbloquear Insights
                    </button>
                </div>
            )}

            <div className={`bg-slate-900 rounded-xl border border-slate-800 p-6 ${isLocked ? 'opacity-50 pointer-events-none filter blur-sm' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                     <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        Heatmap de Empleabilidad
                    </h3>
                    <span className="text-xs font-mono text-slate-500">LIVE DATA</span>
                </div>
               
                <p className="text-sm text-slate-400 mb-4">
                    Intensidad de demanda por sector industrial (Validación en tiempo real):
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                    {data.perfectMatchStats.industries.map((ind, i) => (
                        <div key={i} className="relative overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700 p-3 group hover:border-blue-500/50 transition-colors">
                            {/* Heatmap Background Intensity */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"
                                style={{ opacity: ind.value / 100 }}
                            ></div>
                            
                            <div className="relative z-10 flex justify-between items-center">
                                <span className="font-bold text-sm text-slate-200">{ind.name}</span>
                                <span className={`text-xs font-bold ${ind.growth.startsWith('+') ? 'text-green-400' : 'text-slate-500'}`}>
                                    {ind.growth}
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${ind.value > 80 ? 'bg-gradient-to-r from-orange-500 to-red-500' : ind.value > 50 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-500'}`}
                                    style={{ width: `${ind.value}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <Lock size={18} className="text-green-400" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Trust Score Institucional</div>
                        <div className="text-xl font-black text-white flex items-baseline gap-1">
                            {data.identityStats.trustScore || 92}/100
                            <span className="text-xs font-normal text-green-400 ml-1">
                                {plan?.id === 'enterprise' ? 'Nivel Premium' : plan?.id === 'professional' ? 'Nivel Profesional' : 'Nivel Básico'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 p-6 ${isLocked ? 'opacity-50 pointer-events-none filter blur-sm' : ''}`}>
                <h3 className="font-bold text-lg text-white mb-2">Acreditación & Evidencia</h3>
                <p className="text-sm text-slate-400 mb-4">
                    Utiliza estos datos como evidencia fidedigna para tus procesos de acreditación institucional.
                </p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <BarChart2 size={16} /> Descargar Reporte PDF
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
            {trend && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{trend}</span>}
        </div>
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-1">{title}</h3>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
);

export default InstitutionAnalytics;
