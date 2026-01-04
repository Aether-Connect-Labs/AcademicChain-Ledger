const IORedis = require('ioredis');
const logger = require('../src/utils/logger');

const DISABLE_REDIS = process.env.DISABLE_REDIS === '1' ||
  (process.env.NODE_ENV || 'development') === 'test' ||
  (!process.env.REDIS_URL && (process.env.NODE_ENV || 'development') !== 'production');

// Fail-safe para producción si REDIS_URL no está definido (Koyeb)
// Si estamos en producción y NO hay REDIS_URL, asumimos que queremos correr sin Redis en lugar de crashear
if ((process.env.NODE_ENV === 'production') && !process.env.REDIS_URL && !process.env.REDIS_CLUSTER_NODES && !process.env.REDIS_SENTINELS) {
  logger.warn('No REDIS_URL found in production. Running in fallback mode (Redis disabled).');
  // Sobreescribir variable global si es necesario, o usar una bandera interna
  // Nota: const DISABLE_REDIS no se puede reasignar, así que usaremos la lógica de conexión abajo
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';


const REDIS_CLUSTER_NODES = process.env.REDIS_CLUSTER_NODES 
  ? process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
      const [host, port] = node.trim().split(':');
      return { host, port: parseInt(port, 10) };
    })
  : null;

// Configuración escalable de Redis
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  enableOfflineQueue: false,
  // Connection pooling
  lazyConnect: true,
  // Retry configuration
  retryStrategy: (times) => {
    // Si Redis está desactivado explícitamente, no reintentar
    if (process.env.DISABLE_REDIS === '1') {
      return null;
    }
    // Límite de reintentos para evitar bucles infinitos en desarrollo o si falla críticamente
    if (times > 20 && process.env.NODE_ENV !== 'production') {
      logger.error('Redis connection failed too many times in dev, giving up.');
      return null;
    }
    
    // Exponential backoff con jitter
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  // Reconnect configuration
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      logger.error('Redis is in readonly mode, reconnecting...');
      return true;
    }
    return false;
  },
  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Keep alive
  keepAlive: 30000,
};

let connection;
// Flag efectiva para desactivar
const isRedisDisabled = DISABLE_REDIS || ((process.env.NODE_ENV === 'production') && !process.env.REDIS_URL && !process.env.REDIS_CLUSTER_NODES && !process.env.REDIS_SENTINELS);

// Detectar si es cluster o standalone
if (isRedisDisabled) {
  connection = {
    status: 'disabled',
    on: () => {},
    connect: async () => {},
    info: async () => null,
  };
  logger.warn('Redis disabled. Queues will be no-op.');
} else if (REDIS_CLUSTER_NODES && REDIS_CLUSTER_NODES.length > 0) {
  // Redis Cluster mode para alta disponibilidad
  logger.info('Initializing Redis Cluster connection...');
  connection = new IORedis.Cluster(REDIS_CLUSTER_NODES, {
    ...redisOptions,
    redisOptions: {
      ...redisOptions,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
    },
    clusterRetryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableOfflineQueue: false,
    maxRedirections: 3,
  });

  connection.on('+node', (node) => {
    logger.info(`Redis cluster node added: ${node.options.host}:${node.options.port}`);
  });

  connection.on('-node', (node) => {
    logger.warn(`Redis cluster node removed: ${node.options.host}:${node.options.port}`);
  });

  connection.on('node error', (err, node) => {
    logger.error(`Redis cluster node error on ${node.options.host}:${node.options.port}:`, err);
  });
} else {
  // Standalone Redis con sentinel support
  if (process.env.REDIS_SENTINELS) {
    const sentinels = process.env.REDIS_SENTINELS.split(',').map(s => {
      const [host, port] = s.trim().split(':');
      return { host, port: parseInt(port, 10) };
    });

    logger.info('Initializing Redis Sentinel connection...');
    connection = new IORedis({
      sentinels,
      name: process.env.REDIS_MASTER_NAME || 'mymaster',
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      ...redisOptions,
    });
  } else {
    // Standalone Redis simple
    connection = new IORedis(REDIS_URL, {
      ...redisOptions,
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
    });
  }
}

// Event listeners para monitoreo
connection.on('connect', () => {
  logger.info('✅ Redis connecting...');
});

connection.on('ready', () => {
  logger.info('✅ Redis connected and ready');
});

connection.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

connection.on('close', () => {
  logger.warn('⚠️  Redis connection closed');
});

connection.on('reconnecting', (delay) => {
  logger.info(`🔄 Redis reconnecting in ${delay}ms...`);
});

connection.on('end', () => {
  logger.warn('⚠️  Redis connection ended');
});

// Conectar cuando el módulo se carga
if (!isRedisDisabled) {
  // En producción ya conectamos; en desarrollo conectamos proactivamente si REDIS_URL está definido
  try {
    connection.connect().catch((err) => {
      // Silenciar errores de conexión inicial para evitar ruido en logs si se va a reintentar
      // logger.error('Failed to connect to Redis:', err);
    });
  } catch (e) {
    logger.error('Redis connect init error:', e);
  }
}

// Helper para verificar estado
const isConnected = () => {
  if (isRedisDisabled) {
    return false;
  }
  return connection.status === 'ready';
};

// Helper para obtener estadísticas
const getStats = async () => {
  try {
    if (isRedisDisabled) {
      return { status: 'disabled' };
    }
    if (!isConnected()) {
      return { status: 'disconnected' };
    }
    const info = await connection.info('stats');
    return {
      status: connection.status,
      connected: isConnected(),
      info: info ? info.split('\n').slice(0, 10).join('\n') : null,
    };
  } catch (err) {
    logger.error('Error getting Redis stats:', err);
    return { status: 'error', error: err.message };
  }
};

module.exports = connection;
module.exports.isConnected = isConnected;
module.exports.getStats = getStats;
