import { z } from 'zod';
import { NON_EMPTY_MESSAGE, nonEmpty } from './common';

const dateOrder = (v: { startDate?: Date; endDate?: Date }): boolean =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;
const DATE_MSG = { message: 'endDate must be on or after startDate', path: ['endDate'] };
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    headline: z.string().trim().max(150),
    summary: z.string().trim().max(2000),
    phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, 'Invalid phone number'),
    location: z.string().trim().max(100),
    skills: z.array(z.string().trim().min(1).max(50)).max(50),
  })
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE);

const educationBase = z.object({
  institution: z.string().trim().min(2).max(150),
  degree: z.string().trim().min(2).max(100),
  fieldOfStudy: optionalText(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  grade: optionalText(50),
  description: optionalText(1000),
});
export const educationCreateSchema = educationBase.refine(dateOrder, DATE_MSG);
export const educationUpdateSchema = educationBase.partial().refine(nonEmpty, NON_EMPTY_MESSAGE).refine(dateOrder, DATE_MSG);

const experienceBase = z.object({
  company: z.string().trim().min(2).max(150),
  title: z.string().trim().min(2).max(150),
  location: optionalText(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: optionalText(2000),
});
const currentRule = (v: { isCurrent?: boolean; endDate?: Date }): boolean => !(v.isCurrent && v.endDate);
const CURRENT_MSG = { message: 'endDate must be empty for a current position', path: ['endDate'] };
export const experienceCreateSchema = experienceBase.refine(dateOrder, DATE_MSG).refine(currentRule, CURRENT_MSG);
export const experienceUpdateSchema = experienceBase
  .partial()
  .refine(nonEmpty, NON_EMPTY_MESSAGE)
  .refine(dateOrder, DATE_MSG)
  .refine(currentRule, CURRENT_MSG);

const projectBase = z.object({
  title: z.string().trim().min(2).max(150),
  description: optionalText(2000),
  url: z.string().trim().url('Invalid URL').optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export const projectCreateSchema = projectBase.refine(dateOrder, DATE_MSG);
export const projectUpdateSchema = projectBase.partial().refine(nonEmpty, NON_EMPTY_MESSAGE).refine(dateOrder, DATE_MSG);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
