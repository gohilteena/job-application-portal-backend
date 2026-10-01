import { z } from 'zod';
import { TAG_APPLIES_ON } from '../types';

export const createTagSchema = z.object({
  name: z.string().trim().min(2).max(50),
  appliesOn: z.enum(TAG_APPLIES_ON),
});

export const tagQuerySchema = z.object({
  appliesOn: z.enum(TAG_APPLIES_ON).optional(),
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type TagQuery = z.infer<typeof tagQuerySchema>;
