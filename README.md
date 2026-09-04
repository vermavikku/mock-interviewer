# AI Mock Interviewer — Enterprise Distributed Platform

An intelligent, enterprise-grade distributed mock interview platform that ingests candidate resumes, converts multi-format documents, extracts text via OCR, and generates tailored technical and behavioral interview questions with sub-second real-time AI scoring.

---

## 📑 Table of Contents

- [Platform Overview & Highlights](#platform-overview--highlights)
- [System Architecture](#system-architecture)
  - [High-Level Architecture Diagram](#high-level-architecture-diagram)
  - [Layer Responsibilities](#layer-responsibilities)
  - [Network & Security Topology](#network--security-topology)
- [Technologies Used and Where](#technologies-used-and-where)
  - [Technology Matrix](#technology-matrix)
  - [Detailed Component Breakdown](#detailed-component-breakdown)
- [End-to-End Code Flows](#end-to-end-code-flows)
  - [1. Authentication & Dual-JWT Lifecycle](#1-authentication--dual-jwt-lifecycle)
  - [2. Resume Ingestion & AI Question Generation Pipeline](#2-resume-ingestion--ai-question-generation-pipeline)
  - [3. Live Interview Execution & Real-Time Scoring](#3-live-interview-execution--real-time-scoring)
  - [4. Resume Vault & Document Lifecycle](#4-resume-vault--document-lifecycle)
- [Repository Structure](#repository-structure)
- [Quick Start: Running with Docker (Recommended)](#quick-start-running-with-docker-recommended)
- [Quick Start: Running without Docker (Local Bare-Metal)](#quick-start-running-without-docker-local-bare-metal)
- [Environment Variables Configuration](#environment-variables-configuration)
- [API Gateway Endpoints](#api-gateway-endpoints)
- [Security & Inter-Service Protection](#security--inter-service-protection)
- [License](#license)

---

## 🌟 Platform Overview & Highlights

- **Multi-Format Document Ingestion**: Upload resumes in `.pdf`, `.docx`, `.doc`, `.png`, and `.jpg`. Documents are rendered to high-resolution PNGs via MuPDF WebAssembly and processed through high-accuracy Tesseract OCR.
- **Sub-3s Adaptive AI Engine**: Uses `gemini-2.5-flash-lite` for instantaneous question generation and real-time candidate answer evaluation against industry scoring rubrics.
- **Enterprise Multi-Tenancy & Dual-JWT Security**:
  - Secure credential authentication with bcrypt password hashing (10 salt rounds).
  - Dual JWT mechanism with short-lived `access_token` (1h) and long-lived `refresh_token` (7d) stored in secure `HttpOnly`, `SameSite=Lax` cookies.
  - Global session invalidation across all devices via database-backed `tokenVersion`.
  - Complete data isolation per candidate across sessions, scores, and resume files.
- **Distributed Async Pipeline**: BullMQ queue backed by Redis with a built-in visual monitoring dashboard (`/admin/queues`).
- **Resilient Resume Vault**: Candidates can reuse previously parsed resumes for new interviews without redundant OCR re-processing, or delete resumes with automatic file unlinking while preserving completed interview history.
- **100% Containerized 7-Service Stack**: Production-ready Alpine Linux containers orchestrated via `docker-compose.yml` with health checks and dedicated service networks.

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```mermaid
flowchart TB
    User([Candidate Browser])

    subgraph Presentation Layer [Presentation Layer — Port 5173 / 80]
        Nginx[Nginx Alpine Web Server]
        SPA[React 19 SPA / Vite App]
        Nginx --> SPA
    end

    subgraph Gateway Layer [API Gateway & Orchestrator — Port 5000]
        NestAPI[NestJS API Gateway]
        AuthMod[Auth & JWT Cookie Manager]
        PrismaORM[Prisma Client ORM]
        QueueProd[BullMQ Job Producer]
        BullBoard[Bull-Board Dashboard :5000/admin/queues]
        AiGen[AI Engine: gemini-2.5-flash-lite]
        SessionStore[Local Session JSON Store]
    end

    subgraph Microservices Layer [Microservices Layer]
        ImageProc[Image Processing Service :3000<br/>MuPDF WASM + Sharp Engine]
        OCRService[OCR Service :3001<br/>Tesseract.js Engine + Traineddata]
    end

    subgraph Data & Queue Tier [Data, Cache & Queue Tier]
        Postgres[(PostgreSQL 16 Alpine :5432)]
        Redis[(Redis 7 Alpine :6379)]
        Mongo[(MongoDB 7.0 Alpine :27017)]
        DiskStorage[(Persistent Volume: /app/storage & /app/uploads)]
    end

    User -->|HTTP Credentials: include| Nginx
    Nginx -->|Reverse Proxy /api/| NestAPI
    
    NestAPI --> AuthMod
    NestAPI --> PrismaORM --> Postgres
    NestAPI --> DiskStorage
    NestAPI --> QueueProd --> Redis
    
    Redis -->|Consume JOB_PROCESS_RESUME| NestAPI
    NestAPI -->|x-internal-secret| ImageProc
    NestAPI -->|x-internal-secret| OCRService
    ImageProc --> Mongo
    OCRService --> Mongo
    NestAPI --> AiGen
```

### Layer Responsibilities

1. **Presentation Layer (Frontend)**:
   - Client-side Single Page Application (SPA) built with React 19 and Vite.
   - Served via Nginx Alpine in Docker, with client-side routing fallback and proxy capabilities.
   - Manages interactive interview state, speech recognition, timer countdowns, and real-time audio/visual feedback.
2. **API Gateway & Orchestration Layer (Backend)**:
   - Built with NestJS 11 in TypeScript.
   - Exposes RESTful endpoints documented via OpenAPI / Swagger at `/api/docs`.
   - Handles authentication, cookie issuing, request validation, and database operations via Prisma ORM.
   - Enqueues background jobs to BullMQ and hosts the Bull-Board monitoring dashboard at `/admin/queues`.
   - Directs prompt engineering and JSON response parsing with Google Generative AI SDK.
3. **Microservices Layer**:
   - **Image Processing Service (`:3000`)**: Converts uploaded documents (`.pdf`, `.docx`, `.doc`) into standardized PNG page images using MuPDF compiled to WebAssembly, optimized with Sharp.
   - **OCR Service (`:3001`)**: Extracts plain text from page image buffers using Tesseract.js with bundled offline English training data (`eng.traineddata`).
4. **Data, Cache & Queue Tier**:
   - **PostgreSQL (`:5432`)**: Relational database storing users, interview session metadata, overall scores, and audit timestamps.
   - **Redis (`:6379`)**: BullMQ job queue broker and distributed lock manager.
   - **MongoDB (`:27017`)**: Document database storing intermediate image processing and OCR artifacts.
   - **Persistent Disk Volume**: Stores original resume files and complete interview session JSON state trees.

---

## 🛠️ Technologies Used and Where

### Technology Matrix

| Service / Layer | Technology | Version | Location in Codebase | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | React | 19.x | `frontend/src/` | Interactive Single Page Application |
| **Frontend Tooling** | Vite | 8.x | `frontend/vite.config.js` | Fast HMR dev server and production asset bundler |
| **Frontend Routing** | React Router DOM | 7.x | `frontend/src/app/Router.jsx` | Client-side routing & auth-protected routes |
| **Global State** | Redux Toolkit | 2.x | `frontend/src/shared/store/` | Session data, interview history, and user state |
| **UI Design System** | Vanilla CSS3 | Standard | `frontend/src/shared/styles/` | Custom Emerald-Blue Hybrid theme (no bulky CSS frameworks) |
| **Iconography** | Lucide React | 1.x | `frontend/src/` | Modern vector UI icons |
| **Visual Effects** | Canvas Confetti | 1.9 | `frontend/src/modules/interview-room/` | Dynamic celebration animation on interview completion |
| **Web Server** | Nginx | Alpine | `frontend/nginx.conf`, `frontend/Dockerfile` | Production web server & SPA fallback routing |
| **API Gateway** | NestJS | 11.x | `backend/src/` | Enterprise Node.js backend orchestration framework |
| **Database ORM** | Prisma | 6.x | `backend/prisma/schema.prisma` | Type-safe PostgreSQL client and schema migrations |
| **Relational DB** | PostgreSQL | 16-alpine | `docker-compose.yml` / Neon Cloud | Primary data store (Users, Sessions, Scores) |
| **Job Queue** | BullMQ | 5.x | `backend/src/modules/queue/` | Background resume conversion and AI job orchestration |
| **Queue Broker** | Redis | 7-alpine | `docker-compose.yml` | In-memory message broker for BullMQ |
| **Queue Dashboard** | @bull-board/nestjs | 6.x | `backend/src/modules/queue/` | Visual UI for job queue monitoring at `/admin/queues` |
| **AI Evaluation Engine** | @google/genai | SDK | `backend/src/modules/ai/` | Google Gemini `gemini-2.5-flash-lite` model for fast scoring |
| **Auth & Security** | Passport & JWT | 11.x | `backend/src/modules/auth/` | HttpOnly cookie dual-token authentication |
| **Password Hashing** | Bcrypt | 6.x | `backend/src/modules/auth/` | Secure 10-round salted password hashing |
| **File Uploads** | Multer | 1.x | `backend/src/modules/interview/` | Multipart file streaming and validation |
| **API Documentation** | Swagger / OpenAPI | 11.x | `backend/src/main.ts` | Interactive API documentation at `/api/docs` |
| **Document Converter** | MuPDF WASM | Latest | `image-processing/src/services/` | High-fidelity PDF, DOCX, DOC to PNG conversion |
| **Image Optimizer** | Sharp | 0.33 | `image-processing/src/services/` | Image resizing, DPI scaling, and format normalization |
| **OCR Engine** | Tesseract.js | 5.x | `ocr/src/services/` | Optical Character Recognition with offline `eng.traineddata` |
| **Document Store** | MongoDB | 7.0 | `docker-compose.yml` | Temporary conversion metadata and image cache |
| **Container Engine** | Docker Compose | v2.x | `docker-compose.yml` | Multi-container orchestration with health checks |

---

## 🔄 End-to-End Code Flows

### 1. Authentication & Dual-JWT Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant AuthCtrl as AuthController (:5000)
    participant AuthService as AuthService
    participant Prisma as Prisma (PostgreSQL)
    participant Guard as JwtAuthGuard

    Candidate->>AuthCtrl: POST /api/auth/register { username, password }
    AuthCtrl->>AuthService: register(dto)
    AuthService->>AuthService: bcrypt.hash(password, 10)
    AuthService->>Prisma: user.create({ username, passwordHash, tokenVersion: 0 })
    AuthService-->>Candidate: { success: true, user }

    Candidate->>AuthCtrl: POST /api/auth/login { identifier, password }
    AuthCtrl->>AuthService: login(dto)
    AuthService->>Prisma: user.findUnique({ where: { username } })
    AuthService->>AuthService: bcrypt.compare(password, hash)
    AuthService->>AuthService: Sign access_token (1h) & refresh_token (7d)
    AuthCtrl-->>Candidate: Set-Cookie: access_token, refresh_token (HttpOnly, SameSite=Lax)

    Note over Candidate,Guard: Authenticated Requests
    Candidate->>Guard: GET /api/interviews/sessions (Cookies sent automatically)
    Guard->>Guard: Verify JWT signature & expiration
    Guard->>Prisma: user.findUnique({ where: { id } })
    Guard->>Guard: Check payload.tokenVersion === dbUser.tokenVersion
    Guard-->>Candidate: Allow access to protected endpoint

    Note over Candidate,AuthCtrl: Token Revocation / Logout
    Candidate->>AuthCtrl: POST /api/auth/logout
    AuthCtrl->>Prisma: user.update({ tokenVersion: tokenVersion + 1 })
    AuthCtrl-->>Candidate: Clear-Cookie (access_token, refresh_token)
```

### 2. Resume Ingestion & AI Question Generation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant FE as Frontend (React 19)
    participant Gateway as NestJS Gateway (:5000)
    participant Redis as Redis / BullMQ
    participant Worker as ResumePipelineWorker
    participant ImgSvc as Image Processing (:3000)
    participant OcrSvc as OCR Service (:3001)
    participant Gemini as Gemini AI (2.5-flash-lite)
    participant Disk as Local File Storage
    participant DB as PostgreSQL

    User->>FE: Upload Resume File (.pdf, .docx, .png)
    FE->>Gateway: POST /api/interviews/sessions/upload (Multipart)
    Gateway->>Disk: Save file to storage/uploads/<sessionId>.<ext>
    Gateway->>DB: interviewSession.create({ status: 'PENDING', originalFileName, ... })
    Gateway->>Redis: Enqueue Job: JOB_PROCESS_RESUME { sessionId, filePath }
    Gateway-->>FE: Return { sessionId, status: 'PENDING' }

    critical Async Pipeline Execution
        Redis->>Worker: Pick up JOB_PROCESS_RESUME
        Worker->>DB: Update status to 'PROCESSING'
        Worker->>ImgSvc: POST /api/convert (Multipart stream + x-internal-secret)
        ImgSvc->>ImgSvc: Render document to PNG images (MuPDF WASM + Sharp)
        ImgSvc-->>Worker: Return array of page image buffers
        Worker->>OcrSvc: POST /api/extract-text (Page images + x-internal-secret)
        OcrSvc->>OcrSvc: Extract structured text (Tesseract.js)
        OcrSvc-->>Worker: Return { rawText, confidence }
        Worker->>Gemini: generateInterviewQuestions({ role, level, type, resumeText })
        Gemini-->>Worker: Return 5 Tailored Questions with Rubrics (JSON)
        Worker->>Disk: Write session JSON (questions, config, initial state)
        Worker->>DB: Update interviewSession ({ status: 'READY' })
    end

    loop Polling Status
        FE->>Gateway: GET /api/interviews/sessions/:id/status
        Gateway-->>FE: { status: 'READY', questionsCount: 5 }
    end
    FE->>User: Transition to Interview Room Screen
```

### 3. Live Interview Execution & Real-Time Scoring

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant Room as Interview Room UI
    participant Gateway as NestJS Gateway (:5000)
    participant Gemini as Gemini AI Engine
    participant SessionFile as Session JSON Storage
    participant DB as PostgreSQL

    Room->>Candidate: Present Question 1 of 5 (AI avatar + speech synthesis)
    Candidate->>Room: Submit Answer (Speech-to-Text or typed answer)
    Room->>Gateway: POST /api/interviews/sessions/:id/submit-answer { questionId, answer }
    Gateway->>Gemini: evaluateAnswer({ question, rubric, candidateAnswer })
    Gemini-->>Gateway: Return { score: 85, feedback, strengths, improvements }
    Gateway->>SessionFile: Append evaluation to question object in session JSON
    Gateway-->>Room: Return evaluated score & live feedback

    Note over Room,Candidate: Candidate repeats for remaining questions

    Candidate->>Room: Click "Complete & Submit Interview"
    Room->>Gateway: POST /api/interviews/sessions/:id/complete
    Gateway->>Gemini: calculateFinalEvaluation(allQuestionsAndAnswers)
    Gateway->>DB: Update interviewSession ({ status: 'COMPLETED', totalScore })
    Gateway->>SessionFile: Mark status 'COMPLETED' with final score breakdown
    Gateway-->>Room: Return full scorecard (Technical, Problem Solving, Communication)
    Room->>Candidate: Display Performance Scorecard & Trigger Confetti
```

### 4. Resume Vault & Document Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant Vault as Resume Vault UI (/resumes)
    participant Gateway as NestJS Gateway (:5000)
    participant Disk as Physical Storage (/storage)
    participant DB as PostgreSQL

    Candidate->>Vault: Open Resume Vault Page
    Vault->>Gateway: GET /api/interviews/resumes
    Gateway->>DB: Find candidate sessions with originalFileName
    Gateway->>Disk: Verify file exists on disk
    Gateway-->>Vault: Return unique resumes list with metadata & file size

    alt Reusing Resume for New Interview
        Candidate->>Vault: Click "Practice with this Resume"
        Vault->>Gateway: POST /api/interviews/sessions/reuse { sourceSessionId, config }
        Gateway->>Disk: Copy source resume to new session file
        Gateway->>DB: Create new session record reusing existing extracted OCR text
        Gateway-->>Vault: Return new sessionId immediately (Skips OCR parsing!)
    else Deleting Resume Permanently
        Candidate->>Vault: Click "Delete Resume"
        Vault->>Gateway: DELETE /api/interviews/resumes/:sessionId
        Gateway->>DB: Find all session rows sharing originalFileName
        Gateway->>Disk: Delete physical file (fs.unlink)
        Gateway->>DB: Delete vault placeholder sessions
        Gateway->>DB: Disassociate completed sessions (set storedFilePath = '')
        Gateway-->>Vault: { success: true, message: 'Resume permanently removed' }
        Note over Gateway,DB: Completed interview history & scores are preserved!
    end
```

---

## 📁 Repository Structure

```
mock-interviewer/
├── backend/                             # NestJS API Gateway & BullMQ Worker
│   ├── prisma/
│   │   ├── schema.prisma                # PostgreSQL Schema (Users & Sessions)
│   │   └── migrations/                  # Prisma migration history
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ai/                      # Google Gemini AI Service & Prompts
│   │   │   ├── auth/                    # JWT Auth, Bcrypt, HttpOnly Cookies, Guards
│   │   │   ├── interview/               # Interview Controller, Service, DTOs
│   │   │   ├── microservices/           # Downstream HTTP clients (ImageProc & OCR)
│   │   │   ├── queue/                   # BullMQ Producer, Resume Pipeline Worker
│   │   │   └── session-storage/         # JSON Session State Manager
│   │   ├── shared/                      # Global filters, decorators, pipes
│   │   ├── app.module.ts                # Root NestJS module
│   │   └── main.ts                      # NestJS Bootstrap (Swagger, CORS, Cookies)
│   ├── storage/                         # Local volume mount for resumes & session JSON
│   ├── Dockerfile                       # Multi-stage Node 20 Alpine Dockerfile
│   └── .env                             # Backend environment variables
│
├── frontend/                            # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── app/                         # App entry, Router & Context Providers
│   │   ├── modules/
│   │   │   ├── auth/                    # Login, Register & Reset Password Pages
│   │   │   ├── dashboard/               # Candidate Metrics & Quick Start
│   │   │   ├── interview-history/       # Completed Interview History & Scorecards
│   │   │   ├── interview-room/          # Real-time Question, Timer & Answer Room
│   │   │   ├── new-interview/           # Interview Wizard (Upload, Config, Pipeline)
│   │   │   ├── profile/                 # Profile, Avatar & Password Change
│   │   │   └── resumes/                 # Resume Vault Document Manager
│   │   └── shared/                      # UI Components, Modals, Buttons, API Client
│   ├── nginx.conf                       # Production Nginx SPA Routing configuration
│   ├── Dockerfile                       # Multi-stage Node 20 + Nginx Alpine Dockerfile
│   └── .env                             # Frontend environment variables
│
├── image-processing/                    # Document Converter Microservice
│   ├── src/
│   │   ├── controllers/                 # Express route handlers
│   │   ├── services/                    # MuPDF WebAssembly & Sharp logic
│   │   └── server.js                    # Express app bootstrap
│   ├── Dockerfile                       # Node 20 Alpine Dockerfile
│   └── .env                             # Image Processing configuration
│
├── ocr/                                 # OCR Text Extraction Microservice
│   ├── src/
│   │   ├── controllers/                 # Express route handlers
│   │   ├── services/                    # Tesseract.js Worker & model manager
│   │   └── server.js                    # Express app bootstrap
│   ├── eng.traineddata                  # Bundled offline English OCR training data
│   ├── Dockerfile                       # Node 20 Alpine Dockerfile
│   └── .env                             # OCR service configuration
│
├── docker-compose.yml                   # Complete 7-Service Orchestration Manifest
└── README.md                            # Comprehensive System Documentation
```

---

## 🐳 Quick Start: Running with Docker (Recommended)

Docker Compose orchestrates the full **7-container ecosystem** (`postgres`, `redis`, `mongodb`, `image-processing`, `ocr`, `backend`, and `frontend`) on a dedicated internal bridge network (`mock-interviewer-net`).

### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/) >= 24.0.0
- [Docker Compose](https://docs.docker.com/compose/install/) v2

### Step 1: Clone the Repository
```bash
git clone https://github.com/vermavikku/mock-interviewer.git
cd mock-interviewer
```

### Step 2: Configure Environment Keys
Ensure `backend/.env` has your valid Google Gemini API key:
```ini
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

### Step 3: Build & Launch All 7 Containers
```bash
docker compose up -d --build
```

### Step 4: Verify Container Health
Check that all 7 containers are running and healthy:
```bash
docker compose ps
```

Expected output:
```
NAME                          IMAGE                    STATUS                   PORTS
mock-interviewer-postgres     postgres:16-alpine       Up (healthy)             0.0.0.0:5432->5432/tcp
mock-interviewer-redis        redis:7-alpine           Up (healthy)             0.0.0.0:6379->6379/tcp
mock-interviewer-mongodb      mongo:7.0                Up (healthy)             0.0.0.0:27017->27017/tcp
mock-interviewer-image-proc   mock-interviewer-image   Up                       0.0.0.0:3000->3000/tcp
mock-interviewer-ocr          mock-interviewer-ocr     Up                       0.0.0.0:3001->3001/tcp
mock-interviewer-backend      mock-interviewer-backend Up                       0.0.0.0:5000->5000/tcp
mock-interviewer-frontend     mock-interviewer-front   Up                       0.0.0.0:5173->80/tcp
```

### Step 5: Access the Application
- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **API Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **BullMQ Queue Monitoring**: [http://localhost:5000/admin/queues](http://localhost:5000/admin/queues)

### Useful Docker Commands
```bash
# View aggregated live logs across all containers
docker compose logs -f

# View live logs for backend only
docker compose logs -f backend

# Stop all containers
docker compose down

# Stop and wipe all persistent database volumes
docker compose down -v
```

---

## 💻 Quick Start: Running without Docker (Local Bare-Metal)

For active local development, you can run services directly using Node.js.

### Prerequisites
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Redis Server**: Running locally on `localhost:6379`
- **MongoDB Server**: Running locally on `localhost:27017`
- **PostgreSQL**: Running locally on `localhost:5432` OR a [Neon Cloud Serverless PostgreSQL](https://neon.tech) URL.

---

### Step 1: Start Redis & MongoDB
Ensure local Redis and MongoDB instances are active:
```bash
# Windows (if installed as services)
net start Redis
net start MongoDB

# Linux / macOS
sudo systemctl start redis mongodb
```

---

### Step 2: Start Image Processing Microservice
In a new terminal:
```bash
cd image-processing
npm install
npm run dev
# Running on http://localhost:3000
```

---

### Step 3: Start OCR Microservice
In a second terminal:
```bash
cd ocr
npm install
npm run dev
# Running on http://localhost:3001
```

---

### Step 4: Setup & Start Backend Gateway
In a third terminal:
```bash
cd backend
npm install

# Push database schema to PostgreSQL
npx prisma generate
npx prisma db push

# Start NestJS development server with watch mode
npm run dev
# Running on http://localhost:5000
```

---

### Step 5: Start Frontend SPA
In a fourth terminal:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

Now open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Environment Variables Configuration

Each service manages its own `.env` configuration file:

### 1. `backend/.env`
```ini
PORT=5000
NODE_ENV=development

# Database (Use postgres container or local/cloud PostgreSQL URL)
DATABASE_URL="postgresql://user:password@localhost:5432/mock_interviewer?schema=public"

# Redis Cache & BullMQ Queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Downstream Microservices
IMAGE_PROCESSING_URL=http://localhost:3000
OCR_SERVICE_URL=http://localhost:3001
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite

# Authentication Secrets
JWT_ACCESS_SECRET=mock_interviewer_jwt_access_secret_key_super_secure_2026
JWT_REFRESH_SECRET=mock_interviewer_jwt_refresh_secret_key_super_secure_2026
```

### 2. `image-processing/.env`
```ini
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mock-interviewer
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899
JWT_SECRET=your_jwt_secret
```

### 3. `ocr/.env`
```ini
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mock-interviewer
INTERNAL_SERVICE_SECRET=mock_interviewer_internal_microservice_secret_key_8899
JWT_SECRET=your_jwt_secret
```

### 4. `frontend/.env`
```ini
VITE_BACKEND_URL=http://localhost:5000
```

---

## 📡 API Gateway Endpoints

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new candidate with username & bcrypt password | No |
| `POST` | `/api/auth/login` | Authenticate & set HttpOnly dual-JWT cookies | No |
| `POST` | `/api/auth/refresh-token` | Exchange valid refresh cookie for new access token | No |
| `POST` | `/api/auth/reset-password`| Reset password with username verification | No |
| `POST` | `/api/auth/logout` | Revoke session (`tokenVersion++`) and clear cookies | Yes |
| `GET` | `/api/auth/profile` | Fetch logged-in user profile, avatar & interview stats | Yes |
| `PUT` | `/api/auth/profile` | Update candidate display name, target role & avatar | Yes |
| `PUT` | `/api/auth/change-password` | Update password & invalidate all active sessions | Yes |

### Interview & Resume Endpoints (`/api/interviews`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/interviews/sessions/upload` | Upload resume file & dispatch BullMQ background job | Yes |
| `POST` | `/api/interviews/sessions/reuse` | Create session reusing existing parsed resume | Yes |
| `POST` | `/api/interviews/sessions/sample` | Create instant session with sample engineer profile | Yes |
| `GET` | `/api/interviews/sessions` | List all interview sessions for current candidate | Yes |
| `GET` | `/api/interviews/sessions/:id` | Get full interview session details & JSON state | Yes |
| `GET` | `/api/interviews/sessions/:id/status`| Poll async document conversion pipeline progress | Yes |
| `POST` | `/api/interviews/sessions/:id/submit-answer` | Submit answer & receive real-time AI evaluation | Yes |
| `POST` | `/api/interviews/sessions/:id/complete` | Finalize session & compute comprehensive score | Yes |
| `DELETE`| `/api/interviews/sessions/:id` | Delete interview session & JSON document | Yes |
| `GET` | `/api/interviews/resumes` | List candidate's Resume Vault documents | Yes |
| `GET` | `/api/interviews/resumes/:sessionId/file` | Stream original uploaded resume for preview | Yes |
| `DELETE`| `/api/interviews/resumes/:sessionId` | Permanently delete resume from disk & vault | Yes |

---

## 🔒 Security & Inter-Service Protection

1. **Client to API Gateway**:
   - Authentication tokens are never exposed to browser `localStorage` or JavaScript.
   - Tokens are transported in secure `HttpOnly`, `SameSite=Lax` cookies.
   - Every protected request checks `payload.tokenVersion === dbUser.tokenVersion`. Changing passwords or logging out increments `tokenVersion`, instantly invalidating existing tokens across all devices.
2. **API Gateway to Downstream Microservices**:
   - `Image Processing` (`:3000`) and `OCR` (`:3001`) microservices enforce inter-service security via the `x-internal-secret` HTTP header.
   - Any external or unauthenticated direct requests to downstream microservices are rejected with `403 Forbidden`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
