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
  // Development mode bypass - allow direct access without authentication
  if (process.env.NODE_ENV === 'development') {
    req.adminUser = {
      id: 0,
      username: 'dev-admin',
      email: 'dev@admin.local',
    };
    return next();
  }

  // Check for admin session (username/password auth)
  if (req.session.adminUserId) {
    req.adminUser = {
      id: req.session.adminUserId,
      username: req.session.adminUsername || '',
      email: req.session.adminEmail,
    };
    return next();
  }

  // Check for OIDC admin claim (Replit Auth with admin role)
  if (req.user && (req.user as any).isAdmin === true) {
    req.adminUser = {
      id: 0, // OIDC users don't have admin DB IDs
      username: (req.user as any).email || (req.user as any).sub || 'oidc-admin',
      email: (req.user as any).email,
    };
    return next();
  }

  return res.status(401).json({ error: 'Admin authentication required' });
}
