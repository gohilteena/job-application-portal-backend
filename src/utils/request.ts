import type { Request, Response } from 'express';
import type { AuthUser } from '../types';
import { AppError } from './AppError';

export const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw new AppError(401, 'Authentication required');
  return req.user;
};

export const param = (req: Request, name: string): string => String(req.params[name]);

/** Parsed query stored by the validate middleware (req.query is read-only in Express 5). */
export const queryOf = <T>(res: Response): T => res.locals.query as T;
