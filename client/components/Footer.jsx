import React from 'react';
import { Link } from 'react-router-dom';
import { toGateway } from './utils/ipfsUtils';
import { Shield, Lock, Globe } from 'lucide-react';

const Footer = () => {
  const termsUrl = toGateway('ipfs://bafkreifivywo2ecfysgunkbqgrwmut2eyddkgpmvdrceai5tu2dbwpc6ta');
  const privacyUrl = toGateway('ipfs://bafkreidtamxbd5icphwjs3szittynegs7jq3yrqd7vjboat3uzgnbgposu');

  return (
    <footer
      className="bg-[#050505] border-t border-white/5 pt-16 pb-8 relative overflow-hidden"
      data-testid="footer"
      role="contentinfo"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                   <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  AcademicChain <span className="text-slate-500 font-light">Ledger</span>
                </h2>
             </div>
             <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
               Infraestructura híbrida de certificación descentralizada. 
               Potenciando la fe pública digital con tecnología Hedera Hashgraph y XRPL.
             </p>
             <div className="flex gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-pointer group">
                   <Globe className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1} />
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-pointer group">
                   <Lock className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1} />
                </div>
             </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Plataforma</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/instituciones" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Instituciones
                </Link>
              </li>
              <li>
                <Link to="/creators" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Creadores
                </Link>
              </li>
              <li>
                <Link to="/employer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Empresas
                </Link>
              </li>
              <li>
                <Link to="/verificar" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Verificar Título
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Legal & Soporte</h3>
            <ul className="space-y-4">
              <li>
                <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Política de Privacidad
                </a>
              </li>
              <li>
                <Link to="/agenda" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/developers/docs" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-cyan-400 transition-colors"></span>
                  Documentación API
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            © 2026 AcademicChain Ledger Technology. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <span className="text-[10px] text-emerald-500 font-mono tracking-wide">SYSTEM_OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
