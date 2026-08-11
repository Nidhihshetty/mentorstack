import express from 'express';
import { prisma } from '../../lib/prisma';
import { Role } from '@prisma/client';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Utility: Retry database queries with exponential backoff (handles Neon cold starts)
async function retryDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;

      // Only retry on connection errors (P1001 = Can't reach database server)
      if (error.code === 'P1001' && attempt < maxRetries) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔄 Database connection failed (attempt ${attempt}/${maxRetries}). Retrying in ${delayMs}ms...`);
        console.log(`   Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      // Don't retry for other errors (syntax errors, constraint violations, etc.)
      throw error;
    }
  }

  throw lastError;
}

// Get overview dashboard statistics
router.get('/overview', async (req: any, res: any) => {
  try {
    console.log('📊 Fetching overview stats for admin:', req.user?.id);

    // Wrap all database queries in retry logic
    const overviewData = await retryDatabaseQuery(async () => {
      const [
        // User stats
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        activeUsersToday,
        activeUsersThisWeek,
        mentors,
        mentees,
        admins,

        // Content stats
        totalQuestions,
        questionsToday,
        questionsThisWeek,
        totalAnswers,
        answersToday,
        totalArticles,
        articesToday,

        // Community stats
        totalCommunities,
        totalCommunityPosts,
        communitiesThisMonth,

        // Engagement stats
        totalVotes,
        votesToday,
        totalBookmarks,
        bookmarksToday,

        // Mentorship stats
        totalMentorshipRequests,
        pendingRequests,
        acceptedRequests,
        requestsThisMonth,
        totalConnections
      ] = await Promise.all([
        // User queries
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        }),
        // Active users approximation: any question/answer/article today
        prisma.user.count({
          where: {
            OR: [
              { questions: { some: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } } },
              { answers: { some: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } } },
              { articles: { some: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } } }
            ]
          }
        }),
        prisma.user.count({
          where: {
            OR: [
              { questions: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
              { answers: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
              { articles: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } }
            ]
          }
        }),
        prisma.user.count({ where: { role: Role.mentor } }),
        prisma.user.count({ where: { role: Role.mentee } }),
        prisma.user.count({ where: { role: Role.admin } }),

        // Content queries
        prisma.question.count(),
        prisma.question.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.question.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.answer.count(),
        prisma.answer.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.article.count(),
        prisma.article.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),

        // Community queries
        prisma.community.count(),
        prisma.communityPost.count(),
        prisma.community.count({
          where: {
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        }),

        // Engagement queries
        prisma.answerVote.count(),
        prisma.answerVote.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.questionBookmark.count(),
        prisma.questionBookmark.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),

        // Mentorship queries
        prisma.mentorshipRequest.count(),
        prisma.mentorshipRequest.count({ where: { status: 'pending' } }),
        prisma.mentorshipRequest.count({ where: { status: 'accepted' } }),
        prisma.mentorshipRequest.count({
          where: {
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        }),
        prisma.connection.count()
      ]);

      // Calculate growth rates
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [usersLastMonth, questionsLastMonth, articlesLastMonth] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: lastMonth, lt: thisMonth }
          }
        }),
        prisma.question.count({
          where: {
            createdAt: { gte: lastMonth, lt: thisMonth }
          }
        }),
        prisma.article.count({
          where: {
            createdAt: { gte: lastMonth, lt: thisMonth }
          }
        })
      ]);

      // Calculate growth percentages
      const userGrowth = usersLastMonth > 0 ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth * 100) : 0;
      const questionGrowth = questionsLastMonth > 0 ? ((questionsThisWeek - questionsLastMonth) / questionsLastMonth * 100) : 0;
      const articleGrowth = articlesLastMonth > 0 ? ((articesToday * 30 - articlesLastMonth) / articlesLastMonth * 100) : 0;

      // Get top active users
      const topActiveUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { reputation: 'desc' },
        where: {
          OR: [
            { questions: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { answers: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } },
            { articles: { some: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          reputation: true,
          role: true,
          avatarUrl: true
        }
      });

      // Get recent activity trends (last 7 days)
      const activityTrends = await Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          const [questions, answers, articles, users] = await Promise.all([
            prisma.question.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            }),
            prisma.answer.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            }),
            prisma.article.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            }),
            prisma.user.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            })
          ]);

          return {
            date: startOfDay.toISOString().split('T')[0],
            questions,
            answers,
            articles,
            users
          };
        })
      );

      const overviewStats = {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          activeToday: activeUsersToday,
          activeThisWeek: activeUsersThisWeek,
          mentors,
          mentees,
          admins,
          growthRate: Math.round(userGrowth * 100) / 100
        },
        content: {
          questions: {
            total: totalQuestions,
            today: questionsToday,
            thisWeek: questionsThisWeek,
            growthRate: Math.round(questionGrowth * 100) / 100
          },
          answers: {
            total: totalAnswers,
            today: answersToday
          },
          articles: {
            total: totalArticles,
            today: articesToday,
            growthRate: Math.round(articleGrowth * 100) / 100
          }
        },
        communities: {
          total: totalCommunities,
          posts: totalCommunityPosts,
          newThisMonth: communitiesThisMonth
        },
        engagement: {
          answerVotes: {
            total: totalVotes,
            today: votesToday
          },
          questionBookmarks: {
            total: totalBookmarks,
            today: bookmarksToday
          }
        },
        mentorship: {
          totalRequests: totalMentorshipRequests,
          pending: pendingRequests,
          accepted: acceptedRequests,
          newThisMonth: requestsThisMonth,
          totalConnections: totalConnections,
          acceptanceRate: totalMentorshipRequests > 0 ?
            Math.round((acceptedRequests / totalMentorshipRequests) * 100) : 0
        },
        topActiveUsers,
        activityTrends: activityTrends.slice().reverse() // Show oldest to newest
      };

      return overviewStats;
    }, 3, 2000); // 3 retries, starting with 2 second delay

    console.log('✅ Successfully fetched overview stats');
    res.json(overviewData);
  } catch (error) {
    console.error('❌ Error fetching overview stats:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

    // Enhanced error response
    const errorResponse: any = {
      error: 'Failed to fetch overview statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    };

    // Add error code if available
    if ((error as any).code) {
      errorResponse.code = (error as any).code;
    }

    // Special message for connection errors
    if ((error as any).code === 'P1001') {
      errorResponse.hint = 'Database connection failed. Please ensure your Neon database is active and accessible.';
      console.error('💡 HINT: Your Neon database may be sleeping. Visit https://console.neon.tech to wake it up.');
    }

    res.status(500).json(errorResponse);
  }
});

// Get detailed user distribution stats
router.get('/users', async (req: any, res: any) => {
  try {
    const [
      roleDistribution,
      departmentDistribution,
      registrationTrends,
      reputationDistribution
    ] = await Promise.all([
      // Role distribution
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),

      // Department distribution
      prisma.user.groupBy({
        by: ['department'],
        _count: { department: true },
        where: { department: { not: null } }
      }),

      // Registration trends (last 12 months)
      Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const count = await prisma.user.count({
            where: {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          });

          return {
            month: startOfMonth.toISOString().slice(0, 7),
            count
          };
        })
      ),


      // Reputation distribution
      Promise.all([
        prisma.user.count({ where: { reputation: { gte: 1000 } } }),
        prisma.user.count({ where: { reputation: { gte: 500, lt: 1000 } } }),
        prisma.user.count({ where: { reputation: { gte: 100, lt: 500 } } }),
        prisma.user.count({ where: { reputation: { gte: 10, lt: 100 } } }),
        prisma.user.count({ where: { reputation: { lt: 10 } } })
      ])
    ]);

    res.json({
      roleDistribution: roleDistribution.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      departmentDistribution: departmentDistribution.map(item => ({
        department: item.department,
        count: item._count.department
      })),
      registrationTrends: registrationTrends.slice().reverse(),
      // activityLevels removed (no lastActiveAt field)
      reputationDistribution: {
        expert: reputationDistribution[0], // 1000+
        advanced: reputationDistribution[1], // 500-999
        intermediate: reputationDistribution[2], // 100-499
        beginner: reputationDistribution[3], // 10-99
        new: reputationDistribution[4] // 0-9
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get content statistics
router.get('/content', async (req: any, res: any) => {
  try {
    const [
      topQuestions,
      topArticles,
      contentTrends,
      tagDistribution,
      mostActiveAuthors
    ] = await Promise.all([
      // Top questions by votes
      prisma.question.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, email: true }
          },
          _count: { select: { answers: true } }
        }
      }),

      // Top articles by votes
      prisma.article.findMany({
        take: 10,
        orderBy: { upvotes: 'desc' },
        select: {
          id: true,
          title: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      }),

      // Content creation trends (last 30 days)
      Promise.all(
        Array.from({ length: 30 }, async (_, i) => {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          const [questions, articles] = await Promise.all([
            prisma.question.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            }),
            prisma.article.count({
              where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            })
          ]);

          return {
            date: startOfDay.toISOString().split('T')[0],
            questions,
            articles
          };
        })
      ),

      // Tag distribution (top 20 tags)
      prisma.tag.findMany({
        take: 20,
        orderBy: {
          questions: { _count: 'desc' }
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              questions: true,
              articles: true
            }
          }
        }
      }),

      // Most active content authors
      prisma.user.findMany({
        take: 10,
        orderBy: [
          { questions: { _count: 'desc' } },
          { articles: { _count: 'desc' } }
        ],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          reputation: true,
          _count: {
            select: {
              questions: true,
              articles: true,
              answers: true
            }
          }
        }
      })
    ]);

    res.json({
      topQuestions,
      topArticles,
      contentTrends: contentTrends.slice().reverse(),
      tagDistribution,
      mostActiveAuthors
    });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({ error: 'Failed to fetch content statistics' });
  }
});

// Get system health metrics
router.get('/health', async (req: any, res: any) => {
  try {
    // Performance metrics (no need for nested Promise.all)
    const performanceMetrics = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.article.count(),
      prisma.community.count()
    ]);

    res.json({
      database: {
        status: 'connected',
        health: 'good'
      },
      recentErrors: [],
      metrics: {
        totalRecords: performanceMetrics.reduce((sum, count) => sum + count, 0),
        tables: {
          users: performanceMetrics[0],
          questions: performanceMetrics[1],
          articles: performanceMetrics[2],
          communities: performanceMetrics[3]
        }
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    console.error('Error fetching health stats:', error);
    res.status(500).json({
      error: 'Failed to fetch system health',
      database: { status: 'error', health: 'poor' }
    });
  }
});

export default router;
// ================ Mentor Impact Analytics =================
// Helper to compute impact for one mentor (reduces cognitive complexity)
async function computeMentorImpact(mentor: any) {
  const connectionConversationIds = mentor.mentorConnections
    .map((c: any) => c.conversation?.id)
    .filter((id: any): id is number => typeof id === 'number');

  if (!connectionConversationIds.length) {
    return {
      mentorId: mentor.id,
      name: mentor.name,
      avatarUrl: mentor.avatarUrl,
      email: mentor.email,
      sessions: mentor.mentorConnections.length,
      messagesSent: 0,
      avgResponseMinutes: null,
      impactScore: 0
    };
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: { in: connectionConversationIds } },
    orderBy: { timestamp: 'asc' },
    select: { id: true, senderId: true, timestamp: true, conversationId: true }
  });

  let totalResponseMs = 0;
  let responseCount = 0;
  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];
    if (curr.senderId === mentor.id && prev.senderId !== mentor.id) {
      const diff = curr.timestamp.getTime() - prev.timestamp.getTime();
      if (diff > 0 && diff < 12 * 60 * 60 * 1000) { // ignore >12h gaps
        totalResponseMs += diff;
        responseCount++;
      }
    }
  }

  const avgResponseMinutes = responseCount ? Math.round((totalResponseMs / responseCount) / 60000) : null;
  const sessions = mentor.mentorConnections.length;
  const messagesSent = mentor.sentMessages.filter((m: any) => connectionConversationIds.includes(m.conversationId)).length;
  const responsivenessComponent = avgResponseMinutes === null ? 0 : (100 / (avgResponseMinutes + 5));
  const impactScore = Math.round((sessions * 2 + messagesSent * 0.5 + responsivenessComponent) * 100) / 100;
  return { mentorId: mentor.id, name: mentor.name, avatarUrl: mentor.avatarUrl, email: mentor.email, sessions, messagesSent, avgResponseMinutes, impactScore };
}

router.get('/mentors/impact', async (req: any, res: any) => {
  try {
    const { limit = '20' } = req.query;
    const take = Math.min(100, Number.parseInt(limit));
    const mentors = await prisma.user.findMany({
      where: { role: Role.mentor },
      take,
      orderBy: { reputation: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        reputation: true,
        avatarUrl: true,
        mentorConnections: { select: { id: true, conversation: { select: { id: true } } } },
        sentMessages: { select: { id: true, timestamp: true, conversationId: true } }
      }
    });

    const impactData = await Promise.all(mentors.map(m => computeMentorImpact(m)));
    impactData.sort((a, b) => b.impactScore - a.impactScore);
    res.json({ mentors: impactData });
  } catch (error) {
    console.error('Error computing mentor impact:', error);
    res.status(500).json({ error: 'Failed to compute mentor impact' });
  }
});

// ================ Mentee Progress Radar =================
router.get('/mentees/progress', async (req: any, res: any) => {
  try {
    const { limit = '50' } = req.query;
    const take = Math.min(200, Number.parseInt(limit));
    const mentees = await prisma.user.findMany({
      where: { role: Role.mentee },
      take,
      orderBy: { reputation: 'desc' },
      select: { id: true, name: true, avatarUrl: true }
    });

    // Preload counts for all mentees using batch queries
    const menteeIds = mentees.map(m => m.id);

    const [questionCounts, articleBookmarkCounts, communityPostCounts, communityMessageCounts, messageCounts, connectionCounts] = await Promise.all([
      prisma.question.groupBy({ by: ['authorId'], _count: { authorId: true }, where: { authorId: { in: menteeIds } } }),
      prisma.articleBookmark.groupBy({ by: ['userId'], _count: { userId: true }, where: { userId: { in: menteeIds } } }),
      prisma.communityPost.groupBy({ by: ['authorId'], _count: { authorId: true }, where: { authorId: { in: menteeIds } } }),
      // Some environments may not have generated client for CommunityMessage yet; use raw SQL for portability
      prisma.$queryRawUnsafe<any[]>(`SELECT "senderId", COUNT(*)::int as cnt FROM "CommunityMessage" WHERE "senderId" = ANY($1) GROUP BY "senderId"`, menteeIds),
      prisma.message.groupBy({ by: ['senderId'], _count: { senderId: true }, where: { senderId: { in: menteeIds } } }),
      prisma.connection.groupBy({ by: ['menteeUserId'], _count: { menteeUserId: true }, where: { menteeUserId: { in: menteeIds } } })
    ]);

    // Helper to get count from grouped array
    const getCount = (arr: any[], key: string, id: number) => {
      const found = arr.find(r => r[key] === id);
      if (!found) return 0;
      if (rHasCount(found)) return found._count[key] ?? 0;
      const anyFound: any = found; // explicit alias to satisfy lint rule
      return typeof anyFound.cnt === 'number' ? anyFound.cnt : 0;
    };

    function rHasCount(r: any): r is { _count: Record<string, number> } {
      return typeof r === 'object' && r && '_count' in r;
    }

    // Build raw metrics per mentee
    const radarData = mentees.map(m => {
      const questionsAsked = getCount(questionCounts, 'authorId', m.id);
      const articlesSaved = getCount(articleBookmarkCounts, 'userId', m.id);
      const communityPosts = getCount(communityPostCounts, 'authorId', m.id);
      const communityMessages = getCount(communityMessageCounts, 'senderId', m.id);
      const chatMessages = getCount(messageCounts, 'senderId', m.id);
      const mentorshipConnections = getCount(connectionCounts, 'menteeUserId', m.id);
      const communityEngagement = communityPosts + communityMessages;
      return {
        menteeId: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl,
        raw: {
          questionsAsked,
          articlesSaved,
          communityEngagement,
          chatActivity: chatMessages,
          mentorshipParticipation: mentorshipConnections
        }
      };
    });

    // Normalization for radar (scale each axis 0-100 based on max in set)
    const maxima = {
      questionsAsked: Math.max(1, ...radarData.map(d => d.raw.questionsAsked)),
      articlesSaved: Math.max(1, ...radarData.map(d => d.raw.articlesSaved)),
      communityEngagement: Math.max(1, ...radarData.map(d => d.raw.communityEngagement)),
      chatActivity: Math.max(1, ...radarData.map(d => d.raw.chatActivity)),
      mentorshipParticipation: Math.max(1, ...radarData.map(d => d.raw.mentorshipParticipation))
    };

    const normalized = radarData.map(d => ({
      menteeId: d.menteeId,
      name: d.name,
      avatarUrl: d.avatarUrl,
      raw: d.raw,
      normalized: {
        questionsAsked: Math.round((d.raw.questionsAsked / maxima.questionsAsked) * 100),
        articlesSaved: Math.round((d.raw.articlesSaved / maxima.articlesSaved) * 100),
        communityEngagement: Math.round((d.raw.communityEngagement / maxima.communityEngagement) * 100),
        chatActivity: Math.round((d.raw.chatActivity / maxima.chatActivity) * 100),
        mentorshipParticipation: Math.round((d.raw.mentorshipParticipation / maxima.mentorshipParticipation) * 100)
      }
    }));

    res.json({ mentees: normalized, maxima });
  } catch (error) {
    console.error('Error computing mentee progress:', error);
    res.status(500).json({ error: 'Failed to compute mentee progress' });
  }
});
