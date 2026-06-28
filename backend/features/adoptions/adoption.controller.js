const prisma = require('../../db/prisma');
const { sendEmail } = require('../../services/email.service');

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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

/**
 * @desc Get all available pets for adoption
 * @route GET /api/adoptions/pets
 * @access Public
 */
const listPets = async (req, res) => {
  try {
    const { lat, lng, maxDistance } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;
    const maxDist = maxDistance ? parseFloat(maxDistance) : null;

    const pets = await prisma.pet.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        partner: true,
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

    let mappedPets = pets.map(pet => {
      const p = mapPetData(pet);
      
      let petLat = null;
      let petLng = null;
      let locationString = 'Location Unknown';

      if (pet.partner && pet.partner.lat && pet.partner.lng) {
        petLat = pet.partner.lat;
        petLng = pet.partner.lng;
        locationString = pet.partner.city ? `${pet.partner.name}, ${pet.partner.city}` : pet.partner.name;
      } else if (pet.report && pet.report.locationLat && pet.report.locationLng) {
        petLat = pet.report.locationLat;
        petLng = pet.report.locationLng;
        locationString = 'Reported Location';
      }

      let distance = null;
      if (userLat !== null && userLng !== null && petLat !== null && petLng !== null) {
        distance = calculateDistance(userLat, userLng, petLat, petLng);
      }

      return {
        ...p,
        distance,
        locationString
      };
    });

    if (userLat !== null && userLng !== null) {
      if (maxDist !== null && !isNaN(maxDist)) {
        mappedPets = mappedPets.filter(p => p.distance !== null && p.distance <= maxDist);
      }
      mappedPets.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    res.json({ status: 'success', data: mappedPets });
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
        partner: true,
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
      select: { partnerId: true, role: true }
    });

    const userRole = dbUser?.role || req.user.role;
    let partnerId = dbUser?.partnerId || null;

    // Validation: Must be associated with a partner OR be a registered Rescuer
    if (!partnerId && userRole !== 'RESCUER' && userRole !== 'ADMIN' && userRole !== 'NGO') {
      return res.status(403).json({
        status: 'error',
        message: 'To list a pet for adoption, you must either be associated with a partner or be a registered rescuer/NGO.'
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

      // If report has a partner, use it, unless the user is an admin or the rescuer assigned to it
      partnerId = report.assignedPartnerId || partnerId;

      // Check authorization for report-linked pets
      if (userRole !== 'ADMIN' &&
        partnerId !== dbUser?.partnerId &&
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
        partnerId,
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
        partner: true,
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
      include: { owner: true }
    });

    if (!pet || pet.status !== 'AVAILABLE') {
      return res.status(400).json({ status: 'error', message: 'Pet is no longer available for adoption' });
    }

    const existingRequest = await prisma.adoptionRequest.findFirst({
      where: {
        petId,
        userId,
        status: { in: ['PENDING', 'INTERVIEW_SCHEDULED'] }
      }
    });

    if (existingRequest) {
      return res.status(400).json({ status: 'error', message: 'You already have an active adoption request for this pet' });
    }

    const request = await prisma.adoptionRequest.create({
      data: {
        petId,
        userId,
        formDetails,
        status: 'PENDING',
      },
    });

    if (pet.owner && pet.owner.fcmToken) {
      const { sendPushNotification } = require('../../utils/firebase');
      sendPushNotification(
        pet.owner.fcmToken,
        'New Adoption Request!',
        `A new adoption request has been submitted for ${pet.name || 'your listed pet'}.`
      );
    }

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
    else if (req.user.partnerId) {
      // Vets/Partner Admins see requests for the partner's pets
      whereClause.pet = { partnerId: req.user.partnerId };
    }
    else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const requests = await prisma.adoptionRequest.findMany({
      where: whereClause,
      include: {
        pet: {
          include: {
            partner: true,
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
      include: {
        pet: {
          include: {
            partner: true,
            owner: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            contact: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Adoption request not found' });
    }

    // Check authorization: Owner of pet, or member of assigned clinic, or ADMIN
    const isOwner = request.pet.ownerId === req.user.id;
    const isInClinic = req.user.partnerId && request.pet.partnerId === req.user.partnerId;

    if (req.user.role !== 'ADMIN' && !isOwner && !isInClinic) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update this request' });
    }

    if (status === 'APPROVED' && !request.interviewDate && !interviewDate) {
      return res.status(400).json({ status: 'error', message: 'Cannot approve request without scheduling an interview first' });
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

      // Send Approval Email to Adopter
      sendEmail({
        to: request.user.email,
        subject: `Adoption Request Approved! - ${request.pet.name || 'Unnamed Pet'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2f855a; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Adoption Request Approved! 🎉</h2>
            <p>Dear ${request.user.name},</p>
            <p>We are absolutely thrilled to inform you that your request to adopt <strong>${request.pet.name || 'Unnamed'}</strong> (ID: <code>${request.pet.id}</code>) has been <strong>Approved</strong>!</p>
            <p>Our team or the coordinator will get in touch with you shortly to finalize the adoption process and arrange for the pick-up/handover.</p>
            <div style="background-color: #f0fff4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #38a169;">
              <p style="margin: 0; color: #276749; font-weight: bold;">Congratulations on welcoming your new furry family member!</p>
            </div>
            <p style="margin-top: 20px; font-weight: bold; color: #4a5568;">Best regards,<br/>The Furzo Team</p>
          </div>
          <!-- Footer -->
      <div style="background:#f8faf7; padding:20px 30px; border-top:1px solid #e5e5e5;">
        <p style="margin:0; font-size:13px; color:#666666;">
          This is an automated email from Furzo. Please do not reply to this message.
        </p>

        <p style="margin-top:10px; font-size:13px; color:#666666;">
          Thank you for helping create a safer world for stray animals.
        </p>

        <p style="margin-top:10px; font-size:12px; color:#999999;">
          © 2026 Furzo. All rights reserved.
        </p>
        </div>

      </div>

        `
      }).then(result => {
        if (result.success) {
          console.log(`✅ [Email Success] Adoption approved email sent to ${request.user.email}`);
        } else {
          console.error(`❌ [Email Error] Failed to send adoption approved email:`, result.error);
        }
      }).catch(err => {
        console.error(`❌ [Email Error] Unexpected exception sending approval email:`, err);
      });
    }

    if (status === 'REJECTED') {
      // Send Rejection Email to Adopter
      sendEmail({
        to: request.user.email,
        subject: `Adoption Request Update - ${request.pet.name || 'Unnamed Pet'}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow:hidden;">
    
    <!-- Header -->
    <div style="background:#c53030; padding:20px; text-align:center;">
        <h2 style="color:#ffffff; margin:0;"> Adoption Request Update </h2>
    </div>
    
    <!-- Content -->
    <div style="padding:30px;">
        <p>Dear ${request.user.name},</p>
        <p>Thank you for your interest in adopting <strong>${request.pet.name || 'Unnamed Pet'}</strong> (ID: <code>${request.pet.id}</code>). </p>
        
        <p>After careful consideration, we regret to inform you that your adoption application has not been approved at this time.</p>
        
        <div style=" background:#fff5f5; padding:15px; border-radius:6px; margin:20px 0; border-left:4px solid #c53030;">
            <p style="margin:0; color:#9b2c2c;">We sincerely appreciate your willingness to provide a loving home to a stray animal.</p>
        </div>
        
        <p>This decision may be based on a variety of factors related to the adoption process and does not reflect negatively on your interest or commitment.</p>
        
        <p>We encourage you to continue exploring other pets available on Furzo. Your future companion may be waiting for you.</p>
        
        <p style="margin-top:25px; color:#4a5568;">
            Best regards,<br>
            <strong>The Furzo Team</strong>
        </p>
    </div>
    
    <!-- Footer -->
    <div style="background:#f8faf7; padding:20px 30px; border-top:1px solid #e5e5e5;">
        <p style="margin:0; font-size:13px; color:#666666;">
            This is an automated email from Furzo. Please do not reply to this message.
        </p>
        <p style="margin-top:10px; font-size:13px; color:#666666;">
            Thank you for helping create a safer world for stray animals.
        </p>
        <p style="margin-top:10px; font-size:12px; color:#999999;">
            © 2026 Furzo. All rights reserved.
        </p>
    </div>

</div>
 ` }).then(result => {
          if (result.success) {
            console.log(`✅ [Email Success] Adoption rejected email sent to ${request.user.email}`);
          } else {
            console.error(`❌ [Email Error] Failed to send adoption rejected email:`, result.error);
          }
        }).catch(err => {
          console.error(`❌ [Email Error] Unexpected exception sending rejection email:`, err);
        });
    }

    if (status === 'INTERVIEW_SCHEDULED') {
      const centerName = request.pet.partner?.name || request.interviewLocation || 'Furzo Partner Center';
      const centerAddress = request.pet.partner?.address
        ? `${request.pet.partner.address}${request.pet.partner.city ? ', ' + request.pet.partner.city : ''}`
        : 'Will be shared by the coordinator';

      const dateObj = interviewDate ? new Date(interviewDate) : null;
      const formattedDate = dateObj && !isNaN(dateObj)
        ? dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : (interviewDate || 'To be determined');

      // Email 1: To the Adopter (Applicant)
      sendEmail({
        to: request.user.email,
        subject: `Interview Scheduled for Pet Adoption - ${request.pet.name || 'Unnamed Pet'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2b6cb0; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Adoption Interview Scheduled!</h2>
            <p>Dear ${request.user.name},</p>
            <p>We are pleased to inform you that an interview has been scheduled or updated for your adoption request.</p>
            
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #2d3748; margin-top: 0;">Interview Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #4a5568;">Center Name:</td>
                  <td style="padding: 6px 0; color: #2d3748;">${centerName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Location:</td>
                  <td style="padding: 6px 0; color: #2d3748;">${centerAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Date:</td>
                  <td style="padding: 6px 0; color: #2d3748;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Time:</td>
                  <td style="padding: 6px 0; color: #2d3748;">${interviewTime || 'Scheduled Time'}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #ebf8ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3182ce;">
              <h3 style="color: #2b6cb0; margin-top: 0;">Pet Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #4a5568;">Pet Name:</td>
                  <td style="padding: 6px 0; color: #2d3748;">${request.pet.name || 'Unnamed'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Pet ID:</td>
                  <td style="padding: 6px 0; color: #2d3748;"><code>${request.pet.id}</code></td>
                </tr>
              </table>
            </div>

            <p style="color: #718096; font-size: 0.9em; margin-top: 30px;">If you have any questions or need to reschedule, please contact the center/rescuer directly.</p>
            <p style="margin-top: 20px; font-weight: bold; color: #4a5568;">Best regards,<br/>The Furzo Team</p>
          </div>
        `
      }).then(result => {
        if (result.success) {
          console.log(`✅ [Email Success] Adoption interview email sent to applicant: ${request.user.email}`);
        } else {
          console.error(`❌ [Email Error] Failed to send interview email to applicant ${request.user.email}:`, result.error);
        }
      }).catch(err => {
        console.error(`❌ [Email Error] Unexpected exception sending interview email to applicant:`, err);
      });

      // Email 2: To the Listing Owner (Confirmation)
      if (request.pet.owner?.email) {
        const adopterContact = request.user.phone || request.user.contact || 'No phone number provided';
        sendEmail({
          to: request.pet.owner.email,
          subject: `Adoption Interview Scheduled - Adopter: ${request.user.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2b6cb0; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Adoption Interview Confirmation</h2>
              <p>Dear ${request.pet.owner.name},</p>
              <p>An interview has been scheduled or updated for a pet you listed for adoption.</p>
              
              <div style="background-color: #fffaf0; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dd6b20;">
                <h3 style="color: #dd6b20; margin-top: 0;">Adopter Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #4a5568;">Name:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${request.user.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Email:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${request.user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Contact/Phone:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${adopterContact}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #2d3748; margin-top: 0;">Interview Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #4a5568;">Center Name:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${centerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Location:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${centerAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Date:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Time:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${interviewTime || 'Scheduled Time'}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #ebf8ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3182ce;">
                <h3 style="color: #2b6cb0; margin-top: 0;">Pet Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; width: 140px; color: #4a5568;">Pet Name:</td>
                    <td style="padding: 6px 0; color: #2d3748;">${request.pet.name || 'Unnamed'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold; color: #4a5568;">Pet ID:</td>
                    <td style="padding: 6px 0; color: #2d3748;"><code>${request.pet.id}</code></td>
                  </tr>
                </table>
              </div>

              <p style="margin-top: 20px; font-weight: bold; color: #4a5568;">Best regards,<br/>The Furzo Team</p>
            </div>
          `
        }).then(result => {
          if (result.success) {
            console.log(`✅ [Email Success] Adoption interview confirmation email sent to owner: ${request.pet.owner.email}`);
          } else {
            console.error(`❌ [Email Error] Failed to send confirmation email to owner ${request.pet.owner.email}:`, result.error);
          }
        }).catch(err => {
          console.error(`❌ [Email Error] Unexpected exception sending confirmation email to owner:`, err);
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
    const partnerId = req.user.partnerId;
    if (!partnerId) {
      return res.status(400).json({ error: 'You are not associated with any partner' });
    }
    const pets = await prisma.pet.findMany({
      where: { partnerId },
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
    const isInClinic = req.user.partnerId && pet.partnerId === req.user.partnerId;

    if (req.user.role !== 'ADMIN' && !isOwner && !isInClinic) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to update this pet' });
    }

    if (status === 'REMOVED') {
      // Find pending/scheduled requests to send cancellation emails
      const pendingRequests = await prisma.adoptionRequest.findMany({
        where: {
          petId: id,
          status: { in: ['PENDING', 'INTERVIEW_SCHEDULED'] },
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      // Send cancellation emails
      for (const reqObj of pendingRequests) {
        if (reqObj.user && reqObj.user.email) {
          sendEmail({
            to: reqObj.user.email,
            subject: `Adoption Listing Removed - ${pet.name || 'Unnamed Pet'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #c53030; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Adoption Listing Update</h2>
                <p>Dear ${reqObj.user.name},</p>
                <p>We are writing to inform you that the adoption listing for <strong>${pet.name || 'Unnamed Pet'}</strong> is no longer available, and the pet has been removed from the platform.</p>
                <p>As a result, your adoption application has been automatically cancelled. We apologize for any inconvenience this may cause and encourage you to explore other pets that are still looking for a loving home.</p>
                <p style="margin-top: 20px; font-weight: bold; color: #4a5568;">Best regards,<br/>The Furzo Team</p>
              </div>
            `
          }).catch(err => console.error('Error sending removal email:', err));
        }
      }

      // Delete associated adoption requests
      await prisma.adoptionRequest.deleteMany({
        where: { petId: id },
      });

      // Revert AnimalReport status to 'TREATED' if applicable
      if (pet.reportId) {
        await prisma.animalReport.update({
          where: { id: pet.reportId },
          data: { status: 'TREATED' },
        });
      }

      // Finally, delete the pet
      const deletedPet = await prisma.pet.delete({
        where: { id },
      });

      return res.json({ status: 'success', message: 'Pet and associated data removed successfully', data: deletedPet });
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

const cancelAdoptionRequest = async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user.id;

    // Delete any pending/scheduled request from this user for this pet
    await prisma.adoptionRequest.deleteMany({
      where: {
        petId,
        userId,
        status: { in: ['PENDING', 'INTERVIEW_SCHEDULED'] }
      }
    });

    res.json({ status: 'success', message: 'Adoption request cancelled successfully' });
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
  cancelAdoptionRequest,
};
