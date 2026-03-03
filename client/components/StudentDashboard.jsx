
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Eye, CheckCircle, Shield, Award } from 'lucide-react';
import axios from 'axios';

const Stat = ({ value, label, icon: Icon, color = "blue" }) => (
  <div className={`text-center glass-panel p-4 border border-${color}-500/20 bg-${color}-500/5`}>
    <div className="flex justify-center mb-2">
        {Icon && <Icon className={`text-${color}-400`} size={24} />}
    </div>
    <div className={`text-3xl font-bold text-${color}-400 font-display`}>{value}</div>
    <div className="text-slate-400 text-sm mt-1">{label}</div>
  </div>
);

const CredentialItem = ({ title, id, hederaId, date }) => (
  <div className="flex items-center justify-between glass-card p-4 hover:bg-white/5 transition-colors border border-slate-700/50">
    <div className="flex items-center gap-4">
        <div className="bg-blue-500/20 p-2 rounded-full text-blue-400">
            <Award size={20} />
        </div>
        <div>
            <div className="font-semibold text-white">{title}</div>
            <div className="text-xs text-slate-500 font-mono mt-1">ID: {id?.substring(0, 16)}...</div>
        </div>
    </div>
    <div className="text-right">
        <div className="px-3 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1">
            <CheckCircle size={12} /> Verificada
        </div>
        {hederaId && (
            <a 
                href={`https://hashscan.io/testnet/transaction/${hederaId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 mt-1 block"
            >
                Ver en Hedera
            </a>
        )}
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
      credentials: 0,
      verified: 0,
      views: 0
  });
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    // Simulate fetching data or fetch real data if user has ID
    // For demo, we'll use a mock if no real user data
    const fetchData = async () => {
        // Mock Data for "Real-time" feel
        setStats({
            credentials: 2,
            verified: 2,
            views: Math.floor(Math.random() * 10) + 1 // Dynamic "Views today"
        });

        setCertificates([
            {
                id: "c3d5736dc8fca0dc60e27f6c2823ee3e1692b4d3faea837ea7d7cba10a9d236a",
                title: "Full Stack React Developer",
                hederaId: "0.0.4576394@1772487913.501",
                date: "2026-03-02"
            },
            {
                id: "a1b2c3d4e5f6...",
                title: "Blockchain Architect",
                hederaId: "0.0.4576394@1772481234.123",
                date: "2025-12-15"
            }
        ]);
    };
    fetchData();
  }, [user]);

  return (
    <div className="container-responsive pb-10 pt-24 sm:pt-32 relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 font-display">
                Hola <span className="text-gradient">{user?.name || 'Estudiante'}</span>
            </h1>
            <p className="text-slate-400">Tu identidad digital y Smart CV en tiempo real.</p>
        </div>
        <div className="hidden md:block">
            <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-slate-300">Identidad Digital Activa</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat value={stats.credentials} label="Credenciales" icon={Award} color="blue" />
        <Stat value={stats.verified} label="Verificadas en Blockchain" icon={Shield} color="green" />
        <Stat value={stats.views} label="Visitas de Empleadores Hoy" icon={Eye} color="purple" />
      </div>

      <div className="glass-panel p-6 mb-8 border border-slate-700/50">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white font-display">Tus Certificados (Smart CV)</h2>
            <button className="btn-secondary text-sm">Compartir Perfil</button>
        </div>
        <div className="space-y-3">
            {certificates.map((cert, i) => (
                <CredentialItem key={i} {...cert} />
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield size={100} />
          </div>
          <h3 className="text-lg font-semibold text-primary-300 mb-2">Verificación Instantánea</h3>
          <p className="text-slate-300 mb-4 text-sm">
              Tu identidad está protegida por SHA-256 y anclada en Hedera.
              Cualquier empleador puede verificar tu título en segundos.
          </p>
          <Link to="/verificar" className="btn-primary inline-block text-sm">Probar Verificación</Link>
        </div>

        <div className="glass-card p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-2">Visibilidad de Perfil</h3>
          <p className="text-slate-400 mb-4 text-sm">
              Tu perfil ha aparecido en <strong>{stats.views} búsquedas</strong> de talento hoy.
              Mantén tus habilidades actualizadas para mejorar tu ranking.
          </p>
          <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <div className="text-xs text-slate-500 text-right">Alta Demanda</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
