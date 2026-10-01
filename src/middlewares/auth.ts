import type { RequestHandler } from 'express';
import type { Role } from '../types';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

const bearer = (header: string | undefined): string | null =>
  header && header.startsWith('Bearer ') ? header.slice(7).trim() : null;

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = bearer(req.headers.authorization);
  if (!token) throw new AppError(401, 'Authentication required. Use "Authorization: Bearer <accessToken>"');
  req.user = verifyAccessToken(token);
  next();
};

/** Attaches req.user when a valid token is present, but never rejects the request. */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = bearer(req.headers.authorization);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* treat as anonymous */
    }
  }
  next();
};

export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw new AppError(401, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'You do not have permission to perform this action');
    }
    next();
  };
