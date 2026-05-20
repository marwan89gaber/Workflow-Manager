# WorkFlow Manager — Enterprise Task & Project Management Platform

> A production-grade, full-stack web application for managing teams, projects, tasks, and internal communication. Built with a RESTful Node.js/Express API, MySQL relational database, and a vanilla JavaScript SPA frontend — structured and documented to enterprise standards.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Business Problem](#2-business-problem)
3. [Project Objectives](#3-project-objectives)
4. [Database Documentation](#4-database-documentation)
5. [System Architecture](#5-system-architecture)
6. [Technologies Used](#6-technologies-used)
7. [Data & Backend Pipeline](#7-data--backend-pipeline)
8. [API Development & Endpoints](#8-api-development--endpoints)
9. [Frontend Dashboard & Visualization](#9-frontend-dashboard--visualization)
10. [Role-Based Access Control](#10-role-based-access-control)
11. [Real-Time Features](#11-real-time-features)
12. [Challenges Faced](#12-challenges-faced)
13. [Optimization & Improvements](#13-optimization--improvements)
14. [Results & Business Impact](#14-results--business-impact)
15. [Setup Guide](#15-setup-guide)
16. [Folder Structure](#16-folder-structure)
17. [Screenshots & Demo](#17-screenshots--demo)
18. [Lessons Learned](#18-lessons-learned)
19. [Future Work](#19-future-work)
20. [Resume Bullet Points](#20-resume-bullet-points)

---

## 1. Project Summary

**WorkFlow Manager** is an enterprise-scale task and project management platform designed to streamline team collaboration, task tracking, and internal communication for organizations of any size.

The system targets three user roles — **Admins**, **Managers**, and **Employees** — each with tailored permissions and views. Managers can create projects, assign tasks, generate reports, and post company-wide announcements. Employees can track their workload via a Kanban board, collaborate through threaded comments and direct messaging, and upload attachments to tasks. Admins oversee the entire organization.

The backend is a fully normalized **MySQL** relational database with 13 tables, stored procedures, triggers, and views — exposed through a secure **RESTful Express.js API** with JWT authentication. The frontend is a responsive single-page application (SPA) built with vanilla JavaScript, organized around reusable component patterns.

**Key capabilities:**
- Role-based access control (Admin / Manager / Employee)
- Project lifecycle management with progress tracking
- Kanban task board with drag-and-drop status updates
- Real-time messaging (direct & project group chat)
- Automated notifications via database triggers
- File attachments per task
- Reports & analytics for managers
- Company news & announcements feed

---

## 2. Business Problem

Modern teams working across departments suffer from fragmented tooling: tasks tracked in spreadsheets, communication scattered across email threads, and project status visible only to managers. This creates:

- **Visibility gaps** — employees don't know project priorities or deadlines
- **Communication overhead** — status update meetings replace automated tracking
- **Accountability issues** — no audit trail for task changes or decisions
- **Onboarding friction** — no central place to find project assignments or team members

**Stakeholders affected:** Project managers, team leads, individual contributors, and executive leadership.

**Business impact:** Without a centralized system, teams lose an estimated 20–30% of productive hours to coordination overhead. Late task delivery cascades into missed deadlines and budget overruns on client projects.

WorkFlow Manager addresses these directly by centralizing task ownership, automating notifications, maintaining a full audit trail (`task_history`), and giving each role exactly the information they need.

---

## 3. Project Objectives

### Technical Goals
- Build a fully normalized relational database with referential integrity, triggers, and stored procedures
- Implement a RESTful API with JWT-based authentication and role-based route authorization
- Develop a responsive SPA frontend without a framework, demonstrating vanilla JS architecture skills
- Implement real-time polling for messages and notifications
- Support file upload/download for task attachments

### Business Goals
- Enable managers to track project completion rates at a glance
- Give employees a single source of truth for their assigned work
- Reduce status-update meetings by making task progress self-serve
- Provide an audit trail for every task state change
- Support direct and group messaging within project context

---

## 4. Database Documentation

### Source
Fully synthetic, purpose-built relational dataset. Seed data generated to represent a realistic mid-size technology company with multiple departments and concurrent projects.

### Scale (Seed Data)
| Entity | Count |
|---|---|
| Users | 16 (2 admins, 3 managers, 11 employees) |
| Projects | 8 |
| Tasks | 55 |
| Comments | 40+ |
| Messages | 10+ |
| Notifications | Auto-generated via triggers |
| Work News | 4 |
| Files | 10 |

### Schema Overview (13 Tables)

| Table | Purpose |
|---|---|
| `users` | Core user accounts with role, department, status |
| `projects` | Project metadata, dates, priority, budget |
| `project_members` | Many-to-many: users ↔ projects |
| `tasks` | Task definitions with status, priority, hours |
| `comments` | Threaded comments on tasks |
| `files` | File attachments per task |
| `conversations` | Direct and group chat containers |
| `conversation_participants` | Many-to-many: users ↔ conversations |
| `messages` | Individual chat messages |
| `notifications` | Per-user event notifications |
| `work_news` | Company announcements |
| `reports` | Generated report metadata + JSON payload |
| `task_history` | Full audit log of task field changes |

### Automation (Triggers & Procedures)
- `after_project_insert` — auto-creates a group chat for every new project
- `after_project_member_insert` — auto-adds new members to the project chat
- `after_task_insert` — sends a notification to the assigned user
- `after_task_update` — logs every status/priority/assignment change to `task_history`
- `after_comment_insert` — notifies the task assignee on new comments
- `generate_user_id` — stored procedure that creates deterministic, role-prefixed IDs (e.g. `ebj001`, `mas001`)

### Views
- `dashboard_stats` — per-user task counts by status + active project count
- `project_progress` — per-project completion percentage and team size

### Data Quality
- All foreign keys enforced at the database level with `ON DELETE CASCADE / SET NULL / RESTRICT` as appropriate
- Passwords stored as bcrypt hashes (10 rounds) — never plaintext
- Timestamps auto-managed by `DEFAULT CURRENT_TIMESTAMP` and `ON UPDATE`

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  index.html → pages/*.html                                      │
│  js/config.js │ js/auth.js │ js/api.js │ js/utils.js            │
│  js/components.js  (layout, sidebar, navbar, badges)            │
│  js/dashboard.js │ tasks.js │ projects.js │ chat.js │ ...       │
│  css/global.css + page-specific stylesheets                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST (JWT Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXPRESS.JS API SERVER (Node.js)                │
│                                                                 │
│  server/app.js  ──►  routes/*.js  ──►  controllers/*.js         │
│                                                                 │
│  Middleware:                                                    │
│    auth.js       (JWT verify + role guard)                      │
│    validation.js (express-validator request schemas)            │
│    upload.js     (multer file handling)                         │
│                                                                 │
│  DbService.js    (centralized MySQL query layer)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ mysql2 connection pool
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MySQL DATABASE                              │
│                                                                 │
│  13 Tables │ 5 Triggers │ 1 Stored Procedure │ 2 Views          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User authenticates → API returns signed JWT
2. Frontend stores JWT in `localStorage`, attaches as `Authorization: Bearer` header on every request
3. `auth.authenticateToken` middleware decodes the JWT and attaches `req.user`
4. `auth.authorizeRole(...)` guards manager/admin-only routes
5. Controllers call `DbService` methods → parameterized MySQL queries
6. Database triggers fire asynchronously (notifications, history, group chats)
7. Frontend polls `/notifications/unread-count` and `/messages/unread-count` every 30s/10s

---

## 6. Technologies Used

### Languages
| Language | Usage |
|---|---|
| JavaScript (Node.js) | Backend API server |
| JavaScript (Vanilla) | Frontend SPA |
| SQL | Database schema, triggers, procedures, views |
| HTML5 / CSS3 | Frontend markup and styling |

### Backend & API
| Technology | Version | Role |
|---|---|---|
| Node.js | ≥18 | Runtime |
| Express.js | ^5.2 | HTTP framework |
| mysql2 | ^3.15 | Database driver |
| bcrypt | ^6.0 | Password hashing |
| jsonwebtoken | ^9.0 | JWT auth tokens |
| multer | ^2.0 | File upload middleware |
| express-validator | ^7.3 | Request validation |
| dotenv | ^17 | Environment config |
| cors | ^2.8 | Cross-origin support |
| nodemon | ^3.1 | Dev auto-reload |

### Database
| Technology | Role |
|---|---|
| MySQL 8+ | Primary relational store |
| InnoDB | Storage engine (ACID compliance) |

### Frontend
| Technology | Role |
|---|---|
| Vanilla JS (ES6+) | SPA logic, DOM manipulation |
| CSS custom properties | Design system / theming |
| Fetch API | HTTP requests to backend |
| Drag & Drop API | Kanban board interactions |

---

## 7. Data & Backend Pipeline

### Authentication Flow
```
POST /api/users/login
  → Validate email + password (express-validator)
  → getUserByEmail() → bcrypt.compare()
  → Sign JWT (24h expiry, HS256)
  → Return { token, user }
```

### Request Lifecycle
```
Request
  → CORS middleware
  → JSON body parser
  → Route match (Express router)
  → auth.authenticateToken (verify JWT)
  → auth.authorizeRole(...) [if restricted]
  → validation.validate*() + handleValidationErrors
  → Controller method
  → DbService.query() (parameterized)
  → MySQL (+ trigger side-effects)
  → JSON response
```

### File Upload Pipeline
```
POST /api/files/task/:taskId
  → multer.single('file')
    → MIME type whitelist check
    → 5 MB size limit
    → Save to server/uploads/ with UUID filename
  → FileController.uploadFile
  → dbService.insertNewFile()
```

### Notification Pipeline (Trigger-driven)
```
INSERT INTO tasks (assigned_to = userId)
  → MySQL trigger: after_task_insert
  → INSERT INTO notifications (user_id, notification_type, message)
Frontend polls GET /api/notifications/unread-count every 30s
  → Badge updates in navbar
```

---

## 8. API Development & Endpoints

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | Public | Register new user |
| POST | `/users/login` | Public | Login, receive JWT |
| GET | `/users` | Any | List all users |
| GET | `/users/:id` | Any | Get user by ID |
| PUT | `/users/:id` | Any | Update profile |
| DELETE | `/users/:id` | Admin/Manager | Delete user |
| GET | `/users/:id/dashboard` | Any | Dashboard stats |
| PUT | `/users/:id/password` | Any | Change password |
| PUT | `/users/:id/status` | Admin/Manager | Update status |

### Projects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/projects` | Any | All projects |
| POST | `/projects` | Manager/Admin | Create project |
| GET | `/projects/:id` | Any | Project details |
| PUT | `/projects/:id` | Manager/Admin | Update project |
| DELETE | `/projects/:id` | Manager/Admin | Delete project |
| GET | `/projects/:id/members` | Any | List members |
| POST | `/projects/:id/members` | Manager/Admin | Add member |
| DELETE | `/projects/:id/members/:userId` | Manager/Admin | Remove member |
| GET | `/projects/:id/progress` | Any | Completion stats |
| PUT | `/projects/:id/status` | Manager/Admin | Update status |
| GET | `/projects/user/:userId` | Any | User's projects |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | Any | All tasks |
| POST | `/tasks` | Any | Create task |
| GET | `/tasks/:id` | Any | Task details |
| PUT | `/tasks/:id` | Any | Update task |
| DELETE | `/tasks/:id` | Manager/Admin | Delete task |
| PUT | `/tasks/:id/status` | Any | Change status |
| PUT | `/tasks/:id/assign` | Manager/Admin | Reassign task |
| PUT | `/tasks/:id/priority` | Manager/Admin | Change priority |
| GET | `/tasks/:id/history` | Any | Audit log |
| GET | `/tasks/project/:projectId` | Any | Tasks by project |
| GET | `/tasks/user/:userId` | Any | Tasks by user |
| GET | `/tasks/overdue` | Any | Overdue tasks |

### Comments, Files, Messages, Notifications, News, Reports
Full CRUD endpoints follow the same pattern. See `server/routes/` for complete definitions.

---

## 9. Frontend Dashboard & Visualization

### Pages & Features

| Page | File | Key Features |
|---|---|---|
| Login | `pages/login.html` | JWT auth, form validation, redirect |
| Register | `pages/register.html` | Role selection, client-side validation |
| Dashboard | `pages/dashboard.html` | Stats cards, recent tasks, news feed |
| Projects | `pages/projects.html` | Grid view, filters, create/edit/delete |
| Project Detail | `pages/project-detail.html` | Tabs: overview, tasks, members, chat |
| Tasks (List) | `pages/tasks.html` | Table view, filters, task detail modal |
| Task Board | `pages/task-board.html` | Kanban columns, drag-and-drop |
| Messages | `pages/chat.html` | Conversation list, real-time polling |
| Notifications | `pages/notifications.html` | Unread filter, mark-read, delete |
| Profile | `pages/profile.html` | Edit info, change password, stats |
| Reports | `pages/reports.html` | Team performance, project status, custom |

### Dashboard KPIs
- Total Tasks assigned to the logged-in user
- In-Progress task count
- Completed task count
- Active project count
- Recent tasks table (last 5)
- Pinned + recent news/announcements

### Kanban Board
Four status columns: **To Do → In Progress → In Review → Done**. Tasks are draggable between columns; dropping triggers a `PUT /tasks/:id/status` API call and re-renders the board.

---

## 10. Role-Based Access Control

| Feature | Employee | Manager | Admin |
|---|---|---|---|
| View all projects | ✅ (read-only if not member) | ✅ | ✅ |
| Create / edit projects | ❌ | ✅ | ✅ |
| Delete projects | ❌ | ✅ | ✅ |
| Add / remove project members | ❌ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Delete tasks | ❌ | ✅ | ✅ |
| Assign / reassign tasks | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |
| Post news/announcements | ❌ | ✅ | ✅ |
| Delete users | ❌ | ✅ | ✅ |
| View locked (non-member) projects | 🔒 locked | ✅ | ✅ |

Lock state is enforced both client-side (locked card UI) and server-side (JWT role checks on API routes).

---

## 11. Real-Time Features

WorkFlow Manager uses **short-poll** intervals to simulate near-real-time updates without WebSockets:

| Feature | Poll Interval | Endpoint |
|---|---|---|
| Notification badge | 30 seconds | `GET /notifications/unread-count` |
| Message badge | 10 seconds | `GET /messages/unread-count` |
| Chat messages | 10 seconds | `GET /messages/conversation/:id` |

This approach was chosen for simplicity and compatibility. The architecture is designed so that swapping polling for WebSocket/SSE in a future iteration requires only changes to `js/chat.js` and `js/components.js`.

---

## 12. Challenges Faced

### 1. Custom User ID Generation via Stored Procedure
**Challenge:** The schema required deterministic user IDs like `ebj001` (role prefix + name initials + counter) rather than auto-increment integers.  
**Root cause:** MySQL auto-increment doesn't support composite, conditional ID logic.  
**Solution:** Implemented a `generate_user_id` stored procedure called via `CALL` before each `INSERT INTO users`, with a loop to find the next available counter.

### 2. Trigger-Driven Side Effects in Node.js
**Challenge:** MySQL triggers (group chat creation, notification inserts) fire asynchronously and are invisible to the Node.js layer, making debugging difficult when something went wrong.  
**Solution:** Added structured `console.log` breadcrumbs in `dbService.js` during development and validated trigger behavior directly in MySQL Workbench before wiring up the API.

### 3. Frontend State Without a Framework
**Challenge:** Building a multi-page SPA with shared layout (sidebar, navbar, badge counts) in vanilla JS requires careful coordination — React-style component trees don't exist.  
**Solution:** Centralized layout injection in `Components.initLayout()`, which every page calls on load. Badge counts are fetched on every page render to stay in sync.

### 4. JWT Expiry & Session Management
**Challenge:** JWTs expiring mid-session caused confusing 403 errors without clear user feedback.  
**Solution:** Added a global `window.addEventListener('unauthorized', ...)` handler in `auth.js` that triggers `Auth.logout()` and redirects to login on any 401 response.

---

## 13. Optimization & Improvements

### Current Optimizations
- MySQL indexes on high-frequency lookup columns (`email`, `assigned_to`, `project_id`, `status`, `due_date`)
- Database views (`dashboard_stats`, `project_progress`) pre-compute aggregate queries
- Parameterized queries throughout `dbService.js` to prevent SQL injection
- Client-side filtering (search, status, priority) runs in-memory after a single `getAll` fetch, reducing API round-trips

### Planned Improvements
- Replace polling with **WebSockets** (Socket.io) for true real-time messaging
- Add **Redis caching** for dashboard stats and notification counts
- Implement **CI/CD pipeline** with GitHub Actions (lint → test → deploy)
- Add **Docker Compose** setup for one-command local environment
- Integrate **Swagger / OpenAPI** auto-generated documentation
- Add **Jest** unit tests for controllers and `dbService` methods
- Move to a **connection pool** (`mysql2/promise` with `createPool`) instead of a single persistent connection

---

## 14. Results & Business Impact

| Metric | Result |
|---|---|
| Database tables | 13 fully normalized tables |
| Automated triggers | 5 (notifications, history, group chats) |
| API endpoints | 50+ RESTful routes across 9 resource areas |
| Frontend pages | 11 fully functional pages |
| Role permission levels | 3 (Employee, Manager, Admin) |
| Seed data | 16 users, 8 projects, 55 tasks, 40+ comments |
| Password security | bcrypt (10 rounds) — OWASP compliant |
| Auth token lifetime | 24 hours (configurable via `JWT_SECRET`) |

**Business value delivered:**
- Single platform replacing email chains, spreadsheets, and separate chat tools
- Automatic task assignment notifications eliminate manual follow-up
- Audit trail (`task_history`) provides full accountability without extra process
- Manager reports provide instant visibility into team performance and project health
- Locked project cards prevent accidental access to confidential work

---

## 15. Setup Guide

### Prerequisites
- Node.js ≥ 18.x
- MySQL 8.x (running locally or via Docker)
- A MySQL client (Workbench, DBeaver, or CLI)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/workflow-manager.git
cd workflow-manager
```

### 2. Set Up the Database
Open `database/schema.sql` in your MySQL client and run the entire file. This will:
- Create the `task_manager_db` database
- Create all 13 tables with indexes and foreign keys
- Create stored procedures, triggers, and views
- Insert seed data (16 users, 8 projects, 55 tasks, etc.)

```bash
mysql -u root -p < database/schema.sql
```

> **Default password for all seed users:** `password123`

### 3. Configure the Server
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DATABASE=task_manager_db
JWT_SECRET=change-this-to-a-long-random-string
```

### 4. Install Dependencies & Start the API
```bash
cd server
npm install
npm start          # production
# or
npx nodemon app.js  # development (auto-reload)
```

The API will be available at `http://localhost:5000`.

### 5. Serve the Frontend
The frontend is plain HTML/CSS/JS — no build step required.

Open `index.html` directly in a browser, **or** serve it with any static file server:

```bash
# Option A: VS Code Live Server extension (recommended for development)
# Option B: Python simple server
python -m http.server 8080
# Then open http://localhost:8080
```

### 6. Login
Use any seed user credentials:

| Role | Email | Password |
|---|---|---|
| Admin | `john.doe@company.com` | `password123` |
| Manager | `alice.smith@company.com` | `password123` |
| Employee | `bob.johnson@company.com` | `password123` |

---

## 16. Folder Structure

```plaintext
workflow-manager/
│
├── client/                          # Frontend SPA
│   ├── css/
│   │   ├── global.css               # CSS variables, layout, components
│   │   ├── dashboard.css
│   │   ├── tasks.css
│   │   ├── projects.css
│   │   ├── chat.css
│   │   ├── notifications.css
│   │   ├── profile.css
│   │   ├── reports.css
│   │   └── auth.css
│   ├── js/
│   │   ├── config.js                # App-wide constants (API URL, keys, colors)
│   │   ├── auth.js                  # Token management, requireAuth, logout
│   │   ├── api.js                   # Centralized fetch wrapper + all API methods
│   │   ├── utils.js                 # Date formatting, toast, helpers
│   │   ├── components.js            # Sidebar, navbar, badges, shared UI
│   │   ├── dashboard.js
│   │   ├── projects.js
│   │   ├── project-detail.js
│   │   ├── tasks.js
│   │   ├── task-board.js
│   │   ├── task-detail.js
│   │   ├── chat.js
│   │   ├── notifications.js
│   │   ├── profile.js
│   │   └── reports.js
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── dashboard.html
│   │   ├── projects.html
│   │   ├── project-detail.html
│   │   ├── tasks.html
│   │   ├── task-board.html
│   │   ├── chat.html
│   │   ├── notifications.html
│   │   ├── profile.html
│   │   └── reports.html
│   └── index.html                   # Entry point (auth redirect)
│
├── server/                          # Backend API
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── commentController.js
│   │   ├── fileController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   ├── newsController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT verify + role authorization
│   │   ├── validation.js            # express-validator schemas
│   │   └── upload.js                # multer config
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── newsRoutes.js
│   │   └── reportRoutes.js
│   ├── uploads/                     # Runtime file storage (git-ignored)
│   ├── app.js                       # Express app entry point
│   ├── dbService.js                 # All MySQL query methods
│   ├── package.json
│   └── .env                         # (git-ignored — use .env.example)
│
├── database/
│   └── schema.sql                   # Full DB: tables, triggers, procedures, seed data
│
├── docs/
│   └── architecture.md              # System architecture notes (this README + diagrams)
│
├── screenshots/                     # UI screenshots for README / portfolio
│
├── .gitignore
└── README.md
```

---

## 17. Screenshots & Demo

> Add screenshots to the `screenshots/` folder and reference them here.

| View | Description |
|---|---|
| `screenshots/dashboard.png` | Stats cards + recent tasks + news feed |
| `screenshots/kanban.png` | Drag-and-drop task board |
| `screenshots/project-detail.png` | Project tabs: overview, tasks, members, chat |
| `screenshots/reports.png` | Manager reports page |
| `screenshots/login.png` | Authentication page |

---

## 18. Lessons Learned

**Database design matters early.** The 13-table schema with triggers, procedures, and views required careful planning before writing a single line of API code. Retrofitting referential integrity or trigger logic mid-project would have been far more expensive.

**Vanilla JS scales surprisingly well** when structured around clear modules (`config → auth → api → utils → components → page logic`). The dependency chain is explicit and debuggable — no magic.

**Triggers are powerful but opaque.** The automatic group chat creation and notification inserts saved dozens of API calls but required thorough testing in MySQL directly. Side effects that happen "behind" the ORM/query layer can be hard to trace.

**Role enforcement must be layered.** Client-side UI locks (greyed-out cards, hidden buttons) are for UX. Server-side `authorizeRole` middleware is for security. Both are required.

**Polling is a stepping stone.** Short-poll works for an MVP but doesn't scale. Real-time UX on a production system needs WebSockets or SSE.

---

## 19. Future Work

| Priority | Improvement |
|---|---|
| High | Replace polling with **Socket.io** WebSocket layer for messages and notifications |
| High | Add **Docker Compose** (`docker-compose.yml`) for one-command setup |
| High | **Jest** unit + integration tests for all controllers and dbService methods |
| Medium | **Swagger / OpenAPI** auto-generated API documentation |
| Medium | **Redis** caching for dashboard aggregates and notification counts |
| Medium | **GitHub Actions** CI/CD: lint → test → build → deploy |
| Medium | Migrate `dbService.js` to a proper **connection pool** (`mysql2 createPool`) |
| Low | **Kubernetes** Helm chart for cloud deployment |
| Low | **Grafana + Prometheus** monitoring for API latency and error rates |
| Low | **Explainable reporting**: chart.js visualizations in the Reports page |

---

## 20. Resume Bullet Points

- Architected and built a **full-stack task management platform** using Node.js/Express REST API, MySQL, and a vanilla JavaScript SPA — serving 3 user roles with 50+ API endpoints
- Designed a **13-table normalized MySQL schema** with stored procedures, triggers, and views to automate notifications, audit logging, and group chat provisioning
- Implemented **JWT-based authentication and role-based access control** (Admin/Manager/Employee) enforced at both the API middleware and client UI layers
- Built a **drag-and-drop Kanban board** using the native HTML5 Drag and Drop API, integrating real-time status updates via REST calls without a frontend framework
- Developed a **real-time messaging system** with direct and project group chat, supported by short-poll notification infrastructure and unread message badge tracking

---

## License

MIT — see `LICENSE` for details.

---

*Built as a portfolio demonstration of enterprise-grade full-stack web development and database engineering.*