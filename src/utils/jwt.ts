import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUser, Role } from '../types';
import { AppError } from './AppError';

const sign = (user: AuthUser, secret: string, expiresIn: string): string =>
  jwt.sign({ role: user.role }, secret, {
    subject: user.id,
    expiresIn: expiresIn as SignOptions['expiresIn'],
    jwtid: crypto.randomUUID(), // makes every refresh token unique, so rotation always changes the hash
  });

const verify = (token: string, secret: string): AuthUser => {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.sub) throw new Error('Malformed token');
    const role = decoded.role as Role;
    if (role !== 'job_seeker' && role !== 'recruiter') throw new Error('Malformed token');
    return { id: decoded.sub, role };
  } catch (err) {
    throw new AppError(401, err instanceof jwt.TokenExpiredError ? 'Token has expired' : 'Invalid token');
  }
};

export const signAccessToken = (user: AuthUser): string => sign(user, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRY);
export const signRefreshToken = (user: AuthUser): string => sign(user, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRY);
export const verifyAccessToken = (token: string): AuthUser => verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token: string): AuthUser => verify(token, env.JWT_REFRESH_SECRET);

/** Refresh tokens are stored hashed so a DB leak does not expose usable tokens. */
export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');
