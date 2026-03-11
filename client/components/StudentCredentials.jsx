import React, { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import QRCode from 'react-qr-code';
import DocumentViewer from './ui/DocumentViewer';
import { studentService } from './services/studentService';
import { verificationService } from './services/verificationService';
import { toGateway } from './utils/ipfsUtils';
import useAnalytics from './useAnalytics';
import { 
  Award, 
  ExternalLink, 
  FileText, 
  Share2, 
  Trash2, 
  XCircle, 
  CheckCircle, 
  Download,
  Copy,
  ShieldCheck
} from 'lucide-react';

const CredentialCard = ({ credential, onDelete, onRevoke }) => {
  const link = `${window.location.origin}/#/verificar?tokenId=${encodeURIComponent(credential.tokenId)}&serialNumber=${encodeURIComponent(credential.serialNumber)}`;
  const [docOpen, setDocOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [widgetCode, setWidgetCode] = useState('');
  const docUrl = toGateway(credential.ipfsURI);
  const evidenceUrl = `/#/credential/${encodeURIComponent(credential.tokenId)}/${encodeURIComponent(credential.serialNumber)}/evidence`;

  const handleShowWidget = async () => {
    if (widgetCode) {
      setShowWidget(true);
      return;
    }
    try {
      const id = `${credential.tokenId}-${credential.serialNumber}`;
      const res = await studentService.getWidgetCode(id);
      setWidgetCode(res.data?.html || res.html || 'Error generando widget');
      setShowWidget(true);
    } catch (e) {
      console.error(e);
      // In a real app we'd use a toast here
      alert('No se pudo generar el widget');
    }
  };

  return (
    <div className="group relative bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-900/10">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6">
        {/* QR Section */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <div className="p-3 bg-white rounded-xl shadow-lg shadow-black/20">
            <QRCode value={link} size={120} />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-grow space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                {credential.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                {credential.issuer}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Emitida
              </span>
              {(credential.ipfsURI || '').startsWith('ipfs://') ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  IPFS
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                  Demo
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#050505]/50 rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between gap-4">
              <div className="truncate text-xs text-slate-500 font-mono flex-grow">
                {link}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(link)}
                className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                title="Copiar enlace"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm flex items-center gap-2 transition-colors"
              onClick={() => setDocOpen(true)} 
              disabled={!docUrl}
            >
              <FileText className="w-4 h-4" />
              Ver Documento
            </button>
            
            <button 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm flex items-center gap-2 transition-colors"
              onClick={handleShowWidget}
            >
              <Share2 className="w-4 h-4" />
              Embed Widget
            </button>

            <a 
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm flex items-center gap-2 transition-colors"
              href={evidenceUrl}
            >
              <ExternalLink className="w-4 h-4" />
              Evidencias
            </a>

            {credential.tokenId && credential.serialNumber && (
              <a
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm flex items-center gap-2 transition-colors"
                href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/nft/${credential.tokenId}-${credential.serialNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                <img src="https://cryptologos.cc/logos/hedera-hbar-logo.png" alt="Hedera" className="w-4 h-4" />
                HashScan
              </a>
            )}
            
            <div className="flex-grow"></div>

            <button
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 transition-colors ml-auto"
              onClick={onRevoke}
            >
              <XCircle className="w-4 h-4" />
              Revocar
            </button>
            
            <button
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 transition-colors"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
              Borrar
            </button>
          </div>
        </div>
      </div>

      <DocumentViewer open={docOpen} src={docUrl} title={credential.title || 'Documento'} onClose={() => setDocOpen(false)} />
      
      {/* Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-cyan-900/20 relative">
            <button 
              onClick={() => setShowWidget(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Trust Widget & LinkedIn
            </h3>
            <p className="text-sm text-slate-400 mb-6">Copia este código para insertar el sello de verificación en tu sitio web o blog.</p>
            
            <div className="relative">
              <textarea 
                className="w-full h-32 p-4 bg-[#050505] border border-white/10 rounded-xl font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 resize-none"
                readOnly
                value={widgetCode}
              />
              <button 
                onClick={() => navigator.clipboard.writeText(widgetCode)}
                className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowWidget(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentCredentials = ({ demo }) => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assuming studentService.getAll() fetches credentials
  useEffect(() => {
    // Mock or real fetch
    const fetchCreds = async () => {
        try {
            setLoading(true);
            const res = await studentService.getMyCredentials();
            setCredentials(res.data || []);
        } catch (e) {
            console.error("Error fetching credentials", e);
        } finally {
            setLoading(false);
        }
    };
    fetchCreds();
  }, [user]);

  const handleDelete = async (id) => {
      if(!confirm("¿Estás seguro de borrar esta credencial?")) return;
      // Call service to delete
      // update state
      setCredentials(prev => prev.filter(c => c._id !== id));
  };

  const handleRevoke = async (id) => {
      if(!confirm("¿Estás seguro de revocar esta credencial? Esta acción es irreversible en la Blockchain.")) return;
      // Call service to revoke
      alert("Funcionalidad de revocación en desarrollo");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12 bg-[#0d0d0d]/40 backdrop-blur-xl border border-white/5 rounded-2xl border-dashed">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No tienes credenciales aún</h3>
        <p className="text-slate-500 text-sm">Las credenciales emitidas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {credentials.map((cred, i) => (
        <CredentialCard 
          key={cred._id || i} 
          credential={cred} 
          onDelete={() => handleDelete(cred._id)}
          onRevoke={() => handleRevoke(cred._id)}
        />
      ))}
    </div>
  );
};

export default StudentCredentials;
