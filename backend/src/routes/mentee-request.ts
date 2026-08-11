import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { awardReputation } from '../lib/reputation';
import { MentorshipStatus, Role } from '@prisma/client';

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

// ==================== 1. GET ALL MENTORSHIP REQUESTS FOR MENTOR ====================
// GET /api/mentee-request/requests
// Returns all mentorship requests sent to the current mentor (authenticated user)
router.get('/requests', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Verify the user is a mentor
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true }
        });

        if (!user || user.role !== Role.mentor) {
            return res.status(403).json({ error: 'Access denied. Only mentors can view mentorship requests.' });
        }

        // Fetch all mentorship requests where current user is the mentor
        const requests = await prisma.mentorshipRequest.findMany({
            where: {
                mentorUserId: currentUserId
            },
            include: {
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        bio: true,
                        skills: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to match frontend RequestCard interface
        const transformedRequests = requests.map(request => ({
            id: request.id.toString(),
            menteeId: request.menteeUserId,
            name: request.mentee.name,
            email: request.mentee.email,
            avatar: request.mentee.avatarUrl,
            jobTitle: request.mentee.jobTitle,
            department: request.mentee.department,
            bio: request.mentee.bio,
            skills: request.mentee.skills,
            status: request.status.charAt(0).toUpperCase() + request.status.slice(1), // Convert 'pending' to 'Pending'
            fullMessage: request.requestMessage || 'No message provided',
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));

        return res.status(200).json({
            success: true,
            requests: transformedRequests,
            total: transformedRequests.length
        });

    } catch (error) {
        console.error('Error fetching mentorship requests:', error);
        return res.status(500).json({
            error: 'Failed to fetch mentorship requests',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ==================== 2. ACCEPT MENTORSHIP REQUEST ====================
// POST /api/mentee-request/accept/:requestId
// Accepts a mentorship request - updates MentorshipRequest status and creates Connection
router.post('/accept/:requestId', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user?.userId;
    const requestId = Number.parseInt(req.params.requestId);

        if (!currentUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

    if (Number.isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        // Verify the user is a mentor
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true }
        });

        if (!user || user.role !== Role.mentor) {
            return res.status(403).json({ error: 'Access denied. Only mentors can accept requests.' });
        }

        // Find the mentorship request
        const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
            where: { id: requestId }
        });

        if (!mentorshipRequest) {
            return res.status(404).json({ error: 'Mentorship request not found' });
        }

        // Verify the request is for this mentor
        if (mentorshipRequest.mentorUserId !== currentUserId) {
            return res.status(403).json({ error: 'You are not authorized to accept this request' });
        }

        // Check if request is already processed
        if (mentorshipRequest.status !== MentorshipStatus.pending) {
            return res.status(400).json({
                error: `Request has already been ${mentorshipRequest.status}`
            });
        }

        // Use a transaction to update MentorshipRequest, create Connection & Conversation, and award reputation
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update MentorshipRequest status to 'accepted'
            const updatedRequest = await tx.mentorshipRequest.update({
                where: { id: requestId },
                data: {
                    status: MentorshipStatus.accepted,
                    updatedAt: new Date()
                },
                include: {
                    mentee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                            jobTitle: true,
                            department: true
                        }
                    }
                }
            });

            // 2. Create a Connection record
            const connection = await tx.connection.create({
                data: {
                    mentorUserId: currentUserId,
                    menteeUserId: mentorshipRequest.menteeUserId,
                    acceptedAt: new Date()
                },
                include: {
                    mentee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true
                        }
                    }
                }
            });

            // 3. Create a Conversation for this connection
            const conversation = await tx.conversation.create({
                data: {
                    connectionId: connection.id
                }
            });

            // 4. Award reputation to mentor (+10, unlimited)
            const rep = await awardReputation(tx as any, {
                userId: currentUserId,
                action: 'mentorship_request_accepted',
                entityType: 'mentorship_request',
                entityId: updatedRequest.id,
                customDescription: 'Helping others'
            });

            return {
                mentorshipRequest: updatedRequest,
                connection,
                conversation,
                reputation: rep
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Mentorship request accepted successfully',
            data: {
                requestId: result.mentorshipRequest.id,
                status: result.mentorshipRequest.status,
                connectionId: result.connection.id,
                conversationId: result.conversation.id,
                mentee: result.mentorshipRequest.mentee,
                reputation: result.reputation
            }
        });

    } catch (error) {
        console.error('Error accepting mentorship request:', error);

        // Handle unique constraint violation (connection already exists)
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({
                error: 'A connection with this mentee already exists'
            });
        }

        return res.status(500).json({
            error: 'Failed to accept mentorship request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ==================== 3. REJECT MENTORSHIP REQUEST ====================
// POST /api/mentee-request/reject/:requestId
// Rejects a mentorship request - only updates MentorshipRequest status
router.post('/reject/:requestId', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user?.userId;
    const requestId = Number.parseInt(req.params.requestId);

        if (!currentUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

    if (Number.isNaN(requestId)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        // Verify the user is a mentor
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true }
        });

        if (!user || user.role !== Role.mentor) {
            return res.status(403).json({ error: 'Access denied. Only mentors can reject requests.' });
        }

        // Find the mentorship request
        const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
            where: { id: requestId }
        });

        if (!mentorshipRequest) {
            return res.status(404).json({ error: 'Mentorship request not found' });
        }

        // Verify the request is for this mentor
        if (mentorshipRequest.mentorUserId !== currentUserId) {
            return res.status(403).json({ error: 'You are not authorized to reject this request' });
        }

        // Check if request is already processed
        if (mentorshipRequest.status !== MentorshipStatus.pending) {
            return res.status(400).json({
                error: `Request has already been ${mentorshipRequest.status}`
            });
        }

        // Update MentorshipRequest status to 'rejected'
        const updatedRequest = await prisma.mentorshipRequest.update({
            where: { id: requestId },
            data: {
                status: MentorshipStatus.rejected,
                updatedAt: new Date()
            },
            include: {
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Mentorship request rejected successfully',
            data: {
                requestId: updatedRequest.id,
                status: updatedRequest.status,
                mentee: updatedRequest.mentee
            }
        });

    } catch (error) {
        console.error('Error rejecting mentorship request:', error);
        return res.status(500).json({
            error: 'Failed to reject mentorship request',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ==================== 4. GET REQUESTS BY STATUS ====================
// GET /api/mentee-request/requests/:status
// Returns mentorship requests filtered by status (pending, accepted, rejected)
router.get('/requests/:status', authenticateToken, async (req: any, res: any) => {
    try {
        const currentUserId = req.user?.userId;
        const status = req.params.status.toLowerCase() as 'pending' | 'accepted' | 'rejected';

        if (!currentUserId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Validate status parameter
        const validStatuses: MentorshipStatus[] = [MentorshipStatus.pending, MentorshipStatus.accepted, MentorshipStatus.rejected];
        if (!validStatuses.includes(status as MentorshipStatus)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: pending, accepted, rejected'
            });
        }

        // Verify the user is a mentor
        const user = await prisma.user.findUnique({
            where: { id: currentUserId },
            select: { role: true }
        });

        if (!user || user.role !== Role.mentor) {
            return res.status(403).json({ error: 'Access denied. Only mentors can view requests.' });
        }

        // Fetch requests with the specified status
        const requests = await prisma.mentorshipRequest.findMany({
            where: {
                mentorUserId: currentUserId,
                status: status as MentorshipStatus
            },
            include: {
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        bio: true,
                        skills: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform to match frontend interface
        const transformedRequests = requests.map(request => ({
            id: request.id.toString(),
            menteeId: request.menteeUserId,
            name: request.mentee.name,
            email: request.mentee.email,
            avatar: request.mentee.avatarUrl,
            jobTitle: request.mentee.jobTitle,
            department: request.mentee.department,
            bio: request.mentee.bio,
            skills: request.mentee.skills,
            status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
            fullMessage: request.requestMessage || 'No message provided',
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));

        return res.status(200).json({
            success: true,
            requests: transformedRequests,
            total: transformedRequests.length,
            status: status
        });

    } catch (error) {
        console.error('Error fetching requests by status:', error);
        return res.status(500).json({
            error: 'Failed to fetch requests',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export { router as menteeRequestRouter };
