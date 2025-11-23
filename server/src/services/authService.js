const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { BadRequestError, UnauthorizedError } = require('../utils/errors');
const didService = require('./didService');
const { User } = require('../models');

class AuthService {
  async register(userData) {
    const { email, password, name, role, universityName, hederaAccountId } = userData;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new BadRequestError('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      universityName: role === 'university' ? universityName : null,
      hederaAccountId: hederaAccountId || null,
      isActive: true,
    });

    if (user.hederaAccountId) {
      user.did = didService.generateDid(user.hederaAccountId);
      await user.save();
    }

    logger.info(`👤 New user registered: ${email} (${role})`);

    return this.generateToken(user);
  }

  async login(credentials, res) {
    const { email, password } = credentials;

    const user = await User.findOne({ email: email.toLowerCase() });

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
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
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
      createdAt: user.createdAt,
    };
  }
}

module.exports = new AuthService();