import { z } from 'zod';
import { COMPANY_SIZES } from '../types';
import { NON_EMPTY_MESSAGE, nonEmpty } from './common';

export const updateRecruiterSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Invalid phone number'),
    designation: z.string().trim().max(100),
    bio: z.string().trim().max(1000),
  })
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

export const companySchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    website: z.string().trim().url('Invalid URL'),
    industry: z.string().trim().max(100),
    size: z.enum(COMPANY_SIZES),
    description: z.string().trim().max(3000),
    location: z.string().trim().max(150),
    logoUrl: z.string().trim().url('Invalid URL'),
  })
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

export type UpdateRecruiterInput = z.infer<typeof updateRecruiterSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
