export const ROLES = ['job_seeker', 'recruiter'] as const;
export type Role = (typeof ROLES)[number];

export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const;
export const WORK_MODES = ['onsite', 'remote', 'hybrid'] as const;
export const JOB_STATUSES = ['open', 'closed', 'draft'] as const;
export const APPLICATION_STATUSES = ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired', 'withdrawn'] as const;
export const RECRUITER_SETTABLE_STATUSES = ['reviewing', 'shortlisted', 'rejected', 'hired'] as const;
export const TAG_APPLIES_ON = ['skill', 'job_category', 'industry'] as const;
export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type TagAppliesOn = (typeof TAG_APPLIES_ON)[number];

export interface AuthUser {
  id: string;
  role: Role;
}
