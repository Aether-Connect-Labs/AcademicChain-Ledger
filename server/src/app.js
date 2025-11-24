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
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const hederaService = require('./services/hederaServices');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('./models');

const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const ipfsService = require('./services/ipfsService');
const cacheService = require('./services/cacheService');
const { protect, authorize } = require('./middleware/auth');
const { issuanceQueue } = require('../queue/issuanceQueue');
const { initializeWorkers } = require('./workers');
const { connectDB, isConnected: isMongoConnected, getConnectionStats: getMongoStats } = require('./config/database');
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
const studentRoutes = require('./routes/student');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']),
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Security middleware
const isProduction = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL;

// Secure CORS Policy
const whitelist = isProduction ? [clientUrl] : (clientUrl ? clientUrl.split(',') : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Trust reverse proxy (Render, Vercel, etc.) to set secure cookies and IPs
app.set('trust proxy', 1);

// Secure HTTP Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"], // Allow scripts from self and Google
        frameSrc: ["'self'", "https://accounts.google.com"], // Allow frames from self and Google for OAuth
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(passport.initialize());

// Configure Google OAuth strategy only if env vars are present
try {
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogle) {
    const callbackBase = process.env.SERVER_URL || `http://localhost:${PORT}`;
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${callbackBase}/api/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase();
        if (!email) return done(new Error('Google profile did not provide an email'));
        let user = await User.findOne({ email });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(uuidv4(), salt);
          user = await User.create({
            email,
            password: hashed,
            name: profile.displayName || (email.split('@')[0] || 'Usuario'),
            role: 'user',
            isActive: true,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }));
  }
} catch {}

app.use(cookieParser());

// Body parsing middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

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

app.get('/healthz', async (req, res) => {
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
    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    const checks = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        mongo: isMongoConnected(),
        redis: isRedisConnected(),
        server: true,
      }
    };

    // En desarrollo, consideramos el servicio "ready" aunque falten dependencias
    // para permitir probar el sistema completo con modo mock.
    const isReady = (isDev && checks.checks.server) || (checks.checks.mongo && checks.checks.redis);
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
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/credentials', studentRoutes); // Ruta para credenciales de estudiantes

// Manejo de errores
app.use(errorHandler);

module.exports = { app, server, io };

if (require.main === module) {
  (async () => {
    try {
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      if (typeof connectDB === 'function') {
        if (isProd) {
          await connectDB();
        } else {
          connectDB().catch(err => logger.error('MongoDB async connect failed:', err));
        }
      }
      if (typeof initializeWorkers === 'function') {
        try {
          if (isRedisConnected()) {
            initializeWorkers(io);
          }
        } catch {}
      }
      server.listen(PORT, () => {
        if (process.send) process.send('ready');
      });
    } catch (err) {
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      if (isProd) {
        process.exit(1);
      } else {
        logger.error('Startup continuing without MongoDB:', err);
        server.listen(PORT, () => {
          if (process.send) process.send('ready');
        });
      }
    }
  })();
}

io.on('connection', (socket) => {
  const { token } = socket.handshake.auth || {};
  socket.on('subscribe-job', (jobId) => {
    if (jobId) socket.join(String(jobId));
  });
  socket.on('unsubscribe-job', (jobId) => {
    if (jobId) socket.leave(String(jobId));
  });
});