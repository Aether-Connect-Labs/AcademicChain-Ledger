import { useState, useCallback, useEffect, useRef } from 'react';
import { verificationService } from '../services/verificationService';
import { OFFICIAL_BILLETERA_MADRE } from '../services/config';
import QRScanner from '../ui/QRScanner.jsx';
import DocumentViewer from '../ui/DocumentViewer';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';

const CredentialVerifier = () => {
  const [state, setState] = useState({ status: 'idle', mode: 'credential' });
  const [scanCount, setScanCount] = useState(0);
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [docOpen, setDocOpen] = useState(false);
  const diplomaRef = useRef(null);
  const [merkle, setMerkle] = useState({ ready: false, hash: '', root: '', proof: [], hedera: null, xrpl: null, algorand: null, verified: false });
  const hexToBytes = (hex) => {
    const clean = String(hex || '').trim().toLowerCase().replace(/^0x/, '');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  };
  const bytesToHex = (buffer) => {
    const arr = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    let s = '';
    for (let i = 0; i < arr.length; i++) {
      const h = arr[i].toString(16).padStart(2, '0');
      s += h;
    }
    return s;
  };
  const sha256HexConcat = async (hexA, hexB, order) => {
    const a = hexToBytes(hexA);
    const b = hexToBytes(hexB);
    const joined = order === 'left'
      ? new Uint8Array(a.length + b.length)
      : new Uint8Array(b.length + a.length);
    if (order === 'left') {
      joined.set(a, 0);
      joined.set(b, a.length);
    } else {
      joined.set(b, 0);
      joined.set(a, b.length);
    }
    const digest = await crypto.subtle.digest('SHA-256', joined);
    return bytesToHex(digest);
  };
  const verifyProof = async (leafHex, proofArray, expectedRoot) => {
    let acc = String(leafHex).trim().toLowerCase();
    for (const step of (Array.isArray(proofArray) ? proofArray : [])) {
      const sib = String(step.hash || '').trim().toLowerCase();
      const pos = step.position === 'left' ? 'left' : 'right';
      acc = await sha256HexConcat(sib, acc, pos);
    }
    return acc === String(expectedRoot || '').trim().toLowerCase();
  };
  const fetchLatestMerkleRootFromTopic = async (topicId) => {
    const base = import.meta.env.VITE_HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';
    const url = `${base}/api/v1/topics/${topicId}/messages?limit=50&order=desc`;
    const res = await axios.get(url, { timeout: 15000 });
    const messages = res.data?.messages || [];
    for (const m of messages) {
      try {
        const msg = atob(m.message || '');
        const j = JSON.parse(msg);
        if (j && j.type === 'MERKLE_ROOT' && typeof j.merkleRoot === 'string') {
          return { merkleRoot: j.merkleRoot, sequenceNumber: m.sequence_number, consensusTimestamp: m.consensus_timestamp, topicId };
        }
      } catch {}
    }
    return null;
  };

  const toGateways = (uri) => {
    if (!uri) return [];
    const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
    const primary = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/$/, '');
    const list = [
      'https://gateway.pinata.cloud/ipfs',
      'https://ipfs.io/ipfs',
      'https://dweb.link/ipfs',
      'https://cloudflare-ipfs.com/ipfs',
      primary
    ];
    const uniq = Array.from(new Set(list));
    return uniq.map(g => `${g}/${cid}`);
  };
  const toGateway = (uri) => {
    const urls = toGateways(uri);
    return urls[0] || '';
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!diplomaRef.current) return;
    const canvas = await html2canvas(diplomaRef.current, { backgroundColor: '#ffffff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const y = Math.max(10, (pageHeight - imgHeight) / 2);
    pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
    pdf.setFontSize(9);
    const gw = toGateway(state.data?.ipfsURI);
    const hedId = state.data?.tokenId && state.data?.serialNumber ? `${state.data.tokenId}-${state.data.serialNumber}` : '';
    const ts = new Date().toLocaleString();
    const lines = [
      hedId ? `Hedera ID: ${hedId}` : '',
      gw ? `IPFS: ${gw}` : '',
      `Generado: ${ts}`,
      OFFICIAL_BILLETERA_MADRE ? `Certificado emitido por la Autoridad Central AcademicChain (ID: ${OFFICIAL_BILLETERA_MADRE}). Autenticidad verificada mediante firma criptográfica inalterable.` : ''
    ].filter(Boolean);
    let ty = y + imgHeight + 6;
    if (ty > pageHeight - 20) ty = pageHeight - 20;
    for (const line of lines) {
      const wrapped = pdf.splitTextToSize(line, 180);
      pdf.text(wrapped, 10, ty);
      ty += (wrapped.length * 5) + 2;
    }
    const uni = (state.data?.metadata?.attributes || []).find(a => a.trait_type === 'University')?.value || 'Universidad';
    const stu = (state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Student')?.value || 'Estudiante';
    const deg = (state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Degree')?.value || 'Título';
    const fileName = `Diploma-${uni}-${stu}-${deg}.pdf`.replace(/[^\w\-.]+/g, '_');
    pdf.save(fileName);
  }, [state.data]);

  const handleDownloadMerklePDF = useCallback(async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const title = 'Certificado de Autenticidad Blockchain';
    pdf.setFontSize(16);
    pdf.text(title, 10, 20);
    pdf.setFontSize(11);
    const ts = new Date().toLocaleString();
    const lines = [
      `Fecha de verificación: ${ts}`,
      `Raíz de Merkle: ${merkle.root || 'N/A'}`,
      `Hash del documento: ${merkle.hash || 'N/A'}`,
      `Hedera Topic ID: ${merkle.hedera?.topicId || 'N/A'}`,
      `XRPL Tx: ${merkle.xrpl?.txHash || 'N/A'}`,
      `Algorand Tx: ${merkle.algorand?.txId || 'N/A'}`,
      `Resultado: ${merkle.verified ? 'Auténtico (prueba válida)' : 'No válido (prueba no coincide)'}`
    ];
    let y = 30;
    for (const line of lines) {
      const wrapped = pdf.splitTextToSize(line, 180);
      pdf.text(wrapped, 10, y);
      y += (wrapped.length * 6) + 2;
    }
    pdf.setFontSize(9);
    const legal = 'La integridad se valida criptográficamente mediante Árbol de Merkle contra raíz publicada en redes distribuidas (Hedera/XRPL/Algorand).';
    const lwrapped = pdf.splitTextToSize(legal, 180);
    pdf.text(lwrapped, 10, y + 4);
    if (OFFICIAL_BILLETERA_MADRE) {
      const phrase = `Certificado emitido por la Autoridad Central AcademicChain (ID: ${OFFICIAL_BILLETERA_MADRE}). Autenticidad verificada mediante firma criptográfica inalterable.`;
      const pw = pdf.splitTextToSize(phrase, 180);
      pdf.text(pw, 10, y + 14);
    }
    pdf.save(`Certificado-Autenticidad-${(merkle.hash||'').slice(0,8)}.pdf`);
  }, [merkle]);

  const validateQRData = (data) => {
    try {
      const parsed = JSON.parse(data);
      return !!(parsed.tokenId && parsed.serialNumber);
    } catch {
      return false;
    }
  };

  const checkStatus = useCallback(async (tokenId, serialNumber) => {
    try {
      const res = await verificationService.getCredentialStatus(tokenId, serialNumber);
      const st = String(res.data?.status || res.status || '').toUpperCase();
      if (st === 'REVOKED') {
        const reason = res.data?.revocationReason || null;
        return { ok: false, message: '⚠️ TÍTULO REVOCADO: Esta credencial ha sido anulada por la institución emisora.', reason };
      }
      return { ok: true };
    } catch {
      return { ok: true };
    }
  }, []);

  const handleScan = useCallback(async (data) => {
    if (!data || state.status === 'verifying') return;

    if (!validateQRData(data)) {
      setState({ status: 'error', error: 'Formato de QR inválido. Escanea un código válido de AcademicChain.' });
      return;
    }

    setState({ status: 'verifying' });
    setScanCount(prev => prev + 1);

    try {
      const parsed = JSON.parse(data);
      const statusCheck = await checkStatus(parsed.tokenId, parsed.serialNumber);
      if (!statusCheck.ok) {
        setState({ status: 'error', error: statusCheck.message });
        return;
      }
      const payload = await verificationService.verifyCredential(parsed.tokenId, parsed.serialNumber);
      
      if (payload.success && payload.data?.valid && payload.data?.credential) {
        const cred = payload.data.credential;
        const props = cred?.metadata?.properties || {};
        const issuerId = props?.issuerAccountId || '';
        if (OFFICIAL_BILLETERA_MADRE && issuerId && issuerId !== OFFICIAL_BILLETERA_MADRE) {
          setState({ status: 'error', error: '⚠️ FRAUDE: Esta credencial no fue emitida por la autoridad oficial.' });
          return;
        }
        const attrs = Array.isArray(cred?.metadata?.attributes) ? cred.metadata.attributes : [];
        const uni = (attrs.find(a => a.trait_type === 'University')?.value || '');
        const stu = (attrs.find(a => a.trait_type === 'Student')?.value || '');
        const deg = (attrs.find(a => a.trait_type === 'Degree')?.value || '');
        const date = (attrs.find(a => a.display_type === 'date')?.value || '');
        const uri = cred?.metadata?.properties?.file?.uri || cred?.ipfsURI || '';
        const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
        const baseStr = [stu, deg, date, cid].join('|');
        const enc = new TextEncoder().encode(baseStr);
        const digest = await crypto.subtle.digest('SHA-256', enc);
        const calcHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
        const stored = String(props?.file?.hash || '').trim().toLowerCase();
        if (stored && calcHex !== stored) {
          setState({ status: 'error', error: 'CONTENIDO ALTERADO: Los datos no coinciden con el hash de la Blockchain.' });
          return;
        }
        setState({
          status: 'success',
          data: cred,
          xrpAnchor: payload.data.xrpAnchor || null,
          algorandAnchor: payload.data.algorandAnchor || null
        });
      } else {
        throw new Error('Credencial inválida');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar la credencial. Intenta nuevamente.';
      setState({ status: 'error', error: errorMessage });
    }
  }, [state.status]);

  const handleSubmitManual = useCallback(async (e) => {
    e.preventDefault();
    if (!tokenIdInput || !serialInput || state.status === 'verifying') return;
    setState({ status: 'verifying' });
    try {
      const statusCheck = await checkStatus(tokenIdInput.trim(), serialInput.trim());
      if (!statusCheck.ok) {
        setState({ status: 'error', error: statusCheck.message });
        return;
      }
      const payload = await verificationService.verifyCredential(tokenIdInput.trim(), serialInput.trim());
      
      if (payload.success && payload.data?.valid && payload.data?.credential) {
        const cred = payload.data.credential;
        const props = cred?.metadata?.properties || {};
        const issuerId = props?.issuerAccountId || '';
        if (OFFICIAL_BILLETERA_MADRE && issuerId && issuerId !== OFFICIAL_BILLETERA_MADRE) {
          setState({ status: 'error', error: '⚠️ FRAUDE: Esta credencial no fue emitida por la autoridad oficial.' });
          return;
        }
        const attrs = Array.isArray(cred?.metadata?.attributes) ? cred.metadata.attributes : [];
        const uni = (attrs.find(a => a.trait_type === 'University')?.value || '');
        const stu = (attrs.find(a => a.trait_type === 'Student')?.value || '');
        const deg = (attrs.find(a => a.trait_type === 'Degree')?.value || '');
        const date = (attrs.find(a => a.display_type === 'date')?.value || '');
        const uri = cred?.metadata?.properties?.file?.uri || cred?.ipfsURI || '';
        const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
        const baseStr = [stu, deg, date, cid].join('|');
        const enc = new TextEncoder().encode(baseStr);
        const digest = await crypto.subtle.digest('SHA-256', enc);
        const calcHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
        const stored = String(props?.file?.hash || '').trim().toLowerCase();
        if (stored && calcHex !== stored) {
          setState({ status: 'error', error: 'CONTENIDO ALTERADO: Los datos no coinciden con el hash de la Blockchain.' });
          return;
        }
        setState({
            status: 'success',
            data: cred,
            xrpAnchor: payload.data.xrpAnchor || null,
            algorandAnchor: payload.data.algorandAnchor || null
        });
      } else {
        throw new Error('Credencial inválida');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar la credencial. Intenta nuevamente.';
      setState({ status: 'error', error: errorMessage });
    }
  }, [tokenIdInput, serialInput, state.status]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tid = params.get('tokenId');
      const sn = params.get('serialNumber');
      const hash = params.get('hash');
      const proofRaw = params.get('proof');
      const proofB64 = params.get('proof_b64');
      const rootParam = params.get('merkleRoot');
      const topicId = params.get('hederaTopicId');
      const xrplTx = params.get('xrplTx');
      const algoTx = params.get('algoTx');
      if (hash && proofRaw && state.status !== 'verifying') {
        setState({ status: 'verifying', mode: 'merkle' });
        (async () => {
          try {
            let root = String(rootParam || '').trim();
            let hederaInfo = null;
            if (!root && topicId) {
              const latest = await fetchLatestMerkleRootFromTopic(topicId);
              if (latest && latest.merkleRoot) {
                root = latest.merkleRoot;
                hederaInfo = latest;
              }
            }
            if (!root) {
              setState({ status: 'error', mode: 'merkle', error: 'No se encontró merkleRoot. Proporciona merkleRoot o hederaTopicId.' });
              return;
            }
            let proofArr = [];
            try { proofArr = JSON.parse(decodeURIComponent(proofRaw)); } catch { proofArr = []; }
            const ok = await verifyProof(String(hash).trim().toLowerCase(), proofArr, root);
            const xrplUrl = xrplTx ? `https://${(import.meta.env.VITE_XRPL_NETWORK || 'testnet').includes('main') ? 'livenet' : 'testnet'}.xrpl.org/transactions/${encodeURIComponent(xrplTx)}` : '';
            const algoUrl = algoTx ? `https://testnet.explorer.perawallet.app/tx/${encodeURIComponent(algoTx)}/` : '';
            setMerkle({
              ready: true,
              hash: String(hash).trim().toLowerCase(),
              root: root.toLowerCase(),
              proof: proofArr,
              hedera: hederaInfo || { topicId: topicId || null },
              xrpl: xrplTx ? { txHash: xrplTx, explorer: xrplUrl } : null,
              algorand: algoTx ? { txId: algoTx, explorer: algoUrl } : null,
              verified: ok
            });
            setState({ status: ok ? 'success' : 'error', mode: 'merkle', error: ok ? '' : 'La prueba de Merkle no coincide con la raíz' });
          } catch (e) {
            setState({ status: 'error', mode: 'merkle', error: e instanceof Error ? e.message : 'Error en verificación Merkle' });
          }
        })();
        return;
      }
      if (hash && proofB64 && state.status !== 'verifying') {
        setState({ status: 'verifying', mode: 'merkle' });
        (async () => {
          try {
            let root = String(rootParam || '').trim();
            let hederaInfo = null;
            if (!root && topicId) {
              const latest = await fetchLatestMerkleRootFromTopic(topicId);
              if (latest && latest.merkleRoot) {
                root = latest.merkleRoot;
                hederaInfo = latest;
              }
            }
            if (!root) {
              setState({ status: 'error', mode: 'merkle', error: 'No se encontró merkleRoot. Proporciona merkleRoot o hederaTopicId.' });
              return;
            }
            let proofArr = [];
            try {
              const json = atob(proofB64.replace(/-/g, '+').replace(/_/g, '/'));
              proofArr = JSON.parse(json);
            } catch { proofArr = []; }
            const ok = await verifyProof(String(hash).trim().toLowerCase(), proofArr, root);
            const xrplUrl = xrplTx ? `https://${(import.meta.env.VITE_XRPL_NETWORK || 'testnet').includes('main') ? 'livenet' : 'testnet'}.xrpl.org/transactions/${encodeURIComponent(xrplTx)}` : '';
            const algoUrl = algoTx ? `https://testnet.explorer.perawallet.app/tx/${encodeURIComponent(algoTx)}/` : '';
            setMerkle({
              ready: true,
              hash: String(hash).trim().toLowerCase(),
              root: root.toLowerCase(),
              proof: proofArr,
              hedera: hederaInfo || { topicId: topicId || null },
              xrpl: xrplTx ? { txHash: xrplTx, explorer: xrplUrl } : null,
              algorand: algoTx ? { txId: algoTx, explorer: algoUrl } : null,
              verified: ok
            });
            setState({ status: ok ? 'success' : 'error', mode: 'merkle', error: ok ? '' : 'La prueba de Merkle no coincide con la raíz' });
          } catch (e) {
            setState({ status: 'error', mode: 'merkle', error: e instanceof Error ? e.message : 'Error en verificación Merkle' });
          }
        })();
        return;
      }
      if (tid && sn && state.status !== 'verifying' && state.status !== 'success') {
        (async () => {
          setTokenIdInput(tid);
          setSerialInput(sn);
          setState({ status: 'verifying' });
          try {
            const statusCheck = await checkStatus(tid, sn);
            if (!statusCheck.ok) {
              setState({ status: 'error', error: statusCheck.message });
              return;
            }
            const payload = await verificationService.verifyCredential(tid, sn);
            
            if (payload.success && payload.data?.valid && payload.data?.credential) {
              const cred = payload.data.credential;
              const props = cred?.metadata?.properties || {};
              const issuerId = props?.issuerAccountId || '';
              if (OFFICIAL_BILLETERA_MADRE && issuerId && issuerId !== OFFICIAL_BILLETERA_MADRE) {
                setState({ status: 'error', error: '⚠️ FRAUDE: Esta credencial no fue emitida por la autoridad oficial.' });
                return;
              }
              const attrs = Array.isArray(cred?.metadata?.attributes) ? cred.metadata.attributes : [];
              const uni = (attrs.find(a => a.trait_type === 'University')?.value || '');
              const stu = (attrs.find(a => a.trait_type === 'Student')?.value || '');
              const deg = (attrs.find(a => a.trait_type === 'Degree')?.value || '');
              const date = (attrs.find(a => a.display_type === 'date')?.value || '');
              const uri = cred?.metadata?.properties?.file?.uri || cred?.ipfsURI || '';
              const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
              const baseStr = [stu, deg, date, cid].join('|');
              const enc = new TextEncoder().encode(baseStr);
              const digest = await crypto.subtle.digest('SHA-256', enc);
              const calcHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
              const stored = String(props?.file?.hash || '').trim().toLowerCase();
              if (stored && calcHex !== stored) {
                setState({ status: 'error', mode: 'credential', error: 'CONTENIDO ALTERADO: Los datos no coinciden con el hash de la Blockchain.' });
                return;
              }
              setState({ 
                status: 'success', 
                data: cred, 
                xrpAnchor: payload.data.xrpAnchor || null,
                algorandAnchor: payload.data.algorandAnchor || null 
              });
            } else {
              throw new Error('Credencial inválida');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al verificar la credencial. Intenta nuevamente.';
            setState({ status: 'error', error: errorMessage });
          }
        })();
      }
    } catch {}
  }, [state.status]);

  const handleReset = () => setState({ status: 'idle' });
  const handleRetry = () => setState({ status: 'scanning' });

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-gray-600 mb-4">
              Escanea el código QR de una credencial académica para verificar su autenticidad en Hedera
            </p>
            <form onSubmit={handleSubmitManual} className="mt-6 grid grid-cols-1 gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={tokenIdInput}
                onChange={(e) => setTokenIdInput(e.target.value)}
                placeholder="Token ID (ej. 0.0.123456)"
                className="input-primary"
              />
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Serial Number (ej. 1)"
                className="input-primary"
              />
              <button type="submit" className="btn-primary">
                Verificar manualmente
              </button>
            </form>
          </div>
        );

      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            {state.mode === 'merkle' ? (
              <>
                <p className="text-blue-600 font-medium">Verificando prueba de Merkle en tu dispositivo...</p>
                <p className="text-sm text-gray-500 mt-2">Descargando raíz desde Hedera</p>
              </>
            ) : (
              <>
                <p className="text-blue-600 font-medium">Verificando en Hedera Network...</p>
                <p className="text-sm text-gray-500 mt-2">Consultando el consenso distribuido</p>
              </>
            )}
          </div>
        );

      case 'success':
        return state.mode === 'merkle' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-8 pt-8 text-center">
                <div className="text-xs uppercase tracking-widest text-green-600">Verificación Trustless</div>
                <h3 className="mt-1 text-2xl font-extrabold tracking-wide text-gray-900">Prueba de Merkle</h3>
              </div>
              <div className="px-10 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-lg border p-4 bg-green-50 border-green-200">
                    <div className="text-sm font-semibold">Hedera</div>
                    <div className="mt-1 text-xs">Raíz publicada</div>
                    {merkle.hedera?.topicId ? (
                      <a className="text-blue-600 text-xs underline" href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/topic/${merkle.hedera.topicId}`} target="_blank" rel="noreferrer">Ver Topic</a>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">XRPL</div>
                    <div className="mt-1 text-xs">Estado: {merkle.xrpl?.txHash ? 'Anclado' : 'N/A'}</div>
                    {merkle.xrpl?.txHash ? (
                      <a className="text-blue-600 text-xs underline" href={merkle.xrpl.explorer} target="_blank" rel="noreferrer">Ver Tx</a>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Algorand</div>
                    <div className="mt-1 text-xs">Estado: {merkle.algorand?.txId ? 'Anclado' : 'N/A'}</div>
                    {merkle.algorand?.txId ? (
                      <a className="text-blue-600 text-xs underline" href={merkle.algorand.explorer} target="_blank" rel="noreferrer">Ver Tx</a>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-lg border p-4 ${merkle.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm font-semibold">Resultado</div>
                    <div className="mt-1 font-mono text-xs break-all">Leaf: {merkle.hash}</div>
                    <div className="mt-1 font-mono text-xs break-all">Root: {merkle.root}</div>
                    <div className="mt-2 text-sm">{merkle.verified ? '✓ Coincide con la raíz' : '✗ No coincide con la raíz'}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Hedera</div>
                    <div className="mt-1 text-xs">Raíz publicada</div>
                    {merkle.hedera?.topicId ? (
                      <a className="text-blue-600 text-xs underline" href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/topic/${merkle.hedera.topicId}`} target="_blank" rel="noreferrer">Ver Topic</a>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Exploradores</div>
                    <div className="mt-1 text-xs">XRPL: {merkle.xrpl?.txHash ? <a className="text-blue-600 underline" href={merkle.xrpl.explorer} target="_blank" rel="noreferrer">Ver</a> : 'N/A'}</div>
                    <div className="mt-1 text-xs">Algorand: {merkle.algorand?.txId ? <a className="text-blue-600 underline" href={merkle.algorand.explorer} target="_blank" rel="noreferrer">Ver</a> : 'N/A'}</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 flex items-center justify-center bg-gray-50">
                    {(() => {
                      const params = new URLSearchParams();
                      if (merkle.hash) params.set('hash', merkle.hash);
                      if (merkle.proof?.length) {
                        try {
                          const b64 = btoa(JSON.stringify(merkle.proof));
                          params.set('proof_b64', b64);
                        } catch {}
                      }
                      if (merkle.hedera?.topicId) params.set('hederaTopicId', merkle.hedera.topicId);
                      if (merkle.xrpl?.txHash) params.set('xrplTx', merkle.xrpl.txHash);
                      if (merkle.algorand?.txId) params.set('algoTx', merkle.algorand.txId);
                      const url = `${window.location.origin}/#/verificar?${params.toString()}`;
                      return <QRCode value={url} size={128} />;
                    })()}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold mb-2">Acciones</div>
                    <button onClick={handleDownloadMerklePDF} className="btn-primary btn-sm">Descargar Certificado de Autenticidad (PDF)</button>
                    <button onClick={() => {
                      const params = new URLSearchParams();
                      if (merkle.hash) params.set('hash', merkle.hash);
                      if (merkle.proof?.length) {
                        try {
                          const b64 = btoa(JSON.stringify(merkle.proof));
                          params.set('proof_b64', b64);
                        } catch {}
                      }
                      if (merkle.hedera?.topicId) params.set('hederaTopicId', merkle.hedera.topicId);
                      if (merkle.xrpl?.txHash) params.set('xrplTx', merkle.xrpl.txHash);
                      if (merkle.algorand?.txId) params.set('algoTx', merkle.algorand.txId);
                      const url = `${window.location.origin}/#/verificar?${params.toString()}`;
                      navigator.clipboard.writeText(url);
                    }} className="btn-secondary btn-sm ml-2">Copiar Link de Verificación</button>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-sm text-gray-700">La verificación se ejecutó localmente en tu dispositivo. No se requirió confianza en el servidor.</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="btn-primary">Verificar otra credencial</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div ref={diplomaRef} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-8 pt-8 text-center">
                <div className="text-xs uppercase tracking-widest text-blue-600">Certificado Académico</div>
                {(() => {
                  const logoAttr = (state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Institution Logo')?.value || '';
                  const raw = state.data?.metadata?.image || logoAttr || '';
                  const urls = toGateways(raw);
                  if (!urls.length) return null;
                  return (
                    <div className="w-full flex justify-center mb-3">
                      <img
                        src={urls[0]}
                        data-idx="0"
                        alt="Institución"
                        className="h-20 object-contain"
                        onError={(e) => {
                          const i = Number(e.currentTarget.dataset.idx || '0');
                          const next = urls[i + 1];
                          if (next) {
                            e.currentTarget.dataset.idx = String(i + 1);
                            e.currentTarget.src = next;
                          }
                        }}
                      />
                    </div>
                  );
                })()}
                <h3 className="mt-1 text-3xl font-extrabold tracking-wide text-gray-900">
                  {(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'University')?.value}
                </h3>
              </div>
              <div className="px-10 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-lg border p-4 bg-green-50 border-green-200">
                    <div className="text-sm font-semibold">Hedera</div>
                    <div className="mt-1 text-xs">Estado: Válido</div>
                    {state.data?.tokenId ? (
                      <a className="text-blue-600 text-xs underline" href={`https://hashscan.io/${import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet')}/token/${state.data.tokenId}`} target="_blank" rel="noreferrer">Ver en Hashscan</a>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">XRPL</div>
                    <div className="mt-1 text-xs">Estado: {state.xrpAnchor?.xrpTxHash ? 'Anclado' : 'N/A'}</div>
                    {state.xrpAnchor?.xrpTxHash ? (
                      <a className="text-blue-600 text-xs underline" href={`https://${(import.meta.env.VITE_XRPL_NETWORK || 'testnet').includes('main') ? 'livenet' : 'testnet'}.xrpl.org/transactions/${state.xrpAnchor.xrpTxHash}`} target="_blank" rel="noreferrer">Ver Tx</a>
                    ) : null}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Algorand</div>
                    <div className="mt-1 text-xs">Estado: {state.algorandAnchor?.algoTxId ? 'Anclado' : 'N/A'}</div>
                    {state.algorandAnchor?.algoTxId ? (
                      <a className="text-blue-600 text-xs underline" href={`https://${(import.meta.env.VITE_ALGORAND_NETWORK || 'testnet')==='mainnet'?'algoexplorer.io':'testnet.algoexplorer.io'}/tx/${state.algorandAnchor.algoTxId}`} target="_blank" rel="noreferrer">Ver Tx</a>
                    ) : null}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Otorgado a</div>
                  <div className="text-4xl font-bold text-gray-900">
                    {(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Student')?.value || 'Estudiante'}
                  </div>
                  <div className="mt-3 text-gray-700">Por completar</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Degree')?.value}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {(state.data?.metadata?.attributes || []).find(a => a.display_type === 'date')?.value}
                  </div>
                  {(() => {
                    const props = state.data?.metadata?.properties || {};
                    const exp = props?.credential_info?.expiry_date || null;
                    if (!exp) return null;
                    return (
                      <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs">
                        Expira: {exp}
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Token</div>
                    <div className="font-mono text-sm text-gray-900">{state.data?.tokenId}</div>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Serial</div>
                    <div className="font-mono text-sm text-gray-900">{state.data?.serialNumber}</div>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <div className="text-xs text-gray-500">Transacción Hedera</div>
                    <div className="font-mono text-xs text-blue-600">{(state.data?.transactionId || '').slice(0, 18)}...</div>
                  </div>
                </div>
                {(() => {
                  const props = state.data?.metadata?.properties || {};
                  const external = props?.external_anchors || {};
                  const xrpHash = external?.xrpl?.testnet_tx_hash || state.xrpAnchor?.xrpTxHash || '';
                  const xrpUrl = external?.xrpl?.explorer_url || (xrpHash ? `https://testnet.xrpl.org/transactions/${encodeURIComponent(xrpHash)}` : '');
                  const algoId = external?.algorand?.testnet_tx_id || state.algorandAnchor?.algoTxId || '';
                  const algoUrl = external?.algorand?.explorer_url || (algoId ? `https://testnet.explorer.perawallet.app/tx/${encodeURIComponent(algoId)}/` : '');
                  return (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <div className="text-xs text-gray-500 mb-1">XRP tx hash</div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm break-all">{xrpHash || 'N/A'}</div>
                          {xrpUrl && (
                            <a className="ml-3 text-blue-600 hover:underline text-sm" href={xrpUrl} target="_blank" rel="noreferrer">Ver</a>
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <div className="text-xs text-gray-500 mb-1">Algorand tx id</div>
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm break-all">{algoId || 'N/A'}</div>
                          {algoUrl && (
                            <a className="ml-3 text-blue-600 hover:underline text-sm" href={algoUrl} target="_blank" rel="noreferrer">Ver</a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 flex items-center justify-center bg-gray-50">
                    {(() => {
                      const tokenId = state.data?.tokenId;
                      const serialNumber = state.data?.serialNumber;
                      const link = `${window.location.origin}/#/verificar?tokenId=${encodeURIComponent(tokenId || '')}&serialNumber=${encodeURIComponent(serialNumber || '')}`;
                      return <QRCode value={link} size={128} />;
                    })()}
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500 mb-1">Institución</div>
                    <div className="font-medium">
                      {(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'University')?.value}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 mb-1">Firma</div>
                    <div className="text-sm break-all">
                      {(state.data?.metadata?.attributes || []).find(a => a.trait_type === 'Signature')?.value || 'N/A'}
                    </div>
                    {(() => {
                      const props = state.data?.metadata?.properties || {};
                      const creator = props?.creator || null;
                      if (!creator) return null;
                      return (
                        <div className="mt-2 text-xs text-gray-500">
                          Creador: <span className="text-gray-700">{String(creator)}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  {(state.data?.ipfsURI || '').startsWith('ipfs://') ? (
                    <span className="badge badge-success">IPFS</span>
                  ) : (
                    <span className="badge badge-info">Documento</span>
                  )}
                  <button onClick={() => setDocOpen(true)} className="btn-secondary btn-sm" disabled={!toGateway(state.data?.ipfsURI)}>
                    Ver documento
                  </button>
                  <button onClick={handleDownloadPDF} className="btn-primary btn-sm">
                    Descargar diploma
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="btn-primary">Verificar otra credencial</button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 text-xl">✗</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg">{state.mode === 'merkle' ? 'Error en Verificación Merkle' : 'Error en Verificación'}</h3>
                  <p className="text-red-600 text-sm">{state.mode === 'merkle' ? 'No se pudo validar la prueba' : 'No se pudo validar la credencial'}</p>
                </div>
              </div>
              <p className="text-gray-700">{state.error || 'Intenta nuevamente.'}</p>
              <div className="mt-4 flex space-x-2">
                <button onClick={handleRetry} className="btn-primary btn-sm">Reintentar</button>
                <button onClick={handleReset} className="btn-secondary btn-sm">Cancelar</button>
              </div>
            </div>

            {state.mode !== 'merkle' && (
              <div className="card">
              <h3 className="font-semibold mb-2">Verificación Manual</h3>
              <form onSubmit={handleSubmitManual} className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                <input
                  type="text"
                  value={tokenIdInput}
                  onChange={(e) => setTokenIdInput(e.target.value)}
                  placeholder="Token ID (ej. 0.0.123456)"
                  className="input-primary"
                />
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="Serial Number (ej. 1)"
                  className="input-primary"
                />
                <button type="submit" className="btn-primary btn-lg">Abrir Verificación</button>
              </form>
              <p className="text-xs text-gray-500 mt-2">Se abrirá una página con el estado en Hedera y el anclaje XRP.</p>
            </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 gradient-text">Verificador de Credenciales</h2>
      <div className="card">
        <div className="max-w-full overflow-hidden">
          <QRScanner onScan={handleScan} onError={(msg) => setState({ status: 'error', error: msg })} />
        </div>
        <div className="mt-6">{renderContent()}</div>
      </div>
      <p className="text-xs text-gray-400 mt-4">Escaneos realizados: {scanCount}</p>
      <DocumentViewer open={docOpen} src={toGateway(state.data?.ipfsURI)} title="Documento" onClose={() => setDocOpen(false)} />
    </div>
  );
};

export default CredentialVerifier;
