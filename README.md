# Task Management REST API (Node.js & Express)

A production-grade, secure, and modular RESTful API for Task Management built using **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **JWT Authentication**, and **Joi Validation**.

---

## 1. Features & Architectural Highlights

- **Decoupled Architecture:** Clean separation of concerns following `routes -> controllers -> services -> models -> middlewares`.
- **JWT Authentication (AuthN):** Stateless token-based authentication using `jsonwebtoken` with 7-day expiration and Bearer scheme.
- **Strict Data Ownership & Isolation:** Users can **only** read, update, or delete tasks that belong to them. Attempts to access other users' tasks return `404 Not Found` to prevent resource enumeration.
- **Strict Schema Validation:** Request payloads and query params are strictly validated using **Joi**; invalid inputs trigger structured `400 Bad Request` messages.
- **Safe MongoDB ID Handling:** Hexadecimal ObjectId validations prevent casting errors (`BSONError`) and server crashes.
- **Password Security:** Passwords salted and hashed with `bcryptjs` (salt rounds: 10). Passwords are never returned in responses or logged.
- **Pagination, Filtering & Search:** `/api/tasks` supports full query-based pagination (`page`, `limit`), filtering by `status` and `priority`, text search, and multi-field sorting.
- **Centralized Error Handling:** Standardized error responses (`{ success, message, data, error }`) with production-safe error masking.

---

## 2. Tech Stack

- **Runtime:** Node.js (ES Modules: `"type": "module"`)
- **Web Framework:** Express.js 5
- **Database:** MongoDB via Mongoose ODM
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Password Hashing:** `bcryptjs`
- **Validation:** `Joi`
- **Security & Utilities:** `cors`, `compression`, `morgan`, `dotenv`

---

## 3. Project Structure

```text
src/
└── api/
    └── v1/
        ├── config/
        │   ├── mongodb.js         # Mongoose connection with fallback support
        │   ├── socket.js          # Socket.IO configuration
        │   └── firebase.js        # Firebase Admin modular initialization
        ├── controllers/
        │   ├── auth.controller.js # Auth request parsing & response dispatching
        │   └── task.controller.js # Task request parsing & response dispatching
        ├── services/
        │   ├── auth.service.js    # Authentication business logic & token issuance
        │   └── task.service.js    # Task CRUD business logic & ownership queries
        ├── models/
        │   ├── user.model.js      # User schema with sanitized toJSON
        │   └── task.model.js      # Task schema with compound indexes
        ├── routes/
        │   ├── auth.routes.js     # /api/auth endpoints
        │   └── task.routes.js     # /api/tasks endpoints (auth protected)
        ├── middlewares/
        │   ├── auth.middleware.js # JWT verification & role authorization
        │   └── validations/
        │       └── task.validator.js # Joi schemas for request validation
        ├── helpers/
        │   └── response.helper.js # Standardized JSON response formatting
        └── utills/
            ├── encrypt.js         # bcrypt hashing & comparison
            └── jwt.js             # JWT creation & verification
app.js                             # Express app setup & route mounting
index.js                           # HTTP server initialization & port binding
smoke-test.js                      # Automated End-to-End API test runner
postman_collection.json            # Importable Postman Collection (v2.1)
.env.example                       # Environment configuration template
```

---

## 4. Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB (Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### Installation

1. **Clone or Navigate to Project:**
   ```bash
   cd codeverseItTest
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Verify your MongoDB URI and port in `.env`.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Or production start:*
   ```bash
   npm start
   ```
   *Server will run at:* `http://localhost:8000`

---

## 5. API Reference

All functional endpoints are mounted on `/api` (as well as `/v1`):

### 5.1 Authentication Module

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with `name`, `email`, `password` |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get authenticated user's profile |

#### Register Request Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

#### Register / Login Response (200 / 201):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "672200a0b6e1...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 5.2 Task Management Module (All Require `Authorization: Bearer <token>`)

| Method | Endpoint | Query / Param | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tasks` | - | Create new task |
| `GET` | `/api/tasks` | `page`, `limit`, `status`, `priority`, `search`, `sortBy`, `order` | List user's tasks with pagination & filters |
| `GET` | `/api/tasks/:id` | `id` (MongoDB ObjectId) | Get specific task by ID |
| `PUT` | `/api/tasks/:id` | `id` (MongoDB ObjectId) | Full update of allowed task fields |
| `PATCH` | `/api/tasks/:id` | `id` (MongoDB ObjectId) | Partial update of allowed task fields |
| `DELETE` | `/api/tasks/:id` | `id` (MongoDB ObjectId) | Delete user's task |

#### Create Task Request Body:
```json
{
  "title": "Complete Code Review",
  "description": "Review pull requests and ensure 100% test coverage",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-11-01T18:00:00.000Z"
}
```

#### Example Success Response (Complies with assignment spec):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "672201b5c9a2...",
    "title": "Complete Code Review",
    "description": "Review pull requests and ensure 100% test coverage",
    "status": "pending",
    "priority": "high",
    "dueDate": "2026-11-01T18:00:00.000Z",
    "createdAt": "2026-10-30T10:30:00.000Z"
  }
}
```

#### Example Error Response (400 Bad Request):
```json
{
  "success": false,
  "status": false,
  "message": "Title is required",
  "error": "ValidationError"
}
```

---

## 6. Security & Design Decisions Note

1. **Authentication & Identity Isolation:**
   - Client requests are **never trusted** to supply a `userId` in the body when creating or accessing tasks.
   - The user identity is extracted purely from the verified JWT payload (`req.user.id`).
   - Every task query enforces `{ _id: taskId, userId: req.user.id }`. If another user attempts to read, update, or delete an unauthorized task, a `404 Not Found` is returned rather than `403 Forbidden` to prevent malicious entity enumeration.

2. **Defense Against Malformed ObjectIds:**
   - Parameter validators ensure incoming route params conform to 24-character hex format before reaching database drivers, completely eliminating unhandled cast exceptions.

3. **Information Disclosure Prevention:**
   - User Mongoose schema applies a `transform` hook deleting `password` and `__v` from all JSON serialization.
   - Passwords are never sent back in signup/login responses.
   - Internal stack traces are suppressed in production mode.

4. **Database Performance:**
   - Compound indexes are established on `{ userId: 1, status: 1 }` and `{ userId: 1, createdAt: -1 }` to support low-latency querying and pagination on growing datasets.

---

## 7. Testing & Verification

### Automated Smoke Test Suite
A self-contained test runner is included in the project root:
```bash
node smoke-test.js
```
*Verifies all 10 critical paths including registration, validation rules, token issuance, CRUD operations, and cross-user security isolation.*

### Postman Collection
Import [`postman_collection.json`](./postman_collection.json) into Postman:
- Includes pre-configured environment variables (`{{base_url}}`, `{{jwt_token}}`, `{{task_id}}`).
- The **Login** request has a test script that **automatically saves the returned JWT** into collection variables for subsequent requests.
