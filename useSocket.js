import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useSocket = (roomId) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    // Inicializar la conexión del socket
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      // Unirse a un room específico para recibir notificaciones relevantes
      socketRef.current.emit('join_room', roomId);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    // Limpieza al desmontar el componente
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  return { socket: socketRef.current, isConnected };
};