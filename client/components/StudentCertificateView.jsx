import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from './services/config';

const toGateway = (uri) => {
  const cid = String(uri || '').replace('ipfs://','').trim();
  return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : '';
};

const StudentCertificateView = () => {
  const { tokenId, serialNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metaCid, setMetaCid] = useState('');
  const [pdfUri, setPdfUri] = useState('');
  const [txId, setTxId] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/api/verification/credential-history/${tokenId}/${serialNumber}`);
        if (!res.ok) throw new Error('No disponible');
        const json = await res.json();
        const cred = json?.credential || json?.data?.credential || {};
        const meta = cred.metadata || {};
        if (meta.metadataCid) setMetaCid(meta.metadataCid);
        const onChainUri = meta.uri || '';
        const metaUri = meta.metadataCid ? `ipfs://${meta.metadataCid}` : (onChainUri || '');
        const gateway = toGateway(metaUri);
        let fileCid = '';
        if (gateway) {
          try {
            const resp = await fetch(gateway);
            const md = await resp.json();
            const furi = md?.properties?.file?.uri || '';
            fileCid = String(furi || '').replace('ipfs://','').trim();
          } catch {}
        }
        setPdfUri(fileCid ? `ipfs://${fileCid}` : '');
        setTxId(cred.transactionId || '');
      } catch (e) {
        setError('No se pudo cargar el certificado');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tokenId, serialNumber]);

  const pdfUrl = toGateway(pdfUri);
  const verifyUrl = `https://hashscan.io/${(import.meta.env.VITE_HEDERA_NETWORK || 'testnet')}/nft/${tokenId}-${serialNumber}`;

  if (loading) return <div className="container-responsive pb-10">Cargando…</div>;
  if (error) return <div className="container-responsive pb-10 text-red-600">{error}</div>;

  return (
    <div className="container-responsive pb-10">
      <h1 className="text-2xl font-bold mb-4">Certificado del Estudiante</h1>
      <div className="mb-4 flex gap-3">
        <a className="btn-primary" href={verifyUrl} target="_blank" rel="noreferrer">Verificar en HashScan</a>
        {pdfUrl ? <a className="btn-secondary" href={pdfUrl} download>Descargar PDF</a> : null}
      </div>
      {pdfUrl ? (
        <motion.iframe 
          title="Certificado" 
          src={pdfUrl} 
          style={{ width: '100%', height: '70vh', border: '1px solid #e5e7eb' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      ) : (
        <div className="text-gray-600">No se encontró el documento en IPFS.</div>
      )}
    </div>
  );
};

export default StudentCertificateView;
