import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { env } from './config/env';
import { Application } from './modules/application/application.model';
import { Company } from './modules/company/company.model';
import { Job } from './modules/job/job.model';
import { JobSeekerProfile } from './modules/jobSeeker/jobSeeker.model';
import { RecruiterProfile } from './modules/recruiter/recruiter.model';
import { Resume } from './modules/resume/resume.model';
import { resumeStorage } from './modules/resume/resume.storage';
import { Tag } from './modules/tag/tag.model';
import { User } from './modules/user/user.model';
import type { IJob } from './modules/job/job.model';
import type { TagAppliesOn } from './types';

const RECRUITER = { name: 'Rita Recruiter', email: 'recruiter@example.com', password: 'Recruiter@123' };
const SEEKER = { name: 'Sam Seeker', email: 'seeker@example.com', password: 'Seeker@123' };

const TAGS: Record<TagAppliesOn, string[]> = {
  skill: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB', 'Express', 'Python', 'SQL', 'Docker', 'AWS', 'Git', 'Figma'],
  job_category: ['Software Engineering', 'Design', 'Data Science', 'Marketing', 'DevOps'],
  industry: ['Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce'],
};

type JobSeed = Omit<IJob, 'recruiter' | 'company'>;
const JOBS: JobSeed[] = [
  { title: 'Backend Developer (Node.js)', description: 'Design and build scalable REST APIs and services for our SaaS platform using Node.js, TypeScript and MongoDB.', jobType: 'full_time', workMode: 'hybrid', location: 'Bengaluru, India', requiredSkills: ['Node.js', 'TypeScript', 'MongoDB', 'Express'], salaryMin: 60000, salaryMax: 100000, status: 'open' },
  { title: 'Frontend Developer (React)', description: 'Build responsive, accessible user interfaces in React and collaborate closely with design and backend teams.', jobType: 'full_time', workMode: 'remote', location: 'Remote (India)', requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Git'], salaryMin: 50000, salaryMax: 90000, status: 'open' },
  { title: 'Data Analyst Intern', description: 'Support the analytics team with data cleaning, SQL queries, dashboards and weekly reporting for product teams.', jobType: 'internship', workMode: 'onsite', location: 'Pune, India', requiredSkills: ['SQL', 'Python'], salaryMin: 10000, salaryMax: 25000, status: 'open' },
  { title: 'DevOps Engineer (Contract)', description: '6-month contract to improve CI/CD pipelines, containerise services and manage cloud infrastructure on AWS.', jobType: 'contract', workMode: 'remote', location: 'Hyderabad, India', requiredSkills: ['Docker', 'AWS', 'Git'], salaryMin: 70000, salaryMax: 120000, status: 'open' },
  { title: 'UI/UX Designer', description: 'Own the design process from research to high-fidelity prototypes for our web and mobile products.', jobType: 'part_time', workMode: 'onsite', location: 'Ahmedabad, India', requiredSkills: ['Figma'], salaryMin: 30000, salaryMax: 55000, status: 'open' },
  { title: 'Legacy PHP Maintainer', description: 'Position closed. Included to demonstrate that closed jobs are hidden from public listings and reject applications.', jobType: 'full_time', workMode: 'onsite', location: 'Mumbai, India', requiredSkills: ['SQL'], salaryMin: 40000, salaryMax: 60000, status: 'closed' },
];

// Smallest valid-looking PDF (passes the signature check) used as a placeholder resume
const PLACEHOLDER_PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

const run = async (): Promise<void> => {
  await connectDB();

  if (process.argv.includes('--reset')) {
    await Promise.all([
      Application.deleteMany({}), Resume.deleteMany({}), Job.deleteMany({}), Tag.deleteMany({}),
      JobSeekerProfile.deleteMany({}), RecruiterProfile.deleteMany({}), Company.deleteMany({}), User.deleteMany({}),
    ]);
    console.log('Collections cleared (files in uploads/resumes are left untouched)');
  }

  const findOrCreateUser = async (data: typeof RECRUITER, role: 'recruiter' | 'job_seeker') =>
    (await User.findOne({ email: data.email })) ??
    (await User.create({ name: data.name, email: data.email, password: await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS), role }));

  const recruiter = await findOrCreateUser(RECRUITER, 'recruiter');
  const seeker = await findOrCreateUser(SEEKER, 'job_seeker');

  const company = await Company.findOneAndUpdate(
    { createdBy: recruiter._id },
    { $setOnInsert: { name: 'TechNova Solutions', website: 'https://technova.example.com', industry: 'Technology', size: '51-200', description: 'A product company building developer tools and SaaS platforms.', location: 'Bengaluru, India', createdBy: recruiter._id } },
    { upsert: true, new: true },
  );
  await RecruiterProfile.findOneAndUpdate(
    { user: recruiter._id },
    { $setOnInsert: { user: recruiter._id, phone: '+91 98765 43210', designation: 'Talent Acquisition Lead', bio: 'Hiring engineers and designers.', company: company._id } },
    { upsert: true },
  );

  await JobSeekerProfile.findOneAndUpdate(
    { user: seeker._id },
    {
      $setOnInsert: {
        user: seeker._id,
        headline: 'Full-stack developer',
        summary: 'Developer with a focus on Node.js and React, keen on building reliable products.',
        phone: '+91 91234 56789',
        location: 'Rajkot, India',
        skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB'],
        education: [{ institution: 'Gujarat Technological University', degree: 'B.E.', fieldOfStudy: 'Computer Engineering', startDate: new Date('2018-08-01'), endDate: new Date('2022-05-31'), grade: '8.4 CGPA' }],
        experience: [{ company: 'CodeCraft Labs', title: 'Software Engineer', location: 'Ahmedabad', startDate: new Date('2022-07-01'), isCurrent: true, description: 'Building REST APIs and internal tools with Node.js.' }],
        projects: [{ title: 'Task Tracker API', description: 'REST API with JWT auth and role-based access.', url: 'https://github.com/example/task-tracker', skills: ['Node.js', 'MongoDB'], startDate: new Date('2023-01-01'), endDate: new Date('2023-03-01') }],
      },
    },
    { upsert: true },
  );

  for (const [appliesOn, names] of Object.entries(TAGS) as Array<[TagAppliesOn, string[]]>) {
    for (const name of names) {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      await Tag.updateOne({ slug, appliesOn }, { $setOnInsert: { name, slug, appliesOn, createdBy: recruiter._id } }, { upsert: true });
    }
  }

  const jobs = [];
  for (const j of JOBS) {
    jobs.push((await Job.findOne({ title: j.title, recruiter: recruiter._id })) ?? (await Job.create({ ...j, recruiter: recruiter._id, company: company._id })));
  }

  let resume = await Resume.findOne({ user: seeker._id, isDefault: true });
  if (!resume) {
    const key = await resumeStorage.save({ buffer: PLACEHOLDER_PDF, originalName: 'sam-seeker-resume.pdf', ownerId: seeker.id });
    resume = await Resume.create({ user: seeker._id, originalName: 'sam-seeker-resume.pdf', storageKey: key, mimeType: 'application/pdf', size: PLACEHOLDER_PDF.length, isDefault: true });
  }

  const firstJob = jobs[0];
  if (firstJob && !(await Application.exists({ job: firstJob._id, applicant: seeker._id }))) {
    await Application.create({ job: firstJob._id, applicant: seeker._id, resume: resume._id, coverLetter: 'I would love to contribute to your backend team.' });
  }

  console.log('\nSeed complete. Test credentials:');
  console.log(`  Recruiter:  ${RECRUITER.email} / ${RECRUITER.password}`);
  console.log(`  Job seeker: ${SEEKER.email} / ${SEEKER.password}\n`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
