import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Protect all admin mentorship routes
router.use(requireAdmin);

// GET /mentorship/requests - Get all mentorship requests with details
router.get('/requests', async (req: any, res: any) => {
    try {
        const status = req.query.status; // pending, accepted, rejected, or 'all'

        const whereClause: any = {};
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const requests = await prisma.mentorshipRequest.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                requestMessage: true,
                createdAt: true,
                updatedAt: true,
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        skills: true,
                        reputation: true,
                        _count: {
                            select: {
                                mentorConnections: true,
                                questions: true,
                                answers: true,
                                articles: true
                            }
                        }
                    }
                },
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        skills: true,
                        reputation: true,
                        _count: {
                            select: {
                                menteeConnections: true,
                                questions: true,
                                answers: true,
                                articles: true
                            }
                        }
                    }
                }
            }
        });

        res.json({ requests });
    } catch (err) {
        console.error('Error fetching mentorship requests:', err);
        res.status(500).json({ error: 'Failed to fetch mentorship requests' });
    }
});

// GET /mentorship/connections - Get all active connections with engagement metrics
router.get('/connections', async (req: any, res: any) => {
    try {
        const connections = await prisma.connection.findMany({
            orderBy: { acceptedAt: 'desc' },
            select: {
                id: true,
                acceptedAt: true,
                updatedAt: true,
                mentor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        skills: true,
                        reputation: true,
                        _count: {
                            select: {
                                mentorConnections: true,
                                questions: true,
                                answers: true,
                                articles: true
                            }
                        }
                    }
                },
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        jobTitle: true,
                        department: true,
                        skills: true,
                        reputation: true,
                        _count: {
                            select: {
                                menteeConnections: true,
                                questions: true,
                                answers: true,
                                articles: true
                            }
                        }
                    }
                },
                conversation: {
                    select: {
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        _count: {
                            select: {
                                messages: true
                            }
                        },
                        messages: {
                            take: 1,
                            orderBy: { timestamp: 'desc' },
                            select: {
                                timestamp: true,
                                message: true,
                                sender: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Calculate engagement metrics for each connection
        const connectionsWithMetrics = await Promise.all(
            connections.map(async (connection) => {
                let messageCount = 0;
                let lastMessageDate = null;
                let lastMessageSender = null;
                let lastMessage = null;

                if (connection.conversation) {
                    messageCount = connection.conversation._count.messages;
                    if (connection.conversation.messages.length > 0) {
                        const lastMsg = connection.conversation.messages[0];
                        lastMessageDate = lastMsg.timestamp;
                        lastMessageSender = lastMsg.sender.name;
                        lastMessage = lastMsg.message;
                    }
                }

                // Calculate days since connection was established
                const daysSinceConnection = Math.floor(
                    (Date.now() - new Date(connection.acceptedAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                // Calculate engagement score (messages per week)
                const weeks = Math.max(daysSinceConnection / 7, 1);
                const messagesPerWeek = messageCount / weeks;

                return {
                    ...connection,
                    metrics: {
                        messageCount,
                        lastMessageDate,
                        lastMessageSender,
                        lastMessage,
                        daysSinceConnection,
                        messagesPerWeek: Math.round(messagesPerWeek * 10) / 10,
                        engagementLevel: messagesPerWeek > 5 ? 'high' : messagesPerWeek > 2 ? 'medium' : 'low'
                    }
                };
            })
        );

        res.json({ connections: connectionsWithMetrics });
    } catch (err) {
        console.error('Error fetching connections:', err);
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});

// GET /mentorship/stats - Get overall mentorship statistics
router.get('/stats', async (req: any, res: any) => {
    try {
        const [
            totalRequests,
            pendingRequests,
            acceptedRequests,
            rejectedRequests,
            totalConnections,
            totalMessages,
            activeConversations
        ] = await Promise.all([
            prisma.mentorshipRequest.count(),
            prisma.mentorshipRequest.count({ where: { status: 'pending' } }),
            prisma.mentorshipRequest.count({ where: { status: 'accepted' } }),
            prisma.mentorshipRequest.count({ where: { status: 'rejected' } }),
            prisma.connection.count(),
            prisma.message.count(),
            prisma.conversation.count()
        ]);

        // Get top active mentors
        const topMentors = await prisma.user.findMany({
            where: { role: 'mentor' },
            orderBy: { reputation: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                reputation: true,
                _count: {
                    select: {
                        mentorConnections: true
                    }
                }
            }
        });

        // Calculate acceptance rate
        const acceptanceRate = totalRequests > 0
            ? Math.round((acceptedRequests / totalRequests) * 100)
            : 0;

        // Calculate average messages per connection
        const avgMessagesPerConnection = totalConnections > 0
            ? Math.round((totalMessages / totalConnections) * 10) / 10
            : 0;

        res.json({
            stats: {
                requests: {
                    total: totalRequests,
                    pending: pendingRequests,
                    accepted: acceptedRequests,
                    rejected: rejectedRequests,
                    acceptanceRate
                },
                connections: {
                    total: totalConnections,
                    active: activeConversations,
                    avgMessagesPerConnection
                },
                messages: {
                    total: totalMessages
                },
                topMentors
            }
        });
    } catch (err) {
        console.error('Error fetching mentorship stats:', err);
        res.status(500).json({ error: 'Failed to fetch mentorship stats' });
    }
});

// DELETE /mentorship/requests/:id - Delete a mentorship request
router.delete('/requests/:id', async (req: any, res: any) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid request ID' });
        }

        await prisma.mentorshipRequest.delete({
            where: { id }
        });

        res.json({ message: 'Mentorship request deleted successfully' });
    } catch (err) {
        console.error('Error deleting mentorship request:', err);
        res.status(500).json({ error: 'Failed to delete mentorship request' });
    }
});

// DELETE /mentorship/connections/:id - Delete a connection
router.delete('/connections/:id', async (req: any, res: any) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid connection ID' });
        }

        await prisma.connection.delete({
            where: { id }
        });

        res.json({ message: 'Connection deleted successfully' });
    } catch (err) {
        console.error('Error deleting connection:', err);
        res.status(500).json({ error: 'Failed to delete connection' });
    }
});

export default router;
