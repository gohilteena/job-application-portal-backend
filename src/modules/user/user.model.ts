import { Schema, model } from 'mongoose';
import { ROLES, type Role } from '../../types';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  refreshTokens: string[]; // sha256 hashes of active refresh tokens
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: [...ROLES], required: true },
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
