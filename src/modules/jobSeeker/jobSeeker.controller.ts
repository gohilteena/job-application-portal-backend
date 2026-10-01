import type { Request, Response } from 'express';
import { currentUser, param } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import type { UpdateProfileInput } from '../../validators/jobSeeker.validator';
import * as service from './jobSeeker.service';
import type { Section } from './jobSeeker.service';

export const getMe = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Profile fetched', { profile: await service.getProfile(currentUser(req).id) });

export const updateMe = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Profile updated', { profile: await service.updateProfile(currentUser(req).id, req.body as UpdateProfileInput) });

export const addEntry = (section: Section) => async (req: Request, res: Response) =>
  sendSuccess(res, 201, `${section} entry added`, { entry: await service.addEntry(currentUser(req).id, section, req.body) });

export const updateEntry = (section: Section) => async (req: Request, res: Response) =>
  sendSuccess(res, 200, `${section} entry updated`, {
    entry: await service.updateEntry(currentUser(req).id, section, param(req, 'id'), req.body),
  });

export const removeEntry = (section: Section) => async (req: Request, res: Response) => {
  await service.removeEntry(currentUser(req).id, section, param(req, 'id'));
  sendSuccess(res, 200, `${section} entry deleted`);
};
