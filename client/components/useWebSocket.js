// client/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

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
    if (!SOCKET_URL) {
      console.error('WebSocket URL is not defined.');
      return;
    }

    // Iniciar conexión
    console.log('Connecting to WebSocket...');
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
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