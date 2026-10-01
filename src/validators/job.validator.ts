import { z } from 'zod';
import { JOB_STATUSES, JOB_TYPES, WORK_MODES } from '../types';
import { NON_EMPTY_MESSAGE, nonEmpty, paginationQuery } from './common';

const jobBase = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000),
  jobType: z.enum(JOB_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().trim().min(2).max(150),
  requiredSkills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  status: z.enum(JOB_STATUSES).default('open'),
});

const salaryRule = (v: { salaryMin?: number; salaryMax?: number }): boolean =>
  v.salaryMin === undefined || v.salaryMax === undefined || v.salaryMin <= v.salaryMax;
const SALARY_MSG = { message: 'salaryMin must not exceed salaryMax', path: ['salaryMin'] };

export const createJobSchema = jobBase.refine(salaryRule, SALARY_MSG);
export const updateJobSchema = jobBase.partial().refine(nonEmpty, NON_EMPTY_MESSAGE).refine(salaryRule, SALARY_MSG);

export const jobQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  location: z.string().trim().max(100).optional(),
  skills: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined)),
  minSalary: z.coerce.number().min(0).optional(),
  maxSalary: z.coerce.number().min(0).optional(),
  sort: z.enum(['newest', 'oldest', 'salary_desc', 'salary_asc']).default('newest'),
  ...paginationQuery,
});

export const myJobsQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  ...paginationQuery,
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobQuery = z.infer<typeof jobQuerySchema>;
export type MyJobsQuery = z.infer<typeof myJobsQuerySchema>;
