const prisma = require('../../db/prisma');

const mapPetData = (pet) => {
  if (!pet) return null;
  let descriptionText = pet.description || '';
  let hobbies = '';
  let talents = '';
  let medicalHistory = '';
  let image = '';
  let type = 'Dog';
  let age = pet.age ? `${pet.age} Years` : 'Unknown';

  try {
    if (pet.description && pet.description.startsWith('{')) {
      const parsed = JSON.parse(pet.description);
      descriptionText = parsed.description || '';
      hobbies = parsed.hobbies || '';
      talents = parsed.talents || '';
      medicalHistory = parsed.healthStatus || '';
      image = parsed.image || '';
      type = parsed.species || 'Dog';
      if (parsed.age) {
        age = parsed.age;
      }
    }
  } catch (e) {
    console.error('Error parsing pet description:', e);
  }

  // Fallback for image: if not in description, try report.mediaUrls[0]
  if (!image && pet.report && pet.report.mediaUrls && pet.report.mediaUrls.length > 0) {
    image = pet.report.mediaUrls[0];
  }

  let ageGroup = 'Adult';
  const ageLower = age.toLowerCase();
  const speciesLower = type.toLowerCase();

  if (ageLower.includes('month') || ageLower.includes('puppy') || ageLower.includes('kitten') || ageLower === '0') {
    ageGroup = speciesLower === 'cat' ? 'Kitten' : 'Puppy';
  } else {
    const val = parseInt(ageLower);
    if (!isNaN(val)) {
      if (val < 1) {
        ageGroup = speciesLower === 'cat' ? 'Kitten' : 'Puppy';
      } else if (val === 1) {
        ageGroup = 'Young';
      } else if (val >= 5) {
        ageGroup = 'Senior';
      } else {
        ageGroup = 'Adult';
      }
    }
  }

  return {
    ...pet,
    type,
    sex: pet.gender || 'Unknown',
    image: image || null,
    description: descriptionText,
    hobbies,
    talents,
    medicalHistory,
    age,
    ageGroup,
    color: '',
  };
};

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
    res.json({ status: 'success', data: pets.map(mapPetData) });
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
    res.json({ status: 'success', data: mapPetData(pet) });
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
    
    // Fetch the most up-to-date user info directly from the database to avoid stale JWT token claims
    const dbUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { clinicId: true, role: true }
    });
    
    const userRole = dbUser?.role || req.user.role;
    let clinicId = dbUser?.clinicId || null;

    // Validation: Must be associated with a clinic OR be a registered Rescuer
    if (!clinicId && userRole !== 'RESCUER' && userRole !== 'ADMIN' && userRole !== 'NGO') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'To list a pet for adoption, you must either be associated with a clinic or be a registered rescuer/NGO.' 
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
      if (userRole !== 'ADMIN' && 
          clinicId !== dbUser?.clinicId && 
          report.assignedRescuerId !== ownerId) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'You are not authorized to list this specific reported stray for adoption.' 
        });
      }

      // Sync the uploaded image to the report's mediaUrls if provided
      if (req.body.image) {
        await prisma.animalReport.update({
          where: { id: reportId },
          data: {
            mediaUrls: [req.body.image]
          }
        });
      }
    }

    // Package description, hobbies, talents, healthStatus, species, image and age in JSON
    const descriptionData = {
      description: description || '',
      hobbies: req.body.hobbies || '',
      talents: req.body.talents || '',
      healthStatus: req.body.healthStatus || '',
      image: req.body.image || null,
      species: req.body.species || 'Dog',
      age: req.body.age || '',
    };
    const serializedDescription = JSON.stringify(descriptionData);

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
        description: serializedDescription,
        status: 'AVAILABLE',
      },
      include: {
        report: true,
        clinic: true,
      }
    });

    res.status(201).json({ status: 'success', data: mapPetData(pet) });
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
        pet: {
          include: {
            clinic: true,
            report: {
              select: {
                mediaUrls: true,
              },
            },
          },
        },
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

    const mappedRequests = requests.map(r => ({
      ...r,
      pet: r.pet ? mapPetData(r.pet) : null,
    }));

    res.json({ status: 'success', data: mappedRequests });
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

const getClinicPets = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    if (!clinicId) {
      return res.status(400).json({ error: 'You are not associated with any clinic' });
    }
    const pets = await prisma.pet.findMany({
      where: { clinicId },
      include: {
        report: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: pets.map(mapPetData) });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, breed, age, gender, size, description, status } = req.body;

    const pet = await prisma.pet.findUnique({
      where: { id },
    });

    if (!pet) {
      return res.status(404).json({ status: 'error', message: 'Pet not found' });
    }

    const isOwner = pet.ownerId === req.user.id;
    const isInClinic = req.user.clinicId && pet.clinicId === req.user.clinicId;

    if (req.user.role !== 'ADMIN' && !isOwner && !isInClinic) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update this pet' });
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name,
        breed,
        age: age ? parseInt(age) : undefined,
        gender,
        size,
        description,
        status,
      },
      include: {
        report: true,
      },
    });

    res.json({ status: 'success', data: mapPetData(updatedPet) });
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
  getClinicPets,
  updatePet,
};
