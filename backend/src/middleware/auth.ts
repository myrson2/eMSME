import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenFromCookie = req.cookies?.emsme_session;

  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    res.status(401).json({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Access token required. Please sign in via eGovPH SSO.',
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_fallback_key';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      success: false,
      errorCode: 'INVALID_TOKEN',
      message: 'Session token is invalid or has expired.',
    });
  }
}
