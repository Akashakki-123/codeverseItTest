import { Router } from 'express';
import * as taskController from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
    validate,
    createTaskSchema,
    updateTaskSchema,
    listTasksQuerySchema,
    idParamSchema
} from '../middlewares/validations/task.validator.js';

const taskRouter = Router();

// Protect all task endpoints with authentication
taskRouter.use(authenticate);

// POST /api/tasks - Create Task
taskRouter.post('/', validate(createTaskSchema, 'body'), taskController.create);

// GET /api/tasks - List logged-in user's tasks with pagination & search
taskRouter.get('/', validate(listTasksQuerySchema, 'query'), taskController.list);

// GET /api/tasks/:id - Get specific user-owned task
taskRouter.get('/:id', validate(idParamSchema, 'params'), taskController.getById);

// PUT /api/tasks/:id - Update allowed task fields
taskRouter.put(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateTaskSchema, 'body'),
    taskController.update
);

// PATCH /api/tasks/:id - Partial update allowed task fields
taskRouter.patch(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateTaskSchema, 'body'),
    taskController.update
);

// DELETE /api/tasks/:id - Delete user-owned task
taskRouter.delete('/:id', validate(idParamSchema, 'params'), taskController.remove);

export default taskRouter;

