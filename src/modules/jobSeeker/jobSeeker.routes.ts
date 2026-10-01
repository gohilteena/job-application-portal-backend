import { Router } from 'express';
import type { ZodTypeAny } from 'zod';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { idParams } from '../../validators/common';
import * as v from '../../validators/jobSeeker.validator';
import * as ctrl from './jobSeeker.controller';
import type { Section } from './jobSeeker.service';

const router = Router();
router.use(authenticate, authorize('job_seeker'));

router.get('/me', ctrl.getMe);
router.put('/me', validate({ body: v.updateProfileSchema }), ctrl.updateMe);

const sections: Array<{ path: string; section: Section; create: ZodTypeAny; update: ZodTypeAny }> = [
  { path: 'education', section: 'education', create: v.educationCreateSchema, update: v.educationUpdateSchema },
  { path: 'experience', section: 'experience', create: v.experienceCreateSchema, update: v.experienceUpdateSchema },
  { path: 'projects', section: 'projects', create: v.projectCreateSchema, update: v.projectUpdateSchema },
];

for (const s of sections) {
  router.post(`/me/${s.path}`, validate({ body: s.create }), ctrl.addEntry(s.section));
  router.put(`/me/${s.path}/:id`, validate({ params: idParams, body: s.update }), ctrl.updateEntry(s.section));
  router.delete(`/me/${s.path}/:id`, validate({ params: idParams }), ctrl.removeEntry(s.section));
}

export default router;
