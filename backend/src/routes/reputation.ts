import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getReputationHistory } from '../lib/reputation';

const router = express.Router();

// JWT auth middleware (duplicate kept local to avoid import coupling)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// GET /api/reputation/history?page=&limit=
router.get('/history', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const data = await getReputationHistory(prisma, { userId, page, limit });
    res.json(data);
  } catch (e) {
    console.error('Failed to load reputation history', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as reputationRouter };
