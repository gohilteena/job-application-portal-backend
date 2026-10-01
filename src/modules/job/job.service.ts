import { AppError } from '../../utils/AppError';
import { buildPagination, escapeRegex } from '../../utils/pagination';
import type { CreateJobInput, JobQuery, MyJobsQuery, UpdateJobInput } from '../../validators/job.validator';
import { Application } from '../application/application.model';
import { RecruiterProfile } from '../recruiter/recruiter.model';
import { Job } from './job.model';

type Filter = Record<string, any>;

const SORTS: Record<JobQuery['sort'], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  salary_desc: { salaryMax: -1 },
  salary_asc: { salaryMin: 1 },
};

const COMPANY_FIELDS = 'name logoUrl location website';

export const listJobs = async (q: JobQuery) => {
  const filter: Filter = { status: 'open' };
  if (q.jobType) filter.jobType = q.jobType;
  if (q.workMode) filter.workMode = q.workMode;
  if (q.location) filter.location = new RegExp(escapeRegex(q.location), 'i');
  if (q.skills?.length) {
    filter.requiredSkills = { $in: q.skills.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { requiredSkills: rx }];
  }
  // A job matches when its salary range overlaps the requested range
  if (q.minSalary !== undefined) filter.salaryMax = { $gte: q.minSalary };
  if (q.maxSalary !== undefined) filter.salaryMin = { $lte: q.maxSalary };

  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('company', COMPANY_FIELDS)
      .populate('recruiter', 'name'),
    Job.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(q.page, q.limit, total) };
};

/** Public detail: drafts/closed jobs are only visible to the recruiter who owns them. */
export const getJob = async (id: string, viewerId?: string) => {
  const job = await Job.findById(id);
  if (!job || (job.status !== 'open' && job.recruiter.toString() !== viewerId)) {
    throw new AppError(404, 'Job not found');
  }
  await job.populate([
    { path: 'company', select: COMPANY_FIELDS },
    { path: 'recruiter', select: 'name' },
  ]);
  return job;
};

export const getOwnedJob = async (id: string, recruiterId: string) => {
  const job = await Job.findById(id);
  if (!job) throw new AppError(404, 'Job not found');
  if (job.recruiter.toString() !== recruiterId) throw new AppError(403, 'You can only manage jobs you posted');
  return job;
};

export const createJob = async (recruiterId: string, input: CreateJobInput) => {
  const profile = await RecruiterProfile.findOne({ user: recruiterId });
  return Job.create({ ...input, recruiter: recruiterId, company: profile?.company });
};

export const updateJob = async (id: string, recruiterId: string, input: UpdateJobInput) => {
  const job = await getOwnedJob(id, recruiterId);
  const salaryMin = input.salaryMin ?? job.salaryMin;
  const salaryMax = input.salaryMax ?? job.salaryMax;
  if (salaryMin > salaryMax) {
    throw new AppError(400, 'Validation failed', [{ field: 'salaryMin', message: 'salaryMin must not exceed salaryMax' }]);
  }
  job.set(input);
  await job.save();
  return job;
};

export const deleteJob = async (id: string, recruiterId: string): Promise<void> => {
  const job = await getOwnedJob(id, recruiterId);
  await Application.deleteMany({ job: job._id }); // applications cannot outlive their job
  await job.deleteOne();
};

export const listRecruiterJobs = async (recruiterId: string, q: MyJobsQuery) => {
  const filter: Filter = { recruiter: recruiterId };
  if (q.status) filter.status = q.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('company', COMPANY_FIELDS)
      .lean(),
    Job.countDocuments(filter),
  ]);

  const counts = await Application.aggregate<{ _id: unknown; count: number }>([
    { $match: { job: { $in: jobs.map((j) => j._id) } } },
    { $group: { _id: '$job', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const items = jobs.map((j) => ({ ...j, applicationsCount: countMap.get(String(j._id)) ?? 0 }));

  return { items, pagination: buildPagination(q.page, q.limit, total) };
};
