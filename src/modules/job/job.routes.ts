import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { idParams } from '../../validators/common';
import { createJobSchema, jobQuerySchema, myJobsQuerySchema, updateJobSchema } from '../../validators/job.validator';
import * as ctrl from './job.controller';

const router = Router();
const recruiterOnly = [authenticate, authorize('recruiter')];

router.get('/', validate({ query: jobQuerySchema }), ctrl.list);
router.get('/recruiter/mine', ...recruiterOnly, validate({ query: myJobsQuerySchema }), ctrl.mine); // must precede /:id
router.get('/:id', optionalAuthenticate, validate({ params: idParams }), ctrl.getById);
router.post('/', ...recruiterOnly, validate({ body: createJobSchema }), ctrl.create);
router.put('/:id', ...recruiterOnly, validate({ params: idParams, body: updateJobSchema }), ctrl.update);
router.delete('/:id', ...recruiterOnly, validate({ params: idParams }), ctrl.remove);

export default router;
