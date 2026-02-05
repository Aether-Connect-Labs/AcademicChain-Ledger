import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 🛡️ Live Block Visualizer
 * Futuristic component to visualize Triple Shield Consensus
 */
const LiveBlockVisualizer = () => {
    const [blocks, setBlocks] = useState([]);

    // Simulation of incoming blocks
    useEffect(() => {
        const interval = setInterval(() => {
            const networks = ['Hedera', 'XRP', 'Algorand'];
            const network = networks[Math.floor(Math.random() * networks.length)];
            const id = Math.random().toString(36).substr(2, 9);

            const newBlock = {
                id,
                network,
                timestamp: new Date().toLocaleTimeString(),
                status: 'PENDING', // Start as Pending
                hash: Math.random().toString(36).substr(2, 16).toUpperCase()
            };

            setBlocks(prev => {
                // Add new block
                const updated = [newBlock, ...prev].slice(0, 5);
                // Simulate rapid confirmation
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
            default: return 'text-slate-400 border-slate-500';
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 mb-8 relative overflow-hidden">
            {/* Background Animated Mesh */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="flex justify-between items-end mb-4 relative z-10">
                <div>
                    <h3 className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 flex items-center gap-2">
                        <span className="animate-pulse text-green-400">●</span> Triple Shield Consensus
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">LIVE NETWORK ACTIVITY • ENCRYPTED STREAM</p>
                </div>
                <div className="text-xs font-mono text-slate-500">
                    LATENCY: <span className="text-green-400">12ms</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {blocks.map((block, i) => (
                    <motion.div
                        key={block.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`p-3 rounded-lg border bg-black/40 backdrop-blur-sm ${getNetworkColor(block.network)}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-wider">{block.network}</span>
                            <span className="text-[10px] opacity-70">{block.timestamp}</span>
                        </div>
                        <div className="font-mono text-xs opacity-80 truncate">
                            HASH: {block.hash}
                        </div>
                        <div className="mt-2 text-[10px] flex justify-between items-center">
                            <span className={`uppercase px-1 rounded ${block.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                {block.status}
                            </span>
                            <span className={`animate-pulse w-2 h-2 rounded-full ${block.status === 'CONFIRMED' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
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
