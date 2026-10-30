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

export async function updateMe(req, res) {
    try {
        // Users can update their own name/email (not role)
        const updateData = { name: req.body.name, email: req.body.email };
        const { status, statusCode, message, data } = await authService.updateUser(req.user.id, updateData);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function getAllUsers(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.getAllUsers(req.query);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function getUserById(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.getUserById(req.params.id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function updateUser(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.updateUser(req.params.id, req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function deleteUser(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.deleteUser(req.params.id);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}

export async function changePassword(req, res) {
    try {
        const { status, statusCode, message, data } = await authService.changePassword(req.user.id, req.body);
        return sendResponse(res, statusCode, status, message, status ? null : message, data);
    } catch (error) {
        return unknownError(res, error);
    }
}
