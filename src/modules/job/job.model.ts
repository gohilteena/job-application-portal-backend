import { Schema, model, type Types } from 'mongoose';
import { JOB_STATUSES, JOB_TYPES, WORK_MODES, type JobStatus, type JobType, type WorkMode } from '../../types';

export interface IJob {
  title: string;
  description: string;
  jobType: JobType;
  workMode: WorkMode;
  location: string;
  requiredSkills: string[];
  salaryMin: number;
  salaryMax: number;
  status: JobStatus;
  recruiter: Types.ObjectId;
  company?: Types.ObjectId;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    jobType: { type: String, enum: [...JOB_TYPES], required: true },
    workMode: { type: String, enum: [...WORK_MODES], required: true },
    location: { type: String, required: true, trim: true },
    requiredSkills: { type: [String], default: [] },
    salaryMin: { type: Number, required: true, min: 0 },
    salaryMax: { type: Number, required: true, min: 0 },
    status: { type: String, enum: [...JOB_STATUSES], default: 'open' },
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true },
);

jobSchema.index({ status: 1, createdAt: -1 });

export const Job = model<IJob>('Job', jobSchema);
