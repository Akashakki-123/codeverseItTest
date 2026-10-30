import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../middlewares/validations/task.validator.js';

const authRouter = Router();

// Public routes
authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

// Protected routes
authRouter.get('/me', authenticate, authController.getMe);

export default authRouter;

