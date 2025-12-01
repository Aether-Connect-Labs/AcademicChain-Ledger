import { HashConnect } from 'hashconnect';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
let API_BASE_URL = import.meta.env.VITE_API_URL
const HEDERA_NETWORK = (import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet'))

export const useHedera = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('unknown');
  const { hederaStatus } = useWebSocket();
  const { user, token } = useAuth();
  const hcRef = useRef(null);

  useEffect(() => {
    if (hederaStatus) {
      setIsConnected(!!hederaStatus.isConnected);
      setNetwork(hederaStatus.network || 'unknown');
      setAccount(hederaStatus.accountId ? { accountId: hederaStatus.accountId } : null);
      setBalance(hederaStatus.balance || null);
    }
  }, [hederaStatus]);

  const connectWallet = useCallback(async () => {
    const candidate = user?.hederaAccountId;
    if (candidate) {
      setAccount({ accountId: candidate });
      try {
        const res = await fetch(`${API_BASE_URL}/api/nft/balance/${encodeURIComponent(candidate)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setBalance(data?.data || null);
        }
      } catch {}
      setIsConnected(true);
      return true;
    }
    try {
      const hc = new HashConnect();
      const appMeta = { name: 'AcademicChain', description: 'Ledger de credenciales', icon: window.location.origin + '/favicon.svg' };
      await hc.init(appMeta, HEDERA_NETWORK, false);
      await hc.connect();
      if (hc.connectToLocalWallet) hc.connectToLocalWallet();
      hcRef.current = hc;
      hc.pairingEvent.on(async (data) => {
        const acc = data?.accountIds?.[0];
        if (acc) {
          setAccount({ accountId: acc });
          setIsConnected(true);
          try {
            if (token) {
              await fetch(`${API_BASE_URL}/api/auth/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ hederaAccountId: acc })
              });
            }
          } catch {}
        }
      });
      return true;
    } catch (e) {
      setIsConnected(false);
      return false;
    }
  }, [user, token]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setBalance(null);
  }, []);

  const executeTransaction = useCallback(async () => {
    return { status: 'mocked' };
  }, []);

  const signTransactionBytes = useCallback(async (bytes) => {
    if (!bytes) return null;
    if (import.meta.env.DEV) return bytes;
    try {
      if (!hcRef.current) return null;
      return bytes;
    } catch {
      return null;
    }
  }, []);

  return {
    isConnected,
    account,
    balance,
    network,
    connectWallet,
    disconnectWallet,
    executeTransaction,
    signTransactionBytes,
  };
};

export default useHedera;
