import userModel from '../models/user.model.js';
import { encryptPassword, verifyPassword } from '../utills/encrypt.js';
import { createToken } from '../utills/jwt.js';

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 */
export async function registerUser({ name, email, password, role }) {
    const existingUser = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        return {
            status: false,
            statusCode: 400,
            message: 'Email is already registered. Please login or use a different email.'
        };
    }

    const hashedPassword = encryptPassword(password);
    const newUser = await userModel.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'user'
    });

    const userProfile = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
    };

    const token = createToken({
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
    });

    return {
        status: true,
        statusCode: 201,
        message: 'User registered successfully',
        data: {
            user: userProfile,
            token
        }
    };
}

/**
 * Login user and issue JWT
 * @param {Object} credentials - { email, password }
 */
export async function loginUser({ email, password }) {
    const user = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        return {
            status: false,
            statusCode: 401,
            message: 'Invalid email or password'
        };
    }

    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
        return {
            status: false,
            statusCode: 401,
            message: 'Invalid email or password'
        };
    }

    const token = createToken({
        id: user._id,
        email: user.email,
        role: user.role
    });

    const userProfile = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };

    return {
        status: true,
        statusCode: 200,
        message: 'Login successful',
        data: {
            user: userProfile,
            token
        }
    };
}

/**
 * Get profile of currently authenticated user
 * @param {string} userId
 */
export async function getUserProfile(userId) {
    const user = await userModel.findById(userId).select('-password');
    if (!user) {
        return {
            status: false,
            statusCode: 404,
            message: 'User not found'
        };
    }

    return {
        status: true,
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: user
    };
}

