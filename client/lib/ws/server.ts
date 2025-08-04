// src/lib/ws/server.ts
import { Server } from 'socket.io';
import http from 'http';
import { credentialQueueEvents } from '../queues/credential.queue';

export function setupWebSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Escuchar eventos de la cola de credenciales
    credentialQueueEvents.on('completed', ({ jobId, returnvalue }) => {
      socket.emit('credential-completed', { jobId, ...returnvalue });
    });
    
    credentialQueueEvents.on('failed', ({ jobId, failedReason }) => {
      socket.emit('credential-failed', { jobId, error: failedReason });
    });
    
    credentialQueueEvents.on('progress', ({ jobId, data }) => {
      socket.emit('credential-progress', { jobId, progress: data });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}