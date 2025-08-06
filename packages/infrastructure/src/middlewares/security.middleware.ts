import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { injectable } from 'inversify';

@injectable()
export class SecurityMiddleware {
  private readonly limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
    standardHeaders: true,
    legacyHeaders: false
  });

  applyMiddlewares(app: any) {
    // Configuración de cabeceras de seguridad
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://ipfs.io"],
          connectSrc: ["'self'", "https://*.hedera.com"]
        }
      },
      hsts: {
        maxAge: 63072000, // 2 años
        includeSubDomains: true,
        preload: true
      }
    }));

    // Limitador de tasa
    app.use(this.limiter);

    // Prevención de MIME sniffing
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    });
  }
}