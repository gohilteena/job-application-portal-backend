import { AppError } from '../../utils/AppError';
import { buildPagination } from '../../utils/pagination';
import type { ApplicationQuery, ApplyInput, UpdateStatusInput } from '../../validators/application.validator';
import { Job } from '../job/job.model';
import { getOwnedJob } from '../job/job.service';
import { Resume } from '../resume/resume.model';
import { Application } from './application.model';

const skip = (q: ApplicationQuery) => (q.page - 1) * q.limit;

const JOB_POPULATE = {
  path: 'job',
  select: 'title jobType workMode location status salaryMin salaryMax company',
  populate: { path: 'company', select: 'name logoUrl' },
};

export const apply = async (userId: string, input: ApplyInput) => {
  const job = await Job.findById(input.jobId);
  if (!job) throw new AppError(404, 'Job not found');
  if (job.status !== 'open') throw new AppError(400, 'This job is not accepting applications');

  const resume = await Resume.findOne({ _id: input.resumeId, user: userId });
  if (!resume) throw new AppError(404, 'Resume not found');

  const existing = await Application.findOne({ job: job._id, applicant: userId });
  if (existing) {
    if (existing.status !== 'withdrawn') throw new AppError(409, 'You have already applied for this job');
    // Re-applying after a withdrawal reactivates the same application
    existing.set({ status: 'applied', resume: resume._id, coverLetter: input.coverLetter, recruiterNote: undefined });
    await existing.save();
    await existing.populate(JOB_POPULATE);
    return { application: existing, reapplied: true };
  }

  const application = await Application.create({
    job: job._id,
    applicant: userId, // always from the JWT
    resume: resume._id,
    coverLetter: input.coverLetter,
  });
  await application.populate(JOB_POPULATE);
  return { application, reapplied: false };
};

export const listMine = async (userId: string, q: ApplicationQuery) => {
  const filter: Record<string, any> = { applicant: userId };
  if (q.status) filter.status = q.status;

  const [items, total] = await Promise.all([
    Application.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).populate(JOB_POPULATE).populate('resume', 'originalName mimeType size'),
    Application.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(q.page, q.limit, total) };
};

export const listForJob = async (recruiterId: string, jobId: string, q: ApplicationQuery) => {
  await getOwnedJob(jobId, recruiterId);
  const filter: Record<string, any> = { job: jobId };
  if (q.status) filter.status = q.status;

  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip(q))
      .limit(q.limit)
      .populate('applicant', 'name email')
      .populate('resume', 'originalName mimeType size'),
    Application.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(q.page, q.limit, total) };
};

export const updateStatus = async (recruiterId: string, id: string, input: UpdateStatusInput) => {
  const application = await Application.findById(id);
  if (!application) throw new AppError(404, 'Application not found');

  await getOwnedJob(application.job.toString(), recruiterId); // 403 if the job isn't theirs
  if (application.status === 'withdrawn') throw new AppError(409, 'Cannot update a withdrawn application');

  application.status = input.status;
  if (input.note !== undefined) application.recruiterNote = input.note;
  await application.save();
  return application;
};

export const withdraw = async (userId: string, id: string) => {
  const application = await Application.findOne({ _id: id, applicant: userId });
  if (!application) throw new AppError(404, 'Application not found');
  if (application.status === 'withdrawn') throw new AppError(409, 'Application is already withdrawn');
  if (application.status === 'rejected' || application.status === 'hired') {
    throw new AppError(409, `A ${application.status} application can no longer be withdrawn`);
  }
  application.status = 'withdrawn';
  await application.save();
  return application;
};
