const prisma = require('../../db/prisma');
const { uploadToCloudinary, getOptimizedUrl } = require('../../utils/cloudinary');

exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
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

    const totalPosts = await prisma.post.count();
    const hasMore = skip + posts.length < totalPosts;

    // Apply Cloudinary URL optimization
    const optimizedPosts = posts.map(post => ({
      ...post,
      postImage: getOptimizedUrl(post.postImage, { width: 800 }),
      author: post.author ? {
        ...post.author,
        avatarUrl: getOptimizedUrl(post.author.avatarUrl, { width: 100, crop: 'fill' })
      } : null,
      comments: post.comments.map(comment => ({
        ...comment,
        user: comment.user ? {
          ...comment.user,
          avatarUrl: getOptimizedUrl(comment.user.avatarUrl, { width: 60, crop: 'fill' })
        } : null
      }))
    }));

    res.status(200).json({
      status: 'success',
      data: optimizedPosts,
      pagination: {
        page,
        limit,
        totalPosts,
        hasMore
      }
    });
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

exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        likes: { select: { userId: true } },
        comments: { select: { id: true } }
      }
    });

    const optimizedPosts = posts.map(post => ({
      ...post,
      postImage: getOptimizedUrl(post.postImage, { width: 800 })
    }));

    res.status(200).json({ status: 'success', data: optimizedPosts });
  } catch (error) {
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found.' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ status: 'error', message: 'You can only delete your own posts.' });
    }

    // Delete related likes and comments first, then the post
    await prisma.like.deleteMany({ where: { postId: id } });
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    // Attempt to delete from Cloudinary if URL exists
    if (post.postImage) {
      try {
        const { cloudinary } = require('../../utils/cloudinary');
        const urlParts = post.postImage.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.warn('Failed to delete image from Cloudinary:', cloudErr.message);
      }
    }

    res.status(200).json({ status: 'success', message: 'Post deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
