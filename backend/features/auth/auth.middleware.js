const jwt = require('jsonwebtoken');
const prisma = require('../../db/prisma');

/**
 * Generate a signed access token containing the user's current role and partnerId.
 */
const generateToken = (userId, role, email, partnerId) => {
  return jwt.sign(
    { id: userId, role, email: email || null, partnerId: partnerId || null, clinicId: partnerId || null },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Verify the JWT and always refresh role/status from the database so a stale
 * token never grants or denies access based on an outdated role.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch the latest role and status from the DB so stale tokens don't
    // cause permission errors when the user's role has been updated since login.
    const freshUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true, partnerId: true, status: true }
    });

    if (!freshUser) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }

    if (freshUser.status === 'Suspended') {
      return res.status(403).json({ error: 'Forbidden: Account has been suspended' });
    }

    // Merge decoded token data with fresh DB values so downstream handlers always
    // see the current role and partnerId.
    req.user = {
      ...decoded,
      role: freshUser.role,
      email: freshUser.email,
      partnerId: freshUser.partnerId,
      clinicId: freshUser.partnerId
    };

    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const optionalVerifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    console.warn('Optional token verification failed:', error.message);
  }
  next();
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  optionalVerifyToken,
  allowRoles
};

