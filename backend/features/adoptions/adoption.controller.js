const prisma = require('../../db/prisma');

/**
 * @desc Get all available pets for adoption
 * @route GET /api/adoptions/pets
 * @access Public
 */
const listPets = async (req, res) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        clinic: true,
        report: true,
      },
    });
    res.json({ status: 'success', data: pets });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc Get pet details
 * @route GET /api/adoptions/pets/:id
 * @access Public
 */
const getPetDetails = async (req, res) => {
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id },
      include: {
        clinic: true,
        report: true,
      },
    });
    if (!pet) {
      return res.status(404).json({ status: 'error', message: 'Pet not found' });
    }
    res.json({ status: 'success', data: pet });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc List a stray for adoption (from AnimalReport)
 * @route POST /api/adoptions/pets
 * @access Vet/Admin
 */
const listPetForAdoption = async (req, res) => {
  try {
    const { reportId, name, breed, age, gender, size, description } = req.body;
    
    // Check if report exists
    const report = await prisma.animalReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ status: 'error', message: 'Animal report not found' });
    }

    // Check if user is associated with the clinic assigned to the report
    // In this simplified version, we'll check if the user has a clinicId or is ADMIN
    if (req.user.role !== 'ADMIN' && (!req.user.clinicId || req.user.clinicId !== report.assignedClinicId)) {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to list this animal for adoption' });
    }

    const pet = await prisma.pet.create({
      data: {
        reportId,
        clinicId: report.assignedClinicId,
        name,
        breed,
        age: parseInt(age),
        gender,
        size,
        description,
        status: 'AVAILABLE',
      },
    });

    // Update report status to ADOPTED if it was not already (maybe wait until actually adopted)
    // Actually, maybe keep it TREATED or similar until adoption is finalized.
    // For now, let's just make it available.

    res.status(201).json({ status: 'success', data: pet });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc Submit an adoption request
 * @route POST /api/adoptions/requests
 * @access User
 */
const submitAdoptionRequest = async (req, res) => {
  try {
    const { petId, formDetails } = req.body;
    const userId = req.user.id;

    // Check if pet is available
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
    });

    if (!pet || pet.status !== 'AVAILABLE') {
      return res.status(400).json({ status: 'error', message: 'Pet is no longer available for adoption' });
    }

    const request = await prisma.adoptionRequest.create({
      data: {
        petId,
        userId,
        formDetails,
        status: 'PENDING',
      },
    });

    // Note: User feedback mentioned skipping notifications for now, 
    // but in a real app, this would trigger a notification for the clinic.

    res.status(201).json({ status: 'success', data: request });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc Get adoption requests for a clinic (Vet/Admin) or User (User)
 * @route GET /api/adoptions/requests
 * @access Private
 */
const getAdoptionRequests = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'USER') {
      whereClause.userId = req.user.id;
    } else if (req.user.clinicId) {
      whereClause.pet = { clinicId: req.user.clinicId };
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const requests = await prisma.adoptionRequest.findMany({
      where: whereClause,
      include: {
        pet: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({ status: 'success', data: requests });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc Update adoption request status (Interview/Approve/Reject)
 * @route PATCH /api/adoptions/requests/:id
 * @access Vet/Admin
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { status, interviewDate, interviewTime, interviewLocation } = req.body;
    const requestId = req.params.id;

    const request = await prisma.adoptionRequest.findUnique({
      where: { id: requestId },
      include: { pet: true },
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Adoption request not found' });
    }

    // Check authorization
    if (req.user.role !== 'ADMIN' && (!req.user.clinicId || req.user.clinicId !== request.pet.clinicId)) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const updatedRequest = await prisma.adoptionRequest.update({
      where: { id: requestId },
      data: {
        status,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        interviewTime,
        interviewLocation,
      },
    });

    // If approved, mark pet as ADOPTED (or similar)
    if (status === 'APPROVED') {
      await prisma.pet.update({
        where: { id: request.petId },
        data: { status: 'ADOPTED' },
      });
      // Also update the report status
      await prisma.animalReport.update({
        where: { id: request.pet.reportId },
        data: { status: 'ADOPTED' },
      });
    }

    res.json({ status: 'success', data: updatedRequest });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  listPets,
  getPetDetails,
  listPetForAdoption,
  submitAdoptionRequest,
  getAdoptionRequests,
  updateRequestStatus,
};
