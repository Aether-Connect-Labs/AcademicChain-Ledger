import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './useAuth';

/**
 * 🛡️ Live Block Visualizer
 * Futuristic component to visualize Triple Shield Consensus
 */
const LiveBlockVisualizer = ({ pendingTransaction }) => {
    const { user } = useAuth();
    const [blocks, setBlocks] = useState([]);

    // Simulation of incoming blocks
    useEffect(() => {
        const interval = setInterval(() => {
            const networks = ['Hedera', 'XRP', 'Algorand'];
            const network = networks[Math.floor(Math.random() * networks.length)];
            const id = Math.random().toString(36).substr(2, 9);

            // ... (rest of simulation logic)
            const newBlock = {
                id,
                network,
                timestamp: new Date().toLocaleTimeString(),
                status: 'PENDING',
                hash: Math.random().toString(36).substr(2, 16).toUpperCase()
            };

            setBlocks(prev => {
                const updated = [newBlock, ...prev].slice(0, 5);
                setTimeout(() => {
                    setBlocks(current => current.map(b =>
                        b.id === id ? { ...b, status: 'CONFIRMED' } : b
                    ));
                }, 1500);
                return updated;
            });
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const getNetworkColor = (net) => {
        switch (net) {
            case 'Hedera': return 'text-green-400 border-green-500/50';
            case 'XRP': return 'text-blue-400 border-blue-500/50';
            case 'Algorand': return 'text-cyan-400 border-cyan-500/50';
            case 'DESIGN': return 'text-purple-400 border-purple-500/80 bg-purple-900/20'; // Special style
            default: return 'text-slate-400 border-slate-500';
        }
    };

    // Merge pending transaction into view
    const displayBlocks = pendingTransaction
        ? [{
            id: 'design-preview',
            network: 'DESIGN',
            timestamp: 'NOW',
            status: 'READY_TO_MINT',
            hash: 'WAITING_FOR_SIG',
            preview: pendingTransaction.preview
        }, ...blocks.slice(0, 4)]
        : blocks;

    return (
        <div className="bg-[#050505] border border-white/10 rounded-xl shadow-2xl p-6 mb-8 relative overflow-hidden font-mono group">
            {/* Terminal Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] pointer-events-none bg-[length:100%_4px,6px_100%]"></div>
            <div className="absolute inset-0 bg-black/40 z-0"></div>

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none z-0"
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="flex justify-between items-end mb-6 relative z-10 border-b border-white/10 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-3 tracking-wider">
                        <span className="animate-pulse text-emerald-400 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span> 
                        TRIPLE_SHIELD_CONSENSUS_V2
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 tracking-[0.2em] uppercase">
                        SECURE_CHANNEL_ESTABLISHED :: ENCRYPTED_STREAM_ACTIVE
                    </p>
                </div>
                <div className="text-[10px] text-slate-500 flex flex-col items-end gap-1">
                    <div>SYS_STATUS: <span className="text-emerald-500">OPTIMAL</span></div>
                    <div>LATENCY: <span className="text-emerald-400">12ms</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {displayBlocks.map((block, i) => (
                    <motion.div
                        key={block.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        className={`p-3 rounded-none border-l-2 ${getNetworkColor(block.network)} bg-white/5 backdrop-blur-sm relative overflow-hidden group/block hover:bg-white/10 transition-colors`}
                    >
                        {block.preview && user && ['creator', 'institution', 'university', 'admin'].includes(user.role) && (
                            <img src={URL.createObjectURL(block.preview)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover/block:opacity-30 transition-opacity grayscale" />
                        )}
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-white/70">[{block.network}]</span>
                            <span className="text-[9px] opacity-50 font-mono">{block.timestamp}</span>
                        </div>
                        <div className="text-[10px] opacity-60 truncate relative z-10 mb-2 font-mono text-slate-300">
                            &gt; HASH: {block.hash}
                        </div>
                        <div className="mt-2 text-[9px] flex justify-between items-center relative z-10 border-t border-white/5 pt-2">
                            <span className={`uppercase tracking-wider ${block.status === 'CONFIRMED' ? 'text-emerald-500' : (block.status === 'READY_TO_MINT' ? 'text-purple-400' : 'text-amber-400')}`}>
                                {block.status}
                            </span>
                            <span className={`w-1.5 h-1.5 ${block.status === 'CONFIRMED' ? 'bg-emerald-500' : (block.status === 'READY_TO_MINT' ? 'bg-purple-500' : 'bg-amber-500')} shadow-[0_0_8px_currentColor]`}></span>
                        </div>
                    </motion.div>
                ))}
                {/* Placeholder for empty states if needed */}
                {blocks.length < 5 && Array(5 - blocks.length).fill(0).map((_, i) => (
                    <div key={`placeholder-${i}`} className="p-3 rounded-lg border border-slate-800 bg-black/20 opacity-30 flex items-center justify-center">
                        <span className="text-xs text-slate-600">Waiting for blocks...</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveBlockVisualizer;
