const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { User } = require('../models');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies?.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const disableMongo = process.env.DISABLE_MONGO === '1';
    let user = null;
    if (!disableMongo) {
      user = await User.findById(decoded.userId);
    }
    if (!user && (process.env.NODE_ENV !== 'production') && (disableMongo || decoded?.role === 'admin')) {
      user = {
        _id: decoded.userId || decoded.devId || 'preview-user',
        id: decoded.userId || decoded.devId || 'preview-user',
        email: decoded.email || 'user@preview.local',
        role: decoded.role || 'user',
        hederaAccountId: decoded.hederaAccountId,
        isActive: true,
      };
    }

    if (!user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    let message = 'Not authorized, token failed';
    if (error instanceof jwt.TokenExpiredError) {
      message = 'Not authorized, token expired';
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = 'Not authorized, invalid token';
    }
    throw new UnauthorizedError(`${message}: ${error.message}`);
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('User role not authorized to access this route');
    }
    next();
  };
};

const isUniversity = (req, res, next) => {
  if (req.user.role !== 'university') {
    throw new ForbiddenError('This route is only for universities');
  }
  next();
};

module.exports = { protect, authorize, isUniversity };
