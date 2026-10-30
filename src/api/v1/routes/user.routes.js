import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    validate,
    registerSchema,
    updateUserSchema,
    listUsersQuerySchema,
    idParamSchema
} from '../middlewares/validations/task.validator.js';

const userRouter = Router();

// Protect user management routes
userRouter.use(authenticate);

// GET /api/users - Get all users with pagination, filters, search
userRouter.get('/', validate(listUsersQuerySchema, 'query'), authController.getAllUsers);
userRouter.get('/all', validate(listUsersQuerySchema, 'query'), authController.getAllUsers);

// POST /api/users - Admin create user
userRouter.post('/', authorize('admin'), validate(registerSchema, 'body'), authController.register);
userRouter.post('/add', authorize('admin'), validate(registerSchema, 'body'), authController.register);

// GET /api/users/:id - Get user by ID
userRouter.get('/:id', validate(idParamSchema, 'params'), authController.getUserById);

// PUT & PATCH /api/users/:id - Update user by ID
userRouter.put('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), authController.updateUser);
userRouter.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), authController.updateUser);

// DELETE /api/users/:id - Delete user by ID (Admin only)
userRouter.delete('/:id', authorize('admin'), validate(idParamSchema, 'params'), authController.deleteUser);

export default userRouter;

