const express = require('express');
const router = express.Router();
const automationService = require('../services/automationService');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route POST /api/automation/test-trigger
 * @desc Test trigger for automation event
 * @access Private (Admin only)
 */
router.post('/test-trigger', protect, authorize('admin'), async (req, res) => {
  const { event, payload } = req.body;
  try {
    await automationService.triggerEvent(event || 'test_event', payload || { message: 'Hello n8n' });
    res.json({ success: true, message: 'Automation event triggered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/automation/webhook/inbound
 * @desc Receive events from n8n/Moodle to trigger actions
 * @access Private (API Key Protected)
 */
router.post('/webhook/inbound', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  // Simple check against env var for now
  if (!apiKey || apiKey !== (process.env.AUTOMATION_API_KEY || 'academic-automation-secret')) {
    logger.warn('⚠️ Unauthorized automation webhook attempt');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { action, data } = req.body;
  logger.info(`🤖 Inbound Automation: ${action}`);

  try {
    if (action === 'ISSUE_CREDENTIAL') {
        // Example: Moodle triggers issuance
        // We'd call the creator/issuance service here.
        // For the MVP, we log and return success.
        logger.info(`✅ Queuing issuance for: ${data?.studentName}`);
        
        // TODO: Connect to IssuanceQueue
        // const job = await issuanceQueue.add('issue-from-automation', data);
        
        return res.json({ success: true, message: 'Issuance request received', data });
    }
    
    res.json({ success: true, message: 'Action processed' });
  } catch (error) {
    logger.error('Automation inbound error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
