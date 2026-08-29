# OCR & RAG Microservice

An independent, modular Node.js REST API for **Optical Character Recognition (OCR)** powered by **Tesseract.js** and **Retrieval-Augmented Generation (RAG)** vector search powered by **PostgreSQL (`pgvector`) & Prisma ORM**, mapped directly to MongoDB `_id`s.

---

## 📁 Project Structure

```
ocr/
├── prisma/                      # Prisma ORM & PostgreSQL pgvector schema
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── config/                  # App configuration, DBs & Swagger setup
│   │   ├── env.js               # Centralized environment loader
│   │   ├── database.js          # MongoDB connection (Mongoose)
│   │   ├── prisma.js            # PostgreSQL connection & pgvector initializer (Prisma)
│   │   └── swagger.js           # Base OpenAPI 3.0 & Auto-merger
│   │
│   ├── modules/                 # Feature Modules
│   │   ├── ocr/                 # 🔍 OCR Module
│   │   │   ├── ocr.routes.js
│   │   │   ├── ocr.controller.js
│   │   │   ├── ocr.service.js   # Tesseract.js extraction
│   │   │   ├── ocr.model.js     # Mongoose Schemas (OcrBatch, OcrItem)
│   │   │   ├── ocr.swagger.js
│   │   │   └── index.js
│   │   │
│   │   └── rag/                 # 🧠 RAG & Vector Search Module
│   │       ├── rag.routes.js    # Ingest, Search, Delete endpoints
│   │       ├── rag.controller.js# Request/Response handlers
│   │       ├── rag.service.js   # Chunking, Embeddings & pgvector search
│   │       ├── rag.swagger.js   # OpenAPI 3.0 vector search docs
│   │       └── index.js
│   │
│   ├── shared/                  # Cross-cutting concerns & shared utilities
│   │   ├── middleware/          # errorHandler, authenticate, validate
│   │   ├── utils/               # logger, apiError
│   │   └── constants/           # Global constants & enums
│   │
│   ├── app.js                   # Express application setup
│   └── server.js                # Server entry point
│
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- MongoDB (local or Atlas)
- PostgreSQL (with `pgvector` extension)

### Installation

```bash
# Navigate to the service folder
cd ocr

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Start in development mode
npm run dev

# Start in production mode
npm start
```

---

## 🔧 Environment Variables

| Variable             | Description                                | Default                                         |
| -------------------- | ------------------------------------------ | ----------------------------------------------- |
| `PORT`               | Server port                                | `3001`                                          |
| `NODE_ENV`           | Environment mode                           | `development`                                   |
| `MONGO_URI`          | MongoDB connection string                  | `mongodb://localhost:27017/ocr_service`         |
| `DATABASE_URL`       | PostgreSQL connection string (Prisma)      | `postgresql://postgres:postgres@localhost:5432/ocr_rag?schema=public` |
| `EMBEDDING_PROVIDER` | Embedding model (`openai` / `mock`)        | `mock`                                          |
| `OPENAI_API_KEY`     | OpenAI API Key (optional for embeddings)   | `""`                                            |

---

## 📡 API Endpoints

### 🔍 OCR Endpoints
| Method | Endpoint             | Description                                                    |
| ------ | -------------------- | -------------------------------------------------------------- |
| POST   | `/api/ocr/extract`   | Upload multiple images (`images` form-data) & extract OCR text |
| GET    | `/api/ocr/:id`       | Retrieve OCR extraction results & text mappings by batch ID    |

### 🧠 RAG & Vector Search Endpoints
| Method | Endpoint                     | Description                                                                     |
| ------ | ---------------------------- | ------------------------------------------------------------------------------- |
| POST   | `/api/rag/ingest/:batchId`   | Ingest OCR batch from MongoDB, chunk, embed, and store in PostgreSQL `pgvector` |
| POST   | `/api/rag/search`            | Semantic vector search with cosine similarity filtering & Mongo `_id` mapping   |
| DELETE | `/api/rag/batch/:batchId`    | Delete vector embeddings for a specific MongoDB batch ID                        |

### 📖 Documentation & Health
| Method | Endpoint             | Description                                                    |
| ------ | -------------------- | -------------------------------------------------------------- |
| GET    | `/api/docs`          | Interactive Swagger UI API Documentation                       |
| GET    | `/api/docs.json`     | Raw OpenAPI 3.0 JSON specification                             |
| GET    | `/`                  | Service health check                                           |

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **OCR Engine:** Tesseract.js (Pure WebAssembly / JavaScript)
- **Vector Database:** PostgreSQL with `pgvector` extension
- **ORM:** Prisma ORM with `@prisma/adapter-pg`
- **Metadata Database:** MongoDB (Mongoose ODM)
- **File Uploads:** Multer (In-memory buffer)
- **Documentation:** Swagger / OpenAPI 3.0 (`swagger-ui-express`)
- **Security:** Helmet, CORS
- **Logging:** Morgan + Custom logger
