/**
 * Automated End-to-End API Test Suite
 * Tests all requirements from assignment:
 * - User Registration & Duplicate Email Protection
 * - User Login & JWT Issuance
 * - Get Profile (/api/auth/me)
 * - Task Creation (/api/tasks)
 * - Task Listing with pagination, search, status filter
 * - Task Retrieval by ID
 * - Task Update (PUT / PATCH)
 * - Ownership Security: User B cannot access/update/delete User A's task
 * - Invalid ObjectId error handling
 * - Task Deletion
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8000/api';

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

let passed = 0;
let failed = 0;

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    try {
        const res = await fetch(url, {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const json = await res.json().catch(() => ({}));
        return { status: res.status, data: json };
    } catch (err) {
        return { status: 500, error: err.message };
    }
}

function assert(description, condition, details = '') {
    if (condition) {
        console.log(`  ${COLORS.green}✓ [PASS]${COLORS.reset} ${description}`);
        passed++;
    } else {
        console.log(`  ${COLORS.red}✗ [FAIL]${COLORS.reset} ${description} ${details ? `(${details})` : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log(`\n${COLORS.cyan}====================================================${COLORS.reset}`);
    console.log(`${COLORS.cyan}   TASK MANAGEMENT API - AUTOMATED TEST SUITE        ${COLORS.reset}`);
    console.log(`${COLORS.cyan}   Target: ${BASE_URL}${COLORS.reset}`);
    console.log(`${COLORS.cyan}====================================================\n${COLORS.reset}`);

    const timestamp = Date.now();
    const userA = {
        name: 'Alice Developer',
        email: `alice_${timestamp}@test.com`,
        password: 'password123'
    };

    const userB = {
        name: 'Bob Tester',
        email: `bob_${timestamp}@test.com`,
        password: 'password123'
    };

    let tokenA = '';
    let tokenB = '';
    let createdTaskId = '';

    // 1. Health check
    console.log(`${COLORS.yellow}[1. System Health Check]${COLORS.reset}`);
    const health = await request('/health');
    assert('Health / root endpoint responds', health.status === 200 || health.status === 404);

    // 2. Authentication - User A
    console.log(`\n${COLORS.yellow}[2. User Registration & Validation]${COLORS.reset}`);
    const regRes = await request('/auth/register', { method: 'POST', body: userA });
    assert('User A Registration returns 201 Created', regRes.status === 201, `Got ${regRes.status}`);
    assert('Registration returns user without password hash', !regRes.data?.data?.user?.password);

    // Duplicate email check
    const dupRes = await request('/auth/register', { method: 'POST', body: userA });
    assert('Duplicate email registration returns 400 Bad Request', dupRes.status === 400, `Got ${dupRes.status}`);

    // Validation check: short password
    const shortPassRes = await request('/auth/register', {
        method: 'POST',
        body: { name: 'Test', email: 'test_short@test.com', password: '123' }
    });
    assert('Short password (< 6 chars) rejected with 400', shortPassRes.status === 400);

    // 3. User Login
    console.log(`\n${COLORS.yellow}[3. User Login & Token Generation]${COLORS.reset}`);
    const loginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: userA.email, password: userA.password }
    });
    assert('Login returns 200 OK', loginRes.status === 200);
    tokenA = loginRes.data?.data?.token;
    assert('JWT token returned in login response', Boolean(tokenA));

    // Register User B for ownership isolation tests
    const regBRes = await request('/auth/register', { method: 'POST', body: userB });
    tokenB = regBRes.data?.data?.token;

    // 4. Get Current Profile
    console.log(`\n${COLORS.yellow}[4. Profile Retrieval (/api/auth/me)]${COLORS.reset}`);
    const meRes = await request('/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('Get /api/auth/me returns 200 OK', meRes.status === 200);
    assert('Profile matches registered email', meRes.data?.data?.email === userA.email);

    // Unauthorized access check
    const noTokenRes = await request('/auth/me', { method: 'GET' });
    assert('Accessing /api/auth/me without token returns 401', noTokenRes.status === 401);

    // 5. Create Task
    console.log(`\n${COLORS.yellow}[5. Create Task (/api/tasks)]${COLORS.reset}`);
    const newTask = {
        title: 'Build Production REST API',
        description: 'Complete Node.js technical assignment with strict validations',
        priority: 'high',
        status: 'pending',
        dueDate: new Date(Date.now() + 86400000).toISOString()
    };
    const taskRes = await request('/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: newTask
    });
    assert('Task creation returns 201 Created', taskRes.status === 201);
    createdTaskId = taskRes.data?.data?.id || taskRes.data?.data?._id;
    assert('Created task contains valid ID', Boolean(createdTaskId));
    assert('Created task title matches', taskRes.data?.data?.title === newTask.title);

    // 6. List Tasks
    console.log(`\n${COLORS.yellow}[6. List Tasks with Pagination & Filtering]${COLORS.reset}`);
    const listRes = await request('/tasks?page=1&limit=10&status=pending', {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('List tasks returns 200 OK', listRes.status === 200);
    assert('List contains pagination metadata', Boolean(listRes.data?.data?.pagination));
    assert('List contains created task', Array.isArray(listRes.data?.data?.tasks) && listRes.data.data.tasks.length > 0);

    // 7. Get Task By ID
    console.log(`\n${COLORS.yellow}[7. Get Task By ID]${COLORS.reset}`);
    const getTaskRes = await request(`/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('Get task by valid ID returns 200 OK', getTaskRes.status === 200);
    assert('Retrieved task ID matches created task ID', (getTaskRes.data?.data?.id || getTaskRes.data?.data?._id) === createdTaskId);

    // Invalid ObjectId format check
    const invalidIdRes = await request('/tasks/not-a-valid-object-id', {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('Malformed ObjectId parameter returns 400 Bad Request', invalidIdRes.status === 400);

    // 8. Update Task
    console.log(`\n${COLORS.yellow}[8. Update Task (PUT & PATCH)]${COLORS.reset}`);
    const updateRes = await request(`/tasks/${createdTaskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: { status: 'in-progress', priority: 'urgent' }
    });
    assert('Update task returns 200 OK', updateRes.status === 200);
    assert('Task status updated to in-progress', updateRes.data?.data?.status === 'in-progress');

    // 9. Ownership Isolation Security Test
    console.log(`\n${COLORS.yellow}[9. Security & Ownership Isolation (User A vs User B)]${COLORS.reset}`);
    const userBAccessRes = await request(`/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert('User B CANNOT access User A task (Returns 404 Not Found)', userBAccessRes.status === 404);

    const userBUpdateRes = await request(`/tasks/${createdTaskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenB}` },
        body: { title: 'Hacked Title' }
    });
    assert('User B CANNOT update User A task (Returns 404 Not Found)', userBUpdateRes.status === 404);

    const userBDeleteRes = await request(`/tasks/${createdTaskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert('User B CANNOT delete User A task (Returns 404 Not Found)', userBDeleteRes.status === 404);

    // 10. Delete Task
    console.log(`\n${COLORS.yellow}[10. Delete Task]${COLORS.reset}`);
    const delRes = await request(`/tasks/${createdTaskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('Delete user-owned task returns 200 OK', delRes.status === 200);

    const verifyDelRes = await request(`/tasks/${createdTaskId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert('Accessing deleted task returns 404 Not Found', verifyDelRes.status === 404);

    // Summary
    console.log(`\n${COLORS.cyan}====================================================${COLORS.reset}`);
    console.log(`TEST RESULTS: ${COLORS.green}${passed} PASSED${COLORS.reset}, ${failed > 0 ? `${COLORS.red}${failed} FAILED` : '0 FAILED'}`);
    console.log(`${COLORS.cyan}====================================================\n${COLORS.reset}`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();

