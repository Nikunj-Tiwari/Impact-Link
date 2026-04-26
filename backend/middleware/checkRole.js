const User = require('../models/User');

/**
 * Middleware to restrict routes to specific roles.
 * Must be used AFTER verifyToken middleware.
 */
const checkRole = (...allowedRoles) => async (req, res, next) => {
  try {
    // req.user is populated by verifyToken from Firebase
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      console.warn(`[AUTH] User record not found for UID: ${req.user?.uid}`);
      return res.status(404).json({ error: `User record not found (${req.user?.uid}). Complete onboarding.` });
    }

    if (!allowedRoles.includes(user.role)) {
      console.warn(`[AUTH] Role mismatch. User ${user.uid} has role ${user.role}, but [${allowedRoles}] required.`);
      return res.status(403).json({ error: `Access denied. Role '${user.role}' lacks permissions.` });
    }

    // Attach full database user object to request
    req.impactUser = user;
    next();
  } catch (err) {
    console.error('Role check middleware error:', err);
    res.status(500).json({ error: 'Authorization validation failed.' });
  }
};

module.exports = checkRole;
