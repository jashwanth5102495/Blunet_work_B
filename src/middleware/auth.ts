import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';
import { Role } from '../types/index.js';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Authentication token missing. Please log in.', 401, 'UNAUTHORIZED');
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN'));
    }
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthenticated user.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};
