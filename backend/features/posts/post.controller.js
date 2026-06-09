const prisma = require('../../db/prisma');
const { uploadToCloudinary } = require('../../utils/cloudinary');

exports.getPosts = async (req, res, next) => {
  try {
    // Determine user ID if authenticated (to check isLiked). Auth middleware could optionally append user, but GET might be public.
    // If we want isLiked, we need the requester's ID. Let's assume auth middleware handles it, or we rely on the client passing it.
    // For now, we'll just return all posts and let the client match `likes.some(like => like.userId === currentUserId)` if they want.
    
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        },
        likes: {
          select: { userId: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.status(200).json({ status: 'success', data: posts });
  } catch (error) {
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { caption, location } = req.body;
    const userId = req.user.id; // from requireAuth middleware
    
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Image file is required.' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    const post = await prisma.post.create({
      data: {
        caption,
        location,
        postImage: result.secure_url,
        authorId: userId
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        likes: true,
        comments: true
      }
    });

    res.status(201).json({ status: 'success', data: post });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      res.status(200).json({ status: 'success', message: 'Post unliked', isLiked: false });
    } else {
      await prisma.like.create({
        data: { postId, userId }
      });
      res.status(200).json({ status: 'success', message: 'Post liked', isLiked: true });
    }
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'Comment text is required.' });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        postId,
        userId
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.status(201).json({ status: 'success', data: comment });
  } catch (error) {
    next(error);
  }
};
