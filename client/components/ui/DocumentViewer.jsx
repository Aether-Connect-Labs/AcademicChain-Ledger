import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../useAuth';
import { Document, Page, pdfjs } from 'react-pdf';
import { Lock, FileCheck, Shield, Eye, Download, Maximize, Minimize } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const isPdf = (url) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('.pdf') || u.includes('format=pdf');
};

const DocumentViewer = ({ open, src, title = 'Documento', onClose, metadata }) => {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loaded, setLoaded] = useState(false);
  const [showMetadata, setShowMetadata] = useState(!!metadata);
  const [watermarkUrl, setWatermarkUrl] = useState('');
  const storageKey = useMemo(() => (src ? `docviewer:${user?.id || 'anon'}:${src}` : ''), [src, user?.id]);
  const [preferFull, setPreferFull] = useState(false);
  const [fullTryFailed, setFullTryFailed] = useState(false);
  
  // Authorization Check for viewing PDF/CID
  // Only institution, university, admin, or the student owner can view the actual document
  // Public users only see the hash
  const isAuthorizedViewer = !!user && (user.role === 'institution' || user.role === 'university' || user.role === 'admin' || user.role === 'student');

  useEffect(() => {
    try {
      const u = localStorage.getItem('acl:brand:logoUrl') || '';
      if (u) setWatermarkUrl(u);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose();
      if (isAuthorizedViewer && isPdf(src)) {
        if (e.key === 'ArrowRight') setPageNumber((p) => Math.min((numPages || p), p + 1));
        if (e.key === 'ArrowLeft') setPageNumber((p) => Math.max(1, p - 1));
        if (e.key === 'PageDown') setPageNumber((p) => Math.min((numPages || p), p + 1));
        if (e.key === 'PageUp') setPageNumber((p) => Math.max(1, p - 1));
        if (e.key === 'Home') setPageNumber(1);
        if (e.key === 'End') setPageNumber(numPages || 1);
        if (e.key === '+') setScale((s) => Math.min(3, s + 0.1));
        if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, src, numPages, onClose, isAuthorizedViewer]);

  useEffect(() => {
    if (open && isAuthorizedViewer) {
      setLoaded(false);
      if (isPdf(src) && storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const data = JSON.parse(raw);
            if (typeof data.page === 'number') setPageNumber(Math.max(1, data.page));
            if (typeof data.scale === 'number') setScale(Math.min(3, Math.max(0.5, data.scale)));
            if (typeof data.preferFull === 'boolean') setPreferFull(!!data.preferFull);
            return;
          }
        } catch {}
      }
      setPageNumber(1);
      setScale(1.2);
      setPreferFull(false);
    }
  }, [open, src, storageKey, isAuthorizedViewer]);

  const onLoadSuccess = useCallback((pdf) => {
    const n = pdf.numPages || 1;
    setNumPages(n);
    setPageNumber((p) => Math.min(Math.max(1, p), n));
    setLoaded(true);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" id="doc-viewer-root">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl border border-slate-700 flex flex-col h-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${isAuthorizedViewer ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                {isAuthorizedViewer ? <FileCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate" title={title}>{title}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    {isAuthorizedViewer ? 'Vista Institucional Privada' : 'Vista Pública Verificada'}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorizedViewer && (
                <>
                    <a className="btn-secondary text-xs flex items-center gap-1" href={src} download>
                        <Download className="w-3 h-3" /> Descargar
                    </a>
                    <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => setShowMetadata(!showMetadata)}>
                        <Eye className="w-3 h-3" /> {showMetadata ? 'Ocultar Datos' : 'Ver Metadatos'}
                    </button>
                </>
            )}
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500" onClick={onClose}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden relative bg-slate-100">
            
            {/* Main Viewer or Protected Placeholder */}
            <div className={`flex-1 overflow-auto flex items-center justify-center relative transition-all duration-300 ${showMetadata && isAuthorizedViewer ? 'w-2/3' : 'w-full'}`}>
                
                {isAuthorizedViewer ? (
                    /* AUTHORIZED VIEW: PDF/CID */
                    <div className="min-h-full min-w-full flex items-center justify-center p-4">
                        {isPdf(src) ? (
                            <div className="shadow-lg">
                                <Document 
                                    file={src} 
                                    onLoadSuccess={onLoadSuccess} 
                                    loading={
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-slate-500">Descifrando documento...</span>
                                        </div>
                                    }
                                    error={
                                        <div className="text-red-500 flex flex-col items-center">
                                            <span className="text-lg">⚠️</span>
                                            <span>Error al cargar documento</span>
                                        </div>
                                    }
                                >
                                    <Page 
                                        pageNumber={pageNumber} 
                                        scale={scale} 
                                        renderTextLayer={false} 
                                        renderAnnotationLayer={false}
                                        className="bg-white shadow-xl"
                                    />
                                </Document>
                                
                                {/* PDF Controls Overlay */}
                                {loaded && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-4 backdrop-blur-md z-10">
                                        <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber<=1} className="hover:text-blue-400 disabled:opacity-30">◀</button>
                                        <span className="text-xs font-mono">{pageNumber} / {numPages}</span>
                                        <button onClick={() => setPageNumber(p => Math.min(numPages, p+1))} disabled={pageNumber>=numPages} className="hover:text-blue-400 disabled:opacity-30">▶</button>
                                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                        <button onClick={() => setScale(s => Math.max(0.5, s-0.1))} className="hover:text-blue-400">−</button>
                                        <span className="text-xs font-mono">{Math.round(scale*100)}%</span>
                                        <button onClick={() => setScale(s => Math.min(3, s+0.1))} className="hover:text-blue-400">＋</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <iframe title="doc" src={src} className="w-full h-full min-h-[500px] bg-white shadow-sm" />
                        )}
                    </div>
                ) : (
                    /* UNAUTHORIZED / PUBLIC VIEW */
                    <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Lock className="w-10 h-10 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Contenido Protegido</h2>
                        <p className="text-slate-600 mb-8">
                            El documento original (PDF) y su ubicación en IPFS (CID) están restringidos a la institución emisora y autoridades competentes para proteger la privacidad del titular.
                        </p>
                        
                        <div className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                                <Shield className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-slate-700">Prueba de Integridad Pública</span>
                            </div>
                            
                            <div className="mb-4">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Hash SHA-256 del Documento</label>
                                <div className="font-mono text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 break-all select-all">
                                    {metadata?.ipfsHash256 || metadata?.hash || 'Hash no disponible en este registro'}
                                </div>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 italic">
                                Este hash permite verificar matemáticamente que el documento original no ha sido alterado, sin necesidad de exponer su contenido visual públicamente.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Metadata Sidebar (Only for authorized) */}
            {isAuthorizedViewer && showMetadata && (
                <div className="w-1/3 bg-white border-l border-slate-200 overflow-auto p-4 shadow-xl z-20">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Hexagon className="w-4 h-4 text-purple-600" />
                        Metadatos Blockchain
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="group">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Estudiante</label>
                            <div className="text-sm font-medium text-slate-900">{metadata?.studentName || 'N/A'}</div>
                        </div>
                        
                        <div className="group">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Título</label>
                            <div className="text-sm text-slate-700">{metadata?.title || 'N/A'}</div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-between">
                                    Hedera Creation ID
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Primary</span>
                                </label>
                                <div className="font-mono text-xs text-slate-700 mt-1 break-all select-all">{metadata?.id || metadata?.tokenId || 'N/A'}</div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase">IPFS CID (Privado)</label>
                                <div className="font-mono text-xs text-slate-700 mt-1 break-all select-all">{metadata?.ipfsCid || 'N/A'}</div>
                            </div>

                            {metadata?.xrpHash && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase">XRP Ledger Hash</label>
                                    <div className="font-mono text-xs text-slate-700 mt-1 break-all select-all">{metadata.xrpHash}</div>
                                </div>
                            )}

                            {metadata?.algorandHash && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase">Algorand Hash</label>
                                    <div className="font-mono text-xs text-slate-700 mt-1 break-all select-all">{metadata.algorandHash}</div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Estado</label>
                            <div className="mt-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                    metadata?.status === 'verified' ? 'bg-green-100 text-green-700' : 
                                    metadata?.status === 'revoked' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {metadata?.status || 'Desconocido'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper Icon Component if not imported
// Removed conflicting Hexagon component since it is imported from lucide-react
// const Hexagon = ({ className }) => (
//    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
//    </svg>
// );

export default DocumentViewer;
