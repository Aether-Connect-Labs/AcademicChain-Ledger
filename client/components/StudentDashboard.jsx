import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Eye, CheckCircle, Shield, Award, Share2, Activity, Wallet, FileCheck, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const Stat = ({ value, label, icon: Icon, color = "cyan", delay = 0 }) => {
  const colorClasses = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border group-hover:scale-110 transition-transform ${colorClasses[color] || colorClasses.cyan}`}>
          {Icon && <Icon size={24} strokeWidth={1.5} />}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-slate-400 text-sm font-medium">{label}</div>
      </div>
    </motion.div>
  );
};

const CredentialItem = ({ title, id, hederaId, date, index }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
    className="group flex flex-col md:flex-row items-start md:items-center justify-between bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 p-4 rounded-xl transition-all duration-300 gap-4"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
        <Award className="text-cyan-400" size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{title}</div>
        <div className="text-xs text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-2">
            <span>ID: {id?.substring(0, 8)}...{id?.substring(id.length - 8)}</span>
            <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-700"></span>
            <span>{date}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
      <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-1.5">
        <CheckCircle size={12} strokeWidth={1.5} /> 
        <span>Verificada</span>
      </div>
      {hederaId && (
        <a 
          href={`https://hashscan.io/testnet/transaction/${hederaId}`} 
          target="_blank" 
          rel="noreferrer"
          className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
        >
          <ExternalLink size={12} strokeWidth={1.5} />
          <span>HashScan</span>
        </a>
      )}
    </div>
  </motion.div>
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
    // Simulate fetching data
    const fetchData = async () => {
        setStats({
            credentials: 2,
            verified: 2,
            views: Math.floor(Math.random() * 10) + 1
        });

        setCertificates([
            {
                id: "c3d5736dc8fca0dc60e27f6c2823ee3e1692b4d3faea837ea7d7cba10a9d236a",
                title: "Full Stack React Developer",
                hederaId: "0.0.4576394@1772487913.501",
                date: "2026-03-02"
            },
            {
                id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
                title: "Blockchain Architect",
                hederaId: "0.0.4576394@1772481234.123",
                date: "2025-12-15"
            }
        ]);
    };
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 pt-24 pb-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-2">
              Portal del Estudiante
            </h1>
            <p className="text-slate-400 text-lg">
              Gestiona tus credenciales académicas y reputación on-chain
            </p>
          </div>
          <Link to="/verify" className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
            <Shield size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            <span>Verificar Credencial</span>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Stat 
                value={stats.credentials} 
                label="Credenciales" 
                icon={Award} 
                color="cyan"
                delay={0.1}
            />
            <Stat 
                value={stats.verified} 
                label="Verificadas" 
                icon={CheckCircle} 
                color="emerald"
                delay={0.2}
            />
            <Stat 
                value={stats.views} 
                label="Visualizaciones" 
                icon={Eye} 
                color="blue"
                delay={0.3}
            />
            <Stat 
                value="Nivel 2" 
                label="Reputación" 
                icon={Activity} 
                color="purple"
                delay={0.4}
            />
        </div>

        {/* Credentials List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <FileCheck className="text-cyan-400" size={20} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Mis Certificados</h2>
                </div>
                <div className="flex gap-2">
                     <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Share2 size={20} strokeWidth={1.5} />
                     </button>
                     <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Wallet size={20} strokeWidth={1.5} />
                     </button>
                </div>
            </div>

            <div className="space-y-4">
                {certificates.map((cert, index) => (
                    <CredentialItem 
                        key={cert.id} 
                        {...cert} 
                        index={index}
                    />
                ))}
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;
