#!/usr/bin/env node
'use strict';

require('dotenv').config();

const port = process.env.PORT || 3000;
const express = require("express");
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/avatars')) {
    fs.mkdirSync('uploads/avatars', { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${req.auth.utorid}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});
const jwtMiddleware = expressJwt({
    secret: JWT_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: false,
});

app.use(jwtMiddleware);

const resetRateLimiter = new Map();
const validateEmail = (email) => {
    const uoftEmailRegex = /^[a-zA-Z0-9._%+-]+@(mail\.)?utoronto\.ca$/;
    return uoftEmailRegex.test(email);
};

const validateUtorid = (utorid) => {
    const utoridRegex = /^[a-zA-Z0-9]{7,8}$/;
    return utoridRegex.test(utorid);
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
};
const requireRole = (...roles) => {
    return async (req, res, next) => {
        if (!req.auth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            req.user = user;

            // Check if user's role is one of the allowed roles
            if (!roles.includes(user.role)) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
const requireEventOrganizer = async (req, res, next) => {
    const eventId = parseInt(req.params.eventId);
    
    if (!req.auth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Managers and superusers have access
        if (user.role === 'manager' || user.role === 'superuser') {
            req.user = user;
            return next();
        }

        // Check if user is an organizer for this event
        const organizer = await prisma.eventOrganizer.findFirst({
            where: {
                eventId: eventId,
                userId: user.id,
            },
        });

        if (!organizer) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
app.post('/auth/tokens', async (req, res) => {
    try {
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Generate JWT
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const token = jwt.sign(
            { id: user.id, utorid: user.utorid, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/resets - Request password reset
app.post('/auth/resets', async (req, res) => {
    try {
        const { utorid } = req.body;

        if (!utorid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const clientIp = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const lastRequest = resetRateLimiter.get(clientIp);

        if (lastRequest && now - lastRequest < 60000) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        resetRateLimiter.set(clientIp, now);
        
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                expiresAt,
            },
        });

        res.status(202).json({
            expiresAt: expiresAt.toISOString(),
            resetToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/resets/:resetToken - Reset password
app.post('/auth/resets/:resetToken', async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password does not meet requirements' });
        }

        const userByToken = await prisma.user.findFirst({
            where: { resetToken },
        });

        if (!userByToken) {
            return res.status(404).json({ error: 'Invalid reset token' });
        }

        if (userByToken.expiresAt && new Date() > userByToken.expiresAt) {
            return res.status(410).json({ error: 'Reset token expired' });
        }

        if (userByToken.utorid !== utorid) {
            return res.status(401).json({ error: 'Utorid mismatch' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: userByToken.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                expiresAt: null,
            },
        });

        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/users', requireRole('cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const { utorid, name, email } = req.body;

        // Validate input
        if (!utorid || !name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validateUtorid(utorid)) {
            return res.status(400).json({ error: 'Invalid utorid format' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (name.length < 1 || name.length > 50) {
            return res.status(400).json({ error: 'Name must be 1-50 characters' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ utorid }, { email }],
            },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User with that utorid or email already exists' });
        }

        // Generate temporary password and reset token
        const tempPassword = await bcrypt.hash('temp', 10);
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const user = await prisma.user.create({
            data: {
                utorid,
                name,
                email,
                password: tempPassword,
                role: 'regular',
                resetToken,
                expiresAt,
            },
        });

        res.status(201).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            verified: user.verified,
            expiresAt: user.expiresAt.toISOString(),
            resetToken: user.resetToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/users', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const {
            name,
            role,
            verified,
            activated,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit' });
        }

        // Build filter
        const where = {};

        if (name) {
            where.OR = [
                { utorid: { contains: name } },
                { name: { contains: name } },
            ];
        }

        if (role) {
            where.role = role;
        }

        if (verified !== undefined) {
            where.verified = verified === 'true';
        }

        if (activated !== undefined) {
            if (activated === 'true') {
                where.lastLogin = { not: null };
            } else {
                where.lastLogin = null;
            }
        }

        const [count, results] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    lastLogin: true,
                    verified: true,
                    avatarUrl: true,
                },
            }),
        ]);

        res.json({ count, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/me - MUST be before /users/:userId to avoid matching 'me' as userId
app.get('/users/me', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
            include: {
                usedPromotions: {
                    select: {
                        promotionId: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get available promotions
        const now = new Date();
        const usedPromotionIds = user.usedPromotions.map(up => up.promotionId);
        
        const availablePromotions = await prisma.promotion.findMany({
            where: {
                type: 'onetime',
                startTime: { lte: now },
                endTime: { gte: now },
                NOT: {
                    id: { in: usedPromotionIds },
                },
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: availablePromotions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /users/me - MUST be before /users/:userId
app.patch('/users/me', requireRole('regular', 'cashier', 'manager', 'superuser'), upload.single('avatar'), async (req, res) => {
    try {
        const { name, email, birthday } = req.body;
        
        if (!name && !email && !birthday && !req.file) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const updateData = {};

        if (name !== undefined && name !== null) {
            if (name.length < 1 || name.length > 50) {
                return res.status(400).json({ error: 'Name must be 1-50 characters' });
            }
            updateData.name = name;
        }

        if (email !== undefined && email !== null) {
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            updateData.email = email;
        }

        if (birthday !== undefined && birthday !== null) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(birthday)) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
            // Validate it's an actual valid date (e.g., not 1990-13-41 or 1990-02-31)
            const date = new Date(birthday + 'T00:00:00Z');
            if (isNaN(date.getTime())) {
                return res.status(400).json({ error: 'Invalid date' });
            }
            const isoDate = date.toISOString().split('T')[0];
            if (isoDate !== birthday) {
                return res.status(400).json({ error: 'Invalid date' });
            }
            updateData.birthday = birthday;
        }

        if (req.file) {
            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        const user = await prisma.user.update({
            where: { id: req.auth.id },
            data: updateData,
        });

        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/users/:userId', requireRole('cashier', 'manager', 'superuser'), async (req, res) => {

    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                usedPromotions: {
                    select: {
                        promotionId: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Cashiers see limited info
        if (req.user.role === 'cashier') {
            // Get available one-time promotions
            const now = new Date();
            const usedPromotionIds = user.usedPromotions.map(up => up.promotionId);
            
            const availablePromotions = await prisma.promotion.findMany({
                where: {
                    type: 'onetime',
                    startTime: { lte: now },
                    endTime: { gte: now },
                    NOT: {
                        id: { in: usedPromotionIds },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    minSpending: true,
                    rate: true,
                    points: true,
                },
            });

            return res.json({
                id: user.id,
                utorid: user.utorid,
                name: user.name,
                points: user.points,
                verified: user.verified,
                promotions: availablePromotions,
            });
        }

        // Managers see full info
        const now = new Date();
        const usedPromotionIds = user.usedPromotions.map(up => up.promotionId);
        
        const availablePromotions = await prisma.promotion.findMany({
            where: {
                type: 'onetime',
                startTime: { lte: now },
                endTime: { gte: now },
                NOT: {
                    id: { in: usedPromotionIds },
                },
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: user.birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: availablePromotions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.patch('/users/:userId', requireRole('manager', 'superuser'), async (req, res, next) => {
    // Skip this route if userId is 'me' - let it go to /users/me route
    if (req.params.userId === 'me') {
        return next();
    }

    try {
        const userId = parseInt(req.params.userId);
        const { email, verified, suspicious, role } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const hasUpdates = (email !== undefined && email !== null) || 
                          (verified !== undefined && verified !== null) || 
                          (suspicious !== undefined && suspicious !== null) || 
                          (role !== undefined && role !== null);
        
        if (!hasUpdates) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updateData = {};

        if (email !== undefined && email !== null) {
            if (!validateEmail(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            updateData.email = email;
        }

        if (verified !== undefined && verified !== null) {
            if (typeof verified !== 'boolean') {
                return res.status(400).json({ error: 'Invalid verified value' });
            }
            // Can only set verified to true, not false
            if (verified === true) {
                updateData.verified = verified;
            }
        }

        if (suspicious !== undefined && suspicious !== null) {
            if (typeof suspicious !== 'boolean') {
                return res.status(400).json({ error: 'Invalid suspicious value' });
            }
            updateData.suspicious = suspicious;
        }

        if (role !== undefined && role !== null) {
            // Validate role is one of the valid values
            const validRoles = ['regular', 'cashier', 'manager', 'superuser'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            if (req.user.role === 'manager') {
                if (role !== 'regular' && role !== 'cashier') {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                if (role === 'cashier' && (user.suspicious || suspicious === true)) {
                    return res.status(400).json({ error: 'Cannot promote suspicious user to cashier' });
                }
            }

            updateData.role = role;
            if (role === 'cashier') {
                updateData.suspicious = false;
            }
        }

        // Check if there are actually any fields to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const response = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
        };

        if (email !== undefined && email !== null) response.email = updatedUser.email;
        if (verified !== undefined && verified !== null) response.verified = updatedUser.verified;
        if (suspicious !== undefined && suspicious !== null) response.suspicious = updatedUser.suspicious;
        if (role !== undefined && role !== null) response.role = updatedUser.role;

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /users/me/password
app.patch('/users/me/password', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const { old: oldPassword, new: newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ error: 'Password does not meet requirements' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(403).json({ error: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.auth.id },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
const calculatePointsEarned = async (spent, promotionIds) => {
    const baseRate = 1 / 0.25;
    let totalPoints = Math.round(spent * baseRate);

    if (promotionIds && promotionIds.length > 0) {
        const promotions = await prisma.promotion.findMany({
            where: { id: { in: promotionIds } },
        });

        for (const promo of promotions) {
            if (promo.minSpending && spent < promo.minSpending) {
                continue;
            }

            if (promo.rate) {
                totalPoints += Math.round(spent * promo.rate * 100);
            }

            if (promo.points) {
                totalPoints += promo.points;
            }
        }
    }

    return totalPoints;
};
app.post('/transactions', requireRole('cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const { utorid, type, spent, amount, relatedId, promotionIds, remark } = req.body;

        if (!utorid || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const customer = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!customer) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (type === 'purchase') {
            if (spent === undefined || spent <= 0) {
                return res.status(400).json({ error: 'Invalid spent amount' });
            }

            if (promotionIds && promotionIds.length > 0) {
                const now = new Date();
                const promotions = await prisma.promotion.findMany({
                    where: {
                        id: { in: promotionIds },
                    },
                });

                if (promotions.length !== promotionIds.length) {
                    return res.status(400).json({ error: 'Invalid promotion IDs' });
                }

                for (const promo of promotions) {
                    if (promo.startTime > now || promo.endTime < now) {
                        return res.status(400).json({ error: 'Promotion is not active' });
                    }

                    if (promo.type === 'onetime') {
                        const used = await prisma.userPromotion.findFirst({
                            where: {
                                userId: customer.id,
                                promotionId: promo.id,
                            },
                        });

                        if (used) {
                            return res.status(400).json({ error: 'Promotion already used' });
                        }
                    }
                }
            }

            const calculatedEarned = await calculatePointsEarned(spent, promotionIds);
            const isSuspicious = req.user.suspicious || false;
            const earned = isSuspicious ? 0 : calculatedEarned;

            const transaction = await prisma.transaction.create({
                data: {
                    userId: customer.id,
                    type: 'purchase',
                    amount: calculatedEarned,
                    spent,
                    remark: remark || null,
                    suspicious: isSuspicious,
                    createdBy: req.auth.id,
                },
            });

            if (promotionIds && promotionIds.length > 0) {
                await prisma.transactionPromotion.createMany({
                    data: promotionIds.map(promoId => ({
                        transactionId: transaction.id,
                        promotionId: promoId,
                    })),
                });

                // Mark one-time promotions as used
                const promotions = await prisma.promotion.findMany({
                    where: { id: { in: promotionIds } },
                });

                for (const promo of promotions) {
                    if (promo.type === 'onetime') {
                        await prisma.userPromotion.create({
                            data: {
                                userId: customer.id,
                                promotionId: promo.id,
                            },
                        });
                    }
                }
            }

            if (!isSuspicious) {
                await prisma.user.update({
                    where: { id: customer.id },
                    data: { points: { increment: earned } },
                });
            }

            const creator = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            res.status(201).json({
                id: transaction.id,
                utorid: customer.utorid,
                type: 'purchase',
                spent: transaction.spent,
                earned: earned,
                remark: transaction.remark,
                promotionIds: promotionIds || [],
                createdBy: creator.utorid,
            });
        } else if (type === 'adjustment') {
            if (req.user.role !== 'manager' && req.user.role !== 'superuser') {
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (amount === undefined || relatedId === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if related transaction exists
            const relatedTransaction = await prisma.transaction.findUnique({
                where: { id: relatedId },
            });

            if (!relatedTransaction) {
                return res.status(404).json({ error: 'Related transaction not found' });
            }

            const transaction = await prisma.transaction.create({
                data: {
                    userId: customer.id,
                    type: 'adjustment',
                    amount,
                    relatedId,
                    remark: remark || null,
                    createdBy: req.auth.id,
                },
            });

            // Add promotion links if any
            if (promotionIds && promotionIds.length > 0) {
                await prisma.transactionPromotion.createMany({
                    data: promotionIds.map(promoId => ({
                        transactionId: transaction.id,
                        promotionId: promoId,
                    })),
                });
            }

            // Update user points immediately
            await prisma.user.update({
                where: { id: customer.id },
                data: { points: { increment: amount } },
            });

            const creator = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            res.status(201).json({
                id: transaction.id,
                utorid: customer.utorid,
                amount: transaction.amount,
                type: 'adjustment',
                relatedId: transaction.relatedId,
                remark: transaction.remark,
                promotionIds: promotionIds || [],
                createdBy: creator.utorid,
            });
        } else {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /transactions - List transactions (Manager+)
app.get('/transactions', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const {
            name,
            createdBy,
            suspicious,
            promotionId,
            type,
            relatedId,
            amount,
            operator,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit' });
        }

        const where = {};

        if (name) {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { utorid: { contains: name } },
                        { name: { contains: name } },
                    ],
                },
                select: { id: true },
            });
            where.userId = { in: users.map(u => u.id) };
        }

        if (createdBy) {
            const creator = await prisma.user.findUnique({
                where: { utorid: createdBy },
            });
            if (creator) {
                where.createdBy = creator.id;
            }
        }

        if (suspicious !== undefined) {
            where.suspicious = suspicious === 'true';
        }

        if (promotionId) {
            const promoId = parseInt(promotionId);
            const txnPromotions = await prisma.transactionPromotion.findMany({
                where: { promotionId: promoId },
                select: { transactionId: true },
            });
            where.id = { in: txnPromotions.map(tp => tp.transactionId) };
        }

        if (type) {
            where.type = type;
            if (relatedId) {
                where.relatedId = parseInt(relatedId);
            }
        }

        if (amount && operator) {
            const amountNum = parseInt(amount);
            if (operator === 'gte') {
                where.amount = { gte: amountNum };
            } else if (operator === 'lte') {
                where.amount = { lte: amountNum };
            }
        }

        const [count, transactions] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { utorid: true } },
                    creator: { select: { utorid: true } },
                    promotions: { select: { promotionId: true } },
                },
            }),
        ]);

        const results = transactions.map(txn => {
            const result = {
                id: txn.id,
                utorid: txn.user.utorid,
                amount: txn.amount,
                type: txn.type,
                promotionIds: txn.promotions.map(p => p.promotionId),
                remark: txn.remark,
                createdBy: txn.creator.utorid,
            };

            if (txn.type === 'purchase') {
                result.spent = txn.spent;
                result.suspicious = txn.suspicious;
            } else if (txn.type === 'adjustment') {
                result.relatedId = txn.relatedId;
                result.suspicious = txn.suspicious;
            } else if (txn.type === 'redemption') {
                result.relatedId = txn.relatedId;
                result.redeemed = Math.abs(txn.amount);
            } else if (txn.type === 'transfer' || txn.type === 'event') {
                result.relatedId = txn.relatedId;
            }

            return result;
        });

        res.json({ count, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /transactions/:transactionId - Get transaction by ID
app.get('/transactions/:transactionId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                user: { select: { utorid: true } },
                creator: { select: { utorid: true } },
                promotions: { select: { promotionId: true } },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const result = {
            id: transaction.id,
            utorid: transaction.user.utorid,
            type: transaction.type,
            amount: transaction.amount,
            promotionIds: transaction.promotions.map(p => p.promotionId),
            remark: transaction.remark,
            createdBy: transaction.creator.utorid,
        };

        if (transaction.type === 'purchase') {
            result.spent = transaction.spent;
            result.suspicious = transaction.suspicious;
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /transactions/:transactionId/suspicious - Mark transaction as suspicious
app.patch('/transactions/:transactionId/suspicious', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const { suspicious } = req.body;

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        if (suspicious === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                user: { select: { utorid: true } },
                creator: { select: { utorid: true } },
                promotions: { select: { promotionId: true } },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Update transaction
        const updated = await prisma.transaction.update({
            where: { id: transactionId },
            data: { suspicious },
        });

        // Update user points
        if (transaction.suspicious && !suspicious) {
            // Was suspicious, now verified - add points
            await prisma.user.update({
                where: { id: transaction.userId },
                data: { points: { increment: transaction.amount } },
            });
        } else if (!transaction.suspicious && suspicious) {
            // Was verified, now suspicious - deduct points
            await prisma.user.update({
                where: { id: transaction.userId },
                data: { points: { decrement: transaction.amount } },
            });
        }

        res.json({
            id: updated.id,
            utorid: transaction.user.utorid,
            type: updated.type,
            spent: updated.spent,
            amount: updated.amount,
            promotionIds: transaction.promotions.map(p => p.promotionId),
            suspicious: updated.suspicious,
            remark: updated.remark,
            createdBy: transaction.creator.utorid,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /transactions/:transactionId/processed - Process redemption
app.patch('/transactions/:transactionId/processed', requireRole('cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId);
        const { processed } = req.body;

        if (isNaN(transactionId)) {
            return res.status(400).json({ error: 'Invalid transaction ID' });
        }

        if (processed !== true) {
            return res.status(400).json({ error: 'Processed must be true' });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                user: { select: { utorid: true } },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.type !== 'redemption') {
            return res.status(400).json({ error: 'Transaction is not a redemption' });
        }

        if (transaction.processed) {
            return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Update transaction
        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                processed: true,
                relatedId: req.auth.id, // Store cashier who processed it
            },
        });

        // Deduct points from user
        await prisma.user.update({
            where: { id: transaction.userId },
            data: { points: { increment: transaction.amount } }, // amount is negative
        });

        const cashier = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        res.json({
            id: transaction.id,
            utorid: transaction.user.utorid,
            type: 'redemption',
            processedBy: cashier.utorid,
            redeemed: Math.abs(transaction.amount),
            remark: transaction.remark,
            createdBy: transaction.user.utorid,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /users/me/transactions - Create redemption transaction
app.post('/users/me/transactions', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const { type, amount, remark } = req.body;

        if (type !== 'redemption') {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }

        if (amount === undefined || amount === null) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        const amountNum = Number(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        const amountInt = Math.round(amountNum);

        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        if (!user.verified) {
            return res.status(403).json({ error: 'User not verified' });
        }

        if (user.points < amountInt) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'redemption',
                amount: -amountInt,
                remark: remark || null,
                processed: false,
                createdBy: user.id,
            },
        });

        res.status(201).json({
            id: transaction.id,
            utorid: user.utorid,
            type: 'redemption',
            processedBy: null,
            amount: amountInt,
            remark: transaction.remark,
            createdBy: user.utorid,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /users/:userId/transactions - Create transfer transaction
app.post('/users/:userId/transactions', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const recipientId = parseInt(req.params.userId);
        const { type, amount, remark } = req.body;

        if (isNaN(recipientId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (type !== 'transfer') {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const sender = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        if (!sender.verified) {
            return res.status(403).json({ error: 'User not verified' });
        }

        if (sender.points < amount) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
        });

        if (!recipient) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        // Create sender transaction
        const senderTxn = await prisma.transaction.create({
            data: {
                userId: sender.id,
                type: 'transfer',
                amount: -amount,
                relatedId: recipient.id,
                remark: remark || null,
                createdBy: sender.id,
            },
        });

        // Create recipient transaction
        await prisma.transaction.create({
            data: {
                userId: recipient.id,
                type: 'transfer',
                amount: amount,
                relatedId: sender.id,
                remark: remark || null,
                createdBy: sender.id,
            },
        });

        // Update points
        await prisma.user.update({
            where: { id: sender.id },
            data: { points: { decrement: amount } },
        });

        await prisma.user.update({
            where: { id: recipient.id },
            data: { points: { increment: amount } },
        });

        res.status(201).json({
            id: senderTxn.id,
            sender: sender.utorid,
            recipient: recipient.utorid,
            type: 'transfer',
            sent: amount,
            remark: senderTxn.remark,
            createdBy: sender.utorid,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /users/me/transactions - List current user's transactions
app.get('/users/me/transactions', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const {
            type,
            relatedId,
            promotionId,
            amount,
            operator,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit' });
        }

        const where = { userId: req.auth.id };

        if (type) {
            where.type = type;
            if (relatedId) {
                where.relatedId = parseInt(relatedId);
            }
        }

        if (promotionId) {
            const promoId = parseInt(promotionId);
            const txnPromotions = await prisma.transactionPromotion.findMany({
                where: { promotionId: promoId },
                select: { transactionId: true },
            });
            where.id = { in: txnPromotions.map(tp => tp.transactionId) };
        }

        if (amount && operator) {
            const amountNum = parseInt(amount);
            if (operator === 'gte') {
                where.amount = { gte: amountNum };
            } else if (operator === 'lte') {
                where.amount = { lte: amountNum };
            }
        }

        const [count, transactions] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    creator: { select: { utorid: true } },
                    promotions: { select: { promotionId: true } },
                },
            }),
        ]);

        const results = transactions.map(txn => {
            const result = {
                id: txn.id,
                type: txn.type,
                amount: txn.amount,
                promotionIds: txn.promotions.map(p => p.promotionId),
                remark: txn.remark,
                createdBy: txn.creator.utorid,
            };

            if (txn.type === 'purchase') {
                result.spent = txn.spent;
            } else if (txn.type === 'adjustment' || txn.type === 'transfer') {
                result.relatedId = txn.relatedId;
            }

            return result;
        });

        res.json({ count, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =============================================================================
// EVENT ENDPOINTS
// =============================================================================

// POST /events - Create event
app.post('/events', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Empty payload' });
        }

        const { name, description, location, startTime, endTime, capacity, points } = req.body;

        if (!name || !description || !location || !startTime || !endTime || points === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        if (start < now) {
            return res.status(400).json({ error: 'Start time cannot be in the past' });
        }

        if (end <= start) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        if (capacity !== null && capacity !== undefined && capacity <= 0) {
            return res.status(400).json({ error: 'Invalid capacity' });
        }

        if (points <= 0) {
            return res.status(400).json({ error: 'Invalid points' });
        }

        const event = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startTime: start,
                endTime: end,
                capacity: capacity || null,
                pointsRemain: points,
            },
        });

        res.status(201).json({
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            organizers: [],
            guests: [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /events - List events
app.get('/events', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const {
            name,
            location,
            started,
            ended,
            showFull,
            published,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit' });
        }

        if (started !== undefined && ended !== undefined) {
            return res.status(400).json({ error: 'Cannot specify both started and ended' });
        }

        const where = {};
        const now = new Date();

        // Regular users can only see published events
        if (req.user.role === 'regular' || req.user.role === 'cashier') {
            where.published = true;
        } else if (published !== undefined) {
            where.published = published === 'true';
        }

        if (name) {
            where.name = { contains: name };
        }

        if (location) {
            where.location = { contains: location };
        }

        if (started !== undefined) {
            if (started === 'true') {
                where.startTime = { lte: now };
            } else {
                where.startTime = { gt: now };
            }
        }

        if (ended !== undefined) {
            if (ended === 'true') {
                where.endTime = { lte: now };
            } else {
                where.endTime = { gt: now };
            }
        }

        const [count, events] = await Promise.all([
            prisma.event.count({ where }),
            prisma.event.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    guests: true,
                },
            }),
        ]);

        const results = [];
        for (const event of events) {
            const numGuests = event.guests.length;
            
            // Skip full events if showFull is false
            if (showFull !== 'true' && event.capacity && numGuests >= event.capacity) {
                continue;
            }

            const result = {
                id: event.id,
                name: event.name,
                location: event.location,
                startTime: event.startTime.toISOString(),
                endTime: event.endTime.toISOString(),
                capacity: event.capacity,
                numGuests,
            };

            // Managers see more details
            if (req.user.role === 'manager' || req.user.role === 'superuser') {
                result.pointsRemain = event.pointsRemain;
                result.pointsAwarded = event.pointsAwarded;
                result.published = event.published;
            }

            results.push(result);
        }

        res.json({ count, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /events/:eventId - Get event details
app.get('/events/:eventId', async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                            },
                        },
                    },
                },
                guests: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if user is authorized to see unpublished events
        if (!req.auth) {
            // Not authenticated - can only see published events
            if (!event.published) {
                return res.status(404).json({ error: 'Event not found' });
            }
        } else {
            const user = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            const isOrganizer = event.organizers.some(o => o.userId === req.auth.id);
            const isManager = user && (user.role === 'manager' || user.role === 'superuser');

            if (!event.published && !isOrganizer && !isManager) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Organizer or manager - return full details
            if (isOrganizer || isManager) {
                return res.json({
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    location: event.location,
                    startTime: event.startTime.toISOString(),
                    endTime: event.endTime.toISOString(),
                    capacity: event.capacity,
                    pointsRemain: event.pointsRemain,
                    pointsAwarded: event.pointsAwarded,
                    published: event.published,
                    organizers: event.organizers.map(o => o.user),
                    guests: event.guests.map(g => g.user),
                });
            }
        }

        // Regular user - limited details
        res.json({
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            organizers: event.organizers.map(o => o.user),
            numGuests: event.guests.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /events/:eventId - Update event
app.patch('/events/:eventId', requireEventOrganizer, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { name, description, location, startTime, endTime, capacity, points, published } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const updateData = {};
        const now = new Date();
        const isManager = req.user.role === 'manager' || req.user.role === 'superuser';

        // Cannot update certain fields after event has started
        if (now > event.startTime) {
            if (name || description || location || startTime || capacity !== undefined) {
                return res.status(400).json({ error: 'Cannot update these fields after event has started' });
            }
        }

        // Cannot update end time after event has ended
        if (now > event.endTime && endTime) {
            return res.status(400).json({ error: 'Cannot update end time after event has ended' });
        }

        // Validate time updates
        if (startTime || endTime) {
            const newStartTime = startTime ? new Date(startTime) : event.startTime;
            const newEndTime = endTime ? new Date(endTime) : event.endTime;

            if (startTime && newStartTime < now) {
                return res.status(400).json({ error: 'Start time cannot be in the past' });
            }

            if (newEndTime <= newStartTime) {
                return res.status(400).json({ error: 'End time must be after start time' });
            }

            if (startTime) updateData.startTime = newStartTime;
            if (endTime) updateData.endTime = newEndTime;
        }

        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (location) updateData.location = location;

        if (capacity !== undefined) {
            if (capacity !== null && capacity <= 0) {
                return res.status(400).json({ error: 'Invalid capacity' });
            }

            if (capacity !== null && event.guests.length > capacity) {
                return res.status(400).json({ error: 'Capacity too small for current guests' });
            }

            updateData.capacity = capacity;
        }

        // Only managers can update points and published status
        if (points !== undefined && points !== null) {
            if (!isManager) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const pointsNum = Number(points);
            if (isNaN(pointsNum) || pointsNum <= 0) {
                return res.status(400).json({ error: 'Invalid points' });
            }
            
            const pointsInt = Math.round(pointsNum);

            const pointsDiff = pointsInt - (event.pointsRemain + event.pointsAwarded);
            if (event.pointsRemain + pointsDiff < 0) {
                return res.status(400).json({ error: 'Cannot reduce points below awarded amount' });
            }

            updateData.pointsRemain = event.pointsRemain + pointsDiff;
        }

        if (published !== undefined && published !== null) {
            if (!isManager) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            if (published === false) {
                return res.status(400).json({ error: 'Cannot unpublish event' });
            }

            updateData.published = published;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updated = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
        });

        const response = {
            id: updated.id,
            name: updated.name,
            location: updated.location,
        };

        if (published !== undefined && published !== null) response.published = updated.published;
        if (description) response.description = updated.description;
        if (startTime) response.startTime = updated.startTime.toISOString();
        if (endTime) response.endTime = updated.endTime.toISOString();
        if (capacity !== undefined) response.capacity = updated.capacity;
        if (points !== undefined && points !== null) {
            response.pointsRemain = updated.pointsRemain;
            response.pointsAwarded = updated.pointsAwarded;
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /events/:eventId - Delete event
app.delete('/events/:eventId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.published) {
            return res.status(400).json({ error: 'Cannot delete published event' });
        }

        await prisma.event.delete({
            where: { id: eventId },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /events/:eventId/organizers - Add organizer
app.post('/events/:eventId/organizers', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { utorid } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        if (!utorid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const now = new Date();
        if (now > event.endTime) {
            return res.status(410).json({ error: 'Event has ended' });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is already a guest
        const isGuest = await prisma.eventGuest.findFirst({
            where: {
                eventId,
                userId: user.id,
            },
        });

        if (isGuest) {
            return res.status(400).json({ error: 'User is already a guest' });
        }

        // Add organizer
        await prisma.eventOrganizer.create({
            data: {
                eventId,
                userId: user.id,
            },
        });

        const updatedEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(201).json({
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            organizers: updatedEvent.organizers.map(o => o.user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /events/:eventId/organizers/:userId - Remove organizer
app.delete('/events/:eventId/organizers/:userId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);

        if (isNaN(eventId) || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await prisma.eventOrganizer.deleteMany({
            where: {
                eventId,
                userId,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /events/:eventId/guests - Add guest (by organizer or manager)
app.post('/events/:eventId/guests', requireEventOrganizer, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { utorid } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        if (!utorid) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
        const isOrganizer = await prisma.eventOrganizer.findFirst({
            where: {
                eventId,
                userId: req.auth.id,
            },
        });

        if (!event.published && !isOrganizer && !isManager) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const now = new Date();
        if (now > event.endTime) {
            return res.status(410).json({ error: 'Event has ended' });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is already a guest
        const existingGuest = await prisma.eventGuest.findFirst({
            where: {
                eventId,
                userId: user.id,
            },
        });

        if (existingGuest) {
            return res.status(400).json({ error: 'User is already a guest' });
        }

        // Check if user is an organizer
        const userIsOrganizer = await prisma.eventOrganizer.findFirst({
            where: {
                eventId,
                userId: user.id,
            },
        });

        if (userIsOrganizer) {
            return res.status(400).json({ error: 'User is an organizer' });
        }

        // Check capacity after checking for duplicates
        if (event.capacity && event.guests.length >= event.capacity) {
            return res.status(410).json({ error: 'Event is full' });
        }

        // Add guest
        await prisma.eventGuest.create({
            data: {
                eventId,
                userId: user.id,
            },
        });

        res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
            },
            numGuests: event.guests.length + 1,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /events/:eventId/guests/me - RSVP to event (MUST be before /:userId route)
app.post('/events/:eventId/guests/me', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (!event.published) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const now = new Date();
        if (now > event.endTime) {
            return res.status(410).json({ error: 'Event has ended' });
        }

        if (event.capacity && event.guests.length >= event.capacity) {
            return res.status(410).json({ error: 'Event is full' });
        }

        // Check if already a guest
        const existing = await prisma.eventGuest.findFirst({
            where: {
                eventId,
                userId: req.auth.id,
            },
        });

        if (existing) {
            return res.status(400).json({ error: 'Already registered' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.auth.id },
        });

        // Add guest
        await prisma.eventGuest.create({
            data: {
                eventId,
                userId: req.auth.id,
            },
        });

        res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
            },
            numGuests: event.guests.length + 1,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /events/:eventId/guests/me - Cancel RSVP (MUST be before /:userId route)
app.delete('/events/:eventId/guests/me', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const now = new Date();
        if (now > event.endTime) {
            return res.status(410).json({ error: 'Event has ended' });
        }

        const guest = await prisma.eventGuest.findFirst({
            where: {
                eventId,
                userId: req.auth.id,
            },
        });

        if (!guest) {
            return res.status(404).json({ error: 'Not registered for this event' });
        }

        await prisma.eventGuest.delete({
            where: { id: guest.id },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /events/:eventId/guests/:userId - Remove guest (manager only)
app.delete('/events/:eventId/guests/:userId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const userId = parseInt(req.params.userId);

        if (isNaN(eventId) || isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await prisma.eventGuest.deleteMany({
            where: {
                eventId,
                userId,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /events/:eventId/transactions - Award points to guests
app.post('/events/:eventId/transactions', requireEventOrganizer, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        const { type, utorid, amount, remark } = req.body;

        if (isNaN(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        if (type !== 'event' || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                guests: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (utorid) {
            // Award to specific guest
            const guest = event.guests.find(g => g.user && g.user.utorid === utorid);

            if (!guest) {
                return res.status(400).json({ error: 'User not on guest list' });
            }
            
            if (!guest.user) {
                return res.status(400).json({ error: 'User not on guest list' });
            }

            if (event.pointsRemain < amount) {
                return res.status(400).json({ error: 'Insufficient points remaining' });
            }

            const transaction = await prisma.transaction.create({
                data: {
                    userId: guest.userId,
                    type: 'event',
                    amount: amount,
                    relatedId: eventId,
                    remark: remark || null,
                    createdBy: req.auth.id,
                },
            });

            // Update event points
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: { decrement: amount },
                    pointsAwarded: { increment: amount },
                },
            });

            // Update user points
            await prisma.user.update({
                where: { id: guest.userId },
                data: { points: { increment: amount } },
            });

            const creator = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            res.status(201).json({
                id: transaction.id,
                recipient: guest.user.utorid,
                awarded: amount,
                type: 'event',
                relatedId: eventId,
                remark: transaction.remark || null,
                createdBy: creator.utorid,
            });
        } else {
            // Award to all guests
            if (event.pointsRemain < amount * event.guests.length) {
                return res.status(400).json({ error: 'Insufficient points remaining' });
            }

            const transactions = [];

            for (const guest of event.guests) {
                const transaction = await prisma.transaction.create({
                    data: {
                        userId: guest.userId,
                        type: 'event',
                        amount: amount,
                        relatedId: eventId,
                        remark: remark || null,
                        createdBy: req.auth.id,
                    },
                });

                // Update user points
                await prisma.user.update({
                    where: { id: guest.userId },
                    data: { points: { increment: amount } },
                });

                transactions.push(transaction);
            }

            // Update event points
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: { decrement: amount * event.guests.length },
                    pointsAwarded: { increment: amount * event.guests.length },
                },
            });

            const creator = await prisma.user.findUnique({
                where: { id: req.auth.id },
            });

            const results = transactions.map((txn, idx) => ({
                id: txn.id,
                recipient: event.guests[idx].user.utorid,
                awarded: amount,
                type: 'event',
                relatedId: eventId,
                remark: txn.remark || null,
                createdBy: creator.utorid,
            }));

            res.status(201).json(results);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =============================================================================
// PROMOTION ENDPOINTS
// =============================================================================

// POST /promotions - Create promotion
app.post('/promotions', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'Empty payload' });
        }

        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        if (!name || !description || !type || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Accept both "one-time" and "onetime"
        let dbType = type;
        if (type === 'one-time') {
            dbType = 'onetime';
        } else if (type !== 'automatic' && type !== 'onetime') {
            return res.status(400).json({ error: 'Invalid promotion type' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        if (start < now) {
            return res.status(400).json({ error: 'Start time cannot be in the past' });
        }

        if (end <= start) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        if (minSpending !== null && minSpending !== undefined && minSpending < 0) {
            return res.status(400).json({ error: 'Invalid minimum spending' });
        }

        if (rate !== null && rate !== undefined && rate < 0) {
            return res.status(400).json({ error: 'Invalid rate' });
        }

        if (points !== null && points !== undefined && (points < 0 || !Number.isInteger(points))) {
            return res.status(400).json({ error: 'Invalid points' });
        }

        const promotion = await prisma.promotion.create({
            data: {
                name,
                description,
                type: dbType,
                startTime: start,
                endTime: end,
                minSpending: minSpending || null,
                rate: rate || null,
                points: points || null,
            },
        });

        res.status(201).json({
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            startTime: promotion.startTime.toISOString(),
            endTime: promotion.endTime.toISOString(),
            minSpending: promotion.minSpending ?? 0,
            rate: promotion.rate ?? 0,
            points: promotion.points ?? 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /promotions - List promotions
app.get('/promotions', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const {
            name,
            type,
            started,
            ended,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({ error: 'Invalid page number' });
        }

        if (isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid limit' });
        }

        const where = {};
        const now = new Date();

        // Regular users can only see active promotions they haven't used
        const isManager = req.user.role === 'manager' || req.user.role === 'superuser';

        if (!isManager) {
            // Active promotions only
            where.startTime = { lte: now };
            where.endTime = { gte: now };

            // Exclude used promotions for current user
            const usedPromotions = await prisma.userPromotion.findMany({
                where: { userId: req.auth.id },
                select: { promotionId: true },
            });

            if (usedPromotions.length > 0) {
                where.NOT = {
                    id: { in: usedPromotions.map(up => up.promotionId) },
                };
            }
        } else {
            // Managers can filter by started/ended
            if (started !== undefined && ended !== undefined) {
                return res.status(400).json({ error: 'Cannot specify both started and ended' });
            }

            if (started !== undefined) {
                if (started === 'true') {
                    where.startTime = { lte: now };
                } else {
                    where.startTime = { gt: now };
                }
            }

            if (ended !== undefined) {
                if (ended === 'true') {
                    where.endTime = { lte: now };
                } else {
                    where.endTime = { gt: now };
                }
            }
        }

        if (name) {
            where.name = { contains: name };
        }

        if (type) {
            // Accept both "one-time" and "onetime"
            where.type = type === 'one-time' ? 'onetime' : type;
        }

        const [count, promotions] = await Promise.all([
            prisma.promotion.count({ where }),
            prisma.promotion.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
        ]);

        const results = promotions.map(promo => {
            const result = {
                id: promo.id,
                name: promo.name,
                type: promo.type,
                endTime: promo.endTime.toISOString(),
                minSpending: promo.minSpending ?? 0,
                rate: promo.rate ?? 0,
                points: promo.points ?? 0,
            };

            if (isManager) {
                result.startTime = promo.startTime.toISOString();
            }

            return result;
        });

        res.json({ count, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /promotions/:promotionId - Get promotion details
app.get('/promotions/:promotionId', requireRole('regular', 'cashier', 'manager', 'superuser'), async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId);

        if (isNaN(promotionId)) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
        });

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        // Regular users can only see active promotions
        const isManager = req.user.role === 'manager' || req.user.role === 'superuser';
        const now = new Date();

        if (!isManager) {
            if (promotion.startTime > now || promotion.endTime < now) {
                return res.status(404).json({ error: 'Promotion not found' });
            }
        }

        const response = {
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            endTime: promotion.endTime.toISOString(),
            minSpending: promotion.minSpending ?? 0,
            rate: promotion.rate ?? 0,
            points: promotion.points ?? 0,
        };

        if (isManager) {
            response.startTime = promotion.startTime.toISOString();
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /promotions/:promotionId - Update promotion
app.patch('/promotions/:promotionId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId);
        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        if (isNaN(promotionId)) {
            return res.status(400).json({ error: 'Invalid promotion ID' });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
        });

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        const updateData = {};
        const now = new Date();

        // Cannot update certain fields after promotion has started
        if (now > promotion.startTime) {
            if (name || description || type || startTime || minSpending || rate || points) {
                return res.status(400).json({ error: 'Cannot update these fields after promotion has started' });
            }
        }

        // Cannot update endTime after promotion has ended
        if (now > promotion.endTime && endTime) {
            return res.status(400).json({ error: 'Cannot update end time after promotion has ended' });
        }

        // Validate time updates
        if (startTime || endTime) {
            const newStartTime = startTime ? new Date(startTime) : promotion.startTime;
            const newEndTime = endTime ? new Date(endTime) : promotion.endTime;

            if (startTime && newStartTime < now) {
                return res.status(400).json({ error: 'Start time cannot be in the past' });
            }

            if (newEndTime <= newStartTime) {
                return res.status(400).json({ error: 'End time must be after start time' });
            }

            if (startTime) updateData.startTime = newStartTime;
            if (endTime) updateData.endTime = newEndTime;
        }

        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (type) {
            // Accept both "one-time" and "onetime"
            let dbType = type;
            if (type === 'one-time') {
                dbType = 'onetime';
            } else if (type !== 'automatic' && type !== 'onetime') {
                return res.status(400).json({ error: 'Invalid promotion type' });
            }
            updateData.type = dbType;
        }
        if (minSpending !== undefined) {
            if (minSpending !== null && minSpending < 0) {
                return res.status(400).json({ error: 'Invalid minimum spending' });
            }
            updateData.minSpending = minSpending;
        }
        if (rate !== undefined) {
            if (rate !== null && rate < 0) {
                return res.status(400).json({ error: 'Invalid rate' });
            }
            updateData.rate = rate;
        }
        if (points !== undefined) {
            if (points !== null && (points < 0 || !Number.isInteger(points))) {
                return res.status(400).json({ error: 'Invalid points' });
            }
            updateData.points = points;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updated = await prisma.promotion.update({
            where: { id: promotionId },
            data: updateData,
        });

        const response = {
            id: updated.id,
            name: updated.name,
            type: updated.type,
        };

        if (endTime !== undefined) response.endTime = updated.endTime.toISOString();

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /promotions/:promotionId - Delete promotion
app.delete('/promotions/:promotionId', requireRole('manager', 'superuser'), async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId);

        if (isNaN(promotionId)) {
            return res.status(400).json({ error: 'Invalid promotion ID' });
        }

        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
        });

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        const now = new Date();
        if (promotion.startTime <= now) {
            return res.status(403).json({ error: 'Cannot delete promotion that has started' });
        }

        await prisma.promotion.delete({
            where: { id: promotionId },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});