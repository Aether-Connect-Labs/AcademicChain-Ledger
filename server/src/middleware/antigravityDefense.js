/**
 * 🛡️ MODULE PROTECTED BY ANTIGRAVITY INTEGRITY PROTOCOL
 * --------------------------------------------------------
 * Created by: Antigravity (Lead Architect)
 * Purpose: Middleware for Autonomous Defense & Token Validation
 * Integrity: Validates x-antigravity-token & Checks Firewall
 */

const jwt = require('jsonwebtoken');
const firewallService = require('../services/firewallService');
const logger = require('../utils/logger');

const ANTIGRAVITY_HEADER = 'x-antigravity-token';

/**
 * Middleware to protect routes using Antigravity's Autonomous Defense
 */
const antigravityDefense = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;

    // 1. Check Firewall First (Fast Fail)
    if (firewallService.isBlocked(ip)) {
        logger.warn(`⛔ Blocked request from ${ip} attempted to access ${req.originalUrl}`);
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Your IP has been flagged by the Autonomous Defense System.'
        });
    }

    // 2. Validate Token
    const token = req.headers[ANTIGRAVITY_HEADER];

    if (!token) {
        // If it's a critical endpoint, we count this as a strike
        await firewallService.registerAttempt(ip, 'Missing Antigravity Token');
        return res.status(401).json({ error: 'Unauthorized', message: 'Antigravity Token Required' });
    }

    try {
        const secret = process.env.ANTIGRAVITY_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        if (decoded.sub !== 'antigravity-autonomous-agent') {
            throw new Error('Invalid Token Subject');
        }

        // Token is valid, proceed
        req.antigravityAgent = decoded;

        // 3. Data Sanitization (Anti-Injection for n8n flows)
        const sanitize = (input) => {
            if (typeof input !== 'string') return input;
            // Basic removal of potential MongoDB/SQL injection chars and script tags
            return input.replace(/[\$<>]/g, '');
        };

        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                req.body[key] = sanitize(req.body[key]);
            });
        }
        if (req.query && typeof req.query === 'object') {
            Object.keys(req.query).forEach(key => {
                req.query[key] = sanitize(req.query[key]);
            });
        }

        next();
    } catch (err) {
        logger.error(`Defense Middleware Error for ${ip}: ${err.message}`);
        await firewallService.registerAttempt(ip, 'Invalid/Expired Antigravity Token');
        return res.status(403).json({ error: 'Forbidden', message: 'Invalid Authentication Token' });
    }
};

module.exports = antigravityDefense;
