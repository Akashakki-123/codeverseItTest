/**
 * Standalone End-to-End API Smoke Test Suite
 * Uses native Node.js fetch (Node >= 18)
 * Verifies all authentication, authorization (RBAC), user CRUD, and task CRUD endpoints against http://localhost:8000
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8000/api';

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Execute HTTP request and measure latency
 */
async function apiCall(method, endpoint, body = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const startTime = Date.now();
    try {
        const response = await fetch(url, options);
        const latency = Date.now() - startTime;
        let data = null;

        try {
            data = await response.json();
        } catch {
            data = null;
        }

        return {
            status: response.status,
            data,
            latency,
            ok: response.ok
        };
    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            status: 0,
            data: null,
            latency,
            error: error.message
        };
    }
}

/**
 * Custom assertion with color-coded logging and latency measurement
 */
function testAssert(title, condition, status, expectedStatus, latency, extra = '') {
    totalTests++;
    const latencyStr = `${COLORS.gray}(${latency}ms)${COLORS.reset}`;
    const statusStr = status ? `[HTTP ${status}]` : '[ERR]';

    if (condition) {
        passedTests++;
        console.log(`  ${COLORS.green}✓ [PASS]${COLORS.reset} ${title} ${COLORS.cyan}${statusStr}${COLORS.reset} ${latencyStr}`);
    } else {
        failedTests++;
        const expectedStr = expectedStatus ? ` (Expected HTTP ${expectedStatus}, Got ${status})` : '';
        console.log(`  ${COLORS.red}✗ [FAIL]${COLORS.reset} ${title} ${COLORS.red}${statusStr}${expectedStr}${COLORS.reset} ${extra} ${latencyStr}`);
    }
}

async function runSmokeTests() {
    console.log(`\n${COLORS.cyan}${COLORS.bold}========================================================================${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bold}    🚀 PRODUCTION API SMOKE TEST RUNNER - END-TO-END VERIFICATION       ${COLORS.reset}`);
    console.log(`${COLORS.gray}    Target Endpoint: ${COLORS.reset}${COLORS.bold}${BASE_URL}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${COLORS.bold}========================================================================${COLORS.reset}\n`);

    const timestamp = Date.now();

    // Actor 1: Regular User A
    const userA = {
        name: 'Alice Developer',
        email: `alice_${timestamp}@test.com`,
        password: 'Password123!',
        role: 'user'
    };

    // Actor 2: Regular User B (for cross-user ownership isolation)
    const userB = {
        name: 'Bob QA',
        email: `bob_${timestamp}@test.com`,
        password: 'Password123!',
        role: 'user'
    };

    // Actor 3: Admin User (for RBAC 403 Forbidden verification)
    const adminUser = {
        name: 'Super Administrator',
        email: `admin_${timestamp}@test.com`,
        password: 'AdminPassword123!',
        role: 'admin'
    };

    let tokenUserA = '';
    let tokenUserB = '';
    let tokenAdmin = '';
    let userAId = '';
    let userBId = '';
    let createdTaskId = '';

    // -------------------------------------------------------------------------
    // 1. PUBLIC & ROOT HEALTH CHECKS
    // -------------------------------------------------------------------------
    console.log(`${COLORS.yellow}${COLORS.bold}[1. Public & Root Health Check]${COLORS.reset}`);
    const rootRes = await apiCall('GET', '/../');
    testAssert('Root health check endpoint is responsive', rootRes.status === 200 || rootRes.status === 404, rootRes.status, 200, rootRes.latency);

    // -------------------------------------------------------------------------
    // 2. USER REGISTRATION & VALIDATION (ROLE A, ROLE B, ADMIN)
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[2. User Registration & Auth Validations]${COLORS.reset}`);

    // Register User A
    const regARes = await apiCall('POST', '/auth/register', userA);
    testAssert('Register User A (role: user)', regARes.status === 201, regARes.status, 201, regARes.latency);
    userAId = regARes.data?.data?.user?.id || regARes.data?.data?.user?._id;
    testAssert('Password hash is never returned in registration payload', !regARes.data?.data?.user?.password, regARes.status, 201, regARes.latency);

    // Register User B
    const regBRes = await apiCall('POST', '/auth/register', userB);
    testAssert('Register User B (role: user)', regBRes.status === 201, regBRes.status, 201, regBRes.latency);
    userBId = regBRes.data?.data?.user?.id || regBRes.data?.data?.user?._id;

    // Register Admin User
    const regAdminRes = await apiCall('POST', '/auth/register', adminUser);
    testAssert('Register Admin User (role: admin)', regAdminRes.status === 201, regAdminRes.status, 201, regAdminRes.latency);

    // Duplicate email check
    const dupRes = await apiCall('POST', '/auth/register', userA);
    testAssert('Reject duplicate email registration with 400 Bad Request', dupRes.status === 400, dupRes.status, 400, dupRes.latency);

    // Strict validation check: password too short
    const shortPassRes = await apiCall('POST', '/auth/register', {
        name: 'Invalid User',
        email: `invalid_${timestamp}@test.com`,
        password: '123'
    });
    testAssert('Joi validation rejects password < 6 chars with 400', shortPassRes.status === 400, shortPassRes.status, 400, shortPassRes.latency);

    // -------------------------------------------------------------------------
    // 3. AUTHENTICATION & LOGIN (JWT TOKEN ISSUANCE)
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[3. Authentication & Login (JWT Issuance)]${COLORS.reset}`);

    // Login User A
    const loginARes = await apiCall('POST', '/auth/login', { email: userA.email, password: userA.password });
    tokenUserA = loginARes.data?.data?.token;
    testAssert('Login User A returns 200 OK & JWT Bearer token', loginARes.status === 200 && Boolean(tokenUserA), loginARes.status, 200, loginARes.latency);

    // Login User B
    const loginBRes = await apiCall('POST', '/auth/login', { email: userB.email, password: userB.password });
    tokenUserB = loginBRes.data?.data?.token;
    testAssert('Login User B returns 200 OK & JWT Bearer token', loginBRes.status === 200 && Boolean(tokenUserB), loginBRes.status, 200, loginBRes.latency);

    // Login Admin User
    const loginAdminRes = await apiCall('POST', '/auth/login', { email: adminUser.email, password: adminUser.password });
    tokenAdmin = loginAdminRes.data?.data?.token;
    testAssert('Login Admin User returns 200 OK & Admin JWT Bearer token', loginAdminRes.status === 200 && Boolean(tokenAdmin), loginAdminRes.status, 200, loginAdminRes.latency);

    // Invalid credentials check
    const badLoginRes = await apiCall('POST', '/auth/login', { email: userA.email, password: 'WrongPassword!' });
    testAssert('Reject invalid credentials with 401 Unauthorized', badLoginRes.status === 401, badLoginRes.status, 401, badLoginRes.latency);

    // -------------------------------------------------------------------------
    // 4. AUTHENTICATED PROFILE & USER CRUD OPERATIONS
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[4. User Profile & CRUD Operations]${COLORS.reset}`);

    // GET /api/auth/me
    const meRes = await apiCall('GET', '/auth/me', null, tokenUserA);
    testAssert('GET /api/auth/me returns authenticated profile', meRes.status === 200 && meRes.data?.data?.email === userA.email, meRes.status, 200, meRes.latency);

    // Missing token check (401)
    const unauthMeRes = await apiCall('GET', '/auth/me');
    testAssert('Accessing protected route without token returns 401 Unauthorized', unauthMeRes.status === 401, unauthMeRes.status, 401, unauthMeRes.latency);

    // PATCH /api/auth/me
    const updateMeRes = await apiCall('PATCH', '/auth/me', { name: 'Alice Senior Dev' }, tokenUserA);
    testAssert('PATCH /api/auth/me updates user profile name', updateMeRes.status === 200 && updateMeRes.data?.data?.name === 'Alice Senior Dev', updateMeRes.status, 200, updateMeRes.latency);

    // POST /api/auth/change-password
    const changePassRes = await apiCall('POST', '/auth/change-password', {
        currentPassword: userA.password,
        newPassword: 'BrandNewPassword123!'
    }, tokenUserA);
    testAssert('POST /api/auth/change-password updates password securely', changePassRes.status === 200, changePassRes.status, 200, changePassRes.latency);

    // Verify login with new password
    const reLoginRes = await apiCall('POST', '/auth/login', { email: userA.email, password: 'BrandNewPassword123!' });
    tokenUserA = reLoginRes.data?.data?.token;
    testAssert('Re-login with updated password succeeds', reLoginRes.status === 200 && Boolean(tokenUserA), reLoginRes.status, 200, reLoginRes.latency);

    // GET /api/auth/users (Pagination, Filters, Search)
    const allUsersRes = await apiCall('GET', '/auth/users?page=1&limit=10', null, tokenUserA);
    testAssert('GET /api/auth/users lists users with pagination metadata', allUsersRes.status === 200 && Array.isArray(allUsersRes.data?.data?.users), allUsersRes.status, 200, allUsersRes.latency);

    // GET /api/auth/users/:id
    const getUserByIdRes = await apiCall('GET', `/auth/users/${userAId}`, null, tokenUserA);
    testAssert('GET /api/auth/users/:id fetches user by ID', getUserByIdRes.status === 200 && (getUserByIdRes.data?.data?.id || getUserByIdRes.data?.data?._id) === userAId, getUserByIdRes.status, 200, getUserByIdRes.latency);

    // PATCH /api/auth/users/:id
    const patchUserByIdRes = await apiCall('PATCH', `/auth/users/${userAId}`, { name: 'Alice Principal Dev' }, tokenUserA);
    testAssert('PATCH /api/auth/users/:id updates user by ID', patchUserByIdRes.status === 200, patchUserByIdRes.status, 200, patchUserByIdRes.latency);

    // -------------------------------------------------------------------------
    // 5. ROLE-BASED ACCESS CONTROL (RBAC): ADMIN vs USER (403 FORBIDDEN TEST)
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[5. Role-Based Access Control (RBAC 403 Forbidden Verification)]${COLORS.reset}`);

    // Regular User attempts Admin-Only Delete -> Must receive 403 Forbidden
    const userDeleteAttempt = await apiCall('DELETE', `/auth/users/${userBId}`, null, tokenUserA);
    testAssert('Regular user receives 403 Forbidden on Admin-only DELETE /auth/users/:id', userDeleteAttempt.status === 403, userDeleteAttempt.status, 403, userDeleteAttempt.latency);

    // Admin attempts Delete -> Must receive 200 OK
    const adminDeleteSuccess = await apiCall('DELETE', `/auth/users/${userBId}`, null, tokenAdmin);
    testAssert('Admin user successfully deletes user with 200 OK', adminDeleteSuccess.status === 200, adminDeleteSuccess.status, 200, adminDeleteSuccess.latency);

    // -------------------------------------------------------------------------
    // 6. TASK MANAGEMENT CRUD OPERATIONS
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[6. Task CRUD & Business Logic Operations]${COLORS.reset}`);

    // POST /api/tasks (Create Task)
    const taskPayload = {
        title: 'Implement Production Architecture',
        description: 'Ensure clean MVC, Joi validations, and data ownership security',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000).toISOString()
    };
    const createTaskRes = await apiCall('POST', '/tasks', taskPayload, tokenUserA);
    createdTaskId = createTaskRes.data?.data?.id || createTaskRes.data?.data?._id;
    testAssert('POST /api/tasks creates task bound to User A', createTaskRes.status === 201 && Boolean(createdTaskId), createTaskRes.status, 201, createTaskRes.latency);

    // GET /api/tasks (List user tasks with filters & pagination)
    const listTasksRes = await apiCall('GET', '/tasks?page=1&limit=10&status=pending', null, tokenUserA);
    testAssert('GET /api/tasks lists user-owned tasks with pagination', listTasksRes.status === 200 && Array.isArray(listTasksRes.data?.data?.tasks), listTasksRes.status, 200, listTasksRes.latency);

    // GET /api/tasks/:id
    const getTaskRes = await apiCall('GET', `/tasks/${createdTaskId}`, null, tokenUserA);
    testAssert('GET /api/tasks/:id retrieves task matching ID', getTaskRes.status === 200 && (getTaskRes.data?.data?.id || getTaskRes.data?.data?._id) === createdTaskId, getTaskRes.status, 200, getTaskRes.latency);

    // PATCH /api/tasks/:id (Partial Update)
    const patchTaskRes = await apiCall('PATCH', `/tasks/${createdTaskId}`, { status: 'in-progress', priority: 'urgent' }, tokenUserA);
    testAssert('PATCH /api/tasks/:id updates allowed fields (status, priority)', patchTaskRes.status === 200 && patchTaskRes.data?.data?.status === 'in-progress', patchTaskRes.status, 200, patchTaskRes.latency);

    // PUT /api/tasks/:id (Full Update)
    const putTaskRes = await apiCall('PUT', `/tasks/${createdTaskId}`, { title: 'Implement & Deploy Production Architecture', priority: 'high' }, tokenUserA);
    testAssert('PUT /api/tasks/:id updates task title', putTaskRes.status === 200 && putTaskRes.data?.data?.title.includes('Deploy'), putTaskRes.status, 200, putTaskRes.latency);

    // -------------------------------------------------------------------------
    // 7. SECURITY & DATA OWNERSHIP ISOLATION (USER A vs USER B)
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[7. Security & Cross-User Data Ownership Isolation]${COLORS.reset}`);

    // User Admin (or any other user) tries to access User A's task -> Must return 404 Not Found
    const crossUserGet = await apiCall('GET', `/tasks/${createdTaskId}`, null, tokenAdmin);
    testAssert('Other user CANNOT view User A task (Returns 404 Not Found)', crossUserGet.status === 404, crossUserGet.status, 404, crossUserGet.latency);

    const crossUserUpdate = await apiCall('PATCH', `/tasks/${createdTaskId}`, { title: 'Hacked Title' }, tokenAdmin);
    testAssert('Other user CANNOT update User A task (Returns 404 Not Found)', crossUserUpdate.status === 404, crossUserUpdate.status, 404, crossUserUpdate.latency);

    const crossUserDelete = await apiCall('DELETE', `/tasks/${createdTaskId}`, null, tokenAdmin);
    testAssert('Other user CANNOT delete User A task (Returns 404 Not Found)', crossUserDelete.status === 404, crossUserDelete.status, 404, crossUserDelete.latency);

    // -------------------------------------------------------------------------
    // 8. ERROR HANDLING & MALFORMED OBJECTID PROTECTION
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[8. Error Handling & Malformed ObjectId Guard]${COLORS.reset}`);

    const malformedIdRes = await apiCall('GET', '/tasks/invalid-object-id-999', null, tokenUserA);
    testAssert('Malformed ObjectId format parameter returns 400 Bad Request', malformedIdRes.status === 400, malformedIdRes.status, 400, malformedIdRes.latency);

    // -------------------------------------------------------------------------
    // 9. TASK DELETION & CLEANUP
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.yellow}${COLORS.bold}[9. Task Deletion & Final Verification]${COLORS.reset}`);

    const deleteTaskRes = await apiCall('DELETE', `/tasks/${createdTaskId}`, null, tokenUserA);
    testAssert('DELETE /api/tasks/:id deletes user-owned task with 200 OK', deleteTaskRes.status === 200, deleteTaskRes.status, 200, deleteTaskRes.latency);

    const getDeletedTaskRes = await apiCall('GET', `/tasks/${createdTaskId}`, null, tokenUserA);
    testAssert('Accessing deleted task returns 404 Not Found', getDeletedTaskRes.status === 404, getDeletedTaskRes.status, 404, getDeletedTaskRes.latency);

    // -------------------------------------------------------------------------
    // FINAL TEST SUMMARY
    // -------------------------------------------------------------------------
    console.log(`\n${COLORS.cyan}${COLORS.bold}========================================================================${COLORS.reset}`);
    console.log(`${COLORS.bold}TOTAL TESTS EXECUTED : ${totalTests}${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bold}PASSED               : ${passedTests} ✓${COLORS.reset}`);
    if (failedTests > 0) {
        console.log(`${COLORS.red}${COLORS.bold}FAILED               : ${failedTests} ✗${COLORS.reset}`);
    } else {
        console.log(`${COLORS.green}${COLORS.bold}FAILED               : 0 ✗ (ALL TESTS PASSED PERFECTLY!)${COLORS.reset}`);
    }
    console.log(`${COLORS.cyan}${COLORS.bold}========================================================================${COLORS.reset}\n`);

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runSmokeTests();
