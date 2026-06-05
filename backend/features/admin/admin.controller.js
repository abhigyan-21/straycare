const prisma = require('../../db/prisma');

/**
 * @desc Get administrative analytics statistics
 * @route GET /api/admin/stats
 * @access Private (Admin only)
 */
const getStats = async (req, res) => {
  try {
    const adoptionsCount = await prisma.adoptionRequest.count({
      where: { status: 'APPROVED' }
    });

    const rescuesCount = await prisma.animalReport.count({
      where: {
        status: {
          in: ['RESCUED', 'TREATED', 'ADOPTED']
        }
      }
    });

    const urgentReportsCount = await prisma.animalReport.count({
      where: { status: 'REPORTED' }
    });

    const donationsSum = await prisma.donation.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    const fundingAmount = donationsSum._sum.amount || 0;
    const fundingFormatted = `₹${fundingAmount.toLocaleString('en-IN')}`;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthStr = `${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`;

    res.json({
      adoptions: adoptionsCount,
      rescues: rescuesCount,
      urgentReports: urgentReportsCount,
      funding: fundingFormatted,
      month: currentMonthStr
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all registered users and clinics formatted for admin
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const users = dbUsers.map(u => {
      let roleMapped = 'user';
      if (u.role === 'NGO') roleMapped = 'ngo';
      else if (u.role === 'VET' || u.role === 'RESCUER') roleMapped = 'partner';
      else if (u.role === 'ADMIN') roleMapped = 'admin';

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: roleMapped,
        status: u.status,
        joined: u.createdAt.toISOString().split('T')[0]
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update a user's account status (Active, Suspended, Pending)
 * @route PATCH /api/admin/users/:id/status
 * @access Private (Admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Active', 'Suspended', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all pet medical and NGO verification documents
 * @route GET /api/admin/documents
 * @access Private (Admin only)
 */
const getDocuments = async (req, res) => {
  try {
    const dbDocs = await prisma.petDocument.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    const docs = dbDocs.map(d => ({
      id: d.id,
      title: d.name,
      type: d.type,
      size: `${((d.fileData ? d.fileData.length : 0) / 1024 / 1024).toFixed(1)} MB`,
      date: d.createdAt.toISOString().split('T')[0],
      owner: d.user?.name || 'Unknown'
    }));

    res.json(docs);
  } catch (error) {
    console.error('Error fetching admin documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get animal reports for tracking
 * @route GET /api/admin/tracking
 * @access Private (Admin only)
 */
const getTracking = async (req, res) => {
  try {
    const dbReports = await prisma.animalReport.findMany({
      include: { pet: true },
      orderBy: { createdAt: 'desc' }
    });

    const trackingList = dbReports.map(r => {
      let trackingStatus = 'Reported';
      if (r.status === 'ASSIGNED') trackingStatus = 'Rescue in Progress';
      else if (r.status === 'RESCUED') trackingStatus = 'At Clinic';
      else if (r.status === 'TREATED') trackingStatus = 'Treated';
      else if (r.status === 'ADOPTED') trackingStatus = 'Adopted';

      return {
        id: r.id.substring(0, 8).toUpperCase(),
        name: r.pet?.name || 'Stray',
        type: r.pet?.breed || 'Unknown',
        reporter: 'Anonymous',
        status: trackingStatus,
        date: r.createdAt.toISOString().split('T')[0],
        location: r.description
      };
    });

    res.json(trackingList);
  } catch (error) {
    console.error('Error fetching admin tracking list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get community posts for content moderation
 * @route GET /api/admin/posts
 * @access Private (Admin only)
 */
const getPosts = async (req, res) => {
  try {
    const dbPosts = await prisma.feedPost.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });

    const posts = dbPosts.map(p => ({
      id: p.id,
      author: p.author?.name || 'Anonymous',
      authorAvatar: p.author?.avatarUrl || 'https://i.pravatar.cc/150?u=' + p.id,
      content: p.content,
      date: p.createdAt.toISOString().split('T')[0],
      status: p.status,
      reports: p.reports
    }));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin moderation posts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update post moderation status (Published, Flagged, Pending)
 * @route PATCH /api/admin/posts/:id/status
 * @access Private (Admin only)
 */
const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Published', 'Flagged', 'Pending', 'Reported'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedPost = await prisma.feedPost.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Delete a community post permanently
 * @route DELETE /api/admin/posts/:id
 * @access Private (Admin only)
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.feedPost.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Post deleted permanently' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  getDocuments,
  getTracking,
  getPosts,
  updatePostStatus,
  deletePost
};
