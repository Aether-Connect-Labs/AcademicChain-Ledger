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
const { protect, authorize } = require('./middleware/auth');
const { issuanceQueue } = require('./queue/issuanceQueue');
const { initializeWorkers } = require('./workers');
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AcademicChain Ledger API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nft', protect, nftRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/university', protect, universityRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);

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

const hederaService = require('./services/hederaService');

// Start server
const startServer = async () => {
  try {
    await hederaService.connect();
    await ipfsService.testConnection();
    // Initialize background workers and pass the io instance
    initializeWorkers(io);
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 