import { HashConnect } from 'hashconnect';
import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
let API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '')

export const useHedera = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('unknown');
  const { hederaStatus } = useWebSocket();
  const { user, token } = useAuth();

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
      await hc.init(appMeta, 'testnet', false);
      await hc.connect();
      if (hc.connectToLocalWallet) hc.connectToLocalWallet();
      hc.pairingEvent.on((data) => {
        const acc = data?.accountIds?.[0];
        if (acc) {
          setAccount({ accountId: acc });
          setIsConnected(true);
        }
      });
      return true;
    } catch (e) {
      setIsConnected(false);
      return false;
    }
  }, [user]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setBalance(null);
  }, []);

  const executeTransaction = useCallback(async () => {
    return { status: 'mocked' };
  }, []);

  return {
    isConnected,
    account,
    balance,
    network,
    connectWallet,
    disconnectWallet,
    executeTransaction,
  };
};

export default useHedera;
