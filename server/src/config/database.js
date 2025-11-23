const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Configuración escalable de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academicchain';
const MAX_RETRIES = parseInt(process.env.MONGO_MAX_RETRIES || '5', 10);
const RETRY_DELAY = parseInt(process.env.MONGO_RETRY_DELAY || '5000', 10);

// Opciones optimizadas para escalabilidad
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Connection pooling para mejor rendimiento
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2', 10),
  // Timeouts y retries
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),
  connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT || '10000', 10),
  // Retry configuración
  retryWrites: true,
  retryReads: true,
  // Índices y validación
  autoIndex: process.env.NODE_ENV !== 'production', // Solo en desarrollo
  // Heartbeat para mantener conexiones vivas
  heartbeatFrequencyMS: 10000,
};

let retryCount = 0;

const connectDB = async () => {
  try {
    // Conectar con retry logic
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    
    // Event listeners para monitoreo
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB Connected Successfully');
      retryCount = 0; // Reset retry count on successful connection
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to application termination');
      process.exit(0);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    
    // Retry logic con exponential backoff
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
      logger.info(`Retrying MongoDB connection (${retryCount}/${MAX_RETRIES}) in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB();
    }
    
    throw error;
  }
};

// Helper para verificar estado de la conexión
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Helper para obtener estadísticas de la conexión
const getConnectionStats = () => {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length,
  };
};

module.exports = { connectDB, mongoose, isConnected, getConnectionStats };
