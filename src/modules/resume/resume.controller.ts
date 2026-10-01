import { pipeline } from 'stream/promises';
import type { Request, Response } from 'express';
import { currentUser, param } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import * as service from './resume.service';

export const upload = async (req: Request, res: Response) => {
  const isDefault = Boolean((req.body as { isDefault?: boolean }).isDefault);
  const resume = await service.uploadResume(currentUser(req).id, req.file, isDefault);
  sendSuccess(res, 201, 'Resume uploaded successfully', { resume });
};

export const list = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Resumes fetched', { resumes: await service.listResumes(currentUser(req).id) });

export const setDefault = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Default resume updated', { resume: await service.setDefault(currentUser(req).id, param(req, 'id')) });

export const remove = async (req: Request, res: Response) => {
  await service.deleteResume(currentUser(req).id, param(req, 'id'));
  sendSuccess(res, 200, 'Resume deleted');
};

export const download = async (req: Request, res: Response) => {
  const file = await service.openForDownload(currentUser(req), param(req, 'id'));
  res.attachment(file.name);
  res.type(file.type);
  await pipeline(file.stream, res);
};
