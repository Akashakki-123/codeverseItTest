import { verifyToken } from '../utills/jwt.js';
import { unauthorized, forbidden } from '../helpers/response.helper.js';

/**
 * Authentication Middleware:
 * Verifies Bearer JWT token from Authorization header and attaches decoded user to req.user
 */
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorized(res, 'Access denied. No authentication token provided.');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return unauthorized(res, 'Access token is required.');
        }

        const decoded = verifyToken(token);
        // req.user has { id: user._id, email: user.email, role: user.role }
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return unauthorized(res, 'Authentication token has expired. Please log in again.');
        }
        return unauthorized(res, 'Invalid authentication token.');
    }
}

/**
 * Authorization Middleware (Role-Based Access Control):
 * @param  {...string} allowedRoles - e.g. 'admin', 'user'
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return unauthorized(res, 'User not authenticated.');
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return forbidden(res, `Forbidden: Access requires ${allowedRoles.join(' or ')} role.`);
        }

        next();
    };
}
