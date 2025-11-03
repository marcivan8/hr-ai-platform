import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

declare global { 
  namespace Express { 
    interface Request { 
      user?: {
        id: string;
        role?: string;
      };
    } 
  } 
}

export function ensureAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!roles.includes(role || '')) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}