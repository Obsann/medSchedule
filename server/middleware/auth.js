const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies JWT token and attaches user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 401, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ status: 401, message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 401, message: 'Token expired' });
    }
    return res.status(401).json({ status: 401, message: 'Invalid token' });
  }
};

/**
 * Restricts access to specific roles
 * Usage: requireRole('admin') or requireRole('admin', 'staff')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        message: `Forbidden: Requires ${roles.join(' or ')} role`,
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
