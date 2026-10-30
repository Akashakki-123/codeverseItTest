import mongoose from 'mongoose';

/**
 * Standardized Response Formatter
 * Complies with assignment spec: { success, message, data }
 * while maintaining backward compatibility with existing codebase { status, subCode, error, items }
 */
export async function sendResponse(res, statusCode, successStatus, message, error = null, data = null) {
    const response = {
        success: Boolean(successStatus),
        status: Boolean(successStatus),
        subCode: statusCode,
        message: message || '',
        data: data !== undefined && data !== null ? data : undefined,
        items: data !== undefined && data !== null ? data : undefined
    };

    if (error) {
        response.error = error;
    }

    if (res.tokenInfo) {
        response.tokenInfo = res.tokenInfo;
    }

    return res.status(statusCode).json(response);
}

// 200 OK
export async function success(res, message, data) {
    return sendResponse(res, 200, true, message, null, data);
}

// 201 Created
export async function created(res, message, data) {
    return sendResponse(res, 201, true, message, null, data);
}

// 400 Bad Request
export async function badRequest(res, message, error = null) {
    return sendResponse(res, 400, false, message, error || message, null);
}

// 401 Unauthorized
export async function unauthorized(res, message = 'Unauthorized access') {
    return sendResponse(res, 401, false, message, 'Unauthorized', null);
}

// 403 Forbidden
export async function forbidden(res, message = 'Forbidden: Access denied') {
    return sendResponse(res, 403, false, message, 'Forbidden', null);
}

// 404 Not Found
export async function notFound(res, message = 'Resource not found') {
    return sendResponse(res, 404, false, message, 'NotFound', null);
}

// 500 Internal / Unknown Error
export async function unknownError(res, error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Internal Server Error';
    return sendResponse(res, 500, false, 'An unexpected error occurred', errorMessage, null);
}

export async function serverValidation(res, error) {
    return sendResponse(res, 400, false, 'Validation Error', error, null);
}

export async function onError(res, message, error) {
    return sendResponse(res, 400, false, message, error, null);
}

export async function invalid(res, message, data = null) {
    return sendResponse(res, 400, false, message, 'InvalidRequest', data);
}
