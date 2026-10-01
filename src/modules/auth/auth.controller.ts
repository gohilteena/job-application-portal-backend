import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import type { LoginInput, RegisterInput } from '../../validators/auth.validator';
import * as service from './auth.service';

export const register = async (req: Request, res: Response) =>
  sendSuccess(res, 201, 'Registered successfully', await service.register(req.body as RegisterInput));

export const login = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Login successful', await service.login(req.body as LoginInput));

export const refreshToken = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Token refreshed', await service.refresh((req.body as { refreshToken: string }).refreshToken));

export const logout = async (req: Request, res: Response) => {
  await service.logout((req.body as { refreshToken: string }).refreshToken);
  sendSuccess(res, 200, 'Logged out successfully');
};
