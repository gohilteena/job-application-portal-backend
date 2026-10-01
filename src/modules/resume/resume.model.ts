import { Schema, model, type Types } from 'mongoose';

export interface IResume {
  user: Types.ObjectId;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

resumeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const result = {
      _id: ret._id,
      user: ret.user,
      originalName: ret.originalName,
      mimeType: ret.mimeType,
      size: ret.size,
      isDefault: ret.isDefault,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
      downloadUrl: `/api/resumes/${String(ret._id)}/file`,
    };

    return result;
  },
});

export const Resume = model<IResume>('Resume', resumeSchema);