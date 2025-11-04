import { Request, Response, NextFunction } from 'express';

// Extend Express Session and Request types
declare module 'express-session' {
  interface SessionData {
    adminUserId?: number;
    adminUsername?: string;
    adminEmail?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: number;
        username: string;
        email?: string;
      };
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  req.adminUser = {
    id: req.session.adminUserId,
    username: req.session.adminUsername || '',
    email: req.session.adminEmail,
  };

  next();
}
