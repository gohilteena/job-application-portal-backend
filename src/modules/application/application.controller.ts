import type { Request, Response } from 'express';
import { currentUser, param, queryOf } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import type { ApplicationQuery, ApplyInput, UpdateStatusInput } from '../../validators/application.validator';
import * as service from './application.service';

export const apply = async (req: Request, res: Response) => {
  const { application, reapplied } = await service.apply(currentUser(req).id, req.body as ApplyInput);
  sendSuccess(res, reapplied ? 200 : 201, reapplied ? 'Application re-submitted' : 'Application submitted successfully', { application });
};

export const mine = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Applications fetched', await service.listMine(currentUser(req).id, queryOf<ApplicationQuery>(res)));

export const forJob = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Applications fetched', await service.listForJob(currentUser(req).id, param(req, 'jobId'), queryOf<ApplicationQuery>(res)));

export const updateStatus = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Application status updated', {
    application: await service.updateStatus(currentUser(req).id, param(req, 'id'), req.body as UpdateStatusInput),
  });

export const withdraw = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Application withdrawn', { application: await service.withdraw(currentUser(req).id, param(req, 'id')) });
