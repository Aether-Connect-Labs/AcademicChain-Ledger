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
const xrpService = require('./services/xrpService');
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
const v1Routes = require('./routes/v1');
const contactRoutes = require('./routes/contact');

const app = express();
const testing = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const server = createServer(app);
const io = testing ? { on: () => {} } : new Server(server, {
  cors: {
    origin: (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://localhost:4174'])),
    methods: ['GET', 'POST'],
  },
});
const PORT = process.env.PORT || 3001;

// Development-safe defaults for missing env vars
if (process.env.NODE_ENV === 'test') {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
} else if (process.env.NODE_ENV !== 'production') {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
  process.env.SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
}

// Security middleware
const isProduction = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN;

// Secure CORS Policy (resiliente para Render)
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173', 'http://localhost:4174'];
const configuredOrigins = clientUrl ? clientUrl.split(',').map(o => o.trim()).filter(Boolean) : [];
const extraOrigins = [process.env.RENDER_EXTERNAL_URL, process.env.SERVER_URL, process.env.BASE_URL].map(o => (o || '').trim()).filter(Boolean);
const whitelist = Array.from(new Set([...
  (configuredOrigins.length ? configuredOrigins : defaultOrigins),
  ...extraOrigins
]));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    // In non-production, allow any origin to avoid blocking local development
    if (!isProduction) {
      return callback(null, true);
    }
    if (!whitelist.length) {
      // Fallback: allow when no whitelist configured (prevents hard failures in production)
      return callback(null, true);
    }
    if (whitelist.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};
app.use(cors(corsOptions));
app.set('trust proxy', 1);

// Secure HTTP Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
        connectSrc: ["'self'", ...whitelist],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "data:", "blob:"],
        workerSrc: ["'self'", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);

app.use(passport.initialize());

// Configure Google OAuth strategy only if env vars are present
try {
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogle) {
  const callbackBase = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || `http://localhost:${PORT}`;
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${callbackBase}/api/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase();
        if (!email) return done(new Error('Google profile did not provide an email'));

        const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
        const domain = email.split('@')[1] || '';
        const allowedDomains = String(process.env.INSTITUTION_EMAIL_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(Boolean);

          const isAdmin = adminEmail && email === adminEmail;
          const allowInstitutionFallback = String(process.env.ALLOW_INSTITUTION_FALLBACK || '0') === '1' || !isProduction;
          const isInstitution = allowedDomains.length > 0 ? allowedDomains.includes(domain) : allowInstitutionFallback;

        let user = await User.findOne({ email });
        if (!user) {
          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(uuidv4(), salt);
          const role = isAdmin ? 'admin' : (isInstitution ? 'university' : 'student');
          const universityName = isAdmin ? null : (isInstitution ? ((profile.organizations && profile.organizations[0]?.name) || domain) : null);
          user = await User.create({
            email,
            password: hashed,
            name: profile.displayName || (email.split('@')[0] || 'Usuario'),
            role,
            universityName,
            isActive: true,
          });
        } else {
          const desiredRole = isAdmin ? 'admin' : (isInstitution ? 'university' : 'student');
          if (user.role !== desiredRole) {
            user.role = desiredRole;
          }
          if (!isAdmin && isInstitution && !user.universityName) {
            user.universityName = (profile.organizations && profile.organizations[0]?.name) || domain;
          }
          await user.save();
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
    servers: [{ url: process.env.SERVER_URL || process.env.BASE_URL || `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Apunta a los archivos con anotaciones JSDoc
  apis: ['./routes/**/*.js'],
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
      },
      xrpl: { enabled: typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false, network: xrpService.network || 'disabled' }
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
      },
      xrpl: { enabled: typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false, network: xrpService.network || 'disabled' }
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
        xrpl: typeof xrpService.isEnabled === 'function' ? xrpService.isEnabled() : false,
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
app.use('/api/v1', v1Routes);
app.use('/api/contact', contactRoutes);

// Manejo de errores
app.use(errorHandler);

module.exports = { app, server, io };

if (require.main === module) {
  (async () => {
    try {
      const disableMongo = process.env.DISABLE_MONGO === '1';
      const isProd = (process.env.NODE_ENV || 'development') === 'production';
      if (typeof connectDB === 'function') {
        if (!disableMongo) {
          if (isProd) {
            await connectDB();
          } else {
            connectDB().catch(err => logger.error('MongoDB async connect failed:', err));
          }
        } else {
          logger.warn('MongoDB disabled by DISABLE_MONGO=1. Running without database.');
        }
      }
      try { await hederaService.connect(); } catch {}
      try { await xrpService.connect(); } catch {}
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

if (!testing && io && typeof io.on === 'function') {
  io.on('connection', (socket) => {
    const { token } = socket.handshake.auth || {};
    socket.on('subscribe-job', (jobId) => {
      if (jobId) socket.join(String(jobId));
    });
    socket.on('unsubscribe-job', (jobId) => {
      if (jobId) socket.leave(String(jobId));
    });
  });
}

// Request timeout configurable
try {
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT || '0', 10);
  if (timeoutMs > 0 && !testing) {
    server.setTimeout(timeoutMs);
  }
} catch {}
