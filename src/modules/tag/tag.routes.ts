import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createTagSchema, tagQuerySchema } from '../../validators/tag.validator';
import * as ctrl from './tag.controller';

const router = Router();

router.get('/', validate({ query: tagQuerySchema }), ctrl.list);
router.post('/', authenticate, authorize('recruiter'), validate({ body: createTagSchema }), ctrl.create);

export default router;
