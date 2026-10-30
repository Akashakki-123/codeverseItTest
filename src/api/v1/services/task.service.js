import taskModel from '../models/task.model.js';
import mongoose from 'mongoose';

/**
 * Create a new task belonging strictly to authenticated user
 */
export async function createTask(userId, taskData) {
    const task = await taskModel.create({
        ...taskData,
        userId: new mongoose.Types.ObjectId(userId)
    });

    return {
        status: true,
        statusCode: 201,
        message: 'Task created successfully',
        data: {
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt
        }
    };
}

/**
 * List tasks for the logged-in user with pagination, search, status & priority filters, and sorting
 */
export async function listUserTasks(userId, query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Filter strictly by authenticated userId to prevent data leakage
    const filter = {
        userId: new mongoose.Types.ObjectId(userId)
    };

    if (query.status) {
        filter.status = query.status;
    }

    if (query.priority) {
        filter.priority = query.priority;
    }

    if (query.search && query.search.trim() !== '') {
        const searchRegex = new RegExp(query.search.trim(), 'i');
        filter.$or = [
            { title: searchRegex },
            { description: searchRegex }
        ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    const [tasks, total] = await Promise.all([
        taskModel.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        taskModel.countDocuments(filter)
    ]);

    const formattedTasks = tasks.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
    }));

    return {
        status: true,
        statusCode: 200,
        message: 'Tasks retrieved successfully',
        data: {
            tasks: formattedTasks,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        }
    };
}

/**
 * Get a specific task - strictly user-owned
 */
export async function getTaskById(userId, taskId) {
    const task = await taskModel.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        userId: new mongoose.Types.ObjectId(userId)
    });

    if (!task) {
        return {
            status: false,
            statusCode: 404,
            message: 'Task not found or you do not have permission to access it'
        };
    }

    return {
        status: true,
        statusCode: 200,
        message: 'Task retrieved successfully',
        data: {
            id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
        }
    };
}

/**
 * Update allowed fields of a task - strictly user-owned
 */
export async function updateTask(userId, taskId, updateData) {
    // Only allow permitted fields to be updated
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate'];
    const filteredUpdate = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            filteredUpdate[key] = updateData[key];
        }
    }

    const updatedTask = await taskModel.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(taskId),
            userId: new mongoose.Types.ObjectId(userId)
        },
        { $set: filteredUpdate },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        return {
            status: false,
            statusCode: 404,
            message: 'Task not found or you do not have permission to update it'
        };
    }

    return {
        status: true,
        statusCode: 200,
        message: 'Task updated successfully',
        data: {
            id: updatedTask._id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            dueDate: updatedTask.dueDate,
            updatedAt: updatedTask.updatedAt
        }
    };
}

/**
 * Delete a task - strictly user-owned
 */
export async function deleteTask(userId, taskId) {
    const deletedTask = await taskModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(taskId),
        userId: new mongoose.Types.ObjectId(userId)
    });

    if (!deletedTask) {
        return {
            status: false,
            statusCode: 404,
            message: 'Task not found or you do not have permission to delete it'
        };
    }

    return {
        status: true,
        statusCode: 200,
        message: 'Task deleted successfully',
        data: {
            id: deletedTask._id
        }
    };
}

