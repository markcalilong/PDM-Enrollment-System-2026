# PDM Enrollment System 2026

A web-based school enrollment, fee management, and public-facing website built for PDM (Philippine educational institution). Handles the full student lifecycle from admission through enrollment, assessment, payment, and grade posting — plus a public website for prospective students.

---

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| **Frontend**   | React 19, TypeScript, Vite 6, Tailwind CSS 3, React Router 7, React Hook Form 7, React Icons (Heroicons) |
| **Typography** | Google Fonts — Inter (body, `font-sans`) + Poppins (headings, `font-display`) |
| **Backend**    | Node.js, Express 4, Knex 3 (query builder)                                |
| **Database**   | PostgreSQL — local in dev, **Neon** (managed, SSL) in production           |
| **Auth**       | JWT (jsonwebtoken), bcrypt                                                 |
| **Security**   | Helmet, CORS, express-rate-limit                                           |
| **Validation** | Joi (server-side)                                                          |
| **File Upload**| Multer (memory storage) → **Cloudinary** (logo, banner, slides, announcements, officials) |
| **Hosting**    | **Render** — two services: `pdm-enrollment-api` (Express Web Service) + `pdm-enrollment-web` (static SPA) |
| **Shared**     | `shared/types/index.ts` — TypeScript interfaces shared between client and server |

---

## Architecture

- **Monorepo** with `client/`, `server/`, `shared/`, and `migrations/` at root
- **Database migrations** via Knex (33 migration files)
- **RESTful API** at `/api` with grouped routes: `/auth`, `/maintenance`, `/transactions`, `/institution`, `/users`, `/landing` (public + admin)
- **Public website** at `/` with detail pages for programs and announcements
- **Reusable UI components**: `Button`, `Input`, `Modal`, `DataTable`, `PageHeader`, `SearchSelect`, `Sidebar`
- **Generic CRUD pattern**: `createBaseModel()` + `createCrudController()` + `useCrud()` hook for standard maintenance pages
- **Collapsible sidebar** with grouped navigation, dashboard layout with top navbar
- **Theming**: Institution primary/secondary colors via CSS custom properties — all UI (including the landing eyebrow labels, accent bars, buttons, auth panel, and CTA band) uses the dynamic `primary-*` tokens, never hardcoded colors
- **Auth screen**: premium split-screen `AuthLayout` — gradient brand panel with trust points (≥ lg) + form card; collapses to a compact centered card on mobile
- **Shared UI signatures**: reusable `.eyebrow` section-label pill, `SectionHeading` (eyebrow + accent divider) on the landing page, `Button` hover-lift, `PageHeader` accent bar

### Project Structure

```
PDM Enrollment System 2026/
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/          # Button, Input, Modal, DataTable, PageHeader, SearchSelect
│       │   ├── Sidebar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── PaymentReceipt.tsx
│       ├── hooks/           # useAuth, useCrud, useTheme
│       ├── layouts/         # AuthLayout, DashboardLayout
│       ├── pages/
│       │   ├── maintenance/ # All maintenance CRUD pages
│       │   ├── transactions/# Admission, Advising, Assessment, Payment, Sectioning
│       │   ├── LandingPage.tsx
│       │   ├── CourseDetailPage.tsx
│       │   └── AnnouncementDetailPage.tsx
│       └── services/        # api.ts, authService.ts, maintenanceService.ts
├── server/
│   └── src/
│       ├── config/          # database.js, env.js
│       ├── controllers/     # auth, crud, admission, advising, assessment, etc.
│       ├── middleware/       # auth, validate, errorHandler
│       ├── models/          # All database models
│       ├── routes/          # auth, maintenance, transaction, institution, user, landingPage routes
│       └── services/        # authService.js
├── shared/
│   └── types/index.ts       # Shared TypeScript interfaces
├── migrations/              # Knex migration files
├── knexfile.js
└── .env.example
```

---

## Modules & Status

### Maintenance (All Functional)

| Module                   | Description                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **School Years**         | CRUD + activate/deactivate                                                                   |
| **Semesters**            | CRUD + activate (1st Sem, 2nd Sem, Summer)                                                   |
| **Courses**              | CRUD (code, description, duration, vision, mission)                                          |
| **Subjects**             | CRUD + prerequisite mapping + lab type assignment                                            |
| **Curricula**            | CRUD + per-year/semester subject assignment with elective flag                                |
| **Sections**             | CRUD (course + year level + semester + school year + section letter + capacity)               |
| **Rooms**                | CRUD (code, name, capacity)                                                                  |
| **Admission Requirements** | CRUD (checklist items for student admission)                                              |
| **Miscellaneous Fees**   | CRUD with applicability rules: all students, new students only, course-specific, lab-specific (per-subject multiplier), year-level |
| **Tuition Rates**        | Rate per unit per school year + installment down-payment percentages for 2/3/4-payment plans  |
| **Rating Transmutations**| Grade score-to-transmuted-grade mapping                                                      |
| **Class Schedules**      | Full-width timetable grid per section. Filters: SY → Semester → Course → Section. Lecture/Laboratory type per entry. 3-way conflict detection (room, section, instructor). Subjects filtered by section's curriculum |

### Transactions

| Module                     | Status        | Description                                                                                                     |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| **Admission**              | ✅ Done       | Multi-step student registration (personal info, address, family, education, requirements checklist)              |
| **Advising**               | ✅ Done       | Select student + semester → auto-load curriculum subjects → check/uncheck → approve. List + detail view         |
| **Assessment**             | ✅ Done       | Compute fees from advising record. Add/remove misc fees. Installment plans: Full, 2-pay, 3-pay, 4-pay, Flexible |
| **Payment**                | ✅ Done       | Two tabs: Assessment Payment (installment-aware, auto-updates status assessed→partial→paid, payment history with printable receipt) and Other Payment (non-assessment: ID replacement, fines, clearance). Printable receipt component with institution header, student info, balance summary |
| **Sectioning**             | ✅ Done       | Three tabs: **Pending Sectioning** (students with assessed/paid/partial status, filters: course/year level/semester/SY/payment status, assign to section with capacity & schedule preview), **Enrolled** (manage enrolled students — change section, reassign individual subjects to other sections, add subjects from ANY section for irregular/back subjects, remove subjects, unenroll), **Class List** (browse sections with course/semester/SY filters, view student roster per section or per subject via dropdown, printable for professor distribution) |
| **Grade Posting**          | 🔲 Placeholder | Post and manage student grades                                                                                 |
| **Subject Crediting**      | 🔲 Placeholder | Credit previously taken subjects                                                                               |
| **Enrollment Withdrawal**  | 🔲 Placeholder | Process enrollment withdrawals                                                                                 |

### Inquiry

| Module       | Status        |
| ------------ | ------------- |
| **Students** | 🔲 Placeholder |

### Reports (All Placeholder)

- Certificate of Registration
- Transcript of Records
- Grade Reports
- Scholastic Record
- List of Enrolled Students
- Curriculum

### Public Website

| Module                     | Status        | Description                                                                                                     |
| -------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| **Landing Page**           | ✅ Done       | Public page at `/` — **Hero banner** (institution banner image, else animated gradient; always the top hero), **Campus Showcase** carousel ("What we have to offer" — driven by Hero Slides, showcases facilities/events, placed below the hero), "Why Choose Us" highlights, Vision & Mission, announcements with cover images, course offerings grid, **FAQ accordion** (admin-managed), and a closing **CTA band**. Section headings use eyebrow labels + accent dividers. Theme colors applied via `applyThemeToDOM()`. School name comes entirely from Institution Settings (no hardcoded "College") |
| **Course Detail Page**     | ✅ Done       | `/programs/:id` — Hero banner with course info, "About This Program" section, course-level vision & mission, institution-level vision & mission, full curriculum table (collapsible by year, grouped by semester, shows subject code/name/lec/lab/total units/elective tags), sticky sidebar with "Apply Now" button |
| **Announcement Detail Page** | ✅ Done     | `/announcements/:id` — Full-width cover image hero, category & pinned badges, formatted date, full content with whitespace-pre-line, back link to landing page |

### Utilities (Admin — Landing Page Content Management)

| Module                 | Status        | Description                                                        |
| ---------------------- | ------------- | ------------------------------------------------------------------ |
| **Institution Settings** | ✅ Done     | Name, acronym, logo upload, banner upload, primary/secondary color theming, vision & mission statements |
| **Hero Slides**        | ✅ Done       | Manage the **Campus Showcase** carousel slides (title, subtitle, image, button text/link, sort order). Note: slides feed the showcase section, not the top hero |
| **Announcements**      | ✅ Done       | CRUD with FormData-based cover image upload, category, pinned flag, publish date |
| **Highlights**         | ✅ Done       | "Why Choose Us" items — title, description, icon, sort order       |
| **FAQs**               | ✅ Done       | Admin-managed landing page FAQs — question, answer, sort order, active toggle. Follows the standard CRUD pattern (`faqModel` + `createCrudController`) |
| **Course Offerings**   | ✅ Done       | Link courses to landing page — long description, degree type, duration, featured flag |
| **User Maintenance**   | 🔲 Placeholder | Manage system users and access                                   |
| **Audit Trail**        | 🔲 Placeholder | System activity logs                                             |
| **Backup & Restore**   | 🔲 Placeholder | Database backup and restore                                      |

---

## Database Tables

Created via Knex migration files in `migrations/` (33 migrations):

| Table                    | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `institution_settings`   | School name, acronym, logo_path, banner_path, colors, vision, mission |
| `users`                  | System users with roles (admin, registrar, staff, student) |
| `school_years`           | Academic years with active flag                      |
| `semesters`              | Semester periods with active flag                    |
| `courses`                | Degree programs (code, description, duration, vision, mission) |
| `subjects`               | Subject catalog with lec/lab units and lab type      |
| `subject_prerequisites`  | Subject prerequisite relationships                   |
| `lab_types`              | Reference table for laboratory types                 |
| `admission_requirements` | Checklist items for student admission                |
| `miscellaneous_fees`     | Fee items with applicability and frequency rules     |
| `rating_transmutations`  | Score-to-grade conversion table                      |
| `rooms`                  | Classrooms and labs with capacity                    |
| `curricula`              | Curriculum definitions per course                    |
| `curriculum_subjects`    | Subjects assigned to curriculum by year/semester     |
| `sections`               | Class sections per course/year/semester              |
| `students`               | Student records (personal, address, family, education) |
| `student_requirements`   | Submitted admission requirements per student         |
| `student_education`      | Educational background per student                   |
| `advising`               | Advising header (student + SY + semester + status)   |
| `advising_subjects`      | Subjects selected during advising                    |
| `tuition_rates`          | Rate per unit + installment DP% per school year      |
| `assessments`            | Assessment header with totals + payment plan + installments |
| `assessment_items`       | Itemized fee breakdown (tuition + miscellaneous)     |
| `payments`               | Payment records: assessment or other type, installment index, amount, method (cash/check/bank_transfer/money_order), OR number, remarks |
| `class_schedules`        | Section-subject-room-instructor schedule: day_of_week, start_time, end_time, schedule_type (lecture/laboratory) |
| `enrollments`            | Enrollment header: student → section for a term. Unique on (student_id, school_year_id, semester_id). Status: enrolled |
| `enrollment_subjects`    | Per-subject section tracking: enrollment_id, subject_id, section_id. Allows irregular students to take subjects from different sections. CASCADE on enrollment_id |
| `hero_slides`            | Landing page carousel: title, subtitle, image_path, button_text, button_link, sort_order, is_active |
| `announcements`          | News/events: title, content, category, is_pinned, image_path, published_at, is_active |
| `highlights`             | "Why Choose Us" items: title, description, icon, sort_order, is_active |
| `faqs`                   | Landing page FAQs: question, answer, sort_order, is_active |
| `course_offerings`       | Programs on landing page: course_id, description_long, duration, degree_type, sort_order, is_featured, is_active |

---

## Enrollment Flow

```
Admission → Advising (pick subjects) → Assessment (compute fees) → Payment (optional) → Sectioning (assign section) → Enrolled
```

- Students can be sectioned even without payment — assessed status is enough
- Sectioning auto-populates enrollment_subjects from advised subjects
- Irregular students can add subjects from any section (any course/year level) for back subjects
- Individual subjects can be reassigned to different sections
- Class list is per-subject within a section, designed for professor distribution

---

## Key Business Logic

### Assessment Fee Engine (`server/src/models/assessmentModel.js`)

The `computeAssessment()` function:

1. Loads advised subjects from the advising record
2. Computes total lecture + lab units
3. Calculates **tuition fee** = total units × rate per unit
4. Applies each active **miscellaneous fee** based on rules:
   - `all` — applies to every student
   - `new_students` — only when student status is "admitted"
   - `course_specific` — matches student's course
   - `lab_specific` — matches subject lab type; if `frequency = "per_subject"`, multiplied by number of matching subjects
   - `year_level` — matches student's current year level
5. Returns **installment config** (down-payment percentages) from tuition rate

### Installment Plans

| Plan                      | How It Works                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------- |
| **Full Payment**          | Pay entire assessment at once                                                         |
| **Option A (2 Payments)** | 1st = all misc fees + X% of tuition; 2nd = remaining tuition                         |
| **Option B (3 Payments)** | 1st = all misc fees + X% of tuition; 2nd & 3rd = remaining tuition split equally     |
| **Option C (4 Payments)** | 1st = all misc fees + X% of tuition; 2nd, 3rd, 4th = remaining tuition split equally |
| **Option D (Flexible)**   | Custom payment amounts — user defines each payment; must total the assessment         |

Down-payment percentages (X%) are configurable per school year in the Tuition Rates maintenance page.

---

## Public Website Routes

| Route                  | Page                     | Description                                    |
| ---------------------- | ------------------------ | ---------------------------------------------- |
| `/`                    | Landing Page             | Hero, announcements, highlights, course offerings |
| `/programs/:id`        | Course Detail Page       | Full program info, curriculum, vision/mission  |
| `/announcements/:id`   | Announcement Detail Page | Cover image, full content, category badges     |
| `/login`               | Login                    | Admin/staff login                              |
| `/register`            | Register                 | User registration                              |

## API Routes

| Route Group            | Auth     | Description                                    |
| ---------------------- | -------- | ---------------------------------------------- |
| `/api/auth/*`          | Public   | Login, register                                |
| `/api/landing/*`       | Public   | Landing page data (slides, announcements, highlights, faqs, course offerings, detail endpoints) |
| `/api/landing/admin/*` | Required | CRUD for landing page content (FormData for images) |
| `/api/maintenance/*`   | Required | All maintenance CRUD endpoints                 |
| `/api/transactions/*`  | Required | Admission, advising, assessment, payment, sectioning |
| `/api/institution/*`   | Required | Institution settings, logo upload, banner upload |
| `/api/users/*`         | Required | User management                                |

## Admin Sidebar Structure

- **Maintenance:** School Years, Semesters, Courses, Subjects, Admission Req., Misc Fees, Tuition Rates, Rating Transmutations, Rooms, Curricula, Sections, Class Schedules
- **Transactions:** Admission, Advising, Assessment, Payment, Sectioning, Grade Posting*, Subject Crediting*, Enrollment Withdrawal*
- **Inquiry:** Students*
- **Reports:** COR*, TOR*, Grade Reports*, Scholastic Record*, Enrolled Students*, Curriculum*
- **Utilities:** User Maintenance*, Audit Trail*, Backup & Restore*, Hero Slides, Announcements, Highlights, FAQs, Course Offerings, Institution Settings

(*) = placeholder/ComingSoonPage

---

## Deployment (Production)

Live on **Render** with **Neon** Postgres and **Cloudinary** images (set up July 7, 2026).

| Piece | Value |
| ----- | ----- |
| Frontend (static SPA) | `pdm-enrollment-web` → https://pdm-enrollment-web.onrender.com |
| Backend (API only) | `pdm-enrollment-api` → https://pdm-enrollment-api.onrender.com |
| Database | Neon Postgres (`neondb`, ap-southeast-1) |
| Images | Cloudinary (folders `pdm/institution|slides|announcements|officials`) |
| Config | `render.yaml` blueprint (two services); deploys from GitHub `master` |

**Env vars** — API: `NODE_ENV=production`, `DATABASE_URL` (Neon pooled, `?sslmode=require`), `CLOUDINARY_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` (web URL for CORS). Web: `VITE_API_URL` (bare API origin — **baked at build time**, rebuild web after changing).

**Key connection points**
- Frontend API base is centralized in `client/src/services/apiBase.ts` (`API_BASE` from `VITE_API_URL`). Dev leaves it unset → `/api` via Vite proxy. **Never hardcode `/api`** in client code.
- DB switches to `DATABASE_URL` + SSL when set; `searchPath: ["public"]` is pinned in `knexfile.js` + `database.js` (Neon can leave the default search_path empty).
- `env.js` prints a masked env monitor on boot and refuses to start in production if `DATABASE_URL`/`JWT_SECRET` are missing/default.
- **Do NOT run `npm run seed` on Render** — seeds `.del()` first and wipe data. The build runs migrations only.

## Running the System

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
npx knex migrate:latest

# Start development servers
cd server && node src/server.js    # Backend on http://localhost:3000
cd client && npm run dev           # Frontend on http://localhost:5173
```

### Accounts (default dev passwords `<role>123`)

| Email | Role | Password |
| ----- | ---- | -------- |
| `superadmin@pdm.edu` | super_admin | superadmin123 |
| `admin@pdm.edu` | admin | admin123 |
| `cashier@pdm.edu` | cashier | cashier123 |
| `registrar@pdm.edu` | registrar | registrar123 |

- Roles allowed: `admin`, `registrar`, `staff`, `student`, `super_admin`, `cashier` (migration `20260707000001`). `super_admin`/`cashier` are **stored roles only — no special permissions wired yet** (RBAC deferred). The register API's Joi validator still only allows `student/staff/registrar/admin`.

### Important Notes

- Server entry point is `node src/server.js` (NOT `src/index.js`)
- Server must be restarted after backend code changes
- PostgreSQL returns decimal/numeric columns as strings — always use `Number()` for arithmetic
- API responses must use format `{ success: true, data: ... }` — frontend `api.get()` reads `res.data`
- Students table uses `sex` column (not `gender`)
- **File uploads go to Cloudinary** (multer `memoryStorage` → `server/src/config/cloudinary.js`); the returned `secure_url` is stored in the existing `image_path`/`logo_path`/`banner_path` columns and rendered directly by the frontend. Old assets are best-effort deleted via `destroyByUrl()` on replace/delete
- **Frontend API base is centralized** in `client/src/services/apiBase.ts` — never hardcode `/api`; production URL comes from `VITE_API_URL` (baked at build time)
- Landing page is themeable — `applyThemeToDOM()` maps the institution primary color to `--color-primary-*`; never hardcode brand colors in landing/UI components

---

## Development Milestones

### Phase 1 — Core System (June 3–5, 2026)
- Project scaffolding (React + Express + PostgreSQL + Knex)
- Auth system (JWT, login, register, protected routes)
- All 12 maintenance modules (School Years through Class Schedules)
- Institution Settings with logo upload and theming

### Phase 2 — Transaction Modules (June 4–9, 2026)
- Admission (multi-step student registration)
- Advising (curriculum-based subject selection)
- Assessment (auto-computed fees, installment plans)
- Payment (assessment + other payments, printable receipts)
- Sectioning (section assignment, enrolled management, class lists)

### Phase 3 — Public Website / Landing Page (July 1–2, 2026)
- Landing page with hero section, announcements, highlights, course offerings
- Hero redesign (animated gradient fallback, banner upload support)
- Institution Settings: banner upload, vision & mission
- Course detail page (`/programs/:id`) with curriculum, vision/mission
- Announcement detail page (`/announcements/:id`) with cover images
- Announcement admin with image upload (FormData-based)
- Course vision/mission fields
- Sidebar reorganization (landing page admin moved from Maintenance to Utilities)

### Phase 4 — UI Overhaul & Content Flexibility (July 3, 2026)
- Global UI overhaul inspired by a modern clinic-style reference site: Inter + Poppins font pairing, refined `Button` (hover-lift) and `PageHeader` (accent bar), reusable `.eyebrow` labels and `SectionHeading` on the landing page
- Premium split-screen `AuthLayout` (gradient brand panel + trust points; compact card on mobile)
- Landing page: added FAQ accordion and closing CTA band
- **FAQ management module** (Utilities → FAQs) — new `faqs` table (migration `20260703000001`), `faqModel`, public + admin CRUD, admin page; landing FAQs now DB-driven (were static)
- **Hero vs. Campus Showcase split** — hero slides no longer replace the banner; the banner (or gradient) is always the top hero, and slides render in a dedicated "What we have to offer" showcase carousel below it
- Removed hardcoded "PDM College" fallbacks so the school name is fully driven by Institution Settings (actual name: "Pambayang Dalubhasaan ng Marilao")
- Seeded appropriate royalty-free showcase images into `uploads/slides/`

### Phase 5 — Production Deployment (July 7, 2026)
- **Neon** Postgres (SSL via `DATABASE_URL`, `searchPath` pinned to `public`); migrated all local data → Neon via full `pg_dump`/`psql` restore
- **Cloudinary** for all image uploads (multer memory storage → `secure_url` in existing columns)
- **Render** two-service deploy: Express API (`pdm-enrollment-api`) + static SPA (`pdm-enrollment-web`), wired by `VITE_API_URL`/`CLIENT_URL`; `render.yaml` blueprint
- Centralized client API base (`apiBase.ts`) — fixed public pages that hardcoded `/api` and broke on the static host
- Env monitor in `env.js` (masked startup report, prod fail-fast); staff role accounts (super_admin, admin, cashier, registrar) via migration `20260707000001`
- Hero banner trimmed so CTA buttons sit above the fold

### Pending — Future Phases
- **RBAC** — wire real permissions for `super_admin`/`cashier` (currently stored roles only); extend register-API validator
- Grade Posting, Subject Crediting, Enrollment Withdrawal
- Student Inquiry
- Reports (COR, TOR, Grade Reports, Scholastic Record, Enrolled Students, Curriculum)
- User Maintenance, Audit Trail, Backup & Restore
