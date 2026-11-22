# Smart Recruitment & Applicant Tracking System (ATS)

> An enterprise HR Tech / SaaS platform that centralizes the recruitment lifecycle: job posting, candidate self-service application, private resume parsing and streaming, row-locked multi-stage hiring pipeline, interview scheduling with conflict detection, evaluator scorecards, template offer issuance, and immutable audit telemetry.

[![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

---

## 1. Key Enterprise Features

* **Atomic 6-Stage Hiring Pipeline:** Governed transitions (`Applied` &rarr; `Screening` &rarr; `Interview` &rarr; `Selected` &rarr; `Offered` &rarr; `Rejected`) with PostgreSQL row-level concurrency locking (`SELECT ... FOR UPDATE`) preventing state-machine desynchronization.
* **Role-Based Access Control (RBAC):** Native multi-tenant isolation enforced via Firebase Authentication and JWT Custom Claims across three dedicated roles: `ADMIN`, `HR`, and `CANDIDATE`.
* **Zero-Trust Resume Storage Engine:** Direct disk storage with cryptographic SHA-256 integrity hashing, UUID filename obfuscation, magic-byte MIME validation, and ownership-verified private download streams.
* **Synchronized Interview Operations:** Multi-round panel scheduling with automated time collision detection, calendar synchronization, and structured scorecard rubric evaluation.
* **Cryptographic Offer Lifecycle:** Dynamic HTML offer letter generation with compensation tokens, SHA-256 snapshot archival, and auditable digital candidate acceptance loops.
* **Unified Audit Telemetry:** Real-time event bus capturing all stage transitions, administrative actions, and interview modifications with immutable database persistence.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios (with automatic JWT injection) |
| **Backend** | Node.js, Express, TypeScript, Zod schema validation, Helmet security headers, CORS protection |
| **Database** | PostgreSQL 14+ (12 relational tables, foreign key cascades, row locks, automatic update triggers) |
| **Identity & Auth** | Firebase Authentication & Firebase Local Auth Emulator (`localhost:9099`) with Custom Claims |
| **Object Storage** | Private filesystem storage with magic-byte verification, SHA-256 checksums, and 5 MB upload quotas |
| **Testing** | Jest + Supertest (API unit and RBAC integration tests), Playwright (E2E browser journeys) |
| **DevOps & CI/CD** | Docker, Docker Compose (`postgres` + `firebase-emulator`), GitHub Actions automated workflows |

---

## 3. Project Architecture & 5-Member Team Structure

This platform is structured around a **25-Floor Execution Model**, optimized for a collaborative **5-member engineering team** where each member maintains an isolated branch and contributes verified, tested deliverables:

| Role | Responsibility Domain | Branch | Daily Block | Total Commits |
| :--- | :--- | :--- | :--- | :--- |
| **Leader & DevOps Engineer** | Monorepo governance, Docker Compose, CI gates, test harnesses, release gating | `devops` / `main` | **Block D** (Floor Seal) | 25 Commits |
| **Cloud Engineer** | Firebase Auth & Emulator (port 9099), Custom Claims, DB parameters, private storage, SMTP config | `cloud` | **Block A** (Contract Lead) | 25 Commits |
| **Backend Developer** | 12-table PostgreSQL DDL, Express TypeScript APIs, JWT/RBAC middleware, stage machine, analytics | `backend` | **Block B** (API Logic) | 25 Commits |
| **Frontend Developer 1** | Responsive layouts, UI design tokens, navigation, dashboard screens, forms, and modals | `frontend-1` | **Block C1** (UI / Views) | 25 Commits |
| **Frontend Developer 2** | State management, Firebase Web SDK, Axios interceptors, API hooks, client-side validation | `frontend-2` | **Block C2** (State & Auth) | 25 Commits |

### Active Branches
1. `main`: The stable, integrated production branch.
2. `devops`: DevOps and container infrastructure.
3. `cloud`: Cloud infrastructure, authentication emulators, and storage services.
4. `backend`: REST API routes, controllers, middleware, and database services.
5. `frontend-1`: Primary UI components, view templates, and layout styling.
6. `frontend-2`: State management, authentication hooks, and API integration.
7. `frontend`: Consolidated frontend integration branch.

---

## 4. Repository Structure

```text
.
├── .github/workflows/          # GitHub Actions CI pipelines (lint, test, build, release)
├── backend/                    # Express + TypeScript REST API server
│   ├── src/
│   │   ├── config/             # DB pool, Firebase Admin, storage configuration
│   │   ├── controllers/        # Route controllers (Auth, Jobs, Applications, etc.)
│   │   ├── middleware/         # RBAC, JWT validation, error handling, file upload
│   │   ├── routes/             # Express API route declarations
│   │   └── services/           # Business logic, state machine, offer generation
│   └── tests/                  # Jest unit & integration test suites
├── frontend/                   # React + Vite + TypeScript Single Page Application
│   └── src/
│       ├── components/         # Reusable design primitives, layout, modals, navigation
│       ├── context/            # AuthContext, ToastContext, global state
│       ├── hooks/              # Custom React hooks (useAuth, useApplications, etc.)
│       ├── pages/              # Role-specific views (Candidate, HR, Admin, Public)
│       └── services/           # Axios API client services
├── database/
│   ├── migrations/             # 15 incremental PostgreSQL DDL migration scripts
│   └── seed/                   # Synthetic enterprise demo dataset and seed runner
├── docs/                       # Architectural specifications and daily checklists
├── scripts/                    # Automation scripts (Git branch sync, DB migrations)
├── uploads/                    # Private resume storage root (git-ignored)
├── .env.example                # Zero-secret environment template
├── .gitignore                  # Monorepo git exclusion rules
└── README.md                   # Repository documentation
```

---

## 5. Quick Start & Local Setup

### Prerequisites
* **Node.js** >= 18.x
* **npm** >= 9.x
* **PostgreSQL** >= 14 (running on `localhost:5432`)
* **Git** >= 2.40

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_ORGANIZATION_OR_USER>/<REPO_NAME>.git
cd smart-recruitment-applicant-tracking-system
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Ensure your database credentials in `.env` match your local PostgreSQL instance:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=ats_db
PORT=5000
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
Install dependencies for both backend and frontend workspaces:
```bash
# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### 4. Initialize Database & Seed Demo Accounts
Run the migration and synthetic seed runner to populate the database with sample requisitions, applicants, and staff accounts:
```bash
npm --prefix backend run seed
```

### 5. Launch the Development Stack
Run the backend and frontend servers in separate terminal sessions:

```bash
# Terminal 1: Start Backend API (runs on http://localhost:5000)
npm --prefix backend run dev

# Terminal 2: Start Frontend Application (runs on http://localhost:5173)
npm --prefix frontend run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Pre-Configured Demo Accounts

For seamless local evaluation, the seed script provisions three pre-configured accounts:

| Role | Email | Password | Access Domain |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@ats.local` | `AdminPassword123!` | `/admin` (User management, company settings, system audit telemetry) |
| **HR / Recruiter** | `hr@ats.local` | `HrPassword123!` | `/hr` (Requisitions, Kanban pipeline, interview schedules, offers, analytics) |
| **Candidate** | `candidate@ats.local` | `CandidatePassword123!` | `/candidate` (Self-service profile, resume upload, live application tracking) |

---

## 7. Verification & Automated Testing

The repository includes a comprehensive automated test suite spanning unit, RBAC integration, and build validation:

```bash
# Run all backend unit & integration test suites (548 tests / 48 suites)
npm --prefix backend test

# Run frontend TypeScript type checking and production build
npm --prefix frontend run build

# Run monorepo full verification suite
npm test
```

---

## 8. Synchronizing Branches Across the Team

To initialize or synchronize all 7 team branches to your remote repository, use the included automation script:

```powershell
.\scripts\setup-git-branches.ps1 -RemoteUrl "https://github.com/<YOUR_ORGANIZATION_OR_USER>/<REPO_NAME>.git"
```

---

## 9. Architecture & Documentation Guides

* [Team Workflow & Branching Strategy](docs/TEAM_WORKFLOW_AND_BRANCHING.md)
* [25-Day Engineering Checklist](docs/DAILY_COMMIT_CHECKLIST_25_DAYS.md)
* [API Specification & Endpoints](docs/api-spec.md)
* [Candidate Pipeline Stage Transitions](docs/status-transitions.md)
* [Private Resume Storage Architecture](docs/storage-architecture.md)
* [Database Configuration & Pooling](docs/database-config.md)
* [Caching & CORS Policy](docs/caching-and-cors-policy.md)

---

## 10. License

This project is licensed under the [ISC License](LICENSE).
