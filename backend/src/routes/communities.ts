import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { awardReputation } from '../lib/reputation';
import { Role } from '@prisma/client';
import { postImageStorage, deleteImage, extractPublicId } from '../lib/cloudinary';

const router = express.Router();

// Configure multer to use Cloudinary storage for post images
const upload = multer({ storage: postImageStorage });

const uploadPostImages = (req: any, res: any, next: any) => {
  upload.array('images', 5)(req, res, (err: any) => {
    if (err) {
      console.error('Community post image upload error:', err);
      return res.status(400).json({
        error: 'Image upload failed',
        details: err.message || 'Invalid image upload request',
      });
    }
    next();
  });
};

const getUploadedImageUrl = (file: any): string | null => {
  return file?.path || file?.secure_url || file?.url || null;
};

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: string;
    email: string;
  };
}

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get community categories based on real-time skills
router.get('/categories', async (req: any, res: any) => {
  try {
    // Get all communities with their skills
    const communities = await prisma.community.findMany({
      include: {
        members: true,
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      }
    });

    // Aggregate all skills from communities and their members
    const skillCounts: Record<string, { count: number; communities: string[] }> = {};

    for (const community of communities) {
      const allSkills: string[] = [...community.skills];
      
      // Get skills from all members
      for (const member of community.members) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: member.userId },
            select: { skills: true }
          });
          if (user?.skills) {
            allSkills.push(...user.skills);
          }
        } catch (error) {
          console.error(`Error fetching skills for member ${member.userId}:`, error);
        }
      }

      // Count each skill
      const uniqueSkills = [...new Set(allSkills)];
      for (const skill of uniqueSkills) {
        if (!skillCounts[skill]) {
          skillCounts[skill] = { count: 0, communities: [] };
        }
        skillCounts[skill].count += 1;
        skillCounts[skill].communities.push(community.name);
      }
    }

    // Convert to array and sort by count
    const categories = Object.entries(skillCounts)
      .map(([skill, data]) => ({
        name: skill,
        count: data.count,
        communities: data.communities.slice(0, 3) // Show up to 3 example communities
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 categories

    res.json(categories);
  } catch (error) {
    console.error('Error fetching community categories:', error);
    res.status(500).json({ error: 'Failed to fetch community categories' });
  }
});

// Get all communities with real-time skills from members
router.get('/', async (req: any, res: any) => {
  try {
    const communities = await prisma.community.findMany({
      include: {
        members: {
          include: {
            // Include member details to get their skills
            ...(req.query.includeSkills === 'true' && {
              // We'll need to fetch member skills based on their role
            })
          }
        },
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For each community, aggregate skills from all members
    const communitiesWithRealTimeSkills = await Promise.all(
      communities.map(async (community) => {
        const memberSkills: string[] = [];
        
        // Get skills from all members
        for (const member of community.members) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: member.userId },
              select: { skills: true }
            });
            if (user?.skills) {
              memberSkills.push(...user.skills);
            }
          } catch (error) {
            console.error(`Error fetching skills for member ${member.userId}:`, error);
          }
        }

        // Combine community's original skills with member skills
        const allSkills = [...new Set([...community.skills, ...memberSkills])];
        
        return {
          ...community,
          skills: allSkills,
          memberSkills: memberSkills // Keep track of member-contributed skills
        };
      })
    );

    res.json(communitiesWithRealTimeSkills);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Get community by ID
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: true,
        posts: {
          include: {
            votes: true,
            _count: {
              select: {
                votes: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    res.json(community);
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

// Check if user is a member of a community
router.get('/:id/membership', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: parseInt(id),
        userId: userId,
        userRole: role as any
      }
    });

    res.json({ isMember: !!member });
  } catch (error) {
    console.error('Error checking membership:', error);
    res.status(500).json({ error: 'Failed to check membership' });
  }
});

// Create a new community
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, description, skills } = req.body;
    const { userId, role } = req.user;

    if (!name) {
      return res.status(400).json({ error: 'Community name is required' });
    }

    // Check if community name already exists
    const existingCommunity = await prisma.community.findUnique({
      where: { name }
    });

    if (existingCommunity) {
      return res.status(400).json({ error: 'Community name already exists' });
    }

    const community = await prisma.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: {
          name,
          description: description || '',
          skills: skills || [],
          createdById: userId
        }
      });
      await tx.communityMember.create({
        data: {
          communityId: created.id,
          userRole: role as any,
          userId: userId
        }
      });
      await awardReputation(tx as any, { userId, action: 'community_created', entityType: 'community', entityId: created.id });
      return created;
    });

    res.status(201).json(community);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Update a community (only creator can update)
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, description, skills } = req.body;
    const { userId } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Community name is required' });
    }

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is the creator
    if (community.createdById !== userId) {
      return res.status(403).json({ error: 'Only the community creator can update this community' });
    }

    // If name is being changed, check if new name already exists
    if (name !== community.name) {
      const existingCommunity = await prisma.community.findUnique({
        where: { name }
      });

      if (existingCommunity) {
        return res.status(400).json({ error: 'Community name already exists' });
      }
    }

    const updatedCommunity = await prisma.community.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        skills: skills || []
      }
    });

    res.json(updatedCommunity);
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ error: 'Failed to update community' });
  }
});

// Delete a community (only creator can delete)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is the creator
    if (community.createdById !== userId) {
      return res.status(403).json({ error: 'Only the community creator can delete this community' });
    }

    // Delete the community (cascade will handle members, posts, etc.)
    await prisma.community.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

// Join a community
router.post('/:id/join', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: parseInt(id) }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.communityMember.findFirst({
      where: {
        communityId: parseInt(id),
        userId: userId,
        userRole: role as any
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this community' });
    }

    const member = await prisma.$transaction(async (tx) => {
      const createdMember = await tx.communityMember.create({
        data: {
          communityId: parseInt(id),
          userRole: role as any,
          userId: userId
        }
      });
      await awardReputation(tx as any, { userId, action: 'community_joined', entityType: 'community', entityId: parseInt(id) });
      return createdMember;
    });

    res.status(201).json({ message: 'Successfully joined community', member });
  } catch (error) {
    console.error('Error joining community:', error);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// Leave a community
router.delete('/:id/leave', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: parseInt(id),
        userId: userId,
        userRole: role as any
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Not a member of this community' });
    }

    await prisma.communityMember.delete({
      where: {
        id: member.id
      }
    });

    res.json({ message: 'Successfully left community' });
  } catch (error) {
    console.error('Error leaving community:', error);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// Create a post in a community
router.post('/:id/posts', authenticateToken, uploadPostImages, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const { userId, role } = req.user;

    console.log('Create post request body:', { title, content, tags, hasFiles: !!req.files });

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if user is a member of the community
    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: parseInt(id),
        userId: userId,
        userRole: role as any
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Must be a member to post in this community' });
    }

    // Handle uploaded images from Cloudinary
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = getUploadedImageUrl(file);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.communityPost.create({
        data: {
          communityId: parseInt(id),
          authorId: userId,
          authorRole: role as Role,
          title,
          content,
          imageUrls: imageUrls
        }
      });
      await awardReputation(tx as any, { userId, action: 'community_post_created', entityType: 'community_post', entityId: created.id });
      return created;
    });

    // Handle tags if provided
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        parsedTags = Array.isArray(tags) ? tags : [];
      }
    }

    if (parsedTags.length > 0) {
      for (const tagName of parsedTags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const trimmedTagName = tagName.trim().toLowerCase();
          
          // Find or create the tag
          let tag = await prisma.tag.findUnique({
            where: { name: trimmedTagName }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: trimmedTagName }
            });
          }

          // Link the tag to the community post
          await prisma.communityPostTag.create({
            data: {
              postId: post.id,
              tagId: tag.id
            }
          });
        }
      }
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get posts in a community
router.get('/:id/posts', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is authenticated (optional for viewing posts)
    let currentUserId = null;
    let currentUserRole = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        currentUserId = decoded.userId;
        currentUserRole = decoded.role;
      } catch (err) {
        // Token invalid, but still allow viewing posts
      }
    }

    const posts = await prisma.communityPost.findMany({
      where: { communityId: parseInt(id) },
      include: {
        votes: true,
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    // Fetch user details for each post
    const postsWithUserDetails = await Promise.all(
      posts.map(async (post) => {
        let userName = `User${post.authorId}`;
        
        try {
          const user = await prisma.user.findUnique({
            where: { id: post.authorId },
            select: { name: true }
          });
          if (user) userName = user.name;
        } catch (error) {
          console.error('Error fetching user details:', error);
        }

        return {
          ...post,
          userName
        };
      })
    );

    // Add user vote status to each post
    const postsWithUserVotes = postsWithUserDetails.map(post => {
      let userVote = null;
      if (currentUserId) {
        const userVoteRecord = post.votes.find(vote => 
          vote.userId === currentUserId
        );
        userVote = userVoteRecord ? userVoteRecord.voteType : null;
      }

      return {
        ...post,
        userVote,
        tags: post.tags.map((pt: any) => pt.tag.name)
      };
    });

    res.json(postsWithUserVotes);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Update a community post (only author can update)
router.put('/:communityId/posts/:postId', authenticateToken, uploadPostImages, async (req: any, res: any) => {
  try {
    const { communityId, postId } = req.params;
    const { title, content, tags, existingImageUrls } = req.body;
    const { userId } = req.user;

    console.log('Update post request:', { 
      communityId, 
      postId, 
      title, 
      content, 
      tags: typeof tags, 
      existingImageUrls: typeof existingImageUrls,
      hasFiles: !!req.files 
    });

    if (!title || !title.trim() || !content || !content.trim()) {
      console.log('Validation failed - title or content missing');
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(postId) },
      include: { tags: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post belongs to the community
    if (post.communityId !== parseInt(communityId)) {
      return res.status(400).json({ error: 'Post does not belong to this community' });
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Only the post author can update this post' });
    }

    // Handle image updates
    let finalImageUrls: string[] = [];
    
    // Parse existing image URLs from the request
    let parsedExistingUrls: string[] = [];
    if (existingImageUrls) {
      try {
        parsedExistingUrls = typeof existingImageUrls === 'string' ? JSON.parse(existingImageUrls) : existingImageUrls;
      } catch (error) {
        console.error('Error parsing existingImageUrls:', error);
      }
    }
    
    // Add existing images that were kept
    finalImageUrls = [...parsedExistingUrls];
    
    // Find images to delete (images in post.imageUrls but not in parsedExistingUrls)
    const currentImageUrls = post.imageUrls || [];
    const imagesToDelete = currentImageUrls.filter(url => !parsedExistingUrls.includes(url));
    
    // Delete removed images from Cloudinary
    for (const imageUrl of imagesToDelete) {
      try {
        const publicId = extractPublicId(imageUrl);
        if (publicId) {
          await deleteImage(publicId);
          console.log('Deleted image from Cloudinary:', publicId);
        }
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }
    
    // Add newly uploaded images from Cloudinary
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = getUploadedImageUrl(file);
        if (imageUrl) finalImageUrls.push(imageUrl);
      }
    }

    // Update the post
    const updatedPost = await prisma.communityPost.update({
      where: { id: parseInt(postId) },
      data: {
        title: title.trim(),
        content: content.trim(),
        imageUrls: finalImageUrls
      }
    });

    // Handle tags update if provided
    let parsedTags: string[] = [];
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        parsedTags = Array.isArray(tags) ? tags : [];
      }
      
      // Delete existing tags
      await prisma.communityPostTag.deleteMany({
        where: { postId: parseInt(postId) }
      });

      // Add new tags
      if (parsedTags.length > 0) {
        for (const tagName of parsedTags) {
          if (typeof tagName === 'string' && tagName.trim()) {
            const trimmedTagName = tagName.trim().toLowerCase();
            
            // Find or create the tag
            let tag = await prisma.tag.findUnique({
              where: { name: trimmedTagName }
            });

            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: trimmedTagName }
              });
            }

            // Link the tag to the community post
            await prisma.communityPostTag.create({
              data: {
                postId: parseInt(postId),
                tagId: tag.id
              }
            });
          }
        }
      }
    }

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Failed to update post',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a community post (only author can delete)
router.delete('/:communityId/posts/:postId', authenticateToken, async (req: any, res: any) => {
  try {
    const { communityId, postId } = req.params;
    const { userId } = req.user;

    // Check if post exists
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post belongs to the community
    if (post.communityId !== parseInt(communityId)) {
      return res.status(400).json({ error: 'Post does not belong to this community' });
    }

    // Check if user is the author
    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Only the post author can delete this post' });
    }

    // Delete images from Cloudinary before deleting the post
    if (post.imageUrls && post.imageUrls.length > 0) {
      for (const imageUrl of post.imageUrls) {
        try {
          const publicId = extractPublicId(imageUrl);
          if (publicId) {
            await deleteImage(publicId);
          }
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with deletion even if image cleanup fails
        }
      }
    }

    // Delete the post (cascade will handle votes, tags, bookmarks)
    await prisma.communityPost.delete({
      where: { id: parseInt(postId) }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Vote on a community post
router.post('/:communityId/posts/:postId/vote', authenticateToken, async (req: any, res: any) => {
  try {
    const { communityId, postId } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const { userId, role } = req.user;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ error: 'Vote type must be upvote or downvote' });
    }

    // Check if user is a member
    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: parseInt(communityId),
        userId: userId,
        userRole: role as any
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Must be a member to vote' });
    }

    // Check if user already voted
    const existingVote = await prisma.communityPostVote.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: parseInt(postId)
        }
      }
    });

    const postIdNum = parseInt(postId);

    const post = await prisma.communityPost.findUnique({ where: { id: postIdNum }, select: { authorId: true } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const authorId = post.authorId;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off
        await prisma.$transaction(async (tx) => {
          await tx.communityPostVote.delete({ where: { id: existingVote.id } });
          if (existingVote.voteType === 'upvote') {
            await tx.communityPost.update({ where: { id: postIdNum }, data: { upvotes: { decrement: 1 } } });
            await awardReputation(tx as any, { userId: authorId, action: 'community_post_upvoted', overridePoints: -5, entityType: 'community_post', entityId: postIdNum, bypassCap: true, customDescription: 'Upvote removed' });
          } else {
            await tx.communityPost.update({ where: { id: postIdNum }, data: { downvotes: { decrement: 1 } } });
            await awardReputation(tx as any, { userId: authorId, action: 'community_post_downvoted', overridePoints: 2, entityType: 'community_post', entityId: postIdNum, bypassCap: true, customDescription: 'Downvote removed' });
          }
        });
        return res.json({ message: 'Vote removed successfully' });
      } else {
        // Switch vote (up->down = -7, down->up = +7)
        const delta = existingVote.voteType === 'upvote' ? -7 : 7;
        await prisma.$transaction(async (tx) => {
          await tx.communityPostVote.update({ where: { id: existingVote.id }, data: { voteType: voteType as any } });
          if (existingVote.voteType === 'upvote') {
            await tx.communityPost.update({ where: { id: postIdNum }, data: { upvotes: { decrement: 1 }, downvotes: { increment: 1 } } });
          } else {
            await tx.communityPost.update({ where: { id: postIdNum }, data: { downvotes: { decrement: 1 }, upvotes: { increment: 1 } } });
          }
          await awardReputation(tx as any, { userId: authorId, action: voteType === 'upvote' ? 'community_post_upvoted' : 'community_post_downvoted', overridePoints: delta, entityType: 'community_post', entityId: postIdNum, bypassCap: true, customDescription: 'Vote switched' });
        });
        return res.json({ message: 'Vote updated successfully' });
      }
    }

    // New vote
    await prisma.$transaction(async (tx) => {
      await tx.communityPostVote.create({
        data: {
          userId: userId,
          postId: postIdNum,
          voteType: voteType as any
        }
      });
      if (voteType === 'upvote') {
        await tx.communityPost.update({ where: { id: postIdNum }, data: { upvotes: { increment: 1 } } });
      } else {
        await tx.communityPost.update({ where: { id: postIdNum }, data: { downvotes: { increment: 1 } } });
      }
      await awardReputation(tx as any, { userId: authorId, action: voteType === 'upvote' ? 'community_post_upvoted' : 'community_post_downvoted', entityType: 'community_post', entityId: postIdNum });
    });

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ error: 'Failed to vote on post' });
  }
});

// Search communities
router.get('/search/:query', async (req: any, res: any) => {
  try {
    const { query } = req.params;

    const communities = await prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { skills: { hasSome: [query] } }
        ]
      },
      include: {
        _count: {
          select: {
            members: true,
            posts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(communities);
  } catch (error) {
    console.error('Error searching communities:', error);
    res.status(500).json({ error: 'Failed to search communities' });
  }
});

export { router as communitiesRouter };
