import userModel from '../models/user.model.js';
import taskModel from '../models/task.model.js';
import mongoose from 'mongoose';
import { encryptPassword, verifyPassword } from '../utills/encrypt.js';
import { createToken } from '../utills/jwt.js';

/**
 * Register / Create a new user
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

/**
 * Get all users with pagination, role filtering, search, and sorting
 * @param {Object} query - { page, limit, role, search, sortBy, order }
 */
export async function getAllUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.role) {
        filter.role = query.role;
    }

    if (query.search && query.search.trim() !== '') {
        const searchRegex = new RegExp(query.search.trim(), 'i');
        filter.$or = [
            { name: searchRegex },
            { email: searchRegex }
        ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    const [users, total] = await Promise.all([
        userModel.find(filter)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        userModel.countDocuments(filter)
    ]);

    const formattedUsers = users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
    }));

    return {
        status: true,
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: {
            users: formattedUsers,
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
 * Get user by specific ID
 * @param {string} userId
 */
export async function getUserById(userId) {
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
        message: 'User retrieved successfully',
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    };
}

/**
 * Update user details by ID
 * @param {string} userId
 * @param {Object} updateData - { name, email, role }
 */
export async function updateUser(userId, updateData) {
    const allowedUpdates = ['name', 'email', 'role'];
    const filteredUpdate = {};

    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            filteredUpdate[key] = updateData[key];
        }
    }

    // If email is being changed, check for collision
    if (filteredUpdate.email) {
        const emailLower = filteredUpdate.email.toLowerCase().trim();
        const existing = await userModel.findOne({
            email: emailLower,
            _id: { $ne: new mongoose.Types.ObjectId(userId) }
        });

        if (existing) {
            return {
                status: false,
                statusCode: 400,
                message: 'Email is already in use by another user'
            };
        }
        filteredUpdate.email = emailLower;
    }

    if (filteredUpdate.name) {
        filteredUpdate.name = filteredUpdate.name.trim();
    }

    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { $set: filteredUpdate },
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        return {
            status: false,
            statusCode: 404,
            message: 'User not found'
        };
    }

    return {
        status: true,
        statusCode: 200,
        message: 'User updated successfully',
        data: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        }
    };
}

/**
 * Delete user and cleanup their tasks
 * @param {string} userId
 */
export async function deleteUser(userId) {
    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
        return {
            status: false,
            statusCode: 404,
            message: 'User not found'
        };
    }

    // Cascade delete user's tasks
    await taskModel.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

    return {
        status: true,
        statusCode: 200,
        message: 'User and associated tasks deleted successfully',
        data: {
            id: user._id
        }
    };
}

/**
 * Change / Reset user password
 * @param {string} userId
 * @param {Object} payload - { currentPassword, newPassword }
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await userModel.findById(userId);
    if (!user) {
        return {
            status: false,
            statusCode: 404,
            message: 'User not found'
        };
    }

    const isMatch = verifyPassword(currentPassword, user.password);
    if (!isMatch) {
        return {
            status: false,
            statusCode: 400,
            message: 'Current password is incorrect'
        };
    }

    user.password = encryptPassword(newPassword);
    await user.save();

    return {
        status: true,
        statusCode: 200,
        message: 'Password changed successfully',
        data: {
            id: user._id
        }
    };
}
