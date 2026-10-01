import type { Request, Response } from 'express';
import { currentUser } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import type { CompanyInput, UpdateRecruiterInput } from '../../validators/recruiter.validator';
import * as service from './recruiter.service';

export const getMe = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Profile fetched', { profile: await service.getProfile(currentUser(req).id) });

export const updateMe = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Profile updated', { profile: await service.updateProfile(currentUser(req).id, req.body as UpdateRecruiterInput) });

export const updateCompany = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Company saved', { company: await service.upsertCompany(currentUser(req).id, req.body as CompanyInput) });
