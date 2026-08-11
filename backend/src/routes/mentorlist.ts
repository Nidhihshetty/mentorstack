import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { awardReputation } from '../lib/reputation';
import { Role, MentorshipStatus } from '@prisma/client';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Get all mentors (for "All" tab)
router.get('/mentors', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.userId;

        const mentors = await prisma.user.findMany({
            where: { role: Role.mentor },
            select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                avatarUrl: true,
                skills: true,
                location: true,
                reputation: true,
                jobTitle: true,
                department: true,
                createdAt: true
            },
            orderBy: {
                reputation: 'desc' // Order by reputation (highest first)
            }
        });

        // Get user's mentorship requests to determine status
        const userRequests = await prisma.mentorshipRequest.findMany({
            where: {
                menteeUserId: currentUserId
            },
            select: {
                mentorUserId: true,
                status: true,
                requestMessage: true,
                createdAt: true
            }
        });

        // Map mentors with their request status
        const mentorsWithStatus = mentors.map(mentor => {
            const request = userRequests.find(r => r.mentorUserId === mentor.id);
            return {
                ...mentor,
                status: request?.status || null,
                requestMessage: request?.requestMessage || null,
                requestDate: request?.createdAt || null
            };
        });

        res.json(mentorsWithStatus);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get mentorship requests by status
router.get('/requests/:status', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.userId;
        const { status } = req.params;

        // Validate status
        const validStatuses = ['pending', 'accepted', 'rejected'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ message: 'Invalid status. Use: pending, accepted, or rejected' });
        }

        const mentorshipStatus = status.toLowerCase() as MentorshipStatus;

        const requests = await prisma.mentorshipRequest.findMany({
            where: {
                menteeUserId: currentUserId,
                status: mentorshipStatus
            },
            include: {
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        bio: true,
                        avatarUrl: true,
                        skills: true,
                        location: true,
                        reputation: true,
                        jobTitle: true,
                        department: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to match frontend format
        const formattedRequests = requests.map(req => ({
            ...req.mentor,
            status: req.status,
            requestMessage: req.requestMessage,
            requestDate: req.createdAt,
            requestId: req.id
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send mentorship request
router.post('/request', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.userId;
        const userRole = req.user.role;

        // Only mentees can send requests
        if (userRole !== 'mentee') {
            return res.status(403).json({ message: 'Only mentees can send mentorship requests' });
        }

        const { mentorId, message } = req.body;

        if (!mentorId || !message) {
            return res.status(400).json({ message: 'Mentor ID and message are required' });
        }

        // Check if mentor exists and is actually a mentor
        const mentor = await prisma.user.findFirst({
            where: {
                id: Number.parseInt(mentorId),
                role: Role.mentor
            }
        });

        if (!mentor) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        // Check if request already exists
        const existingRequest = await prisma.mentorshipRequest.findUnique({
            where: {
                mentorUserId_menteeUserId: {
                    mentorUserId: Number.parseInt(mentorId),
                    menteeUserId: currentUserId
                }
            }
        });

        if (existingRequest) {
            return res.status(400).json({
                message: `You already have a ${existingRequest.status} request with this mentor`
            });
        }

        // Create the mentorship request and award reputation in a transaction
        const { request, rep } = await prisma.$transaction(async (tx) => {
            const request = await tx.mentorshipRequest.create({
                data: {
                    mentorUserId: Number.parseInt(mentorId),
                    menteeUserId: currentUserId,
                    status: MentorshipStatus.pending,
                    requestMessage: message
                },
                include: {
                    mentor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            bio: true,
                            avatarUrl: true,
                            skills: true,
                            location: true,
                            jobTitle: true,
                            department: true
                        }
                    }
                }
            });

            const rep = await awardReputation(tx as any, {
                userId: currentUserId,
                action: 'mentorship_request_sent',
                entityType: 'mentorship_request',
                entityId: request.id,
                customDescription: 'Taking initiative'
            });

            return { request, rep };
        });

        res.status(201).json({
            message: 'Mentorship request sent successfully',
            request: {
                ...request.mentor,
                status: request.status,
                requestMessage: request.requestMessage,
                requestDate: request.createdAt,
                requestId: request.id
            },
            reputation: rep
        });
    } catch (error) {
        console.error('Error sending mentorship request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel/Delete mentorship request (only if pending)
router.delete('/request/:mentorId', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user.userId;
        const { mentorId } = req.params;

        // Find the request
        const request = await prisma.mentorshipRequest.findUnique({
            where: {
                mentorUserId_menteeUserId: {
                    mentorUserId: Number.parseInt(mentorId),
                    menteeUserId: currentUserId
                }
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Only allow canceling pending requests
        if (request.status !== MentorshipStatus.pending) {
            return res.status(400).json({
                message: `Cannot cancel ${request.status} request`
            });
        }

        // Delete the request
        await prisma.mentorshipRequest.delete({
            where: {
                mentorUserId_menteeUserId: {
                    mentorUserId: Number.parseInt(mentorId),
                    menteeUserId: currentUserId
                }
            }
        });

        res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
        console.error('Error canceling request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get mentor statistics (optional - for additional info)
router.get('/mentor/:id/stats', authenticateToken, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const mentor = await prisma.user.findFirst({
            where: {
                id: Number.parseInt(id),
                role: Role.mentor
            },
            include: {
                _count: {
                    select: {
                        answers: true,
                        articles: true,
                        mentorConnections: true,
                        mentorRequests: {
                            where: {
                                status: MentorshipStatus.accepted
                            }
                        }
                    }
                }
            }
        });

        if (!mentor) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        res.json({
            answersProvided: mentor._count.answers,
            articlesWritten: mentor._count.articles,
            activeConnections: mentor._count.mentorConnections,
            totalAcceptedRequests: mentor._count.mentorRequests,
            reputation: mentor.reputation
        });
    } catch (error) {
        console.error('Error fetching mentor stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export { router as mentorListRouter };
