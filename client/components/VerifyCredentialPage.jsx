import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { toGateway } from './utils/ipfsUtils';
import { motion } from "framer-motion";
import { API_BASE_URL } from "./services/config";

const BlockchainBadge = ({ network, id, color, icon, link }) => (
  <a 
    href={link} 
    target="_blank" 
    rel="noreferrer"
    className="flex items-center p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer gap-3 w-full"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${color}`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="text-xs text-gray-500 uppercase font-semibold">{network}</div>
      <div className="text-sm font-mono truncate text-gray-800" title={id}>{id || 'Verificando...'}</div>
    </div>
    <div className="text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
    </div>
  </a>
);

const VerifyCredentialPage = () => {
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  // Support both /verify/:tokenId/:serialNumber and query params
  const urlTokenId = params.tokenId || searchParams.get('tokenId');
  const urlSerialNumber = params.serialNumber || searchParams.get('serialNumber');
  const urlCid = params.cid || searchParams.get('cid');
  const urlHash = params.uniqueHash || searchParams.get('hash');

  const [tokenId, setTokenId] = useState(urlTokenId || '');
  const [serialNumber, setSerialNumber] = useState(urlSerialNumber || '');
  
  const [loading, setLoading] = useState(false);
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const loadCredential = async (tid, sn, hash) => {
      if ((!tid || !sn) && !hash) return;
      setLoading(true);
      setError('');
      try {
          // Use the public verification endpoint (Hash or TokenID)
          let url = '';
          if (hash) {
             url = `${API_BASE_URL}/api/verification/hash/${hash}`;
          } else {
             url = `${API_BASE_URL}/api/verification/${tid}/${sn}`;
          }

          const res = await fetch(url);
          if (!res.ok) throw new Error('Credencial no encontrada o inválida');
          const json = await res.json();
          const cred = json?.credential || {};
          
          setCredential({
            ...cred,
            status: json.status,
            revocationDetails: json.revocationDetails,
            verifiableCredential: json.verifiableCredential,
            externalProofs: json.proofs,
            metadata: {
               attributes: [
                 { trait_type: "Student Name", value: cred.studentName || "N/A" },
                 { trait_type: "Degree", value: cred.degree || "N/A" },
                 { trait_type: "University", value: cred.universityName || "N/A" }
               ],
               uri: json.proofs?.ipfs
            }
          });
          setStatus(json.status || 'ACTIVE');
          // If loaded by hash, update state
          if (json.credential.tokenId) setTokenId(json.credential.tokenId);
          if (json.credential.serialNumber) setSerialNumber(json.credential.serialNumber);
      } catch (err) {
          console.error(err);
          setError('No se pudo verificar la credencial. Verifique los datos.');
          setCredential(null);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      if (urlHash) {
          loadCredential(null, null, urlHash);
      } else if (urlTokenId && urlSerialNumber) {
          loadCredential(urlTokenId, urlSerialNumber);
      }
  }, [urlTokenId, urlSerialNumber, urlHash]);

  // Derived Data
  const meta = credential?.metadata || {};
  const attrs = meta.attributes || [];
  const getAttr = (type) => attrs.find(a => a.trait_type === type)?.value || 'N/A';
  
  const studentName = getAttr('Student Name');
  const degree = getAttr('Degree');
  const university = getAttr('University');
  
  const hederaLink = `https://hashscan.io/${(import.meta.env.VITE_HEDERA_NETWORK || 'testnet')}/nft/${tokenId}-${serialNumber}`;
  const xrpLink = credential?.externalProofs?.xrpTxHash ? `https://testnet.xrpl.org/transactions/${credential.externalProofs.xrpTxHash}` : '#';
  const algoLink = credential?.externalProofs?.algoTxId ? `https://testnet.algoexplorer.io/tx/${credential.externalProofs.algoTxId}` : '#';
  
  const ipfsUri = credential?.ipfsURI || (urlCid ? `ipfs://${urlCid}` : '');
  const pdfUrl = toGateway(ipfsUri);
  const cid = ipfsUri.replace('ipfs://', '');
  const filecoinLink = `https://gateway.lighthouse.storage/ipfs/${cid}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Portal de Verificación Pública
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verifique la autenticidad de credenciales académicas en tiempo real utilizando tecnología Blockchain de triple anclaje.
          </p>
        </div>

        {/* Search Box (only if not loaded via URL) */}
        {(!urlTokenId || !urlSerialNumber) && !credential && (
             <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingresar Datos Manualmente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        className="input-primary" 
                        placeholder="Token ID (ej. 0.0.12345)" 
                        value={tokenId} 
                        onChange={(e) => setTokenId(e.target.value)} 
                    />
                    <input 
                        className="input-primary" 
                        placeholder="Número de Serie (ej. 1)" 
                        value={serialNumber} 
                        onChange={(e) => setSerialNumber(e.target.value)} 
                    />
                </div>
                <button 
                    className="btn-primary w-full py-3 text-lg"
                    onClick={() => loadCredential(tokenId, serialNumber)}
                    disabled={loading || !tokenId || !serialNumber}
                >
                    {loading ? 'Verificando...' : 'Verificar Credencial'}
                </button>
             </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Consultando Hedera Hashgraph, XRP Ledger y Algorand...</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-8 shadow-sm">
                <div className="flex items-center">
                    <div className="flex-shrink-0 text-red-500">❌</div>
                    <div className="ml-3">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Success / Credential View */}
        {credential && !loading && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left Column: Visual & Status */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                        <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center">
                            <span className="text-white font-bold tracking-wider uppercase text-sm">Vista Previa</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'ACTIVE' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                                {status === 'ACTIVE' ? '✓ VÁLIDO' : '⚠ REVOCADO'}
                            </span>
                        </div>
                        <div className="aspect-[1.414/1] bg-gray-100 relative group">
                            {pdfUrl ? (
                                <iframe src={pdfUrl} className="w-full h-full" title="Credential PDF" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">Sin vista previa</div>
                            )}
                            <a href={pdfUrl} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-sm font-semibold hover:bg-white transition-colors">
                                ↗ Abrir Original
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                         <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles del Titular</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Nombre del Estudiante</div>
                                 <div className="text-xl font-medium text-gray-900">{studentName}</div>
                             </div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Institución Emisora</div>
                                 <div className="text-xl font-medium text-gray-900">{university}</div>
                             </div>
                             <div className="sm:col-span-2">
                                 <div className="text-xs text-gray-500 uppercase font-semibold">Título / Grado</div>
                                 <div className="text-2xl font-bold text-indigo-700">{degree}</div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right Column: Triple Proof */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-green-500">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Prueba de Vida Triple</h3>
                        <p className="text-sm text-gray-600 mb-6">Este documento ha sido autenticado criptográficamente en tres redes públicas independientes.</p>
                        
                        <div className="space-y-4">
                            <BlockchainBadge 
                                network="Hedera Hashgraph" 
                                id={`${tokenId} #${serialNumber}`}
                                color="bg-black"
                                icon="Ħ"
                                link={hederaLink}
                            />
                            <BlockchainBadge 
                                network="XRP Ledger" 
                                id={credential?.externalProofs?.xrpTxHash}
                                color="bg-blue-600"
                                icon="✕"
                                link={xrpLink}
                            />
                            <BlockchainBadge 
                                network="Algorand" 
                                id={credential?.externalProofs?.algoTxId}
                                color="bg-gray-800"
                                icon="A"
                                link={algoLink}
                            />
                        </div>
                        
                        {/* Sello de Veracidad */}
                        <div className="mt-6 flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-200">
                            <div className="w-16 h-16 flex-shrink-0 bg-green-600 rounded-full flex items-center justify-center border-4 border-green-100 shadow-sm">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-green-800 font-bold text-sm uppercase tracking-wide">Sello de Veracidad Digital</h4>
                                <p className="text-xs text-green-700 mt-1">
                                    Documento inmutable alojado en IPFS/Filecoin y registrado en Hedera & XRP.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status List Verification */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-blue-500 mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verificación de Estado en Cadena</h3>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {status === 'ACTIVE' 
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    }
                                </svg>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">
                                    {status === 'ACTIVE' ? 'Credencial Válida' : 'Credencial Revocada'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Verificado contra Bitstring Status List (W3C Standard).
                                    <br/>
                                    <span className="text-xs font-mono text-gray-400">Index: {serialNumber} | Issuer: did:web:localhost:3001</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Portability */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-purple-500 mt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Portabilidad (W3C VC)</h3>
                        <p className="text-sm text-gray-600 mb-4">Descarga tu credencial verificable para usarla en wallets compatibles (eIDAS, Dock, Veres One).</p>
                        
                        <button
                          onClick={() => {
                            if (!credential?.verifiableCredential) return;
                            const content = typeof credential.verifiableCredential === 'string' 
                              ? credential.verifiableCredential 
                              : JSON.stringify(credential.verifiableCredential, null, 2);
                            
                            const blob = new Blob([content], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `credential-${tokenId}-${serialNumber}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          disabled={!credential?.verifiableCredential}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                           </svg>
                           Descargar VC
                        </button>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <span>🧊</span> Almacenamiento Eterno
                        </h4>
                        <p className="text-xs text-blue-800 mb-3">
                            Respaldado en la red Filecoin para garantizar la disponibilidad permanente de los datos, independiente de servidores centrales.
                        </p>
                        <a href={filecoinLink} target="_blank" rel="noreferrer" className="text-xs font-mono text-blue-600 break-all hover:underline">
                            CID: {cid}
                        </a>
                    </div>
                </div>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifyCredentialPage;
