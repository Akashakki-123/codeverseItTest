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
        const query = req.validatedQuery || req.query || {};
        const { status, statusCode, message, data } = await taskService.listUserTasks(req.user.id, query);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function getById(req, res) {
    try {
        const id = req.validatedParams?.id || req.params.id;
        const { status, statusCode, message, data } = await taskService.getTaskById(req.user.id, id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function update(req, res) {
    try {
        const id = req.validatedParams?.id || req.params.id;
        const { status, statusCode, message, data } = await taskService.updateTask(req.user.id, id, req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function remove(req, res) {
    try {
        const id = req.validatedParams?.id || req.params.id;
        const { status, statusCode, message, data } = await taskService.deleteTask(req.user.id, id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}
