// src/lib/ws/server.ts
import { Server } from 'socket.io';
import http from 'http';
import { credentialQueueEvents } from '../queues/credential.queue';
import { logger } from '../../utils/logger';
import { analytics } from '../../utils/analytics';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { verifyToken } from '../../utils/auth';
import { WebSocketService } from './WebSocketService';
import IORedis from 'ioredis';

// Conexión a Redis para el Rate Limiter distribuido
const redisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Rate limiter para conexiones WebSocket usando Redis para escalabilidad
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 20, // Puntos por IP
  duration: 60, // por minuto
});

// Configuración de CORS mejorada
const corsOptions = {
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://academicchain.vercel.app'
  ],
  methods: ['GET', 'POST'],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
};

// Tipos para eventos WebSocket
interface WebSocketEvents {
  // Cliente → Servidor
  'authenticate': (token: string) => void;
  'subscribe-job': (jobId: string) => void;
  'unsubscribe-job': (jobId: string) => void;
  'subscribe-institution': (institutionId: string) => void;
  'ping': () => void;
  
  // Servidor → Cliente
  'authenticated': (user: any) => void;
  'authentication-error': (error: string) => void;
  'job-progress': (data: JobProgressData) => void;
  'job-completed': (data: JobCompletedData) => void;
  'job-failed': (data: JobFailedData) => void;
  'institution-update': (data: InstitutionUpdateData) => void;
  'hedera-status': (data: HederaStatusData) => void;
  'pong': () => void;
  'error': (error: string) => void;
}

interface JobProgressData {
  jobId: string;
  progress: number;
  status: string;
  message?: string;
  timestamp: string;
}

interface JobCompletedData {
  jobId: string;
  result: any;
  timestamp: string;
  duration: number;
}

interface JobFailedData {
  jobId: string;
  error: string;
  attempts: number;
  timestamp: string;
}

interface InstitutionUpdateData {
  institutionId: string;
  type: 'credential-issued' | 'credential-verified' | 'bulk-completed';
  data: any;
  timestamp: string;
}

interface HederaStatusData {
  isConnected: boolean;
  network: string;
  accountId?: string;
  balance?: number;
  timestamp: string;
}

export class WebSocketServer {
  private io: Server;
  private connectedClients: Map<string, any> = new Map();
  private webSocketService: WebSocketService;

  constructor(server: http.Server) {
    this.io = new Server(server, {
      cors: corsOptions,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
    });

    this.webSocketService = new WebSocketService();
    this.setupEventHandlers();
    this.setupQueueListeners();
    this.setupHealthChecks();
  }

  private setupEventHandlers(): void {
    this.io.use(this.rateLimitMiddleware.bind(this));
    this.io.use(this.authenticationMiddleware.bind(this));

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  private async rateLimitMiddleware(socket: any, next: any): Promise<void> {
    try {
      await rateLimiter.consume(socket.handshake.address);
      next();
    } catch (rejRes) {
      logger.warn('WebSocket rate limit exceeded', {
        ip: socket.handshake.address,
        socketId: socket.id
      });
      next(new Error('Too many connection attempts'));
    }
  }

  private async authenticationMiddleware(socket: any, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Permitir conexiones no autenticadas pero con capacidades limitadas
        socket.isAuthenticated = false;
        return next();
      }

      const user = await verifyToken(token);
      if (!user) {
        socket.isAuthenticated = false;
        return next(new Error('Invalid authentication token'));
      }

      socket.user = user;
      socket.isAuthenticated = true;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error', { error });
      socket.isAuthenticated = false;
      next(new Error('Authentication failed'));
    }
  }

  private handleConnection(socket: any): void {
    const clientInfo = {
      id: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      authenticated: socket.isAuthenticated,
      userId: socket.user?.id,
      institutionId: socket.user?.institutionId,
      connectedAt: new Date().toISOString(),
      rooms: new Set<string>()
    };

    this.connectedClients.set(socket.id, clientInfo);

    logger.info('Client connected', {
      socketId: socket.id,
      ip: clientInfo.ip,
      authenticated: clientInfo.authenticated,
      userId: clientInfo.userId
    });

    analytics.track('websocket_connected', {
      socketId: socket.id,
      authenticated: clientInfo.authenticated,
      userId: clientInfo.userId
    });

    // Setup event handlers para este socket
    this.setupSocketHandlers(socket);

    // Enviar estado inicial
    this.sendInitialState(socket);

    // Setup heartbeat
    this.setupHeartbeat(socket);
  }

  private setupSocketHandlers(socket: any): void {
    // Autenticación
    socket.on('authenticate', async (token: string) => {
      await this.handleAuthentication(socket, token);
    });

    // Suscripción a jobs
    socket.on('subscribe-job', (jobId: string) => {
      this.handleJobSubscription(socket, jobId);
    });

    socket.on('unsubscribe-job', (jobId: string) => {
      this.handleJobUnsubscription(socket, jobId);
    });

    // Suscripción a institución
    socket.on('subscribe-institution', (institutionId: string) => {
      this.handleInstitutionSubscription(socket, institutionId);
    });

    // Ping/Pong
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Desconexión
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Error handling
    socket.on('error', (error: Error) => {
      this.handleSocketError(socket, error);
    });
  }

  private async handleAuthentication(socket: any, token: string): Promise<void> {
    try {
      const user = await verifyToken(token);
      if (!user) {
        socket.emit('authentication-error', 'Invalid token');
        return;
      }

      socket.user = user;
      socket.isAuthenticated = true;

      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.authenticated = true;
        clientInfo.userId = user.id;
        clientInfo.institutionId = user.institutionId;
      }

      socket.emit('authenticated', {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institutionId: user.institutionId
        }
      });

      logger.info('Client authenticated', {
        socketId: socket.id,
        userId: user.id
      });

      analytics.track('websocket_authenticated', {
        socketId: socket.id,
        userId: user.id
      });

    } catch (error) {
      logger.error('Authentication failed', { socketId: socket.id, error });
      socket.emit('authentication-error', 'Authentication failed');
    }
  }

  private handleJobSubscription(socket: any, jobId: string): void {
    if (!this.validateJobAccess(socket, jobId)) {
      socket.emit('error', 'Unauthorized to subscribe to this job');
      return;
    }

    socket.join(`job:${jobId}`);
    
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.rooms.add(`job:${jobId}`);
    }

    logger.debug('Client subscribed to job', {
      socketId: socket.id,
      jobId,
      userId: socket.user?.id
    });
  }

  private handleJobUnsubscription(socket: any, jobId: string): void {
    socket.leave(`job:${jobId}`);
    
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.rooms.delete(`job:${jobId}`);
    }

    logger.debug('Client unsubscribed from job', {
      socketId: socket.id,
      jobId
    });
  }

  private handleInstitutionSubscription(socket: any, institutionId: string): void {
    if (!this.validateInstitutionAccess(socket, institutionId)) {
      socket.emit('error', 'Unauthorized to subscribe to this institution');
      return;
    }

    socket.join(`institution:${institutionId}`);
    
    const clientInfo = this.connectedClients.get(socket.id);
    if (clientInfo) {
      clientInfo.rooms.add(`institution:${institutionId}`);
    }

    logger.debug('Client subscribed to institution', {
      socketId: socket.id,
      institutionId,
      userId: socket.user?.id
    });
  }

  private handleDisconnection(socket: any, reason: string): void {
    const clientInfo = this.connectedClients.get(socket.id);
    
    logger.info('Client disconnected', {
      socketId: socket.id,
      reason,
      duration: clientInfo ? 
        Date.now() - new Date(clientInfo.connectedAt).getTime() : 0,
      rooms: Array.from(clientInfo?.rooms || [])
    });

    analytics.track('websocket_disconnected', {
      socketId: socket.id,
      reason,
      duration: clientInfo ? 
        Date.now() - new Date(clientInfo.connectedAt).getTime() : 0
    });

    this.connectedClients.delete(socket.id);
  }

  private handleSocketError(socket: any, error: Error): void {
    logger.error('WebSocket error', {
      socketId: socket.id,
      error: error.message,
      stack: error.stack
    });

    analytics.track('websocket_error', {
      socketId: socket.id,
      error: error.message
    });
  }

  private setupQueueListeners(): void {
    // Escuchar eventos de la cola de credenciales
    credentialQueueEvents.on('completed', ({ jobId, returnvalue }) => {
      this.io.to(`job:${jobId}`).emit('job-completed', {
        jobId,
        result: returnvalue,
        timestamp: new Date().toISOString(),
        duration: returnvalue.duration || 0
      });

      // Notificar a la institución si aplica
      if (returnvalue.institutionId) {
        this.io.to(`institution:${returnvalue.institutionId}`).emit('institution-update', {
          institutionId: returnvalue.institutionId,
          type: 'credential-issued',
          data: returnvalue,
          timestamp: new Date().toISOString()
        });
      }
    });

    credentialQueueEvents.on('failed', ({ jobId, failedReason, attemptsMade }) => {
      this.io.to(`job:${jobId}`).emit('job-failed', {
        jobId,
        error: failedReason,
        attempts: attemptsMade,
        timestamp: new Date().toISOString()
      });
    });

    credentialQueueEvents.on('progress', ({ jobId, data }) => {
      this.io.to(`job:${jobId}`).emit('job-progress', {
        jobId,
        progress: data,
        status: 'processing',
        timestamp: new Date().toISOString()
      });
    });

    credentialQueueEvents.on('active', ({ jobId }) => {
      this.io.to(`job:${jobId}`).emit('job-progress', {
        jobId,
        progress: 0,
        status: 'started',
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupHealthChecks(): void {
    // Health check cada 30 segundos
    setInterval(() => {
      this.io.emit('hedera-status', this.webSocketService.getHederaStatus());
    }, 30000);

    // Limpieza de conexiones inactivas cada minuto
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000);
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutos

    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      const connectedTime = new Date(clientInfo.connectedAt).getTime();
      if (now - connectedTime > timeout) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }
  }

  private sendInitialState(socket: any): void {
    // Enviar estado de Hedera
    socket.emit('hedera-status', this.webSocketService.getHederaStatus());

    // Enviar estadísticas del sistema si está autenticado
    if (socket.isAuthenticated) {
      const stats = this.webSocketService.getSystemStats();
      socket.emit('system-stats', stats);
    }
  }

  private setupHeartbeat(socket: any): void {
    let isAlive = true;

    const heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(heartbeatInterval);
        socket.disconnect(true);
        return;
      }

      isAlive = false;
      socket.emit('ping');
    }, 30000);

    socket.on('pong', () => {
      isAlive = true;
    });

    socket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
    });
  }

  private validateJobAccess(socket: any, jobId: string): boolean {
    if (!socket.isAuthenticated) {
      return false;
    }

    // Aquí implementar lógica de autorización específica
    // Por ejemplo, verificar que el job pertenece a la institución del usuario
    return true;
  }

  private validateInstitutionAccess(socket: any, institutionId: string): boolean {
    if (!socket.isAuthenticated) {
      return false;
    }

    // Verificar que el usuario pertenece a la institución
    return socket.user?.institutionId === institutionId;
  }

  // Métodos públicos para broadcasting
  public broadcastToInstitution(institutionId: string, event: string, data: any): void {
    this.io.to(`institution:${institutionId}`).emit(event, data);
  }

  public broadcastToJob(jobId: string, event: string, data: any): void {
    this.io.to(`job:${jobId}`).emit(event, data);
  }

  public getConnectionStats(): any {
    return {
      totalConnections: this.connectedClients.size,
      authenticatedConnections: Array.from(this.connectedClients.values())
        .filter(client => client.authenticated).length,
      connectionsByInstitution: this.getConnectionsByInstitution(),
      timestamp: new Date().toISOString()
    };
  }

  private getConnectionsByInstitution(): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const client of this.connectedClients.values()) {
      if (client.institutionId) {
        result[client.institutionId] = (result[client.institutionId] || 0) + 1;
      }
    }
    
    return result;
  }
}

// Función de inicialización legacy para compatibilidad
export function setupWebSocket(server: http.Server): WebSocketServer {
  return new WebSocketServer(server);
}