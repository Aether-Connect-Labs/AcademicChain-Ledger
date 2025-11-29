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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="doc-viewer-root">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-strong w-full max-w-5xl border border-gray-200 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold truncate mr-2">{title}</div>
          <div className="flex items-center gap-2">
            {isPdf(src) && (
              <>
                <button className="btn-ghost" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>◀</button>
                <div className="text-sm">Página {pageNumber} de {numPages || '?'}</div>
                <button className="btn-ghost" onClick={() => setPageNumber((p) => Math.min((numPages || p), p + 1))} disabled={numPages ? pageNumber >= numPages : false}>▶</button>
                <input
                  aria-label="Ir a página"
                  className="input-primary w-20"
                  type="number"
                  min={1}
                  max={numPages || 1}
                  value={pageNumber}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setPageNumber(Math.min(Math.max(1, v), numPages || v));
                  }}
                />
                <button className="btn-ghost" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>−</button>
                <div className="text-sm">Zoom {(Math.round(scale * 100))}%</div>
                <button className="btn-ghost" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>＋</button>
                <button className="btn-ghost" onClick={() => setScale(1.2)}>Reset</button>
              </>
            )}
            <a className="btn-secondary" href={src} target="_blank" rel="noreferrer">Abrir pestaña</a>
            <a className="btn-secondary" href={src} download>Descargar</a>
            <button className="btn-secondary" onClick={() => {
              const el = document.getElementById('doc-viewer-root');
              if (el && el.requestFullscreen) el.requestFullscreen();
            }}>Pantalla completa</button>
            <button className={preferFull ? 'btn-primary' : 'btn-ghost'} onClick={() => setPreferFull(v => !v)}>
              {preferFull ? 'Recordar fullscreen: sí' : 'Recordar fullscreen: no'}
            </button>
            <button className="btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="p-4 overflow-auto bg-gray-50">
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
            <div className="flex justify-center">
              <Document file={src} onLoadSuccess={onLoadSuccess} onLoadError={() => setNumPages(1)}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          ) : (
            <iframe title="doc" src={src} className="w-full h-[70vh] rounded border bg-white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;