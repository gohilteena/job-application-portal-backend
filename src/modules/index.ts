import { Router } from 'express';
import applicationRoutes from './application/application.routes';
import authRoutes from './auth/auth.routes';
import jobRoutes from './job/job.routes';
import jobSeekerRoutes from './jobSeeker/jobSeeker.routes';
import recruiterRoutes from './recruiter/recruiter.routes';
import resumeRoutes from './resume/resume.routes';
import tagRoutes from './tag/tag.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/job-seekers', jobSeekerRoutes);
router.use('/recruiters', recruiterRoutes);
router.use('/tags', tagRoutes);
router.use('/jobs', jobRoutes);
router.use('/resumes', resumeRoutes);
router.use('/applications', applicationRoutes);

export default router;
