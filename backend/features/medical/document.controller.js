const prisma = require('../../db/prisma');

/**
 * @desc Get all pet documents for the logged-in user
 * @route GET /api/medical/documents
 * @access Private
 */
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const documents = await prisma.petDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Upload/create a pet document (base64)
 * @route POST /api/medical/documents
 * @access Private
 */
const uploadDocument = async (req, res) => {
  try {
    const { name, type, fileData } = req.body;
    const userId = req.user.id;

    if (!name || !type || !fileData) {
      return res.status(400).json({ error: 'Name, type, and fileData are required' });
    }

    const document = await prisma.petDocument.create({
      data: {
        userId,
        name,
        type,
        fileData,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * @desc Delete a pet document
 * @route DELETE /api/medical/documents/:id
 * @access Private
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.petDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this document' });
    }

    await prisma.petDocument.delete({
      where: { id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getUserDocuments,
  uploadDocument,
  deleteDocument,
};
