# Task Management & User Auth REST API (Node.js & Express)

A production-grade, secure, and modular RESTful API built using **Node.js**, **Express.js 5**, **MongoDB (Mongoose)**, **JWT Authentication**, and **Joi Validation**.

---

## 1. Features & Architectural Highlights

- **Decoupled Architecture:** Clean separation of concerns following `routes -> controllers -> services -> models -> middlewares`.
- **Complete User & Auth CRUD:** Register, Login, Profile (`/me`), Update Profile, Change Password, and full User CRUD (`/api/auth/users` and `/api/users`).
- **Complete Task CRUD & Ownership Isolation:** Users can **only** read, update, or delete tasks that belong to them. Attempts to access other users' tasks return `404 Not Found` to prevent entity enumeration.
- **Strict Schema Validation:** All request payloads and query params are strictly validated using **Joi**; invalid inputs trigger structured `400 Bad Request` messages.
- **Safe MongoDB ID Handling:** Hexadecimal ObjectId validations prevent casting errors (`BSONError`) and server crashes.
- **Password Security:** Passwords salted and hashed with `bcryptjs` (salt rounds: 10). Passwords are never returned in responses or logged.
- **Pagination, Filtering & Search:** Full query-based pagination (`page`, `limit`), filtering by `status`, `priority`, and `role`, text search, and multi-field sorting.
- **Centralized Error Handling:** Standardized error responses (`{ success, message, data, error }`).

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
        │   ├── auth.controller.js # User & Auth request parsing & response dispatching
        │   └── task.controller.js # Task request parsing & response dispatching
        ├── services/
        │   ├── auth.service.js    # User & Auth business logic, token issuance & CRUD
        │   └── task.service.js    # Task CRUD business logic & ownership queries
        ├── models/
        │   ├── user.model.js      # User schema with sanitized toJSON
        │   └── task.model.js      # Task schema with compound indexes
        ├── routes/
        │   ├── auth.routes.js     # /api/auth endpoints (Auth + User operations)
        │   ├── user.routes.js     # /api/users endpoints (User CRUD)
        │   └── task.routes.js     # /api/tasks endpoints (Auth protected)
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

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *Server will run at:* `http://localhost:8000`

---

## 5. API Reference

All functional endpoints are mounted on `/api` (as well as `/v1`):

### 5.1 Authentication & User Management Module

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with `name`, `email`, `password`, `role` |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Protected | Get authenticated user's profile |
| `PATCH/PUT`| `/api/auth/me` | Protected | Update authenticated user's profile |
| `POST` | `/api/auth/change-password` | Protected | Change password with current password verification |
| `GET` | `/api/auth/users` | Protected | **Get All Users** with pagination, search, role filters, sorting |
| `GET` | `/api/auth/users/:id` | Protected | **Get User by ID** |
| `PATCH/PUT`| `/api/auth/users/:id` | Protected | **Update User by ID** |
| `DELETE` | `/api/auth/users/:id` | Admin Only | **Delete User by ID** (cascades deletion of user tasks) |

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

---

## 6. Testing & Verification

### Automated Smoke Test Suite
A self-contained test runner is included in the project root:
```bash
node smoke-test.js
```
*Verifies all critical paths: User Auth & Registration, Profile Update, Password Change, User List & Retrieval, User Delete, Task CRUD, and cross-user security isolation.*

### Postman Collection
Import [`postman_collection.json`](./postman_collection.json) into Postman:
- Includes pre-configured environment variables (`{{base_url}}`, `{{jwt_token}}`, `{{user_id}}`, `{{task_id}}`).
- The **Login** request has a test script that **automatically saves the returned JWT** into collection variables for subsequent requests.
