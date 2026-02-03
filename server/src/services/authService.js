const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const didService = require('./didService');
const { User } = require('../models');

const memoryUsers = new Map();

class AuthService {
  async register(userData) {
    const { email, password, name, role: requestedRole, universityName, hederaAccountId } = userData;

    let existingUser;
    try {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } catch (e) {
      existingUser = memoryUsers.get(email.toLowerCase());
    }

    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const role = requestedRole === 'university' ? 'university' : 'student';
    const defaultUniversityPlan = (process.env.DEFAULT_UNIVERSITY_PLAN || ((process.env.NODE_ENV || 'development') === 'production' ? 'basic' : 'enterprise'));
    const userPayload = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      universityName: role === 'university' ? universityName : null,
      hederaAccountId: hederaAccountId || null,
      isActive: true,
      plan: role === 'university' ? defaultUniversityPlan : 'basic',
    };

    let user;
    try {
      user = await User.create(userPayload);
    } catch (e) {
      console.warn('AuthService: DB create failed, using memory', e.message);
      user = { 
        ...userPayload, 
        id: uuidv4(), 
        _id: uuidv4(),
        save: async function() { return this; }
      };
      memoryUsers.set(email.toLowerCase(), user);
    }

    if (user.hederaAccountId) {
      user.did = didService.generateDid(user.hederaAccountId);
      await user.save();
    }

    logger.info(`👤 New user registered: ${email} (${role})`);

    const token = this.generateToken(user);
    const profile = this.getUserProfile(user);
    return { token, user: profile };
  }

  async login(credentials, res) {
    const { email, password } = credentials;

    let user;
    try {
      user = await User.findOne({ email: email.toLowerCase() });
    } catch (e) {
      user = memoryUsers.get(email.toLowerCase());
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    logger.info(`🔐 User logged in: ${email} (${user.role})`);

    const token = this.generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });
    const profile = this.getUserProfile(user);
    return { token, user: profile };
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      universityName: user.universityName || null,
      plan: user.plan || 'basic',
      hederaAccountId: user.hederaAccountId || null,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  }

  getUserProfile(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      universityName: user.universityName,
      hederaAccountId: user.hederaAccountId,
      credits: user.credits || 0,
      createdAt: user.createdAt,
    };
  }
}

module.exports = new AuthService();
