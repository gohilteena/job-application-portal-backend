import path from 'path';
import type { Readable } from 'stream';
import type { AuthUser } from '../../types';
import { AppError } from '../../utils/AppError';
import { Application } from '../application/application.model';
import { Job } from '../job/job.model';
import { Resume } from './resume.model';
import { resumeStorage } from './resume.storage';

const MAX_RESUMES_PER_USER = 5;

// Magic-byte check: the client-supplied MIME type/extension alone is easy to fake
const hasValidSignature = (buf: Buffer, ext: string): boolean => {
  if (ext === '.pdf') return buf.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === '.doc') return buf.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  if (ext === '.docx') return buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  return false;
};

const getOwned = async (userId: string, id: string) => {
  const resume = await Resume.findOne({ _id: id, user: userId });
  if (!resume) throw new AppError(404, 'Resume not found');
  return resume;
};

export const uploadResume = async (userId: string, file: Express.Multer.File | undefined, makeDefault: boolean) => {
  if (!file) throw new AppError(400, 'No file uploaded. Send a PDF, DOC or DOCX under the "resume" form-data field');

  const ext = path.extname(file.originalname).toLowerCase();
  if (!hasValidSignature(file.buffer, ext)) {
    throw new AppError(400, 'File content does not match its extension. Upload a valid PDF, DOC or DOCX');
  }

  const existing = await Resume.countDocuments({ user: userId });
  if (existing >= MAX_RESUMES_PER_USER) {
    throw new AppError(400, `You can store at most ${MAX_RESUMES_PER_USER} resumes. Delete one first`);
  }

  const key = await resumeStorage.save({ buffer: file.buffer, originalName: file.originalname, ownerId: userId });
  try {
    const isDefault = existing === 0 || makeDefault;
    if (isDefault) await Resume.updateMany({ user: userId }, { $set: { isDefault: false } });
    return await Resume.create({
      user: userId,
      originalName: file.originalname,
      storageKey: key,
      mimeType: file.mimetype,
      size: file.size,
      isDefault,
    });
  } catch (err) {
    await resumeStorage.remove(key);
    throw err;
  }
};

export const listResumes = (userId: string) => Resume.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

export const setDefault = async (userId: string, id: string) => {
  const resume = await getOwned(userId, id);
  await Resume.updateMany({ user: userId }, { $set: { isDefault: false } });
  resume.isDefault = true;
  await resume.save();
  return resume;
};

export const deleteResume = async (userId: string, id: string): Promise<void> => {
  const resume = await getOwned(userId, id);

  if (await Application.exists({ resume: resume._id, status: { $ne: 'withdrawn' } })) {
    throw new AppError(409, 'This resume is attached to an active application. Withdraw the application first');
  }

  await resume.deleteOne();
  await resumeStorage.remove(resume.storageKey).catch(() => undefined);

  if (resume.isDefault) {
    const next = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
    if (next) await Resume.updateOne({ _id: next._id }, { $set: { isDefault: true } });
  }
};

/** Owner, or a recruiter who received an application with this resume, may download it. */
export const openForDownload = async (viewer: AuthUser, id: string): Promise<{ name: string; type: string; stream: Readable }> => {
  const resume = await Resume.findById(id);
  if (!resume) throw new AppError(404, 'Resume not found');

  let allowed = resume.user.toString() === viewer.id;
  if (!allowed && viewer.role === 'recruiter') {
    const jobIds = await Job.find({ recruiter: viewer.id }).distinct('_id');
    allowed = !!(await Application.exists({ resume: resume._id, job: { $in: jobIds } }));
  }
  if (!allowed) throw new AppError(403, 'You do not have access to this resume');

  const stream = await resumeStorage.read(resume.storageKey);
  if (!stream) throw new AppError(404, 'Resume file is no longer available (storage may be ephemeral)');
  return { name: resume.originalName, type: resume.mimeType, stream };
};
