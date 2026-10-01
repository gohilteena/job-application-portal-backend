import type { Request, Response } from 'express';
import { currentUser, param, queryOf } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import type { CreateJobInput, JobQuery, MyJobsQuery, UpdateJobInput } from '../../validators/job.validator';
import * as service from './job.service';

export const list = async (_req: Request, res: Response) =>
  sendSuccess(res, 200, 'Jobs fetched', await service.listJobs(queryOf<JobQuery>(res)));

export const mine = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Your jobs fetched', await service.listRecruiterJobs(currentUser(req).id, queryOf<MyJobsQuery>(res)));

export const getById = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Job fetched', { job: await service.getJob(param(req, 'id'), req.user?.id) });

export const create = async (req: Request, res: Response) =>
  sendSuccess(res, 201, 'Job created', { job: await service.createJob(currentUser(req).id, req.body as CreateJobInput) });

export const update = async (req: Request, res: Response) =>
  sendSuccess(res, 200, 'Job updated', { job: await service.updateJob(param(req, 'id'), currentUser(req).id, req.body as UpdateJobInput) });

export const remove = async (req: Request, res: Response) => {
  await service.deleteJob(param(req, 'id'), currentUser(req).id);
  sendSuccess(res, 200, 'Job deleted');
};
