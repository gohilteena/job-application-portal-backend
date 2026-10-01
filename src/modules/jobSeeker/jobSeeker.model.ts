import { Schema, model, type Types } from 'mongoose';

export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date;
  grade?: string;
  description?: string;
}
export interface IExperience {
  company: string;
  title: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
}
export interface IProject {
  title: string;
  description?: string;
  url?: string;
  skills: string[];
  startDate?: Date;
  endDate?: Date;
}
export interface IJobSeekerProfile {
  user: Types.ObjectId;
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  skills: string[];
  education: IEducation[];
  experience: IExperience[];
  projects: IProject[];
}

const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  grade: { type: String, trim: true },
  description: { type: String, trim: true },
});

const experienceSchema = new Schema<IExperience>({
  company: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  location: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  isCurrent: { type: Boolean, default: false },
  description: { type: String, trim: true },
});

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  url: { type: String, trim: true },
  skills: { type: [String], default: [] },
  startDate: Date,
  endDate: Date,
});

const jobSeekerProfileSchema = new Schema<IJobSeekerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, trim: true },
    summary: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    skills: { type: [String], default: [] },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
  },
  { timestamps: true },
);

export const JobSeekerProfile = model<IJobSeekerProfile>('JobSeekerProfile', jobSeekerProfileSchema);
