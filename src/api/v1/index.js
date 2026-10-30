import { Router } from 'express';
import authRouter from './routes/auth.routes.js';
import taskRouter from './routes/task.routes.js';

const router = Router();

// Functional Task API routes as required by assignment specification
router.use('/auth', authRouter);
router.use('/tasks', taskRouter);

// Existing user routes for backward compatibility

export default router;
