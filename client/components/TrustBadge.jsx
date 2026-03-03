import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Users, ExternalLink, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

/**
 * Dynamic Trust Badge (Sello de Calidad ACL)
 * Displays real-time reputation metrics anchored on blockchain.
 */
const TrustBadge = ({ institutionId, className = "" }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReputation = async () => {
            try {
                // In a real scenario, use the actual institution ID. 
                // For demo, if not provided, use a default or fetch 'current' user's institution
                const id = institutionId || 'inst-001'; 
                const res = await axios.get(`/api/institution/${id}/reputation`);
                
                if (res.data.success) {
                    setMetrics(res.data.metrics);
                } else {
                    setError("No data");
                }
            } catch (err) {
                console.error("Failed to fetch reputation:", err);
                setError("Connection Error");
            } finally {
                setLoading(false);
            }
        };

        fetchReputation();
        // Refresh every 5 minutes (aligned with Redis cache)
        const interval = setInterval(fetchReputation, 300000);
        return () => clearInterval(interval);
    }, [institutionId]);

    if (loading) return <div className="animate-pulse bg-slate-800/50 h-32 w-full rounded-xl"></div>;
    if (error) return null; // Hide if error to avoid ugly UI on external sites

    const { publicFaithCount, employabilityRate, networkStatus, topicId } = metrics;
    const isOperational = networkStatus === 'Operational';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative group overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-xl shadow-2xl ${className}`}
        >
            {/* Header / Status Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-slate-200 text-sm tracking-wide">ACL TRUST SEAL</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-full border border-slate-700/30">
                    <span className={`relative flex h-2 w-2`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOperational ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isOperational ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {networkStatus === 'Operational' ? 'Hedera Mainnet' : 'Network Issues'}
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 divide-x divide-slate-700/50">
                {/* Public Faith (Certificates) */}
                <div className="p-4 text-center hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-center mb-2">
                        <CheckCircle className="w-6 h-6 text-blue-400 opacity-80" />
                    </div>
                    <div className="text-2xl font-bold text-white tabular-nums">
                        {publicFaithCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                        Títulos Verificados
                    </div>
                </div>

                {/* Employability */}
                <div className="p-4 text-center hover:bg-slate-800/30 transition-colors">
                    <div className="flex justify-center mb-2">
                        <Users className="w-6 h-6 text-purple-400 opacity-80" />
                    </div>
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tabular-nums">
                        {employabilityRate}%
                    </div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                        Tasa Empleabilidad
                    </div>
                </div>
            </div>

            {/* Verification Footer */}
            <a 
                href={`https://hashscan.io/testnet/topic/${topicId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-slate-800/80 hover:bg-cyan-900/20 transition-all border-t border-slate-700/50 p-3 group-hover:border-cyan-500/30"
            >
                <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">
                    <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Validar en Blockchain
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-600 truncate group-hover:text-cyan-400/50 transition-colors">
                    Topic ID: {topicId}
                </div>
            </a>
        </motion.div>
    );
};

export default TrustBadge;
