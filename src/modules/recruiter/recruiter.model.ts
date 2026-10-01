import { Schema, model, type Types } from 'mongoose';

export interface IRecruiterProfile {
  user: Types.ObjectId;
  phone?: string;
  designation?: string;
  bio?: string;
  company?: Types.ObjectId;
}

const recruiterProfileSchema = new Schema<IRecruiterProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    bio: { type: String, trim: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
  },
  { timestamps: true },
);

export const RecruiterProfile = model<IRecruiterProfile>('RecruiterProfile', recruiterProfileSchema);
