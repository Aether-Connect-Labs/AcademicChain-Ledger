import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Clock, Server, Lock, FileCheck, Database, Globe, Zap, Network } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: <ShieldCheck size={32} strokeWidth={1} className="text-emerald-400" />,
      title: "Verificación Instantánea",
      description: "Pruebas criptográficas con datos inalterables. Metadatos completos para trazabilidad forense y control total del titular.",
      color: "emerald"
    },
    {
      icon: <Clock size={32} strokeWidth={1} className="text-cyan-400" />,
      title: "Evidencia Temporal",
      description: "Anclaje con marca de tiempo y prueba de existencia verificable. Respaldo distribuido de bajo costo.",
      color: "cyan"
    },
    {
      icon: <Server size={32} strokeWidth={1} className="text-purple-400" />,
      title: "Continuidad Operativa",
      description: "Redundancia multi-red, alta disponibilidad y almacenamiento descentralizado (IPFS + Filecoin).",
      color: "purple"
    }
  ];

  const benefits = [
    {
      title: "Para Universidades",
      desc: "Certificación con fe pública digital y trazabilidad verificable.",
      icon: <Database size={20} strokeWidth={1} className="text-blue-400" />
    },
    {
      title: "Para Estudiantes",
      desc: "Control total sobre credenciales y verificación instantánea.",
      icon: <FileCheck size={20} strokeWidth={1} className="text-green-400" />
    },
    {
      title: "Para Creadores",
      desc: "Certifica cursos y mentorías con valor verificable.",
      icon: <Zap size={20} strokeWidth={1} className="text-yellow-400" />
    },
    {
      title: "Para Empleadores",
      desc: "Confianza máxima y falsificación imposible.",
      icon: <Lock size={20} strokeWidth={1} className="text-red-400" />
    }
  ];

  return (
    <section className="relative py-24 bg-[#050505] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <Network size={14} strokeWidth={2} />
            <span>INFRAESTRUCTURA TRUSTLESS</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            Confianza Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Descentralizada</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Protocolo estándar para la emisión, verificación y preservación de credenciales académicas en la web3.
          </motion.p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group p-8 rounded-2xl bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-[#0d0d0d]/60"
            >
              <div className={`w-14 h-14 rounded-full bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-${feature.color}-500/20`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Analogy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-white/5 backdrop-blur-md"
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-mono text-cyan-400 mb-2">/// MODELO MENTAL</h3>
            <h4 className="text-2xl font-bold text-white">Analogía del Sistema</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Certificado", value: "Documento Oficial", icon: "📄" },
              { label: "Evidencia", value: "Sello Notarial Digital", icon: "⚖️" },
              { label: "Continuidad", value: "Registro Nacional", icon: "🏛️" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">{item.label}</div>
                  <div className="text-slate-200 font-medium">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy & Governance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-white mb-6">
              Privacidad por Diseño & <br />
              <span className="text-emerald-400">Gobernanza de Datos</span>
            </h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              AcademicChain Ledger opera bajo un modelo estricto de privacidad. No almacenamos datos personales (PII) en la blockchain, solo hashes criptográficos inmutables.
            </p>
            
            <div className="space-y-4">
              {[
                { title: "Anclaje Criptográfico", desc: "Hash SHA-256 como huella digital única." },
                { title: "Almacenamiento Off-Chain", desc: "Datos sensibles en servidores seguros o IPFS privado." },
                { title: "Verificación Selectiva", desc: "Validación sin exponer el registro completo." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {benefits.map((benefit, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-[#0d0d0d]/40 border border-white/5 hover:bg-[#0d0d0d]/60 transition-colors">
                <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit">
                  {benefit.icon}
                </div>
                <h4 className="text-white font-bold mb-2">{benefit.title}</h4>
                <p className="text-slate-400 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
