const prisma = require('../../db/prisma');

/**
 * @desc Get all posts authored by the logged-in user
 * @route GET /api/feed/my-posts
 * @access Private
 */
const getMyPosts = async (req, res) => {
  try {
    const authorId = req.user.id;
    const posts = await prisma.feedPost.findMany({
      where: { authorId },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Create a new feed post
 * @route POST /api/feed
 * @access Private
 */
const createPost = async (req, res) => {
  try {
    const { content, mediaUrls } = req.body;
    const authorId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await prisma.feedPost.create({
      data: {
        authorId,
        content,
        mediaUrls: mediaUrls || [],
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating feed post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Delete a feed post
 * @route DELETE /api/feed/:id
 * @access Private
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const authorId = req.user.id;

    const post = await prisma.feedPost.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== authorId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await prisma.feedPost.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getMyPosts,
  createPost,
  deletePost,
};
