const prisma = require('../../db/prisma');

/**
 * @desc Get all rescuers linked to the current vet's clinic
 * @route GET /api/users/rescuers
 * @access Private (Vet/Admin)
 */
const getClinicRescuers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch the current user to get their clinicId
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });

    if (!currentUser || !currentUser.clinicId) {
      return res.status(400).json({ error: 'You are not associated with any clinic' });
    }

    const rescuers = await prisma.user.findMany({
      where: {
        clinicId: currentUser.clinicId,
        role: 'RESCUER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        avatarUrl: true
      }
    });

    res.json(rescuers);
  } catch (error) {
    console.error('Error fetching rescuers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Add an existing user as a rescuer for the clinic
 * @route POST /api/users/rescuers/add
 * @access Private (Vet/Admin)
 */
const addRescuer = async (req, res) => {
  try {
    const { email, contact } = req.body;
    const vetId = req.user.id;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Get Vet's clinicId
    const vetUser = await prisma.user.findUnique({
      where: { id: vetId },
      select: { clinicId: true }
    });

    if (!vetUser || !vetUser.clinicId) {
      return res.status(400).json({ error: 'You are not associated with any clinic' });
    }

    // Find the user to be promoted
    const userToPromote = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToPromote) {
      return res.status(404).json({ error: 'User not found. Please ask them to register on StrayCare first.' });
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userToPromote.id },
      data: {
        role: 'RESCUER',
        clinicId: vetUser.clinicId,
        contact: contact || userToPromote.contact
      },
      select: {
        id: true,
        name: true,
        email: true,
        contact: true
      }
    });

    res.json({ message: 'Rescuer added successfully', rescuer: updatedUser });
  } catch (error) {
    console.error('Error adding rescuer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Remove a rescuer (demote back to USER)
 * @route POST /api/users/rescuers/remove/:id
 * @access Private (Vet/Admin)
 */
const removeRescuer = async (req, res) => {
  try {
    const rescuerId = req.params.id;
    const vetId = req.user.id;

    // Get Vet's clinicId
    const vetUser = await prisma.user.findUnique({
      where: { id: vetId },
      select: { clinicId: true }
    });

    if (!vetUser || !vetUser.clinicId) {
      return res.status(400).json({ error: 'You are not associated with any clinic' });
    }

    // Find the rescuer and ensure they belong to this clinic
    const rescuer = await prisma.user.findUnique({
      where: { id: rescuerId }
    });

    if (!rescuer || rescuer.clinicId !== vetUser.clinicId) {
      return res.status(404).json({ error: 'Rescuer not found in your clinic' });
    }

    // Demote the user
    await prisma.user.update({
      where: { id: rescuerId },
      data: {
        role: 'USER',
        clinicId: null
      }
    });

    res.json({ message: 'Rescuer removed successfully' });
  } catch (error) {
    console.error('Error removing rescuer:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getClinicRescuers,
  addRescuer,
  removeRescuer
};
