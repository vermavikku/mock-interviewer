# Document Processing API

A modular Node.js REST API built with Express and MongoDB using **CommonJS** module system.

## 📁 Project Structure

```
├── src/
│   ├── config/                  # App configuration & env variables
│   │   ├── env.js
│   │   └── database.js
│   │
│   ├── modules/                 # 🔴 CORE FEATURE MODULES
│   │   ├── auth/
│   │   │   ├── auth.routes.js   # HTTP route definitions
│   │   │   ├── auth.controller.js# Request/response handlers
│   │   │   ├── auth.service.js  # Core business logic
│   │   │   ├── auth.validator.js# Input validation (Joi/Zod)
│   │   │   └── index.js         # Public API exporter for the module
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.model.js    # Schema/database queries
│   │   │   ├── user.validator.js
│   │   │   └── index.js
│   │   │
│   │   └── products/
│   │       ├── product.routes.js
│   │       ├── product.controller.js
│   │       ├── product.service.js
│   │       ├── product.model.js
│   │       └── index.js
│   │
│   ├── shared/                  # Cross-cutting concerns & shared utilities
│   │   ├── middleware/          # Shared middlewares (auth, error-handler, rate-limit)
│   │   │   ├── errorHandler.js
│   │   │   ├── authenticate.js
│   │   │   └── validate.js
│   │   ├── utils/               # Reusable helpers (logger, response formatters)
│   │   │   ├── logger.js
│   │   │   └── apiError.js
│   │   └── constants/           # Global constants & enums
│   │
│   ├── app.js                   # Express application setup & global middleware
│   └── server.js                # Server entry point (starts listener)
│
├── .env.example
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd document_processing

# Install dependencies
npm install

# Create environment variables
cp .env.example .env

# Start the server (development)
npm run dev

# Start the server (production)
npm start
```

## 🔧 Environment Variables

| Variable       | Description                          | Default                                |
| -------------- | ------------------------------------ | -------------------------------------- |
| `PORT`         | Server port                          | `3000`                                 |
| `NODE_ENV`     | Environment mode                     | `development`                          |
| `MONGO_URI`    | MongoDB connection string            | `mongodb://localhost:27017/document_processing` |
| `JWT_SECRET`   | Secret key for JWT signing           | (required)                             |
| `JWT_EXPIRES_IN` | JWT token expiration               | `7d`                                   |

## 📡 API Endpoints

### Auth

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register a user   |
| POST   | `/api/auth/login`    | Login & get token |
| POST   | `/api/auth/refresh-token` | Refresh JWT |

### Users

| Method | Endpoint        | Description      |
| ------ | --------------- | ---------------- |
| GET    | `/api/users`    | Get all users    |
| GET    | `/api/users/:id`| Get user by ID   |
| POST   | `/api/users`    | Create a user    |
| PUT    | `/api/users/:id`| Update a user    |
| DELETE | `/api/users/:id`| Delete a user    |

### Products

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/api/products`      | Get all products    |
| GET    | `/api/products/:id`  | Get product by ID   |
| POST   | `/api/products`      | Create a product    |
| PUT    | `/api/products/:id`  | Update a product    |
| DELETE | `/api/products/:id`  | Delete a product    |

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose ODM)
- **Validation:** Joi
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Security:** Helmet, CORS
- **Logging:** Morgan + custom logger
- **Module System:** CommonJS

## 📝 License

MIT