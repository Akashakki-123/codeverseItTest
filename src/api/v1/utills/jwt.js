import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'machine_test_secret_key_default';

/**
 * Generate JWT token
 * @param {Object} payload - { id, email, role, ... }
 * @param {string} [expiresIn] - e.g. '7d', '24h', '1h'
 */
export const createToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    return jwt.sign(payload, getSecret(), { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token
 */
export const verifyToken = (token) => {
    return jwt.verify(token, getSecret());
};
