import Joi from 'joi';
import mongoose from 'mongoose';
import { badRequest } from '../../helpers/response.helper.js';

// Custom ObjectId validator
const objectIdValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

// Generic validation middleware runner
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source];
        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message.replace(/['"]/g, '')).join(', ');
            return badRequest(res, errorMessage, 'ValidationError');
        }

        req[source] = value;
        next();
    };
};

// Auth Validators
export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Name is required'
    }),
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).max(100).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
    role: Joi.string().valid('user', 'admin').optional()
});

export const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    })
});

// Task Validators
export const createTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Title is required',
        'any.required': 'Title is required'
    }),
    description: Joi.string().trim().allow('').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').optional(),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'archived').default('pending').optional(),
    dueDate: Joi.date().iso().allow(null).optional()
});

export const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().allow('').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'archived').optional(),
    dueDate: Joi.date().iso().allow(null).optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

export const listTasksQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'archived').optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    search: Joi.string().trim().allow('').optional(),
    sortBy: Joi.string().valid('createdAt', 'dueDate', 'priority', 'title').default('createdAt').optional(),
    order: Joi.string().valid('asc', 'desc').default('desc').optional()
});

export const idParamSchema = Joi.object({
    id: Joi.string().custom(objectIdValidator, 'ObjectId validation').required().messages({
        'any.invalid': 'Invalid task ID format. Must be a valid 24-character MongoDB ObjectId',
        'any.required': 'Task ID parameter is required'
    })
});
