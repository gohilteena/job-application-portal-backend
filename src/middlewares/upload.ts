import path from 'path';
import multer from 'multer';
import { AppError } from '../utils/AppError';

export const MAX_RESUME_SIZE = 5 * 1024 * 1024;

export const ALLOWED_RESUME_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Files are buffered in memory and handed to the storage provider, so swapping to S3/Cloudinary needs no change here.
export const uploadResumeFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ALLOWED_RESUME_TYPES[ext];
    if (!allowed || !allowed.includes(file.mimetype)) {
      cb(new AppError(400, 'Invalid file type. Only PDF, DOC and DOCX files are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('resume');
