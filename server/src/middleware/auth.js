const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { User } = require('../models');

const verifyApiKey = (req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    const storedKey = process.env.ACADEMIC_CHAIN_API_KEY;

    if (storedKey && (!providedKey || providedKey !== storedKey)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado: API Key inválida o ausente.'
        });
    }
    next();
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new UnauthorizedError('Not authorized to access this route'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const disableMongo = process.env.DISABLE_MONGO === '1';

    if (disableMongo) {
      const defaultPlan = (process.env.DEFAULT_UNIVERSITY_PLAN || ((process.env.NODE_ENV || 'development') === 'production' ? 'basic' : 'enterprise'));
      req.user = { 
        id: decoded.userId || decoded.id, 
        email: decoded.email, 
        role: decoded.role,
        universityName: decoded.universityName || null,
        plan: decoded.plan || (decoded.role === 'university' ? defaultPlan : 'basic'),
        hederaAccountId: decoded.hederaAccountId || null
      };
      return next();
    }

    let user = null;
    try {
      user = await User.findById(decoded.userId || decoded.id);
    } catch {}
    if (!user) {
      try {
        user = await User.findOne({ _id: decoded.userId || decoded.id });
      } catch {}
    }

    if (!user) {
      req.user = { id: decoded.userId || decoded.id, email: decoded.email, role: decoded.role };
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new UnauthorizedError('Not authorized to access this route'));
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('User not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`User role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};

const isUniversity = (req, res, next) => {
    if (req.user && req.user.role === 'university') {
        next();
    } else {
        return next(new ForbiddenError('University access required'));
    }
};

const requireRole = (role) => authorize(role);

module.exports = {
  verifyApiKey,
  protect,
  authorize,
  isUniversity,
  requireRole
};
