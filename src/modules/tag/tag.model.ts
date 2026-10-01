import { Schema, model, type Types } from 'mongoose';
import { TAG_APPLIES_ON, type TagAppliesOn } from '../../types';

export interface ITag {
  name: string;
  slug: string;
  appliesOn: TagAppliesOn;
  createdBy?: Types.ObjectId;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    appliesOn: { type: String, enum: [...TAG_APPLIES_ON], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

tagSchema.index({ slug: 1, appliesOn: 1 }, { unique: true });

export const Tag = model<ITag>('Tag', tagSchema);
