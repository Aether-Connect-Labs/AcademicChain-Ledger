// client/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
const env = import.meta.env || {};
const apiBase = (() => {
  const c = [
    env.VITE_API_URL,
    env.VITE_SERVER_URL,
    env.VITE_BASE_URL,
    env.REACT_APP_API_URL,
    env.REACT_APP_SERVER_URL,
    env.SERVER_URL,
    env.BASE_URL
  ].filter(Boolean);
  const base = c[0] || '';
  return String(base).replace(/`/g, '').replace(/\/$/, '');
})();
const primary = env.NEXT_PUBLIC_WS_URL || env.VITE_WS_URL || env.REACT_APP_WS_URL || (apiBase ? apiBase.replace(/^http/, 'ws') : '');
const guessLocal = (() => {
  try {
    const u = new URL(window.location.origin);
    const host = u.hostname || 'localhost';
    return [`http://${host}:3001`, `http://${host}:3002`];
  } catch { return ['http://localhost:3001','http://localhost:3002']; }
})();
const CANDIDATES = primary ? [primary, ...guessLocal] : guessLocal;

export const useWebSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [hederaStatus, setHederaStatus] = useState({ isConnected: false, network: 'unknown', accountId: undefined, balance: undefined, timestamp: undefined });

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    let idx = 0;
    const connectNext = () => {
      const target = CANDIDATES[idx] || CANDIDATES[CANDIDATES.length - 1];
      try {
        socketRef.current = io(target, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
      } catch {
        idx = Math.min(idx + 1, CANDIDATES.length - 1);
        setTimeout(connectNext, 500);
        return;
      }
    };
    connectNext();

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('error', () => {});
    socketRef.current.on('connect_error', () => {
      setIsConnected(false);
      try { socketRef.current && socketRef.current.disconnect(); } catch {}
      idx = Math.min(idx + 1, CANDIDATES.length - 1);
      setTimeout(connectNext, 500);
    });

    socketRef.current.on('hedera-status', (data) => {
      setHederaStatus({
        isConnected: !!data?.isConnected,
        network: data?.network || 'unknown',
        accountId: data?.accountId,
        balance: typeof data?.balance === 'number' ? { hbars: data.balance } : undefined,
        timestamp: data?.timestamp
      });
      setLastMessage({ type: 'hedera-status', data });
    });

    // Limpieza al desmontar el componente
    return () => {
      disconnect();
    };
  }, [token, disconnect]);

  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const unsubscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socket: socketRef.current, isConnected, lastMessage, hederaStatus, subscribe, unsubscribe, emit, disconnect };
};
