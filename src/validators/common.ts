import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId');
export const idParams = z.object({ id: objectId });
export const jobIdParams = z.object({ jobId: objectId });

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const nonEmpty = (v: object): boolean => Object.keys(v).length > 0;
export const NON_EMPTY_MESSAGE = 'Provide at least one field to update';
