const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../../middleware/auth');
const ROLES = require('../../config/roles');
const { Credential, AnalyticsEvent, User } = require('../../models');

// GET /api/admin/audit/logs
// Retrieves a combined audit log for the dashboard
router.get('/logs', protect, authorize(ROLES.ADMIN, ROLES.UNIVERSITY), asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    
    // Fetch recent credentials (issuance events)
    const credentials = await Credential.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('universityId', 'name email')
        .lean();

    // Fetch recent analytics events (system actions)
    const analytics = await AnalyticsEvent.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

    // Normalize and merge
    const auditLogs = [];

    credentials.forEach(cred => {
        auditLogs.push({
            id: cred._id,
            type: 'ISSUANCE',
            action: 'Credential Issued',
            actor: cred.universityId?.name || 'Unknown University',
            details: `Issued ${cred.title || 'Credential'} to ${cred.studentName}`,
            status: 'SUCCESS', // Blockchain implies success usually
            timestamp: cred.createdAt,
            metadata: {
                tokenId: cred.tokenId,
                serialNumber: cred.serialNumber,
                network: 'Hedera' // Default for now
            }
        });
    });

    analytics.forEach(event => {
        auditLogs.push({
            id: event._id,
            type: 'SYSTEM',
            action: event.type || 'System Event',
            actor: event.data?.userId || 'System', 
            details: JSON.stringify(event.data || {}),
            status: 'INFO',
            timestamp: event.timestamp,
            metadata: event.data
        });
    });

    // Sort combined logs
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
        success: true,
        data: auditLogs.slice(0, limit)
    });
}));

module.exports = router;
