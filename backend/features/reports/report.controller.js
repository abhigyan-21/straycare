const prisma = require('../../db/prisma');

/**
 * @desc Create a new animal report
 * @route POST /api/reports
 * @access Private
 */
const createReport = async (req, res) => {
  try {
    const { locationLat, locationLng, description, mediaUrls } = req.body;
    const reporterId = req.user.id;

    if (locationLat === undefined || locationLng === undefined || !description) {
      return res.status(400).json({ error: 'Location and description are required' });
    }

    const report = await prisma.animalReport.create({
      data: {
        reporterId,
        locationLat: parseFloat(locationLat),
        locationLng: parseFloat(locationLng),
        description,
        mediaUrls: mediaUrls || [],
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all animal reports submitted by the logged-in user
 * @route GET /api/reports/my
 * @access Private
 */
const getMyReports = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const reports = await prisma.animalReport.findMany({
      where: { reporterId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching my reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all animal reports (for feed/general view)
 * @route GET /api/reports
 * @access Public
 */
const getReports = async (req, res) => {
  try {
    const reports = await prisma.animalReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get details of a specific animal report
 * @route GET /api/reports/:id
 * @access Public
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.animalReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            contact: true,
          },
        },
        medicalRecords: true,
        pet: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update the status of an animal report
 * @route PATCH /api/reports/:id/status
 * @access Private (Vet/Admin)
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['REPORTED', 'ASSIGNED', 'RESCUED', 'TREATED', 'ADOPTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await prisma.animalReport.update({
      where: { id },
      data: { status },
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReports,
  getReportById,
  updateReportStatus,
};
