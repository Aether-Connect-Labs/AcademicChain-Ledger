const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const ipfsService = require('./services/ipfsService');
const cacheService = require('./services/cacheService');
const { protect, authorize } = require('./middleware/auth');
const { issuanceQueue } = require('../queue/issuanceQueue');
const { initializeWorkers } = require('./workers');
const { isConnected: isMongoConnected, getConnectionStats: getMongoStats } = require('./config/database');
const { isConnected: isRedisConnected, getStats: getRedisStats } = require('../queue/connection');
const ROLES = require('./config/roles');

// Import routes
const authRoutes = require('./routes/auth');
const nftRoutes = require('./routes/nft');
const verificationRoutes = require('./routes/verification');
const universityRoutes = require('./routes/university');
const qrRoutes = require('./routes/qr');
const partnerRoutes = require('./routes/partner');
const adminRoutes = require('./routes/admin');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Desactivamos la CSP de Helmet para que Next.js la gestione
  })
);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting escalable con diferentes límites por tipo de endpoint
const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message,
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit store se puede configurar con Redis si está disponible
  // Por defecto usa memoria (mejor para desarrollo)
  // Para producción con múltiples instancias, usar Redis store
  skip: (req) => {
    // Skip rate limiting para health checks
    return req.path === '/health' || req.path === '/ready' || req.path === '/live';
  }
});

// Rate limiters diferenciados por tipo de endpoint
const generalLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later.');
const authLimiter = createLimiter(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again later.');
const verificationLimiter = createLimiter(60 * 1000, 30, 'Too many verification requests, please try again later.');
const adminLimiter = createLimiter(15 * 60 * 1000, 200, 'Too many admin requests, please try again later.');

// Aplicar rate limiting general
app.use('/api/', generalLimiter);
app.use(cookieParser());

// Body parsing middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger/OpenAPI Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AcademicChain Ledger API',
      version: '1.0.0',
      description: 'The official API for the global academic credential verification system on Hedera.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/tu-usuario/academicchain-ledger',
        email: 'support@academicchain-ledger.com',
      },
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  // Apunta a los archivos con anotaciones JSDoc
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoints escalables (para Kubernetes/Docker health checks)
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'AcademicChain Ledger API',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      }
    };

    res.status(200).json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Readiness probe - verifica si el servicio está listo para recibir tráfico
app.get('/ready', async (req, res) => {
  try {
    const checks = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        mongo: isMongoConnected(),
        redis: isRedisConnected(),
        server: true,
      }
    };

    // Si alguna dependencia crítica no está disponible, retornar 503
    const isReady = checks.checks.mongo && checks.checks.redis;
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json(checks);
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Liveness probe - verifica si el proceso está vivo
app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

// Métricas y estadísticas del sistema
app.get('/metrics', protect, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const mongoStats = getMongoStats();
    const redisStats = await getRedisStats();
    const cacheStats = await cacheService.getStats();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        nodeVersion: process.version,
      },
      services: {
        mongo: mongoStats,
        redis: redisStats,
        cache: cacheStats,
      }
    });
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Routes con rate limiting específico
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/nft', protect, nftRoutes);
app.use('/api/verification', verificationLimiter, verificationRoutes);
app.use('/api/university', protect, universityRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/partner', protect, authorize(ROLES.ADMIN), partnerRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// Bull Board (Admin UI for Queues)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(issuanceQueue)],
  serverAdapter,
});

// Protect the admin dashboard
app.use('/api/admin/queues', protect, authorize(ROLES.ADMIN), serverAdapter.getRouter());

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 New client connected: ${socket.id}`);
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    logger.info(`Client ${socket.id} joined room ${roomId}`);
  });
  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'AcademicChain Ledger API - Sistema de Credenciales Académicas en Hedera',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      nft: '/api/nft',
      verification: '/api/verification',
      university: '/api/university',
      qr: '/api/qr',
      partner: '/api/partner'
    },
    documentation: `http://localhost:${PORT}/api/docs`
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

const { connectDB } = require('./config/database');
const hederaService = require('./services/hederaServices');

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB (optional, continue if fails in dev mode)
    try {
      await connectDB();
    } catch (dbError) {
      logger.warn('⚠️  MongoDB connection failed, continuing without database:', dbError.message);
      if (process.env.NODE_ENV === 'production') {
        throw dbError;
      }
    }

    // Connect to Hedera (optional, continue if fails)
    try {
      await hederaService.connect();
    } catch (hederaError) {
      logger.warn('⚠️  Hedera connection failed, continuing without blockchain:', hederaError.message);
    }

    // Test IPFS connection (optional)
    try {
      await ipfsService.testConnection();
    } catch (ipfsError) {
      logger.warn('⚠️  IPFS connection failed, continuing without IPFS:', ipfsError.message);
    }

    // Initialize background workers and pass the io instance (optional, requires Redis)
    try {
      if (process.env.REDIS_URL || process.env.NODE_ENV !== 'production') {
        initializeWorkers(io);
      } else {
        logger.warn('⚠️  Redis not configured. Workers disabled.');
      }
    } catch (workerError) {
      logger.warn('⚠️  Workers initialization failed, continuing without workers:', workerError.message);
    }

    server.listen(PORT, () => {
      logger.info(`🚀 AcademicChain Ledger Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API Base: http://localhost:${PORT}/api`);
      logger.info(`👑 Admin Queue UI: http://localhost:${PORT}/api/admin/queues`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown mejorado
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  // Cerrar servidor HTTP
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Cerrar conexiones de Socket.IO
  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  // Cerrar workers
  try {
    await issuanceQueue.close();
    logger.info('Queue connections closed');
  } catch (error) {
    logger.error('Error closing queue:', error);
  }

  // Cerrar conexión a MongoDB
  try {
    const { mongoose } = require('./config/database');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB:', error);
  }

  // Dar tiempo para que las conexiones se cierren
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 10000); // 10 segundos máximo
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // No terminar el proceso en producción, solo registrar
  if (process.env.NODE_ENV === 'production') {
    // Podrías enviar a un servicio de monitoreo aquí
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // En producción, podríamos querer cerrar el proceso
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

module.exports = app; 