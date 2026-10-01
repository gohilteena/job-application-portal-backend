import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { companySchema, updateRecruiterSchema } from '../../validators/recruiter.validator';
import * as ctrl from './recruiter.controller';

const router = Router();
router.use(authenticate, authorize('recruiter'));

router.get('/me', ctrl.getMe);
router.put('/me', validate({ body: updateRecruiterSchema }), ctrl.updateMe);
router.put('/me/company', validate({ body: companySchema }), ctrl.updateCompany);

export default router;
