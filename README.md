# CampusVault

> **"Your College. Everything You Need. One Search."**

CampusVault is a production-ready full-stack academic resource and discovery platform engineered for college students. It solves academic fragmentation by organizing legally shareable Previous Year Question Papers (PYQs), Mid-Sem and End-Sem papers, curated lecture notes, question banks, case studies, assignments, and lab manuals into an intuitive, high-speed single-search experience.

---

## Key Highlights & Core Business Rules

- **Zero Student-Facing Download Policy**: Per institutional and retention design guidelines, students discover and read academic PDFs directly inside the authenticated CampusVault internal viewer. Direct cloud/storage URLs (S3, Cloudflare R2, Cloudinary, raw disk paths) and public `/download/:id` endpoints are strictly concealed from student clients.
- **Backend-Controlled PDF Streaming**: `/api/resources/:id/stream` validates session credentials, tracks real unique views, updates trending scores, and pipes PDF bytes directly to the canvas-based viewer.
- **Dynamic Search Abstraction**: Text and compound index search provider implemented with a modular `SearchService` interface, returning results categorized into:
  - `QUESTION PAPERS`
  - `NOTES`
  - `IMPORTANT QUESTIONS`
  - `CASE STUDIES`
- **Exam Mode Frequency Engine**: Real historical topic frequency analysis calculated from archived university question papers (with clear disclaimers: *"Based on indexed CampusVault resources from 2024–2025"*).
- **Student Contribution System**: Logged-in students can upload academic material with their college, course, branch, academic year, and current semester automatically locked from their profile. Submissions enter **Pending Review** and require Admin approval before publication.
- **Content Rights & Moderation**: Integrated copyright concern reporting workflow with admin takedown, unpublishing, archival actions, and audit logging.
- **Modern SaaS Admin Console**: Full administrative oversight over academic hierarchy (Colleges, Courses, Branches, Semesters, Subjects, Modules), pending approvals, user roles, material requests, and usage analytics.

---

## Tech Stack

- **Frontend**:
  - React 18, Vite
  - Tailwind CSS (Brand colors: Primary `#6366F1`, Secondary `#8B5CF6` & `#06B6D4`)
  - React Router v6
  - Lucide React icons
  - Canvas Confetti
  - PDF.js canvas rendering engine (`pdfjs-dist`)
  - Theme Engine (☀ Light / 🌙 Dark / ⚙ System mode with persistent storage)
- **Backend**:
  - Node.js & Express.js REST API
  - MongoDB & Mongoose
  - JWT in HTTP-only cookies (`cv_token`) and Authorization Bearer fallback
  - BCrypt password hashing
  - Helmet & CORS security middleware
  - Express Rate Limiting
  - Multer with `%PDF-` file signature (magic bytes) validation
  - PDFKit for automated sample document generation
- **Storage**:
  - `StorageService` abstraction supporting Local File Store, AWS S3, Cloudflare R2, and Cloudinary.

---

## Quick Start & Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/campusvault`) or MongoDB Atlas URI.

### 2. Install Dependencies
```bash
# In root:
npm install

# In server:
cd server && npm install

# In client:
cd client && npm install
```

### 3. Seed Database & Generate Sample Academic PDFs
Run the seeder to populate realistic colleges, courses, subjects (DBMS, Computer Networks, Operating Systems, Discrete Mathematics), realistic multi-page PDFs, and demo accounts:
```bash
cd server
npm run seed
```

### 4. Run Automated Backend Verification Suite
Verify all 10 core API endpoints (Auth, Hierarchy, Subject, Exam Mode, Search, PDF Stream, Bookmarks, Admin):
```bash
node server/test-api.js
```

### 5. Start Development Servers
From the root directory:
```bash
# Starts both Backend (port 5000) and Frontend (port 5173) concurrently:
npm run dev
```
Or run individually:
- **Backend**: `cd server && npm run dev` (Runs at `http://localhost:5000`)
- **Frontend**: `cd client && npm run dev` (Runs at `http://localhost:5173`)

---

## Demo Credentials

| Role | Email | Password | Context |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusvault.edu` | `Admin@12345` | SuperAdmin with full access to `/admin` |
| **Student / Contributor** | `rahul.kumar@cgu-odisha.ac.in` | `Student@12345` | Rahul Kumar, C.V. Raman Global Univ, B.Tech CSE, Sem 3 |
| **Student** | `priya.sharma@cgu-odisha.ac.in` | `Student@12345` | Priya Sharma, C.V. Raman Global Univ, B.Tech CSE, Sem 3 |

*Quick 1-click demo buttons are also provided directly on the Login page (`/login`).*

---

## Key URLs & Routes

### Student & Public Web Experience
- `/`: Modern landing page with large search bar, interactive dashboard preview cards, popular subjects, and trending feed.
- `/dashboard`: Personalized student dashboard ("Good evening, Rahul 👋", semester subjects, continue studying).
- `/search`: Global search with compound filters (College, Semester, Material Type, Exam Type, Year) and grouped results.
- `/subjects/dbms`: Subject hub with tabs (`Overview`, `PYQs`, `Notes`, `Question Bank`, `Case Studies`, `Assignments`, `Lab`).
- `/subjects/dbms/pyqs`: Dedicated PYQ explorer grouped by examination year and test type.
- `/subjects/dbms/exam-mode`: High-yield revision dashboard showing calculated topic frequency percentages and exam countdown.
- `/resources/:slug/view`: Secure in-app PDF viewer with page navigation, zoom, fullscreen, bookmark, and study completion tracking (NO download button).
- `/saved`: Bookmarked materials.
- `/progress`: Visual study completion meters per subject.
- `/contribute`: Student PDF contribution with auto-prefilled academic profile context and validation.
- `/my-contributions`: Status history for submissions (`Pending Review`, `Approved`, `Rejected` with reason).
- `/request`: Community missing material request board.

### Administrative Console
- `/admin`: Overview metrics (total resources, total document views, pending approvals, users, material requests).
- `/admin/approvals`: 1-click Approve or Reject student submissions with custom moderator feedback.
- `/admin/resources`: Catalog management, publish/unpublish, archive, and administrative backup download.
- `/admin/hierarchy`: Management of Colleges, Courses, Branches, Semesters, Subjects, and Modules.
- `/admin/requests`: Student material requests ranked by demand count.
- `/admin/reports`: Copyright takedown and resolution workflow with audit trail.
- `/admin/users`: User management and role promotion.

---

## Security Architecture

1. **Authentication & Session**: Secure JWT stored in HTTP-only cookies with CSRF-safe `sameSite` policy; Authorization header fallback supported for mobile/headless clients.
2. **Password Security**: Passwords hashed with BCrypt (10 salt rounds), never returned in user payloads (`select: false`).
3. **MIME & Magic Bytes Verification**: Uploaded files must match genuine PDF binary header signature (`%PDF-` / `0x25 0x50 0x44 0x46`). Executable binaries and malicious payloads are rejected.
4. **Rate Limiting**: Tiered limiters for authentication attempts, contribution submissions, and general API calls.
5. **Role-Based Access Control**: Strict backend route guards (`STUDENT`, `CONTRIBUTOR`, `ADMIN`).
