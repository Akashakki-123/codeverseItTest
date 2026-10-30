import { Router } from 'express';
import authRouter from './routes/auth.routes.js';
import taskRouter from './routes/task.routes.js';
import userRouter from './routes/user.routes.js';

const router = Router();

// Functional routes
router.use('/auth', authRouter);
router.use('/tasks', taskRouter);
router.use('/users', userRouter);
router.use('/user', userRouter);

export default router;
