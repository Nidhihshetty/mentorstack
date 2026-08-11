import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

const router = express.Router();
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function getFrontendBaseUrl(): string {
    const configured = process.env.FRONTEND_URL?.trim();
    if (configured) {
        return configured.replace(/\/$/, '');
    }

    const firstCorsOrigin = process.env.CORS_ORIGIN
        ?.split(',')
        .map((origin) => origin.trim())
        .find(Boolean);

    return (firstCorsOrigin || 'http://localhost:3000').replace(/\/$/, '');
}

// Signup route
router.post('/signup', async (req: any, res: any) => {
    try {
        const { email, password, role, firstName, lastName, skills = [], bio = '' } = req.body;

        console.log('📝 Signup request received:', { email, role, firstName, lastName, skills, bio });

        // Validate required fields
        if (!email || !password || !role || !firstName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Validate role
        if (!['mentor', 'mentee', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Combine firstName and lastName into name field (handle empty lastName)
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();
        
        if (!fullName) {
            return res.status(400).json({ message: 'Name cannot be empty' });
        }

        // Ensure skills is an array
        const skillsArray = Array.isArray(skills) ? skills : [];

        console.log('📝 Creating user with data:', { email, role, fullName, skillsArray, bio });

        // Create user with role
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role as Role,
                name: fullName,
                bio: bio || '',
                skills: skillsArray,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                bio: true,
                skills: true,
                avatarUrl: true
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                email: newUser.email,
                role: newUser.role 
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ 
            message: 'Server error',
            details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
        });
    }
});

// Login route
router.post('/login', async (req: any, res: any) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot password route
router.post('/forgot-password', async (req: any, res: any) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.trim();
        const safeMessage = 'If an account exists with that email, a reset link has been sent.';

        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: 'insensitive'
                }
            },
            select: { id: true, email: true, name: true }
        });

        // Prevent email enumeration by returning same success response.
        if (!user) {
            return res.json({ message: safeMessage });
        }

        const resetToken = randomBytes(32).toString('hex');
        const resetTokenHash = hashResetToken(resetToken);
        const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetTokenHash,
                passwordResetExpiresAt: resetTokenExpiresAt
            }
        });

        const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

        // TODO: Replace with email provider integration in production.
        console.log(`🔐 Password reset link for ${user.email}: ${resetUrl}`);

        if (process.env.NODE_ENV === 'development') {
            return res.json({ message: safeMessage, resetUrl });
        }

        return res.json({ message: safeMessage });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Reset password route
router.post('/reset-password', async (req: any, res: any) => {
    try {
        const { token, password } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'Reset token is required' });
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const hashedToken = hashResetToken(token);

        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpiresAt: {
                    gt: new Date()
                }
            },
            select: { id: true }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiresAt: null
            }
        });

        return res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Logout route (mainly for client-side token clearing, but can be used for logging)
router.post('/logout', async (req: any, res: any) => {
    try {
        // You could log the logout event here if needed
        // For JWT, logout is primarily handled client-side by removing the token
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user route
router.get('/me', async (req: any, res: any) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: decoded.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                bio: true,
                skills: true,
                avatarUrl: true,
                jobTitle: true,
                department: true,
                location: true,
                reputation: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                bio: user.bio,
                skills: user.skills,
                avatarUrl: user.avatarUrl,
                jobTitle: user.jobTitle,
                department: user.department,
                location: user.location,
                reputation: user.reputation
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
});

export default router;
