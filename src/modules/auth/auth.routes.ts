import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { loginSchema, refreshSchema, registerSchema } from '../../validators/auth.validator';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/register', validate({ body: registerSchema }), ctrl.register);
router.post('/login', validate({ body: loginSchema }), ctrl.login);
router.post('/refresh-token', validate({ body: refreshSchema }), ctrl.refreshToken);
router.post('/logout', validate({ body: refreshSchema }), ctrl.logout);

export default router;
