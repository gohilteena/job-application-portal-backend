import { z } from 'zod';

// Multipart text fields arrive as strings
export const uploadResumeBodySchema = z.object({
  isDefault: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});
