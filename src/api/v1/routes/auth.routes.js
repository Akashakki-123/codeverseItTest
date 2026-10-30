import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    validate,
    registerSchema,
    loginSchema,
    updateUserSchema,
    changePasswordSchema,
    listUsersQuerySchema,
    idParamSchema
} from '../middlewares/validations/task.validator.js';

const authRouter = Router();

// --- Public Routes ---
authRouter.post('/register', validate(registerSchema, 'body'), authController.register);
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

// --- Authenticated User Operations ---
authRouter.get('/me', authenticate, authController.getMe);
authRouter.patch('/me', authenticate, validate(updateUserSchema, 'body'), authController.updateMe);
authRouter.put('/me', authenticate, validate(updateUserSchema, 'body'), authController.updateMe);
authRouter.post('/change-password', authenticate, validate(changePasswordSchema, 'body'), authController.changePassword);

// --- User CRUD & Get All Operations ---
// Get All Users (supports pagination, search, role filters, sorting)
authRouter.get('/users', authenticate, validate(listUsersQuerySchema, 'query'), authController.getAllUsers);
authRouter.get('/all', authenticate, validate(listUsersQuerySchema, 'query'), authController.getAllUsers);

// Create User via admin / auth
authRouter.post('/users', authenticate, authorize('admin'), validate(registerSchema, 'body'), authController.register);

// Get User by ID
authRouter.get('/users/:id', authenticate, validate(idParamSchema, 'params'), authController.getUserById);

// Update User by ID (Admin or Owner)
authRouter.put('/users/:id', authenticate, validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), authController.updateUser);
authRouter.patch('/users/:id', authenticate, validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), authController.updateUser);

// Delete User by ID (Admin only)
authRouter.delete('/users/:id', authenticate, authorize('admin'), validate(idParamSchema, 'params'), authController.deleteUser);

export default authRouter;
