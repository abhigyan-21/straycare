const prisma = require('../../db/prisma');

/**
 * @desc Create a medical record for a stray
 * @route POST /api/medical
 * @access Private (Vet)
 */
const createMedicalRecord = async (req, res) => {
  try {
    const { reportId, clinicId, diagnosis, treatment } = req.body;
    const vetId = req.user.id;

    if (!reportId || !clinicId) {
      return res.status(400).json({ error: 'Report ID and Clinic ID are required' });
    }

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        reportId,
        vetId,
        clinicId,
        diagnosis,
        treatment,
      },
    });

    res.status(201).json(medicalRecord);
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Get medical records for a specific report
 * @route GET /api/medical/report/:reportId
 * @access Private (Staff)
 */
const getRecordsByReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const records = await prisma.medicalRecord.findMany({
      where: { reportId },
      include: {
        vet: {
          select: { name: true }
        },
        clinic: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Update a medical record
 * @route PATCH /api/medical/:id
 * @access Private (Vet)
 */
const updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment } = req.body;

    const medicalRecord = await prisma.medicalRecord.update({
      where: { id },
      data: { diagnosis, treatment },
    });

    res.json(medicalRecord);
  } catch (error) {
    console.error('Error updating medical record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createMedicalRecord,
  getRecordsByReport,
  updateMedicalRecord,
};
