import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { uploadResumeFile } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { idParams } from '../../validators/common';
import { uploadResumeBodySchema } from '../../validators/resume.validator';
import * as ctrl from './resume.controller';

const router = Router();
router.use(authenticate);

// Owner or an authorised recruiter (checked in the service)
router.get('/:id/file', validate({ params: idParams }), ctrl.download);

router.post('/', authorize('job_seeker'), uploadResumeFile, validate({ body: uploadResumeBodySchema }), ctrl.upload);
router.get('/', authorize('job_seeker'), ctrl.list);
router.patch('/:id/default', authorize('job_seeker'), validate({ params: idParams }), ctrl.setDefault);
router.delete('/:id', authorize('job_seeker'), validate({ params: idParams }), ctrl.remove);

export default router;
