import * as taskService from '../services/task.service.js';
import { sendResponse, unknownError } from '../helpers/response.helper.js';

export async function create(req, res) {
    try {
        const { status, statusCode, message, data } = await taskService.createTask(req.user.id, req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function list(req, res) {
    try {
        const { status, statusCode, message, data } = await taskService.listUserTasks(req.user.id, req.query);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function getById(req, res) {
    try {
        const { status, statusCode, message, data } = await taskService.getTaskById(req.user.id, req.params.id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function update(req, res) {
    try {
        const { status, statusCode, message, data } = await taskService.updateTask(req.user.id, req.params.id, req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function remove(req, res) {
    try {
        const { status, statusCode, message, data } = await taskService.deleteTask(req.user.id, req.params.id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

