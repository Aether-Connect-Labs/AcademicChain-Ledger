
export const getGateways = (uri) => {
  if (!uri) return [];
  const cid = uri.startsWith('ipfs://') ? uri.replace('ipfs://','') : uri;
  const primary = (import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/').replace(/\/$/, '');
  
  // Prioritize configured gateway, then fallbacks
  const list = [
    primary,
    'https://gateway.pinata.cloud/ipfs',
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
  return gateways[0] || '';
};
