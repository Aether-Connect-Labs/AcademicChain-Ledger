import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import CredentialVerifier from './credentials/CredentialVerifier.jsx';
import DocumentViewer from './ui/DocumentViewer';
import { verificationService } from './services/verificationService';
import { toGateway } from './utils/ipfsUtils';
import { theme } from './themeConfig';

const VerifyCredentialPage = () => {
  const [searchParams] = useSearchParams();
  const { cid: cidParam } = useParams();
  const [tokenId, setTokenId] = useState(searchParams.get('tokenId') || '');
  const [serialNumber, setSerialNumber] = useState(searchParams.get('serialNumber') || '');
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState(null);
  const [docOpen, setDocOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadDetails = async () => {
    if (!tokenId || !serialNumber) return;
    try {
      const res = await verificationService.getCredentialDetails(tokenId.trim(), serialNumber.trim());
      const cred = res?.data?.credential?.hedera || res?.data?.credential || null;
      setDetails(cred || null);
    } catch {
      setDetails(null);
    }
  };
  useEffect(() => { loadDetails(); }, []);

  useEffect(() => {
    const loadByCid = async () => {
      if (!cidParam) return;
      const url = toGateway(`ipfs://${cidParam}`);
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const meta = await res.json();
          const hederaLike = {
            tokenId: meta?.tokenId || '',
            serialNumber: meta?.serialNumber || '',
            metadata: meta,
            ipfsURI: `ipfs://${cidParam}`
          };
          setDetails(hederaLike);
        } else {
          setDetails({ tokenId: '', serialNumber: '', metadata: { properties: { file: { uri: `ipfs://${cidParam}`, hash: '' } }, attributes: [] }, ipfsURI: `ipfs://${cidParam}` });
        }
      } catch {
        setDetails({ tokenId: '', serialNumber: '', metadata: { properties: { file: { uri: `ipfs://${cidParam}`, hash: '' } }, attributes: [] }, ipfsURI: `ipfs://${cidParam}` });
      }
    };
    loadByCid();
  }, [cidParam]);

  const handleCheckRevocation = async () => {
    if (!tokenId || !serialNumber) return;
    try {
      setChecking(true);
      const res = await verificationService.getCredentialStatus(tokenId.trim(), serialNumber.trim());
      const st = String(res?.data?.status || res.status || '').toUpperCase();
      setStatus(st);
    } catch {
      setStatus('');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="container-responsive pt-24 sm:pt-32" style={{ paddingLeft: theme.spacing.sectionPx, paddingRight: theme.spacing.sectionPx, paddingBottom: theme.spacing.sectionPb }}>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verificar Credencial</h1>
      <p className="text-gray-600">Escanea un código QR o pega datos para verificar.</p>
      <div className="mt-4">
        <Link to="/agenda" className="btn-primary">Agendar Demo</Link>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="font-semibold mb-3">Datos</div>
          <input className="input-primary mb-2" placeholder="Token ID" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
          <input className="input-primary mb-2" placeholder="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={loadDetails} disabled={!tokenId || !serialNumber}>Cargar</button>
            <button className="btn-secondary" onClick={handleCheckRevocation} disabled={!tokenId || !serialNumber || checking}>{checking ? 'Validando...' : 'Validar Revocación'}</button>
          </div>
          {status && (
            <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full ${status === 'REVOKED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {status === 'REVOKED' ? 'Título Revocado' : 'Título Activo'}
            </div>
          )}
          {details?.metadata?.attributes ? (
            <div className="mt-4 text-sm">
              <div>Hash de Hedera: {(details.metadata.properties?.file?.hash || '').slice(0, 16)}…</div>
              <div>ID Token: {details.tokenId}</div>
              <div>Fecha de Emisión: {(() => {
                const d = (details.metadata.attributes || []).find(a => a.display_type === 'date')?.value || '';
                return d ? new Date(d).toLocaleString() : 'N/A';
              })()}</div>
            </div>
          ) : null}
        </div>
        <div className="card p-6">
          <div className="font-semibold mb-3">Visor PDF</div>
          <div className="flex items-center gap-2 mb-3">
            <button className="btn-secondary btn-sm" onClick={() => setDocOpen(true)} disabled={!toGateway(details?.metadata?.properties?.file?.uri || details?.ipfsURI)}>Abrir</button>
            {details?.tokenId && details?.serialNumber && (
              <a className="btn-secondary btn-sm" href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/nft/${details.tokenId}-${details.serialNumber}`} target="_blank" rel="noreferrer">HashScan</a>
            )}
          </div>
          <div className="text-xs text-gray-600">El documento se obtiene desde gateways de IPFS (Pinata/Cloudflare).</div>
        </div>
        <div className="card p-6">
          <div className="font-semibold mb-3">Sello Criptográfico</div>
          <div className="text-sm text-gray-700">
            <div>Hash calculado: {(() => {
              const h = details?.metadata?.properties?.file?.hash || '';
              return h ? h.slice(0, 32) + '…' : 'N/A';
            })()}</div>
            <div>Token ACL: {import.meta.env.VITE_ACL_TOKEN_ID || '0.0.7560139'}</div>
            <div>Red: {import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}</div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <CredentialVerifier />
      </div>
      <DocumentViewer
        open={docOpen}
        src={toGateway(details?.metadata?.properties?.file?.uri || details?.ipfsURI)}
        title="Documento de la Credencial"
        onClose={() => setDocOpen(false)}
      />
    </div>
  );
};

export default VerifyCredentialPage;
