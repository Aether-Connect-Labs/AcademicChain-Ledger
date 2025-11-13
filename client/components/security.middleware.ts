import { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { logger } from '../utils/logger';

/**
 * Aplica un conjunto de middlewares de seguridad de grado de producción a la aplicación Express.
 * @param app La instancia de la aplicación Express.
 */
export const applySecurityMiddlewares = (app: Application): void => {
  // 1. Establecer cabeceras HTTP seguras con Helmet
  app.use(helmet());

  // 2. Configurar CORS para permitir solo orígenes de confianza
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.use(cors({
    origin: (origin, callback) => {
      // Permitir solicitudes sin 'origin' (como Postman) en desarrollo
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin!) !== -1) {
        return callback(null, true);
      }
      logger.warn('CORS blocked request from origin:', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  // 3. Limitar la tasa de solicitudes para prevenir ataques de fuerza bruta y DoS
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Limitar cada IP a 200 solicitudes por ventana de tiempo
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api', limiter); // Aplicar solo a las rutas de la API

  // 4. Sanitizar los datos de entrada para prevenir Inyección NoSQL (MongoDB)
  // Esto elimina cualquier clave que comience con '$' o contenga '.'
  app.use(mongoSanitize());

  // 5. Prevenir la contaminación de parámetros HTTP (HPP)
  app.use(hpp({
    // Opcional: whitelist para parámetros que pueden aparecer múltiples veces
    // whitelist: ['sort']
  }));

  logger.info('🛡️ Production security middlewares applied.');
};