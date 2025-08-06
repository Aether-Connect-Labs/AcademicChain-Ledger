import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      enterprise?: any; // Define the enterprise property
    }
  }
}

@injectable()
export class EnterpriseMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Enterprise token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.ENTERPRISE_JWT_SECRET!);
      req.enterprise = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid enterprise token' });
    }
  }

  checkPlanLimits(planType: 'basic' | 'pro' | 'enterprise') {
    return async (req: Request, res: Response, next: NextFunction) => {
      const enterprise = req.enterprise;
      
      if (!enterprise) {
        return res.status(401).json({ error: 'Enterprise information not found' });
      }

      try {
        const usage = await this.getMonthlyUsage(enterprise.id);
        const limit = this.getPlanLimit(planType);
        
        if (usage >= limit) {
          return res.status(429).json({ 
            error: 'Plan limit exceeded',
            upgradeUrl: '/enterprise/upgrade'
          });
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private async getMonthlyUsage(enterpriseId: string): Promise<number> {
    // Implementar lógica de consulta a base de datos
    return 0; // Placeholder
  }

  private getPlanLimit(planType: string): number {
    const limits: { [key: string]: number } = {
      basic: 1000,
      pro: 10000,
      enterprise: 100000
    };
    return limits[planType] || 0;
  }
}