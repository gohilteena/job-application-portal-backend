import type { Request, Response } from 'express';
import { currentUser, queryOf } from '../../utils/request';
import { sendSuccess } from '../../utils/response';
import type { CreateTagInput, TagQuery } from '../../validators/tag.validator';
import * as service from './tag.service';

export const list = async (_req: Request, res: Response) =>
  sendSuccess(res, 200, 'Tags fetched', await service.listTags(queryOf<TagQuery>(res)));

export const create = async (req: Request, res: Response) =>
  sendSuccess(res, 201, 'Tag created', { tag: await service.createTag(req.body as CreateTagInput, currentUser(req).id) });
