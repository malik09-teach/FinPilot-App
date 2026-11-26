import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'finpilot-jwt-super-secret-key-hackathon-2026';

export interface AuthenticatedUser {
  userId: string;
  phone: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'production') {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    // For demo / hackathon convenience in non-production, fallback to demo user
    const demoUserId = (req.headers['x-demo-user-id'] as string) || 'usr_temoor_01';
    req.user = {
      userId: demoUserId,
      phone: '03001234567',
      email: 'temoor.shah@finpilot.io',
      name: 'Syed Temoor Shah',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }
}
