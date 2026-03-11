import { Link } from 'react-router-dom';
import { motion, useSpring, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Activity, Globe, Cpu, Network } from 'lucide-react';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import ConnectionService from './services/connectionService';

// --- Futuristic DNA Animation Component ---
const DNAStrand = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      <div className="absolute top-[-10%] right-[-10%] w-[70rem] h-[70rem] opacity-20 animate-spin-slow origin-center mix-blend-screen">
        {[...Array(24)].map((_, i) => (
          <div
            key={`strand-1-${i}`}
            className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-purple-600/0 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 7.5}deg) translateY(${Math.sin(i * 0.5) * 120}px)`,
              opacity: 0.3 + Math.sin(i) * 0.3,
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] opacity-15 animate-spin-reverse-slow origin-center mix-blend-screen">
        {[...Array(20)].map((_, i) => (
          <div
            key={`strand-2-${i}`}
            className="absolute top-1/2 left-1/2 w-full h-[1px] bg-gradient-to-r from-emerald-500/0 via-emerald-400/50 to-blue-600/0 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(-50%, -50%) rotate(${i * 9}deg) translateY(${Math.cos(i * 0.5) * 100}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// --- Cyber Particle System ---
const ParticleSystem = () => {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute bg-white rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            opacity: 0,
            scale: 0
          }}
          animate={{
            y: [null, Math.random() * -100],
            opacity: [0, 0.3, 0],
            scale: [0, Math.random() * 1.5, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5
          }}
          style={{
            width: Math.random() * 2 + 'px',
            height: Math.random() * 2 + 'px',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
          }}
        />
      ))}
    </div>
  );
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { 
    y: 30, 
    opacity: 0,
    filter: "blur(8px)"
  },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 100,
    },
  },
};

export const HeroSection = () => {
  const [health, setHealth] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const containerRef = useRef(null);
  
  // Interactive Title State
  const mouseX = useSpring(0, { stiffness: 40, damping: 30 });
  const mouseY = useSpring(0, { stiffness: 40, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set((clientX - centerX) / 50);
      mouseY.set((clientY - centerY) / 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      const t0 = Date.now();
      const { data } = await ConnectionService.fetchWithFallback('/health', { 
        status: 'DEMO', 
        timestamp: new Date().toISOString(), 
        uptime: 0, 
        environment: 'development', 
        memory: { used: 0, total: 0 }, 
        xrpl: { enabled: false }, 
        algorand: { enabled: false }, 
        ipfs: { enabled: false } 
      });
      const t1 = Date.now();
      if (!mounted) return;
      setLatencyMs(Math.max(0, t1 - t0));
      setHealth(data);
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const liveStats = useMemo(() => {
    const uptimeSec = Number(health?.uptime || 0);
    const uptimeH = Math.floor(uptimeSec / 3600);
    const enabledServices = ['xrpl','algorand','ipfs'].reduce((acc, k) => acc + (health?.[k]?.enabled ? 1 : 0), 0) + 1;
    const avgLatency = latencyMs != null ? `${latencyMs} ms` : '--';
    
    return [
      { 
        number: `${enabledServices}`, 
        label: 'NODES ACTIVE', 
        icon: <Network size={16} strokeWidth={1} className="text-emerald-400"/>,
        status: 'online'
      },
      { 
        number: `${uptimeH}h`, 
        label: 'SYSTEM UPTIME', 
        icon: <Cpu size={16} strokeWidth={1} className="text-cyan-400"/>,
        status: 'stable'
      },
      { 
        number: avgLatency, 
        label: 'GLOBAL LATENCY', 
        icon: <Activity size={16} strokeWidth={1} className="text-purple-400"/>,
        status: 'optimized'
      },
    ];
  }, [health, latencyMs]);
  
  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-emerald-500/30">
      
      {/* --- Ambient Background --- */}
      <DNAStrand />
      <ParticleSystem />
      
      {/* Cinematic Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      
      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex flex-col justify-center min-h-screen">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible"
          className="text-center max-w-6xl mx-auto"
        >
          {/* Status Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-10">
            <Link to="/status" className="group relative inline-flex items-center gap-3 px-5 py-2 rounded-full bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              <span className="text-xs font-mono tracking-[0.2em] text-emerald-100/70 group-hover:text-emerald-100 transition-colors">SYSTEM_OPERATIONAL_V2.4</span>
              <ShieldCheck size={14} strokeWidth={1} className="text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
            </Link>
          </motion.div>

          {/* Interactive Hero Title */}
          <motion.div 
            variants={itemVariants} 
            className="mb-10 relative z-20"
            style={{ x: mouseX, y: mouseY }}
          >
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-[0.9] select-none">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl">
                ACADEMIC
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-500 to-purple-600 pb-2">
                CHAIN LEDGER
              </span>
            </h1>
            <p className="absolute -bottom-6 left-0 right-0 text-center text-xs font-mono text-white/20 tracking-[1.5em] uppercase hidden sm:block">
              Immutable • Decentralized • Perpetual
            </p>
          </motion.div>

          {/* Value Proposition */}
          <motion.div variants={itemVariants} className="mb-16 max-w-3xl mx-auto">
            <p className="text-xl sm:text-2xl text-slate-400 leading-relaxed font-light">
              The cryptographic truth layer for global education. 
              <br className="hidden md:block"/>
              We empower institutions with <span className="text-emerald-400 font-medium">unbreakable verification</span> infrastructure.
            </p>
          </motion.div>

          {/* Action Modules */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-24">
            <Link to="/verify" className="relative group w-full sm:w-auto">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <button className="relative w-full sm:w-auto px-10 py-5 bg-[#0a0a0a] rounded-xl flex items-center justify-between sm:justify-center gap-6 border border-white/10 group-hover:border-white/20 transition-all">
                <span className="flex items-center gap-3 text-emerald-100 group-hover:text-white transition-colors">
                  <ShieldCheck size={24} strokeWidth={1} className="text-emerald-500" />
                  <span className="text-lg font-bold tracking-wide">VERIFY CREDENTIAL</span>
                </span>
                <span className="text-emerald-500/50 group-hover:text-emerald-400 transition-colors font-mono text-sm">
                   // EXECUTE
                </span>
              </button>
            </Link>
            
            <a href="https://calendly.com/academicchain/demo" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
               <button className="w-full sm:w-auto px-10 py-5 rounded-xl border border-white/5 bg-[#0d0d0d]/40 backdrop-blur-md hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-slate-300 hover:text-white group">
                  <span className="text-lg font-medium">Book Demo</span>
                  <ArrowRight size={20} strokeWidth={1} className="group-hover:translate-x-1 transition-transform text-purple-400" />
               </button>
            </a>
          </motion.div>

          {/* Live Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {liveStats.map((stat, index) => (
              <motion.div
                key={`${stat.label}-${index}`}
                whileHover={{ y: -5 }}
                className="relative group bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">{stat.number}</div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 opacity-30 mix-blend-screen pointer-events-none"
        animate={{
          y: [0, 10, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <span className="text-[10px] font-mono tracking-[0.3em] text-white uppercase">Initialize</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white to-white/0"></div>
      </motion.div>
    </section>
  );
};
