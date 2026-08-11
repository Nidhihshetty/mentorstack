import { PrismaClient } from '@prisma/client';

// Reputation rules (modern fields)
const RULES: Record<string, { points: number; description: string; dailyCap?: number }> = {
  // Mentorship
  mentorship_request_sent: { points: 5, description: 'Taking initiative', dailyCap: 25 },
  mentorship_request_accepted: { points: 10, description: 'Helping others' },

  // Articles
  article_published: { points: 20, description: 'Knowledge sharing' },
  article_upvoted: { points: 5, description: 'Quality content' },
  article_downvoted: { points: -2, description: 'Discourages spam' },
  article_bookmarked: { points: 10, description: 'Valuable resource' },

  // Communities
  community_created: { points: 20, description: 'Building ecosystem' },
  community_joined: { points: 2, description: 'Engagement' },
  community_post_created: { points: 10, description: 'Active participation' },
  community_post_upvoted: { points: 5, description: 'Quality contribution' },
  community_post_downvoted: { points: -2, description: 'Spam prevention' },
  community_post_bookmarked: { points: 10, description: 'Valuable resource' }
  ,
  // Q&A
  question_asked: { points: 10, description: 'Encourages asking' },
  answer_posted: { points: 10, description: 'Encourages helping' },
  answer_upvoted: { points: 5, description: 'Quality answer' },
  answer_downvoted: { points: -2, description: 'Discourages bad answers' },
  question_bookmarked: { points: 10, description: 'Useful content' }
};

export interface AwardResult {
  applied: boolean;
  appliedPoints: number;
  currentReputation: number;
  reason: string;
  capRemaining?: number;
}

/** Award reputation using modern Prisma model (points/action). */
export async function awardReputation(
  client: PrismaClient, // can be tx or root prisma
  params: { userId: number; action: keyof typeof RULES; entityType?: string; entityId?: number; customDescription?: string; overridePoints?: number; bypassCap?: boolean }
): Promise<AwardResult> {
  const { userId, action, entityType, entityId, customDescription, overridePoints, bypassCap } = params;
  const rule = RULES[action];
  if (!rule) {
    const rep = await client.user.findUnique({ where: { id: userId }, select: { reputation: true } });
    return { applied: false, appliedPoints: 0, currentReputation: rep?.reputation || 0, reason: 'Unknown action' };
  }

  // Daily cap
  let withinCap = true;
  let capRemaining: number | undefined;
  if (rule.dailyCap && !bypassCap) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todays = await (client as any).reputationHistory.findMany({
      where: { userId, action, createdAt: { gte: startOfDay } },
      select: { points: true }
    }) as Array<{ points: number }>;
    const usedToday = todays.reduce((acc, r) => acc + r.points, 0);
    capRemaining = Math.max(0, rule.dailyCap - usedToday);
    const pointsToApply = overridePoints ?? rule.points;
    withinCap = usedToday + pointsToApply <= rule.dailyCap;
  }

  if (!withinCap) {
    const rep = await client.user.findUnique({ where: { id: userId }, select: { reputation: true } });
    return { applied: false, appliedPoints: 0, currentReputation: rep?.reputation || 0, reason: rule.description, capRemaining };
  }

  // Apply (caller should wrap in transaction if atomicity across other ops is required)
  const points = overridePoints ?? rule.points;
  const updated = await client.user.update({
    where: { id: userId },
    data: { reputation: { increment: points } },
    select: { reputation: true }
  });

  await (client as any).reputationHistory.create({
    data: {
      userId,
      points,
      action,
      entityType: entityType || null,
      entityId: entityId || null,
      description: customDescription || rule.description
    }
  });

  return { applied: true, appliedPoints: points, currentReputation: updated.reputation, reason: rule.description, capRemaining };
}

export async function getReputationHistory(
  client: PrismaClient,
  params: { userId: number; page?: number; limit?: number }
) {
  const { userId, page = 1, limit = 50 } = params;
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    (client as any).reputationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: { id: true, points: true, action: true, description: true, entityType: true, entityId: true, createdAt: true }
    }) as Promise<Array<{ id:number; points:number; action:string; description?:string|null; entityType?:string|null; entityId?:number|null; createdAt: Date }>>,
    client.reputationHistory.count({ where: { userId } })
  ]);
  return { entries, page, limit, total, totalPages: Math.ceil(total / limit) };
}
