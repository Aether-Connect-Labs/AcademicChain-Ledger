import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Terminal, 
  Play, 
  Server, 
  ArrowRight, 
  Code, 
  Copy,
  CheckCircle2,
  Database,
  Globe,
  Cpu
} from 'lucide-react';

const ApiDocsLanding = () => {
  const [copied, setCopied] = React.useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const codeExamples = {
    verification: `curl -X POST http://localhost:3001/api/v1/verification/verify-credential \\
  -H 'Content-Type: application/json' \\
  -d '{
    "tokenId": "0.0.123456",
    "serialNumber": "1"
  }'`,
    issuance: `curl -X POST http://localhost:3001/api/v1/credentials/issue \\
  -H 'x-api-key: ak_prefix_secret' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "tokenId": "0.0.123456",
    "uniqueHash": "hash-123",
    "ipfsURI": "ipfs://cid",
    "studentName": "Alice",
    "degree": "CS",
    "recipientAccountId": "0.0.999"
  }'`
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-6 backdrop-blur-md">
              <BookOpen className="w-3 h-3" />
              API REFERENCE v1.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Documentación <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                para Desarrolladores
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Explora y prueba la API REST de AcademicChain. Diseñada para ser intuitiva, segura y escalable.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link 
              to="/agenda" 
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg shadow-white/10"
            >
              <Play className="w-4 h-4 fill-current" />
              Agendar Demo
            </Link>
            <a 
              href="/api/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#0d0d0d] border border-white/10 text-white rounded-xl font-bold hover:border-cyan-500/50 hover:text-cyan-400 transition-all flex items-center gap-2 group"
            >
              <Server className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              Swagger UI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Features & Info */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-500 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Endpoints Públicos</h3>
              <p className="text-slate-400 mb-6">
                Verifica credenciales sin autenticación. Ideal para integraciones en portales de empleo o validadores externos.
              </p>
              <div className="flex items-center gap-4 text-sm font-mono text-slate-500">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">GET</span>
                <span>/verification/verify-credential</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-cyan-500/30 transition-all duration-500 group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-cyan-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Emisión Programática</h3>
              <p className="text-slate-400 mb-6">
                Automatiza la emisión de certificados desde tu LMS o sistema de gestión. Requiere API Key.
              </p>
              <div className="flex items-center gap-4 text-sm font-mono text-slate-500">
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">POST</span>
                <span>/credentials/issue</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Code Examples */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Verificación Pública</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(codeExamples.verification, 'ver')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {copied === 'ver' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-6 overflow-x-auto custom-scrollbar">
                <pre className="font-mono text-sm text-cyan-300 leading-relaxed">
                  {codeExamples.verification}
                </pre>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Emisión con API Key</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(codeExamples.issuance, 'iss')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {copied === 'iss' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="p-6 overflow-x-auto custom-scrollbar">
                <pre className="font-mono text-sm text-purple-300 leading-relaxed">
                  {codeExamples.issuance}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">¿Listo para integrar?</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Obtén tu API Key gratuita y comienza a emitir credenciales verificables en minutos.
            </p>
            <Link 
              to="/developer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-cyan-50 transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
            >
              <Code className="w-5 h-5" />
              Obtener API Key
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ApiDocsLanding;
