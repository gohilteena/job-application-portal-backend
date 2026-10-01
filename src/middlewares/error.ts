import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { AppError, type ErrorDetail } from '../utils/AppError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = 'Internal server error';
  let details: ErrorDetail[] | undefined;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum size is 5 MB'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected field. Send the file under the "resume" field'
          : `Upload error: ${err.message}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err?.code === 11000) {
    status = 409;
    const keys = Object.keys(err.keyPattern ?? {});
    if (keys.includes('email')) message = 'Email is already registered';
    else if (keys.includes('applicant') && keys.includes('job')) message = 'You have already applied for this job';
    else if (keys.includes('slug')) message = 'Tag already exists';
    else message = 'Duplicate value';
  } else if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    // body-parser errors (malformed JSON, payload too large)
    status = err.status;
    message = err.type === 'entity.parse.failed' ? 'Invalid JSON in request body' : 'Invalid request body';
  } else {
    console.error(err);
  }

  const body: { success: false; message: string; data: null; errors?: ErrorDetail[] } = {
    success: false,
    message,
    data: null,
  };
  if (details && details.length) body.errors = details;
  res.status(status).json(body);
};
