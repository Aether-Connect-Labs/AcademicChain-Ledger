// server/api/index.js - Versión con logging estructurado
import { connectToDatabase } from '../lib/mongodb';
import { validateRequest } from '../lib/auth';
import { rateLimit } from '../lib/rate-limit';

// Logger estructurado
const logger = {
  info: (message, data = {}) =\u003e {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  },
  error: (message, error = null, context = {}) =\u003e {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      } : undefined,
      ...context
    }));
  },
  warn: (message, data = {}) =\u003e {
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...data
    }));
  }
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

export default async function handler(req, res) {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.url
  });

  // Validation of environment variables (added by user)
  if (!process.env.MONGODB_URI) {
    logger.error('MONGODB_URI environment variable is missing', null, { requestId });
    return res.status(500).json({ error: 'Database configuration error' });
  }

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET environment variable is missing', null, { requestId });
    return res.status(500).json({ error: 'Authentication configuration error' });
  }

  try {
    // Rate limiting
    await limiter(req, res);

    // Authentication
    const user = await validateRequest(req);
    if (!user) {
      logger.warn('Unauthorized request', null, { requestId });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('User authenticated', null, { requestId, userId: user.id });

    // Database connection
    const { db } = await connectToDatabase();

    // Route handling
    switch (req.method) {
      case 'GET':
        logger.info('Processing GET request', null, { requestId });
        const data = await db.collection('users').find({}).toArray();
        logger.info('GET request completed', null, {
          requestId,
          userCount: data.length,
          duration: Date.now() - startTime
        });
        return res.status(200).json({ users: data });

      case 'POST':
        logger.info('Processing POST request', null, { requestId });
        const newUser = req.body;
        const result = await db.collection('users').insertOne(newUser);
        logger.info('POST request completed', null, {
          requestId,
          insertedId: result.insertedId,
          duration: Date.now() - startTime
        });
        return res.status(201).json({ insertedId: result.insertedId });

      case 'PUT':
        logger.info('Processing PUT request', null, { requestId });
        const { id, ...updateData } = req.body;
        const updateResult = await db.collection('users').updateOne(
          { _id: id },
          { $set: updateData }
        );
        logger.info('PUT request completed', null, {
          requestId,
          modifiedCount: updateResult.modifiedCount,
          duration: Date.now() - startTime
        });
        return res.status(200).json({ modifiedCount: updateResult.modifiedCount });

      default:
        logger.warn('Method not allowed', null, { requestId, method: req.method });
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    logger.error('API Error', error, { requestId, method: req.method, path: req.url });
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    logger.info('Request finished', null, {
      requestId,
      duration: Date.now() - startTime,
      // Note: res.statusCode might not be fully accurate here if an error occurred before setting it.
      // For more robust logging of final status, consider a middleware or a more advanced logging setup.
    });
  }
}
