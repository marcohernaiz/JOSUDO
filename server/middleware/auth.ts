import { Request, Response, NextFunction } from "express";

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const session = req as any;
  
  // Check for Google OAuth authentication
  if (req.isAuthenticated()) {
    session.user = req.user;
    return next();
  }
  
  // Check for session-based authentication
  if (session.session?.userId) {
    session.user = { id: session.session.userId };
    return next();
  }
  
  res.status(401).json({ error: 'Not authenticated' });
}
