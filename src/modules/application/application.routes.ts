import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { applicationQuerySchema, applySchema, updateStatusSchema } from '../../validators/application.validator';
import { idParams, jobIdParams } from '../../validators/common';
import * as ctrl from './application.controller';

const router = Router();
router.use(authenticate);

router.post('/', authorize('job_seeker'), validate({ body: applySchema }), ctrl.apply);
router.get('/me', authorize('job_seeker'), validate({ query: applicationQuerySchema }), ctrl.mine);
router.get('/job/:jobId', authorize('recruiter'), validate({ params: jobIdParams, query: applicationQuerySchema }), ctrl.forJob);
router.patch('/:id/status', authorize('recruiter'), validate({ params: idParams, body: updateStatusSchema }), ctrl.updateStatus);
router.patch('/:id/withdraw', authorize('job_seeker'), validate({ params: idParams }), ctrl.withdraw);

export default router;
