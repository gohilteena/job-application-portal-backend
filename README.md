# Job Portal Backend API

A role-based REST API for a job portal. **Job seekers** manage a profile, upload resumes and apply for jobs. **Recruiters** manage a company, post jobs and review applications.

- **Live API:** [https://job-application-portal-backend-qr2t.onrender.com](https://job-application-portal-backend-zu9q.onrender.com/)
- **Health check:** [https://job-application-portal-backend-qr2t.onrender.com/health](https://job-application-portal-backend-zu9q.onrender.com/health)
- **Database:** MongoDB Atlas

> Render's free tier sleeps when idle; the first request can take ~30 s.
git status
## Tech stack

Node.js 20+, Express 5, TypeScript (strict), MongoDB Atlas + Mongoose 9, Zod, JWT (access + refresh), bcryptjs, Multer, dotenv, helmet, cors, morgan. Deployed on Render.

## Features

- Register / login / refresh-token / logout with short-lived access tokens and **rotating refresh tokens** (stored hashed, one-time use, reuse revokes all sessions)
- Role-based access control (`job_seeker`, `recruiter`)
- Job seeker profile with education, experience and project CRUD
- Recruiter profile and company management
- Jobs with filtering, search, sorting and pagination; recruiters see only their own drafts/closed jobs
- Resume upload (PDF/DOC/DOCX, 5 MB) behind a swappable storage provider
- Applications: apply, list own, list per job (recruiter), update status, withdraw
- Zod validation on every body/query/param; centralized error handling; consistent response envelope

## Project structure

```
src/
  app.ts  server.ts  seed.ts
  config/        env.ts (validated env), db.ts
  middlewares/   auth.ts, validate.ts, upload.ts, error.ts
  modules/       auth, user, jobSeeker, recruiter, company, tag, job, resume, application
                 (each: model / service / controller / routes)
  validators/    Zod schemas
  utils/         AppError, jwt, response, pagination, request helpers
  types/
uploads/resumes/ local resume storage (git-ignored)
postman/         Postman collection (also copied to repo root)
render.yaml  .env.example  README.md
```

## Setup

```bash
git clone <your-repo-url> && cd job-application-portal-backend
npm install
cp .env.example .env     # then fill in the values
```

### Environment variables

| Key | Description |
| --- | --- |
| `PORT` | Server port (Render injects this) |
| `NODE_ENV` | `development` / `production` |
| `MONGO_URI` | Atlas SRV connection string incl. database name |
| `JWT_ACCESS_SECRET` | ≥ 32 chars |
| `JWT_REFRESH_SECRET` | ≥ 32 chars, different from the access secret |
| `JWT_ACCESS_EXPIRY` | e.g. `15m` |
| `JWT_REFRESH_EXPIRY` | e.g. `7d` |
| `BCRYPT_SALT_ROUNDS` | e.g. `12` |
| `CORS_ORIGIN` | _(optional)_ comma-separated allowed origins; empty = allow all |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The app refuses to start if required variables are missing or too short.

### MongoDB Atlas

1. Create a free M0 cluster → **Database Access**: add a user → **Network Access**: allow your IP (and `0.0.0.0/0` for Render's free tier).
2. **Connect → Drivers**, copy the `mongodb+srv://…` string, add the database name (e.g. `/job_portal`) and URL-encode special characters in the password.

### Seed the database

```bash
npm run seed            # idempotent: creates missing data only
npm run seed -- --reset # wipes all collections first, then seeds
```

Creates: 1 recruiter (+ company), 1 job seeker (+ profile with education/experience/project), 22 tags, 6 jobs (5 open, 1 closed), a placeholder default resume and one sample application.

### Test credentials

| Role | Email | Password |
| --- | --- | --- |
| Recruiter | `recruiter@example.com` | `Recruiter@123` |
| Job seeker | `seeker@example.com` | `Seeker@123` |

### Run locally

```bash
npm run dev                      # tsx watch
npm run build && npm start       # compiled
npm run typecheck
```

API at `http://localhost:5000`.

## Response format

```json
{ "success": true, "message": "...", "data": { } }
```
```json
{ "success": false, "message": "Validation failed", "data": null,
  "errors": [{ "field": "salaryMin", "message": "salaryMin must not exceed salaryMax" }] }
```

Status codes: `200`, `201`, `400` validation, `401` unauthenticated / bad token, `403` wrong role or not the owner, `404`, `409` conflict, `413` file too large, `500`.

Paginated endpoints return `data: { items: [...], pagination: { page, limit, total, pages } }`.

## Endpoints

🔒 = `Authorization: Bearer <accessToken>`

| Module | Method & path | Access |
| --- | --- | --- |
| Health | `GET /health` (alias `/api/health`) | public |
| Auth | `POST /api/auth/register` `/login` `/refresh-token` `/logout` | public |
| Job seeker | `GET, PUT /api/job-seekers/me` | 🔒 job_seeker |
| | `POST /me/education`, `PUT, DELETE /me/education/:id` (same for `experience`, `projects`) | 🔒 job_seeker |
| Recruiter | `GET, PUT /api/recruiters/me`, `PUT /api/recruiters/me/company` | 🔒 recruiter |
| Tags | `GET /api/tags?appliesOn=skill` | public |
| | `POST /api/tags` | 🔒 recruiter |
| Jobs | `GET /api/jobs`, `GET /api/jobs/:id` | public |
| | `POST /api/jobs`, `PUT, DELETE /api/jobs/:id`, `GET /api/jobs/recruiter/mine` | 🔒 recruiter |
| Resumes | `POST /api/resumes`, `GET /api/resumes`, `PATCH /api/resumes/:id/default`, `DELETE /api/resumes/:id` | 🔒 job_seeker |
| | `GET /api/resumes/:id/file` (extra: download) | 🔒 owner, or recruiter who received an application with it |
| Applications | `POST /api/applications`, `GET /api/applications/me`, `PATCH /api/applications/:id/withdraw` | 🔒 job_seeker |
| | `GET /api/applications/job/:jobId`, `PATCH /api/applications/:id/status` | 🔒 recruiter |

Enums: `jobType` = `full_time | part_time | contract | internship | freelance`; `workMode` = `onsite | remote | hybrid`; job `status` = `open | closed | draft`; application `status` = `applied | reviewing | shortlisted | rejected | hired | withdrawn` (recruiters may set all except `applied`/`withdrawn`); tag `appliesOn` = `skill | job_category | industry`.

## API documentation

### Auth

**POST /api/auth/register** – password ≥ 8 chars with a letter and a number.
```json
{ "name": "Sam Seeker", "email": "sam@example.com", "password": "Password123", "role": "job_seeker" }
```
`201`
```json
{ "success": true, "message": "Registered successfully",
  "data": { "user": { "id": "66f9a1c2e4b0a1b2c3d4e5f6", "name": "Sam Seeker", "email": "sam@example.com", "role": "job_seeker" },
            "accessToken": "eyJhbGciOi...", "refreshToken": "eyJhbGciOi..." } }
```
Errors: `400` validation, `409` `Email is already registered`.

**POST /api/auth/login** `{ "email": "seeker@example.com", "password": "Seeker@123" }` → `200` same shape as register. `401 Invalid email or password`.

**POST /api/auth/refresh-token** `{ "refreshToken": "..." }` → `200` with a **new** `accessToken` and `refreshToken`. The old refresh token is consumed; replaying it returns `401` and revokes all of that user's sessions.

**POST /api/auth/logout** `{ "refreshToken": "..." }` → `200 { "success": true, "message": "Logged out successfully", "data": null }` (idempotent).

### Job seeker profile

**GET /api/job-seekers/me** → `200`
```json
{ "success": true, "message": "Profile fetched",
  "data": { "profile": { "_id": "...", "user": { "_id": "...", "name": "Sam Seeker", "email": "seeker@example.com", "role": "job_seeker" },
    "headline": "Full-stack developer", "skills": ["Node.js", "React"], "location": "Rajkot, India",
    "education": [{ "_id": "...", "institution": "Gujarat Technological University", "degree": "B.E." }],
    "experience": [], "projects": [] } } }
```

**PUT /api/job-seekers/me** (any subset of fields)
```json
{ "name": "Sam S.", "headline": "Full-stack developer", "summary": "…", "phone": "+91 91234 56789", "location": "Rajkot, India", "skills": ["Node.js", "React"] }
```

**POST /api/job-seekers/me/education** → `201`
```json
{ "institution": "Gujarat Technological University", "degree": "B.E.", "fieldOfStudy": "Computer Engineering", "startDate": "2018-08-01", "endDate": "2022-05-31", "grade": "8.4 CGPA" }
```
```json
{ "success": true, "message": "education entry added", "data": { "entry": { "_id": "66f9b0…", "institution": "Gujarat Technological University", "degree": "B.E." } } }
```
`PUT /me/education/:id` accepts a partial body and returns the updated `entry`; `DELETE` returns `200` with `data: null`; unknown id → `404`.

**Experience** body: `{ "company", "title", "location?", "startDate", "endDate?", "isCurrent?", "description?" }`.
**Projects** body: `{ "title", "description?", "url?", "skills?": [], "startDate?", "endDate?" }`.

### Recruiter

**GET /api/recruiters/me** → profile with populated `company`.
**PUT /api/recruiters/me** `{ "name?", "phone?", "designation?", "bio?" }`.
**PUT /api/recruiters/me/company** – creates the company on first call (`name` required), updates afterwards.
```json
{ "name": "TechNova Solutions", "website": "https://technova.example.com", "industry": "Technology", "size": "51-200", "description": "…", "location": "Bengaluru, India" }
```
`200` → `{ "data": { "company": { "_id": "...", "name": "TechNova Solutions", … } } }`

### Tags

**GET /api/tags?appliesOn=skill&q=node&page=1&limit=50** → `200`
```json
{ "success": true, "message": "Tags fetched",
  "data": { "items": [{ "_id": "...", "name": "Node.js", "slug": "node.js", "appliesOn": "skill" }],
            "pagination": { "page": 1, "limit": 50, "total": 1, "pages": 1 } } }
```
**POST /api/tags** (recruiter) `{ "name": "GraphQL", "appliesOn": "skill" }` → `201`; duplicate → `409 Tag already exists`.

### Jobs

**GET /api/jobs** – only `open` jobs. Query: `q`, `jobType`, `workMode`, `location`, `skills` (comma list), `minSalary`, `maxSalary` (range overlap), `sort` (`newest|oldest|salary_desc|salary_asc`), `page`, `limit` (≤ 50).
```
GET /api/jobs?workMode=remote&skills=Node.js,React&minSalary=50000&page=1&limit=10
```
```json
{ "success": true, "message": "Jobs fetched",
  "data": { "items": [ {
      "_id": "66f9a2d0e4b0a1b2c3d4e600", "title": "Backend Developer (Node.js)", "description": "…",
      "jobType": "full_time", "workMode": "hybrid", "location": "Bengaluru, India",
      "requiredSkills": ["Node.js", "TypeScript", "MongoDB", "Express"],
      "salaryMin": 60000, "salaryMax": 100000, "status": "open",
      "recruiter": { "_id": "...", "name": "Rita Recruiter" },
      "company": { "_id": "...", "name": "TechNova Solutions", "location": "Bengaluru, India" } } ],
    "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1 } } }
```
**GET /api/jobs/:id** → `200 { data: { job } }`. Non-open jobs return `404` unless the caller is the owning recruiter.

**POST /api/jobs** (recruiter)
```json
{ "title": "Backend Engineer", "description": "Build and maintain REST APIs using Node.js and MongoDB.", "jobType": "full_time",
  "workMode": "remote", "location": "Remote (India)", "requiredSkills": ["Node.js", "TypeScript"],
  "salaryMin": 60000, "salaryMax": 100000, "status": "open" }
```
`201 { data: { job } }`. `salaryMin > salaryMax` → `400`. Salaries are plain numbers (annual, currency-agnostic).

**PUT /api/jobs/:id** – partial update, owner only (`403` otherwise). **DELETE /api/jobs/:id** – owner only; **also deletes that job's applications**.
**GET /api/jobs/recruiter/mine?status=open&page=1** – the recruiter's own jobs (any status) with `applicationsCount`.

### Resumes

**POST /api/resumes** – `multipart/form-data`: file field **`resume`** (+ optional text field `isDefault=true`).
```bash
curl -X POST $BASE/api/resumes -H "Authorization: Bearer $TOKEN" -F "resume=@resume.pdf" -F "isDefault=true"
```
`201`
```json
{ "success": true, "message": "Resume uploaded successfully",
  "data": { "resume": { "_id": "66f9c1…", "user": "…", "originalName": "resume.pdf", "mimeType": "application/pdf", "size": 184320,
                        "isDefault": true, "downloadUrl": "/api/resumes/66f9c1…/file" } } }
```
Errors: `400` wrong type / missing file / content doesn't match extension / more than 5 resumes, `413` over 5 MB.

**GET /api/resumes** → `{ data: { resumes: [...] } }` (default first). **PATCH /api/resumes/:id/default** → `{ data: { resume } }`.
**DELETE /api/resumes/:id** → `200`; `409` if the resume is attached to a non-withdrawn application. Deleting the default promotes the newest remaining one.
**GET /api/resumes/:id/file** – streams the file to the owner, or to a recruiter who received an application using it.

### Applications

**POST /api/applications** (job seeker) – the applicant comes from the JWT.
```json
{ "jobId": "66f9a2d0e4b0a1b2c3d4e600", "resumeId": "66f9c1…", "coverLetter": "I would love to join your team." }
```
`201`
```json
{ "success": true, "message": "Application submitted successfully",
  "data": { "application": { "_id": "66f9d1…", "job": { "_id": "…", "title": "Backend Developer (Node.js)", "company": { "name": "TechNova Solutions" } },
            "applicant": "66f9a1…", "resume": "66f9c1…", "status": "applied", "coverLetter": "…" } } }
```
Errors: `404` job/resume not found (resume must belong to you), `400` job not open, `409` already applied. Applying again after a withdrawal re-activates the application (`200`).

**GET /api/applications/me?status=&page=&limit=** → `{ data: { items: [...], pagination } }` (own applications only).
**GET /api/applications/job/:jobId** (recruiter, owner of the job) → applications with `applicant { name, email }` and `resume { originalName, mimeType, size, downloadUrl }`.
**PATCH /api/applications/:id/status** (recruiter, owner of the job)
```json
{ "status": "shortlisted", "note": "Strong backend profile" }
```
`200 { data: { application } }`; withdrawn applications → `409`.
**PATCH /api/applications/:id/withdraw** (applicant) → `200`; `409` if already withdrawn, rejected or hired.

## Resume storage

- Multer buffers the upload in memory, then `src/modules/resume/resume.storage.ts` persists it. Dev files go to `uploads/resumes/`.
- The `StorageProvider` interface (`save`, `remove`, `read`) is the only place that knows about the filesystem. To move to S3/Cloudinary, implement it and change the exported `resumeStorage` – no other file changes.
- Validation: extension + MIME type (Multer) and file signature (magic bytes); max 5 MB; max 5 resumes per user.
- The database stores an opaque storage key; the API exposes only `downloadUrl`, which is access-controlled.
- **Render's free tier has an ephemeral filesystem**: uploaded files are lost on redeploy/restart (DB records remain, downloads then return `404`). Use a Render Persistent Disk mounted at `/opt/render/project/src/uploads` or a cloud provider for anything beyond review/demo.

## Deployment on Render

1. Push the repo to GitHub (never commit `.env`).
2. Atlas → Network Access → allow `0.0.0.0/0` (Render free tier has no fixed IP).
3. Render → **New → Blueprint** (uses `render.yaml`) **or** **New → Web Service** with:
   - Build command: `npm install --include=dev && npm run build`
   - Start command: `npm start`
   - Health check path: `/health`
4. Set environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY=15m`, `JWT_REFRESH_EXPIRY=7d`, `BCRYPT_SALT_ROUNDS=12`, `CORS_ORIGIN` (optional). `PORT` is provided by Render.
5. Deploy and open `https://<service>.onrender.com/health`.
6. Seed production once from your machine with `MONGO_URI` pointing at the Atlas DB: `npm run seed` (or `npm run seed:prod` in the Render Shell).

## Postman

Import `job-portal.postman_collection.json` (repo root; identical copy in `postman/`). Variables: `baseUrl` (default `http://localhost:5000`; set to the live URL to test production), `accessToken`, `refreshToken`, `jobId`, `resumeId`, `applicationId`, plus profile-entry ids. Login requests store the tokens automatically; log in as a job seeker or recruiter depending on the folder you are running.

Suggested flow: **Login (recruiter)** → Create job → **Login (job seeker)** → Upload resume → Apply → **Login (recruiter)** → Applications for a job → Update status.

## Testing checklist

- [ ] `GET /health` → 200, `database: connected`
- [ ] Register both roles; duplicate email → 409; weak password → 400
- [ ] Login, refresh (old refresh token then fails with 401), logout
- [ ] Job seeker calling a recruiter route → 403; no token → 401
- [ ] Profile update; add / update / delete education, experience, project
- [ ] Recruiter profile + company upsert
- [ ] Create tag; duplicate → 409; `GET /api/tags?appliesOn=skill`
- [ ] Create / update / delete job; another recruiter's job → 403; `salaryMin > salaryMax` → 400
- [ ] Job filters and pagination; closed job hidden from `GET /api/jobs` and `GET /api/jobs/:id`
- [ ] Upload PDF ✔; `.txt`/`.png` → 400; > 5 MB → 413; renamed non-PDF → 400
- [ ] Apply; duplicate → 409; someone else's `resumeId` → 404; closed job → 400
- [ ] Recruiter lists applications for own job only; updates status; downloads resume
- [ ] Withdraw → re-apply reactivates; withdrawn application can't get a status update
- [ ] Deleting a resume used by an active application → 409

## Security notes

bcrypt password hashing; refresh tokens hashed at rest, rotated and reuse-detected; access tokens verified on every private route; role checks via `authorize()`; ownership checks in services; Zod validation on all input (unknown body fields are stripped, so `applicant`/`recruiter` can never be supplied by the client); helmet enabled; internal error details are never returned. Consider adding rate limiting (e.g. `express-rate-limit`) on `/api/auth/*` for a public deployment.
