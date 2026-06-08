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

    if (req.io) {
      req.io.emit('new-report', report);
    }

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
 * @desc Get all animal reports assigned to the logged-in rescuer
 * @route GET /api/reports/my-rescues
 * @access Private (Rescuer/Admin)
 */
const getMyRescues = async (req, res) => {
  try {
    const rescuerId = req.user.id;
    const reports = await prisma.animalReport.findMany({
      where: { assignedRescuerId: rescuerId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        pet: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching my rescues:', error);
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
            phone: true,
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
            phone: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            contact: true,
            lat: true,
            lng: true,
          },
        },
        medicalRecords: true,
        pet: true,
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    let rescuer = null;
    if (report.assignedRescuerId) {
      rescuer = await prisma.user.findUnique({
        where: { id: report.assignedRescuerId },
        select: {
          id: true,
          name: true,
          email: true,
          contact: true,
          phone: true,
          avatarUrl: true,
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
              contact: true,
              lat: true,
              lng: true,
            }
          }
        }
      });
    }

    res.json({ ...report, rescuer });
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

    if (req.io) {
      req.io.emit('report-updated', report);
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Assign a report to a rescuer or clinic
 * @route PATCH /api/reports/:id/assign
 * @access Private (Vet/Admin)
 */
const assignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { rescuerId, clinicId } = req.body;

    const data = {};
    if (rescuerId) data.assignedRescuerId = rescuerId;
    if (clinicId) {
      data.assignedClinicId = clinicId;
    } else if (rescuerId) {
      const rescuer = await prisma.user.findUnique({
        where: { id: rescuerId },
        select: { clinicId: true }
      });
      if (rescuer?.clinicId) {
        data.assignedClinicId = rescuer.clinicId;
      }
    }
    
    // Auto-update status to ASSIGNED if not already rescued
    const currentReport = await prisma.animalReport.findUnique({ where: { id } });
    if (currentReport && currentReport.status === 'REPORTED') {
      data.status = 'ASSIGNED';
    }

    const report = await prisma.animalReport.update({
      where: { id },
      data,
    });

    if (req.io) {
      req.io.emit('report-updated', report);
    }

    res.json(report);
  } catch (error) {
    console.error('Error assigning report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update the live location of a rescuer for a specific report
 * @route PATCH /api/reports/:id/location
 * @access Private (Rescuer)
 */
const updateRescuerLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const report = await prisma.animalReport.update({
      where: { id },
      data: {
        rescuerLat: parseFloat(lat),
        rescuerLng: parseFloat(lng),
        lastTracked: new Date(),
      },
    });

    res.json(report);
  } catch (error) {
    console.error('Error updating rescuer location:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get all reports assigned to the current user's clinic
 * @route GET /api/reports/clinic
 * @access Private (Vet/Admin)
 */
const getClinicReports = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId) {
      return res.status(400).json({ error: 'You are not associated with any clinic' });
    }

    const reports = await prisma.animalReport.findMany({
      where: { assignedClinicId: clinicId },
      include: {
        reporter: {
          select: { name: true, avatarUrl: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching clinic reports:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReports,
  getReportById,
  updateReportStatus,
  assignReport,
  updateRescuerLocation,
  getClinicReports,
  getMyRescues,
};
