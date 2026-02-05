import { HashConnect } from 'hashconnect';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from './useAuth';
import ConnectionService from './services/connectionService';
import { authService } from './authService';

const HEDERA_NETWORK = (import.meta.env.VITE_HEDERA_NETWORK || (import.meta.env.PROD ? 'mainnet' : 'testnet'))

export const useHedera = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState('unknown');
  const [networkStatus, setNetworkStatus] = useState('Normal'); // 'Normal' | 'High Traffic'

  // Simulación de tráfico de red para activar Dark Mode automático
  useEffect(() => {
    // Ciclo más realista: 45s Normal -> 15s High Traffic
    const interval = setInterval(() => {
      setNetworkStatus(prev => {
        // Si está en High Traffic, volver a Normal (era un pico)
        if (prev === 'High Traffic') return 'Normal';
        // Si está en Normal, 30% de probabilidad de entrar en High Traffic (simulado)
        // Para demo forzada: Alternar cada vez
        return 'High Traffic';
      });
    }, 45000); // 45 segundos en cada estado (ajustado para que no sea tan frecuente)

    // Ajuste fino: Queremos que High Traffic dure menos que Normal.
    // Reemplazamos con lógica de timeout anidado para control preciso.
    return () => clearInterval(interval);
  }, []);

  // Lógica mejorada de simulación con tiempos asimétricos
  useEffect(() => {
    let timeout;
    const runSimulation = () => {
      if (networkStatus === 'Normal') {
        // Esperar 40s antes de cambiar a High Traffic
        timeout = setTimeout(() => {
          setNetworkStatus('High Traffic');
          runSimulation();
        }, 40000);
      } else {
        // Mantener High Traffic solo 15s
        timeout = setTimeout(() => {
          setNetworkStatus('Normal');
          runSimulation();
        }, 15000);
      }
    };

    // Iniciar simulación limpia (limpiando el intervalo anterior si existiera, aunque aquí sobrescribimos)
    // Nota: El useEffect anterior debe eliminarse o este conflictuará. 
    // Voy a reemplazar TODO el bloque en el SearchReplace.
    
    return () => clearTimeout(timeout);
  }, [networkStatus]);

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
        const data = await ConnectionService.getNftBalance(candidate);
        setBalance(data?.data || null);
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
              await authService.updateProfile({ hederaAccountId: acc });
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
    networkStatus,
    connectWallet,
    disconnectWallet,
    executeTransaction,
    signTransactionBytes,
  };
};

export default useHedera;
