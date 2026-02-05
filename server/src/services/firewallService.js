/**
 * 🛡️ MODULE PROTECTED BY ANTIGRAVITY INTEGRITY PROTOCOL
 * --------------------------------------------------------
 * Created by: Antigravity (Lead Architect)
 * Purpose: Autonomous Firewall & Defense Service
 * Integrity: Application Layer IP Blocking (Simulation)
 */

const logger = require('../utils/logger');
// In-memory blacklist for demonstration. In production, use Redis.
const BLOCKED_IPS = new Set();
// Track failed attempts: IP -> count
const FAILED_ATTEMPTS = new Map();

class FirewallService {

    constructor() {
        this.MAX_ATTEMPTS = 3;
        this.BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Checks if an IP is currently blocked
     * @param {string} ip - The IP address to check
     * @returns {boolean} true if blocked
     */
    isBlocked(ip) {
        return BLOCKED_IPS.has(ip);
    }

    /**
     * Records a failed attempt. Triggers block if threshold exceeded.
     * @param {string} ip - The suspicious IP
     * @param {string} reason - Context of failure
     */
    async registerAttempt(ip, reason = 'Auth Failure') {
        if (this.isBlocked(ip)) return;

        const current = FAILED_ATTEMPTS.get(ip) || 0;
        const newCount = current + 1;
        FAILED_ATTEMPTS.set(ip, newCount);

        logger.warn(`🛡️ Security Warning: ${ip} failed attempt ${newCount}/${this.MAX_ATTEMPTS} (${reason})`);

        if (newCount >= this.MAX_ATTEMPTS) {
            await this.blockIp(ip, `Too many failed attempts (${reason})`);
        }
    }

    /**
     * Executes the "Block" action.
     * @param {string} ip - The IP to block
     * @param {string} reason - Reason for blocking
     */
    async blockIp(ip, reason) {
        BLOCKED_IPS.add(ip);
        logger.error(`⛔ SECURITY ALERT: Blocking IP ${ip}. Reason: ${reason}`);

        // Antigravity Notification Hook
        this.notifyDefenseSystem(ip, reason);

        // Auto-unblock after duration (optional)
        setTimeout(() => {
            BLOCKED_IPS.delete(ip);
            FAILED_ATTEMPTS.delete(ip);
            logger.info(`🛡️ Lifting block for IP ${ip}`);
        }, this.BLOCK_DURATION);
    }

    /**
     * Internal hook to notify n8n or external logs
     */
    async notifyDefenseSystem(ip, reason) {
        try {
            const axios = require('axios');
            const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/security-incident';
            
            // Secure POST request to n8n
            await axios.post(webhookUrl, {
                ip,
                reason,
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                source: 'Antigravity Defense System'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Security-Token': process.env.SECURITY_TOKEN || 'default-secure-token'
                },
                timeout: 5000 // 5s timeout to avoid blocking
            });

            console.log(`[Antigravity Defense] Incident reported to n8n: { target: "${ip}", threat: "${reason}" }`);
        } catch (e) {
            // Fail silently to not disrupt main flow, but log error
            console.error('Failed to report security incident to n8n:', e.message);
        }
    }

    /**
     * Admin method to manually unblock
     */
    unblockIp(ip) {
        BLOCKED_IPS.delete(ip);
        FAILED_ATTEMPTS.delete(ip);
        logger.info(`🛡️ Admin manually unblocked IP ${ip}`);
    }
}

module.exports = new FirewallService();
