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
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
 * @desc List a pet for adoption (from AnimalReport or directly)
 * @route POST /api/adoptions/pets
 * @access Rescuer/Vet/Admin
 */
const listPetForAdoption = async (req, res) => {
  try {
    const { reportId, name, breed, age, gender, size, description } = req.body;
    const ownerId = req.user.id;
    
    let clinicId = req.user.clinicId || null;

    // Validation: Must be associated with a clinic OR be a registered Rescuer
    if (!clinicId && req.user.role !== 'RESCUER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'To list a pet for adoption, you must either be associated with a clinic or be a registered rescuer.' 
      });
    }

    // If linked to a report
    if (reportId) {
      const report = await prisma.animalReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return res.status(404).json({ status: 'error', message: 'Animal report not found' });
      }

      // If report has a clinic, use it, unless the user is an admin or the rescuer assigned to it
      clinicId = report.assignedClinicId || clinicId;

      // Check authorization for report-linked pets
      if (req.user.role !== 'ADMIN' && 
          clinicId !== req.user.clinicId && 
          report.assignedRescuerId !== ownerId) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'You are not authorized to list this specific reported stray for adoption.' 
        });
      }
    }

    const pet = await prisma.pet.create({
      data: {
        reportId: reportId || null,
        clinicId,
        ownerId,
        name,
        breed,
        age: age ? parseInt(age) : null,
        gender,
        size,
        description,
        status: 'AVAILABLE',
      },
    });

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

    res.status(201).json({ status: 'success', data: request });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc Get adoption requests
 * @route GET /api/adoptions/requests
 * @access Private
 */
const getAdoptionRequests = async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'USER') {
      whereClause.userId = req.user.id;
    }
    else if (req.user.role === 'RESCUER') {
      // Rescuers see requests for pets they listed
      whereClause.pet = { ownerId: req.user.id };
    }
    else if (req.user.clinicId) {
      // Vets/Clinic Admins see requests for the clinic's pets
      whereClause.pet = { clinicId: req.user.clinicId };
    }
    else if (req.user.role !== 'ADMIN') {
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
 * @desc Update adoption request status
 * @route PATCH /api/adoptions/requests/:id
 * @access Rescuer/Vet/Admin
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

    // Check authorization: Owner of pet, or member of assigned clinic, or ADMIN
    const isOwner = request.pet.ownerId === req.user.id;
    const isInClinic = req.user.clinicId && request.pet.clinicId === req.user.clinicId;
    
    if (req.user.role !== 'ADMIN' && !isOwner && !isInClinic) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update this request' });
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

    if (status === 'APPROVED') {
      await prisma.pet.update({
        where: { id: request.petId },
        data: { status: 'ADOPTED' },
      });
      if (request.pet.reportId) {
        await prisma.animalReport.update({
          where: { id: request.pet.reportId },
          data: { status: 'ADOPTED' },
        });
      }
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
