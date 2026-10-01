import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError, type ErrorDetail } from '../utils/AppError';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    const details: ErrorDetail[] = [];

    const run = (part: 'body' | 'query' | 'params', schema?: ZodTypeAny): unknown => {
      if (!schema) return undefined;
      const source: unknown = part === 'body' ? (req.body ?? {}) : req[part];
      const result = schema.safeParse(source);
      if (result.success) return result.data;
      for (const issue of result.error.issues) {
        const path = part === 'body' ? issue.path : [part, ...issue.path];
        details.push({ field: path.join('.') || part, message: issue.message });
      }
      return undefined;
    };

    const body = run('body', schemas.body);
    const query = run('query', schemas.query);
    run('params', schemas.params);

    if (details.length) throw new AppError(400, 'Validation failed', details);

    if (schemas.body) req.body = body; // unknown keys are stripped by Zod
    if (schemas.query) res.locals.query = query;
    next();
  };
