import { Schema, model, type Types } from 'mongoose';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../../types';

export interface IApplication {
  job: Types.ObjectId;
  applicant: Types.ObjectId;
  resume: Types.ObjectId;
  coverLetter?: string;
  status: ApplicationStatus;
  recruiterNote?: string;
}

const applicationSchema = new Schema<IApplication>(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    coverLetter: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: [...APPLICATION_STATUSES], default: 'applied' },
    recruiterNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, createdAt: -1 });

export const Application = model<IApplication>('Application', applicationSchema);
