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

    // Fetch recent community activities dynamically
    const recentAdoptions = await prisma.adoptionRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        pet: { select: { name: true } },
        user: { select: { name: true } }
      }
    });

    const recentReports = await prisma.animalReport.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const recentPartners = await prisma.user.findMany({
      where: { role: { in: ['NGO', 'VET'] } },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    const formatTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    };

    const activities = [
      ...recentAdoptions.map(req => ({
        id: `adoption-${req.id}`,
        type: 'adoption',
        title: 'New Adoption Request',
        description: `${req.pet?.name || 'Stray'} was requested by ${req.user?.name || 'someone'}`,
        time: formatTimeAgo(req.createdAt),
        icon: 'heart',
        createdAt: req.createdAt
      })),
      ...recentReports.map(rep => ({
        id: `report-${rep.id}`,
        type: 'emergency',
        title: 'Emergency Report',
        description: rep.description || 'Injured stray reported',
        time: formatTimeAgo(rep.createdAt),
        icon: 'alert',
        createdAt: rep.createdAt
      })),
      ...recentPartners.map(p => ({
        id: `partner-${p.id}`,
        type: 'partner',
        title: 'New Partner Registration',
        description: `${p.name} registered`,
        time: formatTimeAgo(p.createdAt),
        icon: 'user',
        createdAt: p.createdAt
      }))
    ];

    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentActivity = activities.slice(0, 5).map(({ createdAt, ...rest }) => rest);

    res.json({
      adoptions: adoptionsCount,
      rescues: rescuesCount,
      urgentReports: urgentReportsCount,
      funding: fundingFormatted,
      month: currentMonthStr,
      recentActivity
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

/**
 * @desc Get reports and analytics summaries
 * @route GET /api/admin/reports
 * @access Private (Admin only)
 */
const getReports = async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateFilter = {};
    if (start) dateFilter.gte = new Date(start);
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const dateQuery = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const adoptionsCount = await prisma.adoptionRequest.count({
      where: {
        status: 'APPROVED',
        ...dateQuery
      }
    });

    const rescuesCount = await prisma.animalReport.count({
      where: {
        status: { in: ['RESCUED', 'TREATED', 'ADOPTED'] },
        ...dateQuery
      }
    });

    // Calculate user growth in the last 30 days
    const totalUsers = await prisma.user.count();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    const previousUsers = totalUsers - recentUsers;
    const userGrowthPercent = previousUsers > 0 ? Math.round((recentUsers / previousUsers) * 100) : 0;
    const userGrowth = `+${userGrowthPercent}%`;

    const donationsSum = await prisma.donation.aggregate({
      where: {
        status: 'SUCCESS',
        ...dateQuery
      },
      _sum: { amount: true }
    });
    const totalDonations = donationsSum._sum.amount || 0;
    const donationsFormatted = `₹${totalDonations.toLocaleString('en-IN')}`;

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const campaignSummary = campaigns.map(c => {
      const efficiency = c.goalAmount > 0 ? Math.round((c.raisedAmount / c.goalAmount) * 100) : 0;
      return {
        id: c.id,
        name: c.title,
        goal: `₹${c.goalAmount.toLocaleString('en-IN')}`,
        raised: `₹${c.raisedAmount.toLocaleString('en-IN')}`,
        status: c.status === 'APPROVED' ? 'Active' : c.status === 'PENDING' ? 'Ongoing' : 'Inactive',
        efficiency: `${efficiency}%`
      };
    });

    res.json({
      adoptions: adoptionsCount,
      rescues: rescuesCount,
      userGrowth,
      donations: donationsFormatted,
      campaigns: campaignSummary
    });
  } catch (error) {
    console.error('Error fetching admin reports data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Delete a user permanently
 * @route DELETE /api/admin/users/:id
 * @access Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is trying to delete themselves
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    // Perform cascade deletions of all dependencies sequentially
    // 1. Delete general volunteers
    await prisma.generalVolunteer.deleteMany({ where: { userId: id } });

    // 2. Delete campaign volunteers associated with the user
    await prisma.campaignVolunteer.deleteMany({ where: { userId: id } });

    // 3. Delete comments written by the user
    await prisma.comment.deleteMany({ where: { authorId: id } });

    // 4. Delete comments on posts written by the user
    await prisma.comment.deleteMany({ where: { post: { authorId: id } } });

    // 5. Delete feed posts written by the user
    await prisma.feedPost.deleteMany({ where: { authorId: id } });

    // 6. Delete donations associated with campaigns created by the user
    await prisma.donation.deleteMany({ where: { campaign: { createdBy: id } } });

    // 7. Delete volunteers on campaigns created by the user
    await prisma.campaignVolunteer.deleteMany({ where: { campaign: { createdBy: id } } });

    // 8. Delete campaigns created by the user
    await prisma.campaign.deleteMany({ where: { createdBy: id } });

    // 9. Delete donations made by the user
    await prisma.donation.deleteMany({ where: { userId: id } });

    // 10. Delete subscriptions associated with the user
    await prisma.subscription.deleteMany({ where: { userId: id } });

    // 11. Delete adoption requests made by the user
    await prisma.adoptionRequest.deleteMany({ where: { userId: id } });

    // 12. Delete adoption requests for pets owned by the user
    await prisma.adoptionRequest.deleteMany({ where: { pet: { ownerId: id } } });

    // 13. Delete medical records where the user was the vet
    await prisma.medicalRecord.deleteMany({ where: { vetId: id } });

    // 14. Delete medical records on reports created by the user
    await prisma.medicalRecord.deleteMany({ where: { report: { reporterId: id } } });

    // 15. Delete campaigns linked to reports created by the user
    await prisma.campaign.deleteMany({ where: { report: { reporterId: id } } });

    // 16. Delete pets linked to reports created by the user
    await prisma.pet.deleteMany({ where: { report: { reporterId: id } } });

    // 17. Delete pets owned by the user
    await prisma.pet.deleteMany({ where: { ownerId: id } });

    // 18. Delete animal reports created by the user
    await prisma.animalReport.deleteMany({ where: { reporterId: id } });

    // 19. Delete pet documents uploaded by the user
    await prisma.petDocument.deleteMany({ where: { userId: id } });

    // 20. Delete the user
    await prisma.user.deleteMany({ where: { id } });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
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
  deletePost,
  getReports,
  deleteUser
};
