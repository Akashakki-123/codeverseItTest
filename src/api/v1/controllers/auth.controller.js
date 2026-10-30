import * as authService from '../services/auth.service.js';
import { sendResponse, unknownError } from '../helpers/response.helper.js';

export async function register(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.registerUser(req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function login(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.loginUser(req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function getMe(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.getUserProfile(req.user.id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

