import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../useAuth';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const isPdf = (url) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('.pdf') || u.includes('format=pdf');
};

const DocumentViewer = ({ open, src, title = 'Documento', onClose }) => {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loaded, setLoaded] = useState(false);
  const [watermarkUrl, setWatermarkUrl] = useState('');
  const storageKey = useMemo(() => (src ? `docviewer:${user?.id || 'anon'}:${src}` : ''), [src, user?.id]);
  const [preferFull, setPreferFull] = useState(false);
  const [fullTryFailed, setFullTryFailed] = useState(false);
  const ownerEmail = import.meta.env.VITE_DOCVIEWER_OWNER_EMAIL;
  const ownerIdEnv = import.meta.env.VITE_DOCVIEWER_OWNER_ID;
  const canUseOwnerOnly = !!user && (
    (ownerEmail && user.email === ownerEmail) ||
    (ownerIdEnv && user.id === ownerIdEnv) ||
    (localStorage.getItem('previewOwner') === '1' && user.id === 'preview-owner')
  );

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
      if (isPdf(src)) {
        if (e.key === 'ArrowRight') setPageNumber((p) => Math.min((numPages || p), p + 1));
        if (e.key === 'ArrowLeft') setPageNumber((p) => Math.max(1, p - 1));
        if (e.key === 'PageDown') setPageNumber((p) => Math.min((numPages || p), p + 1));
        if (e.key === 'PageUp') setPageNumber((p) => Math.max(1, p - 1));
        if (e.key === 'Home') setPageNumber(1);
        if (e.key === 'End') setPageNumber(numPages || 1);
        if (e.key === '+') setScale((s) => Math.min(3, s + 0.1));
        if (e.key === '-') setScale((s) => Math.max(0.5, s - 0.1));
        if (e.key.toLowerCase() === 'f') {
          const el = document.getElementById('doc-viewer-root');
          if (el && el.requestFullscreen) el.requestFullscreen();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, src, numPages, onClose]);

  useEffect(() => {
    if (open) {
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
  }, [open, src, storageKey]);

  const onLoadSuccess = useCallback((pdf) => {
    const n = pdf.numPages || 1;
    setNumPages(n);
    setPageNumber((p) => Math.min(Math.max(1, p), n));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isPdf(src) && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ page: pageNumber, scale, preferFull }));
      } catch {}
    }
  }, [pageNumber, scale, preferFull, src, storageKey]);

  useEffect(() => {
    if (open && preferFull && canUseOwnerOnly) {
      const el = document.getElementById('doc-viewer-root');
      if (el && el.requestFullscreen) {
        el.requestFullscreen()
          .then(() => setFullTryFailed(false))
          .catch(() => setFullTryFailed(true));
        setTimeout(() => {
          if (!document.fullscreenElement) setFullTryFailed(true);
        }, 300);
      } else {
        setFullTryFailed(true);
      }
    }
  }, [open, preferFull, canUseOwnerOnly]);

  useEffect(() => {
    if (!open) {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
      } catch {}
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" id="doc-viewer-root">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-strong w-full max-w-5xl border border-gray-200 flex flex-col h-full max-h-[98vh] sm:max-h-[95vh]">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-semibold text-sm sm:text-base mr-2 flex-1 min-w-0 overflow-wrap" title={title}>{title}</div>
          <div className="flex flex-wrap items-center gap-2">
            {isPdf(src) && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="btn-ghost" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>◀</button>
                  <div className="text-sm hidden sm:block">Página {pageNumber} de {numPages || '?'}</div>
                  <div className="text-sm" title={`Página ${pageNumber} de ${numPages || '?'}`}>{pageNumber}/{numPages || '?'}</div>
                  <button className="btn-ghost" onClick={() => setPageNumber((p) => Math.min((numPages || p), p + 1))} disabled={numPages ? pageNumber >= numPages : false}>▶</button>
                  <input
                    aria-label="Ir a página"
                    className="input-primary w-16 sm:w-20"
                    type="number"
                    min={1}
                    max={numPages || 1}
                    value={pageNumber}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 1;
                      setPageNumber(Math.min(Math.max(1, v), numPages || v));
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="btn-ghost" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>−</button>
                  <div className="text-sm hidden sm:block">Zoom {(Math.round(scale * 100))}%</div>
                  <div className="text-sm" title={`Zoom ${Math.round(scale * 100)}%`}>{Math.round(scale * 100)}%</div>
                  <button className="btn-ghost" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>＋</button>
                  <button className="btn-ghost hidden sm:inline-block" onClick={() => setScale(1.2)}>Reset</button>
                </div>
              </>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <a className="btn-secondary text-xs sm:text-sm" href={src} target="_blank" rel="noreferrer">Abrir pestaña</a>
              <a className="btn-secondary text-xs sm:text-sm" href={src} download>Descargar</a>
              <button className="btn-secondary text-xs sm:text-sm" onClick={() => {
                const el = document.getElementById('doc-viewer-root');
                if (el && el.requestFullscreen) el.requestFullscreen();
              }}>Pantalla completa</button>
              <button className={preferFull ? 'btn-primary text-xs sm:text-sm' : 'btn-ghost text-xs sm:text-sm'} onClick={() => setPreferFull(v => !v)}>
                {preferFull ? 'Recordar: sí' : 'Recordar: no'}
              </button>
              <button className="btn-ghost" onClick={onClose}>✕</button>
            </div>
          </div>
        </div>
        <div className="p-2 sm:p-4 overflow-auto bg-gray-50 flex-1">
          <div className="relative min-w-0">
            {watermarkUrl ? (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ opacity: 0.08 }}
              >
                <img src={watermarkUrl} alt="" className="max-w-[60%] -rotate-12" />
              </div>
            ) : null}
            {!loaded && (
              <div className="mb-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-2"></span>
                <span>Sincronizando con la Red de Integridad...</span>
              </div>
            )}
          {preferFull && fullTryFailed && canUseOwnerOnly && (
            <div className="mb-2 text-xs text-yellow-800 bg-yellow-100 border border-yellow-300 px-3 py-2 rounded">
              Full-screen bloqueado por el navegador. Requiere interacción.
              <button className="btn-ghost btn-xs ml-2" onClick={() => {
                const el = document.getElementById('doc-viewer-root');
                if (el && el.requestFullscreen) {
                  el.requestFullscreen().then(() => setFullTryFailed(false)).catch(() => setFullTryFailed(true));
                }
              }}>Intentar de nuevo</button>
            </div>
          )}
          {isPdf(src) ? (
            <div className="flex justify-center" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
              <Document file={src} onLoadSuccess={onLoadSuccess} onLoadError={() => setNumPages(1)}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          ) : (
            <iframe title="doc" src={src} className="w-full h-full rounded border bg-white" onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }} />
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
