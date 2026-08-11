import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Protect all admin tag routes
router.use(requireAdmin);

// GET /tags - Get all tags with usage counts
router.get('/', async (req: any, res: any) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        communityPosts: true
                    }
                }
            }
        });

        res.json({ tags });
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

// GET /tags/:id - Get a specific tag by ID
router.get('/:id', async (req: any, res: any) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        const tag = await prisma.tag.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        communityPosts: true
                    }
                }
            }
        });

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.json({ tag });
    } catch (err) {
        console.error('Error fetching tag:', err);
        res.status(500).json({ error: 'Failed to fetch tag' });
    }
});

// POST /tags - Create a new tag
router.post('/', async (req: any, res: any) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        // Check if tag already exists
        const existingTag = await prisma.tag.findUnique({
            where: { name: name.trim().toLowerCase() }
        });

        if (existingTag) {
            return res.status(400).json({ error: 'A tag with this name already exists' });
        }

        const tag = await prisma.tag.create({
            data: {
                name: name.trim().toLowerCase(),
                description: description?.trim() || null
            },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        communityPosts: true
                    }
                }
            }
        });

        res.status(201).json({ message: 'Tag created successfully', tag });
    } catch (err) {
        console.error('Error creating tag:', err);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

// PUT /tags/:id - Update a tag
router.put('/:id', async (req: any, res: any) => {
    try {
        const id = parseInt(req.params.id);
        const { name, description } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        // Check if tag exists
        const existingTag = await prisma.tag.findUnique({
            where: { id }
        });

        if (!existingTag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        // If name is being changed, check if new name already exists
        if (name && name.trim().toLowerCase() !== existingTag.name) {
            const duplicateTag = await prisma.tag.findUnique({
                where: { name: name.trim().toLowerCase() }
            });

            if (duplicateTag) {
                return res.status(400).json({ error: 'A tag with this name already exists' });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim().toLowerCase();
        if (description !== undefined) updateData.description = description?.trim() || null;

        const tag = await prisma.tag.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        communityPosts: true
                    }
                }
            }
        });

        res.json({ message: 'Tag updated successfully', tag });
    } catch (err) {
        console.error('Error updating tag:', err);
        res.status(500).json({ error: 'Failed to update tag' });
    }
});

// DELETE /tags/:id - Delete a tag
router.delete('/:id', async (req: any, res: any) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        // Check if tag exists
        const existingTag = await prisma.tag.findUnique({
            where: { id },
            select: {
                _count: {
                    select: {
                        questions: true,
                        articles: true,
                        communityPosts: true
                    }
                }
            }
        });

        if (!existingTag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        // Check if tag is in use
        const totalUsage = existingTag._count.questions +
            existingTag._count.articles +
            existingTag._count.communityPosts;

        if (totalUsage > 0) {
            return res.status(400).json({
                error: `Cannot delete tag. It is currently being used in ${totalUsage} items (${existingTag._count.questions} questions, ${existingTag._count.articles} articles, ${existingTag._count.communityPosts} community posts)`
            });
        }

        await prisma.tag.delete({
            where: { id }
        });

        res.json({ message: 'Tag deleted successfully' });
    } catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

export default router;
