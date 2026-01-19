const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const { preIssueCheck } = require('../../services/aiValidator');
const { protect, authorize } = require('../../middleware/auth');
const ROLES = require('../../config/roles');

// POST /api/v1/ai/validate-batch
router.post('/validate-batch', protect, authorize(ROLES.UNIVERSITY, ROLES.ADMIN), asyncHandler(async (req, res) => {
    const { batch } = req.body;
    
    if (!batch || !Array.isArray(batch)) {
        return res.status(400).json({ success: false, message: 'Invalid batch data' });
    }

    // Simulación de delay de procesamiento de IA (para efecto dramático en demo)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = await preIssueCheck(batch);
    
    res.json({
        success: true,
        data: result
    });
}));

module.exports = router;
