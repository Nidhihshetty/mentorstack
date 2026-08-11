import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { Role } from '@prisma/client';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Admin Login
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== Role.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current admin user
router.get('/me', requireAdmin, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ admin });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ error: 'Failed to get admin data' });
  }
});

// Admin logout (client-side token removal, server-side optional)
router.post('/logout', requireAdmin, async (req: any, res: any) => {
  try {
    // In a more advanced setup, you might invalidate the token in a blacklist
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export { router as adminAuthRouter };
