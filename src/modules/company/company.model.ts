import { Schema, model, type Types } from 'mongoose';
import { COMPANY_SIZES } from '../../types';

export interface ICompany {
  name: string;
  website?: string;
  industry?: string;
  size?: (typeof COMPANY_SIZES)[number];
  description?: string;
  location?: string;
  logoUrl?: string;
  createdBy: Types.ObjectId;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    size: { type: String, enum: [...COMPANY_SIZES] },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export const Company = model<ICompany>('Company', companySchema);
