import { z } from 'zod';
import { APPLICATION_STATUSES, RECRUITER_SETTABLE_STATUSES } from '../types';
import { objectId, paginationQuery } from './common';

export const applySchema = z.object({
  jobId: objectId,
  resumeId: objectId,
  coverLetter: z.string().trim().max(1000).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(RECRUITER_SETTABLE_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const applicationQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  ...paginationQuery,
});

export type ApplyInput = z.infer<typeof applySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ApplicationQuery = z.infer<typeof applicationQuerySchema>;
