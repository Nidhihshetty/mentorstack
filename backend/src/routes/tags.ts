import express from 'express';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

const router = express.Router();

// Get unified content for a specific tag/skill
router.get('/:tagName/content', async (req: any, res: any) => {
  try {
    const tagName = req.params.tagName.toLowerCase();
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log(`📍 Fetching content for tag: ${tagName}`);

    // Get articles with matching tags
    const articles = await prisma.article.findMany({
      where: {
        tags: {
          some: {
            tag: {
              name: {
                contains: tagName,
                mode: 'insensitive'
              }
            }
          }
        }
      },
      include: {
        author: {
          select: {
            name: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get questions with matching tags
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: tagName,
                    mode: 'insensitive'
                  }
                }
              }
            }
          },
          {
            title: {
              contains: tagName,
              mode: 'insensitive'
            }
          },
          {
            body: {
              contains: tagName,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        },
        answers: true,
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get communities with matching skills (case-insensitive search)
    const allCommunities = await prisma.community.findMany({
      include: {
        createdBy: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    });

    // Filter communities that have the tag in their skills (case-insensitive)
    const communities = allCommunities
      .filter(community => 
        community.skills.some(skill => 
          skill.toLowerCase() === tagName.toLowerCase()
        )
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    console.log(`🔍 Searched for communities with skill: "${tagName}"`);
    console.log(`📊 Total communities in database: ${allCommunities.length}`);
    console.log(`✨ Communities matching skill: ${communities.length}`);
    if (communities.length > 0) {
      console.log(`📝 Matching communities:`, communities.map(c => ({ name: c.name, skills: c.skills })));
    }

    // Get statistics for this tag
    const tagStats = await prisma.tag.findFirst({
      where: {
        name: {
          contains: tagName,
          mode: 'insensitive'
        }
      },
      include: {
        _count: {
          select: {
            articles: true,
            questions: true,
            communityPosts: true
          }
        }
      }
    });

    // Format articles
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content.substring(0, 200) + '...',
      authorName: article.author.name,
      createdAt: article.createdAt,
      tags: article.tags.map(t => t.tag.name)
    }));

    // Format questions
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      description: question.body.substring(0, 200) + '...',
      authorName: question.author.name,
      authorRole: question.author.role,
      createdAt: question.createdAt,
      answerCount: question.answers.length,
      tags: question.tags.map(t => t.tag.name)
    }));

    // Format communities
    const formattedCommunities = communities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description?.substring(0, 200) + (community.description && community.description.length > 200 ? '...' : ''),
      skills: community.skills,
      creatorName: community.createdBy?.name,
      memberCount: community._count.members,
      postCount: community._count.posts,
      createdAt: community.createdAt
    }));

    const response = {
      tagName,
      stats: {
        totalArticles: tagStats?._count?.articles || formattedArticles.length,
        totalQuestions: tagStats?._count?.questions || formattedQuestions.length,
        totalCommunities: formattedCommunities.length,
        totalContent: (tagStats?._count?.articles || 0) + (tagStats?._count?.questions || 0) + formattedCommunities.length
      },
      articles: formattedArticles,
      questions: formattedQuestions,
      communities: formattedCommunities
    };

    console.log(`✅ Found ${formattedArticles.length} articles, ${formattedQuestions.length} questions, and ${formattedCommunities.length} communities for tag: ${tagName}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching tag content:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: (error as any)?.message || 'Unknown error' 
    });
  }
});

// Get all tags with their content counts
router.get('/all', async (req: any, res: any) => {
  try {
    // Get tags from articles and questions
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true,
            questions: true,
            communityPosts: true
          }
        }
      },
      orderBy: [
        {
          articles: {
            _count: 'desc'
          }
        },
        {
          questions: {
            _count: 'desc'
          }
        }
      ]
    });

    // Get all communities to extract unique skills
    const communities = await prisma.community.findMany({
      select: {
        skills: true
      }
    });

    // Extract all unique skills from communities
    const allSkills = new Set<string>();
    communities.forEach(community => {
      community.skills.forEach(skill => {
        allSkills.add(skill.toLowerCase());
      });
    });

    // Create a map to count communities per skill
    const skillCommunityCount = new Map<string, number>();
    allSkills.forEach(skill => {
      const count = communities.filter(community =>
        community.skills.some(s => s.toLowerCase() === skill)
      ).length;
      skillCommunityCount.set(skill, count);
    });

    // Format tags from database (articles and questions)
    const formattedTags = tags.map((tag, index) => {
      // Check if this tag is also a skill
      const communityCount = skillCommunityCount.get(tag.name.toLowerCase()) || 0;

      return {
        name: tag.name,
        articleCount: tag._count.articles,
        questionCount: tag._count.questions,
        communityPostCount: communityCount,
        totalCount: tag._count.articles + tag._count.questions + communityCount,
        color: getTagColor(index)
      };
    });

    // Add skills that don't exist as tags yet
    const tagNames = new Set(tags.map(t => t.name.toLowerCase()));
    let skillIndex = tags.length;
    
    allSkills.forEach(skill => {
      if (!tagNames.has(skill)) {
        const communityCount = skillCommunityCount.get(skill) || 0;
        formattedTags.push({
          name: skill,
          articleCount: 0,
          questionCount: 0,
          communityPostCount: communityCount,
          totalCount: communityCount,
          color: getTagColor(skillIndex++)
        });
      }
    });

    // Filter out tags with zero content
    const activeTags = formattedTags.filter(tag => tag.totalCount > 0);

    // Sort by total count descending
    activeTags.sort((a, b) => b.totalCount - a.totalCount);

    res.json(activeTags);

  } catch (error) {
    console.error('❌ Error fetching all tags:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: (error as any)?.message || 'Unknown error' 
    });
  }
});

// Helper function to assign colors to tags
function getTagColor(index: number): string {
  const colors = [
    'bg-blue-100',
    'bg-green-100', 
    'bg-purple-100',
    'bg-yellow-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-red-100',
    'bg-gray-100',
    'bg-orange-100',
    'bg-teal-100'
  ];
  return colors[index % colors.length];
}

export { router as tagsRouter };
