const axios = require('axios');
const logger = require('../utils/logger');

class AutomationService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || null;
  }

  /**
   * Trigger an automation event
   * @param {string} eventName - The name of the event (e.g., 'credential_issued', 'payment_received')
   * @param {object} payload - The data associated with the event
   */
  async triggerEvent(eventName, payload) {
    logger.info(`🤖 Automation Event Triggered: ${eventName}`);
    
    if (!this.webhookUrl) {
      logger.info('⚠️ No N8N_WEBHOOK_URL configured. Skipping webhook dispatch.');
      return;
    }

    try {
      await axios.post(this.webhookUrl, {
        event: eventName,
        timestamp: new Date().toISOString(),
        data: payload
      });
      logger.info(`✅ Webhook sent to n8n for event: ${eventName}`);
    } catch (error) {
      logger.error(`❌ Failed to send webhook to n8n: ${error.message}`);
    }
  }
}

module.exports = new AutomationService();
