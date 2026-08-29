# AI Mock Interviewer — Enterprise Distributed Platform

An intelligent, distributed mock interview platform that ingests candidate resumes, converts multi-format documents, extracts text via OCR, and generates tailored technical interview questions with real-time AI scoring.

---

## Key Platform Features

- Instant & Automated Document Processing: Supports .pdf, .docx, .doc, .png, and .jpg resumes. Multi-page documents are converted via MuPDF WASM & Sharp, then OCR-extracted via Tesseract.
- Adaptive AI Interviewer: Leverages Google Gemini (gemini-3.5-flash-lite) to dynamically generate targeted behavioral and technical questions, evaluate candidate answers with expected key points, and assign granular scores.
- Enterprise Security & Multi-Tenancy:
  - Pure Username + Password authentication (email optional).
  - Passwords hashed with bcrypt (10 rounds).
  - Dual JWT mechanism with 1-hour access_token and 7-day refresh_token stored in HttpOnly SameSite=Lax cookies.
  - Instant session revocation across all devices using tokenVersion increments.
  - Complete data isolation per candidate userId across interviews, metrics, and resume storage.
- Real-Time Queue & Pipeline Monitoring: Built-in Bull-Board UI (/admin/queues) to inspect BullMQ jobs, retry failures, and monitor pipeline progress.
- 100% Alpine Dockerized Stack: Production-ready multi-stage Alpine containers orchestrated with docker-compose.yml and service-scoped .env files.

---

## System Architecture

```mermaid
flowchart TB
    Candidate([Candidate Web Browser])
    
    subgraph Frontend Layer [Frontend — Port 5173 : 80]
        Nginx[Nginx Alpine Web Server]
        SPA[React 19 SPA / Vite App]
        Nginx --> SPA
    end

    subgraph Gateway Layer [Backend Gateway — Port 5000]
        NestAPI[NestJS API Gateway]
        AuthMod[Auth & JWT Cookie Manager]
        PrismaORM[Prisma Client ORM]
        QueueProd[BullMQ Job Producer]
        BullBoard[Bull-Board Dashboard :5000/admin/queues]
        AiGen[Google Gemini AI Engine]
    end

    subgraph Storage & Cache
        Postgres[(Neon Cloud PostgreSQL)]
        Redis[(Redis 7 Alpine :6379)]
        Mongo[(MongoDB 7.0 :27017)]
        LocalVol[(Volume: Session JSON & Files)]
    end

    subgraph Microservices Layer
        Worker[BullMQ Pipeline Worker]
        ImageProc[Image Processing Service :3000<br/>MuPDF WASM + Sharp]
        OCRService[OCR Service :3001<br/>Tesseract.js Engine]
    end

    Candidate -->|HTTP/HTTPS Credentials: include| Nginx
    Nginx -->|Proxy /api/ or direct| NestAPI
    
    NestAPI --> AuthMod
    NestAPI --> PrismaORM --> Postgres
    NestAPI --> LocalVol
    NestAPI --> QueueProd --> Redis
    
    Redis --> Worker
    Worker -->|x-internal-secret| ImageProc
    Worker -->|x-internal-secret| OCRService
    ImageProc --> Mongo
    OCRService --> Mongo
    Worker --> AiGen
    Worker --> LocalVol
    Worker --> PrismaORM
```

---

## Pipeline and Data Flow

### Resume Ingestion & Question Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant FE as Frontend (React)
    participant BE as Backend Gateway (NestJS)
    participant Q as Redis / BullMQ
    participant IP as Image Processing (:3000)
    participant OCR as OCR Service (:3001)
    participant AI as Google Gemini AI
    participant DB as PostgreSQL / Session JSON

    User->>FE: Upload Resume (.pdf, .docx, .png)
    FE->>BE: POST /api/interviews/sessions/upload (Multipart)
    BE->>DB: Create Session Record (Status: PENDING)
    BE->>Q: Enqueue Pipeline Job (JOB_PROCESS_RESUME)
    BE-->>FE: Return sessionId & Polling Status
    
    critical BullMQ Pipeline Execution
        Q->>IP: Convert Document to PNG Images (MuPDF WASM)
        IP-->>Q: Page Images Buffer & Dimensions
        Q->>OCR: Extract Raw Text from Images (Tesseract)
        OCR-->>Q: Structured OCR Text & Confidence
        Q->>AI: Generate Technical Questions (Google Gemini)
        AI-->>Q: Structured JSON Questions & Rubrics
        Q->>DB: Update Session (Status: READY, Save Questions)
    end

    FE->>BE: Poll GET /api/interviews/sessions/:id/status
    BE-->>FE: Status READY (5 questions prepared)
    FE->>User: Launch Fullscreen Interview Room
```

---

## Technology Stack & Infrastructure

| Layer / Service | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| Frontend | React, Vite | React 19, Vite 8 | Single Page Application with Dark Modern Glassmorphism UI |
| Styling | Vanilla CSS | CSS3 Custom Properties | High-performance CSS design system (no bulky CSS frameworks) |
| Icons & SFX | Lucide React, Web Audio | Lucide 1.34 | Modern vector icons and audio interaction feedback |
| API Gateway | NestJS | 11.0 | Fast, modular TypeScript backend orchestration framework |
| Database ORM | Prisma | 6.4 | Type-safe PostgreSQL database client & schema migrations |
| Relational DB | PostgreSQL | Neon Serverless | Stores Users, Interview Sessions, Scores, and Metadata |
| Async Queues | BullMQ & Redis | BullMQ 5.41, Redis 7 | Distributed job execution and resume conversion pipeline |
| Queue UI | Bull-Board | 6.7 | Web-based queue dashboard mounted at /admin/queues |
| Image Processing | Express, MuPDF, Sharp | Node 20 Alpine | Converts PDF, DOCX, DOC to high-res PNG images |
| OCR Service | Express, Tesseract.js | Node 20 Alpine | Text extraction and image character recognition |
| Document Store | MongoDB | 7.0 | Raw OCR metadata and converted document cache |
| AI Evaluation | Google Gemini SDK | gemini-3.5-flash-lite | Adaptive question generation & candidate answer scoring |
| Authentication | JWT, Passport, Bcrypt | Bcrypt 6.0, Passport | HttpOnly cookie-based authentication with token revocation |
| Containers | Docker & Docker Compose | Compose v2 | Multi-stage Alpine Linux containerization across all services |

---

## Repository Structure

```
mock-interviewer/
├── backend/                         # NestJS API Gateway & BullMQ Orchestrator
│   ├── prisma/
│   │   └── schema.prisma            # PostgreSQL Schema (Users & InterviewSessions)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/                  # Google Gemini AI Generator & Evaluator
│   │   │   ├── auth/                # JWT Auth, Bcrypt, HttpOnly Cookies, Guards
│   │   │   ├── interview/           # Sessions, Resumes Vault, Answer Submissions
│   │   │   ├── microservices/       # Downstream ImageProc & OCR HTTP Clients
│   │   │   ├── queue/               # BullMQ Consumer, Resume Pipeline Worker
│   │   │   └── session-storage/     # Session JSON Document Manager
│   │   └── main.ts                  # NestJS Bootstrap (CORS, CookieParser, Swagger)
│   ├── Dockerfile                   # Multi-stage Node 20 Alpine Dockerfile
│   └── .env                         # Backend Configuration
│
├── frontend/                        # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── app/                     # Router & App Root
│   │   ├── modules/
│   │   │   ├── auth/                # Login & Register Pages (Username-only)
│   │   │   ├── dashboard/           # Summary Metrics, Performance Progression
│   │   │   ├── interview-history/   # History Table, Result Scorecard, Accordions
│   │   │   ├── interview-room/      # Chat Transcript, Timer, Microphone, Answer UI
│   │   │   ├── new-interview/       # Wizard (Upload, Config, Pipeline Progress)
│   │   │   ├── profile/             # Candidate Profile, JWT Token Inspector
│   │   │   └── resumes/             # Resume Vault & Document Management
│   │   └── shared/                  # UI Components (Buttons, Modals, Badges, Inputs)
│   ├── nginx.conf                   # Nginx Alpine SPA Routing & Proxy Configuration
│   ├── Dockerfile                   # Multi-stage Node 20 Alpine + Nginx Dockerfile
│   └── .env                         # Frontend Configuration (VITE_BACKEND_URL)
│
├── image-processing/                # Microservice: MuPDF WASM + Sharp Document Converter
│   ├── src/                         # Express Server, Routes, Conversion Logic
│   ├── Dockerfile                   # Node 20 Alpine Dockerfile
│   └── .env                         # Image Processing Configuration
│
├── ocr/                             # Microservice: Tesseract.js OCR Text Extractor
│   ├── src/                         # Express Server, Tesseract Worker, Model Loader
│   ├── eng.traineddata              # Offline Tesseract OCR English Training Data
│   ├── Dockerfile                   # Node 20 Alpine Dockerfile
│   └── .env                         # OCR Configuration
│
├── docker-compose.yml               # Complete 6-Service Stack Orchestration
└── README.md                        # Platform Documentation
```

---

## Environment Variables

Each service loads its own individual environment file (.env):

### 1. backend/.env
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
IMAGE_PROCESSING_URL=http://localhost:3000
OCR_SERVICE_URL=http://localhost:3001
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899
```

### 2. image-processing/.env
```ini
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mock-interviewer
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899
JWT_SECRET=your_jwt_secret
```

### 3. ocr/.env
```ini
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mock-interviewer
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899
JWT_SECRET=your_jwt_secret
```

### 4. frontend/.env
```ini
VITE_BACKEND_URL=http://localhost:5000
```

---

## Quick Start

### Method A: Run Everything with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/vermavikku/mock-interviewer.git
   cd mock-interviewer
   ```

2. Build and launch all 6 services with a single command:
   ```bash
   docker compose up -d --build
   ```

3. Verify running containers and health checks:
   ```bash
   docker compose ps
   ```

4. Open your browser:
   - Frontend Application: http://localhost:5173
   - Swagger API Docs: http://localhost:5000/api/docs
   - BullMQ Dashboard: http://localhost:5000/admin/queues

---

### Method B: Local Development Setup

#### Prerequisites
- Node.js >= 20.0.0
- Redis server running on localhost:6379
- MongoDB running on localhost:27017

#### 1. Start Image Processing Microservice
```bash
cd image-processing
npm install
npm run dev
# Running on http://localhost:3000
```

#### 2. Start OCR Microservice
```bash
cd ocr
npm install
npm run dev
# Running on http://localhost:3001
```

#### 3. Start Backend Gateway
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
# Running on http://localhost:5000
```

#### 4. Start Frontend SPA
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## API Gateway Endpoints

### Authentication & Profile (/api/auth)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | /api/auth/register | Register new candidate with bcrypt password | No |
| POST | /api/auth/login | Login & set HttpOnly cookies (access_token, refresh_token) | No |
| POST | /api/auth/refresh-token | Auto-refresh 1-hour access token via 7-day refresh cookie | No |
| POST | /api/auth/logout | Revoke session, increment tokenVersion, clear cookies | Yes |
| GET | /api/auth/profile | Get logged-in candidate profile and interview stats | Yes |
| PUT | /api/auth/profile | Update profile information (name, role, bio, avatar) | Yes |
| PUT | /api/auth/change-password | Update password & invalidate active sessions | Yes |

### Interview Sessions & Resumes (/api/interviews)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| POST | /api/interviews/sessions/upload | Upload resume & trigger BullMQ pipeline | Yes |
| POST | /api/interviews/sessions/reuse | Create session reusing an existing resume | Yes |
| POST | /api/interviews/sessions/sample | Create instant session with sample engineer profile | Yes |
| GET | /api/interviews/sessions | List all interviews belonging to current user | Yes |
| GET | /api/interviews/sessions/:id | Get session details & full JSON document | Yes |
| GET | /api/interviews/sessions/:id/status | Poll pipeline progress & logs | Yes |
| POST | /api/interviews/sessions/:id/submit-answer | Submit answer & get real-time AI evaluation | Yes |
| POST | /api/interviews/sessions/:id/complete | Finalize session & compute total score | Yes |
| DELETE | /api/interviews/sessions/:id | Delete interview session & stored files | Yes |
| GET | /api/interviews/resumes | List candidate's Resume Vault documents | Yes |
| GET | /api/interviews/resumes/:id/file | Preview / download original uploaded resume file | Yes |

---

## Security & Service-to-Service Protection

- Candidate to Gateway: Protected by dual JWT in HttpOnly, SameSite=Lax cookies. JwtAuthGuard checks payload.tokenVersion === dbUser.tokenVersion on every request.
- Gateway to Downstream Microservices: All inter-service HTTP requests (Backend to Image Processing, Backend to OCR) require x-internal-secret: process.env.INTERNAL_SERVICE_SECRET. Unauthorized external requests are rejected with 403 Forbidden.

---

## License
This project is licensed under the MIT License.
