import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { useParams } from "react-router-dom"
import { API_BASE_URL } from "./services/config"
import LinkedInButton from "./ui/LinkedInButton";
import { toGateway } from "./utils/ipfsUtils";

const BlockchainBadge = ({ network, id, color, icon, link }) => (
  <a 
    href={link} 
    target="_blank" 
    rel="noreferrer"
    className={`flex items-center p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer gap-3`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="text-xs text-gray-500 uppercase font-semibold">{network}</div>
      <div className="text-sm font-mono truncate" title={id}>{id || 'Pendiente...'}</div>
    </div>
    <div className="text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
    </div>
  </a>
);

const StudentCertificateView = () => {
  const { tokenId, serialNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credential, setCredential] = useState(null);
  const [pdfUri, setPdfUri] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE_URL}/api/verification/credential-history/${tokenId}/${serialNumber}`);
        if (!res.ok) throw new Error('Certificado no disponible');
        const json = await res.json();
        const cred = json?.credential || json?.data?.credential || {};
        setCredential(cred);

        // Parse PDF URI
        const meta = cred.metadata || {};
        const onChainUri = meta.uri || '';
        const metaUri = meta.metadataCid ? `ipfs://${meta.metadataCid}` : (onChainUri || '');
        const gateway = toGateway(metaUri);
        
        // Try to get direct file from properties if available (Mock mode usually has it)
        let fileUri = meta?.properties?.file?.uri || '';
        
        if (!fileUri && gateway) {
          try {
            const resp = await fetch(gateway);
            const md = await resp.json();
            fileUri = md?.properties?.file?.uri || '';
          } catch {}
        }
        
        setPdfUri(fileUri);
      } catch (e) {
        setError('No se pudo cargar el certificado. Verifique el ID.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tokenId, serialNumber]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error de Verificación</h2>
            <p className="text-gray-600">{error}</p>
        </div>
    </div>
  );

  const meta = credential?.metadata || {};
  const attrs = meta.attributes || [];
  const getAttr = (type) => attrs.find(a => a.trait_type === type)?.value || 'N/A';
  
  const studentName = getAttr('Student Name');
  const degree = getAttr('Degree');
  const university = getAttr('University');
  const honors = getAttr('Honors');
  const gpa = getAttr('GPA');
  const gradDate = attrs.find(a => a.display_type === 'date')?.value || 'N/A';

  const pdfUrl = toGateway(pdfUri);
  const hederaLink = `https://hashscan.io/${(import.meta.env.VITE_HEDERA_NETWORK || 'testnet')}/nft/${tokenId}-${serialNumber}`;
  const xrpLink = credential?.externalProofs?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}` : '#';
  const algoLink = credential?.externalProofs?.algoTxId ? `https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}` : '#';
  const ipfsLink = pdfUrl;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Certificate Preview */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
          >
            <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <span>🎓</span> Vista Previa del Documento
                </h2>
                {pdfUrl && (
                    <a href={pdfUrl} download className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                        ⬇ Descargar PDF
                    </a>
                )}
            </div>
            <div className="aspect-[1.414/1] bg-gray-200 relative">
                 {pdfUrl ? (
                    <iframe 
                        src={pdfUrl} 
                        className="w-full h-full absolute inset-0"
                        title="Certificate PDF"
                    />
                 ) : (
                     <div className="flex items-center justify-center h-full text-gray-500">
                         Documento no disponible para previsualización
                     </div>
                 )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Verification Details */}
        <div className="space-y-6">
            
            {/* Header Info */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-600"
            >
                <div className="uppercase tracking-wide text-xs text-indigo-600 font-bold mb-1">Credencial Académica Verificada</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{degree}</h1>
                <p className="text-lg text-gray-600 mb-4">Otorgado a <span className="font-semibold text-gray-800">{studentName}</span></p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Verificado</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">{university}</span>
                    {honors !== 'N/A' && <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">🎖 {honors}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4 mt-4">
                    <div>
                        <span className="block text-xs text-gray-400 uppercase">Fecha de Graduación</span>
                        <span className="font-medium">{gradDate}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400 uppercase">Promedio (GPA)</span>
                        <span className="font-medium">{gpa}</span>
                    </div>
                </div>
            </motion.div>

            {/* Blockchain Proofs */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>⛓️</span> Pruebas en Blockchain
                </h3>
                <div className="space-y-3">
                    <BlockchainBadge 
                        network="Hedera Hashgraph" 
                        id={credential?.tokenId ? `${credential.tokenId} #${credential.serialNumber}` : ''}
                        color="bg-black"
                        icon="Ħ"
                        link={hederaLink}
                    />
                    <BlockchainBadge 
                        network="XRPL Anchor" 
                        id={credential?.externalProofs?.xrpTxHash}
                        color="bg-blue-600"
                        icon="✕"
                        link={xrpLink}
                    />
                    <BlockchainBadge 
                        network="Algorand Anchor" 
                        id={credential?.externalProofs?.algoTxId}
                        color="bg-gray-800"
                        icon="A"
                        link={algoLink}
                    />
                    <BlockchainBadge 
                        network="IPFS / Filecoin" 
                        id={meta?.metadataCid || 'Document Hash'}
                        color="bg-teal-500"
                        icon="📦"
                        link={ipfsLink}
                    />
                </div>
                
                <div className="mt-6 border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Compartir Logro</h4>
                    <LinkedInButton credential={credential} />
                </div>
            </motion.div>

             {/* Verification Footer */}
             <div className="text-center text-xs text-gray-400 mt-8">
                <p>Verificación inmutable provista por AcademicChain Ledger.</p>
                <p className="mt-1">Timestamp: {new Date().toLocaleString()}</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default StudentCertificateView;