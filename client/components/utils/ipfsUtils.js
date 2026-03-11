
export const getGateways = (uri) => {
  if (!uri) return [];
  const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
  const primary = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/$/, '');
  
  // Prioritize configured gateway, then Filecoin/Lighthouse (Permanent), then others
  const list = [
    primary,
    'https://gateway.lighthouse.storage/ipfs',
    'https://w3s.link/ipfs',
    'https://ipfs.io/ipfs',
    'https://dweb.link/ipfs',
    'https://cloudflare-ipfs.com/ipfs'
  ];
  
  // Remove duplicates
  const uniq = Array.from(new Set(list));
  return uniq.map(g => `${g}/${cid}`);
};

export const toGateway = (uri) => {
  const gateways = getGateways(uri);
  // Default to Filecoin/Lighthouse if primary is generic
  return gateways.find(g => g.includes('lighthouse')) || gateways[0] || '';
};
