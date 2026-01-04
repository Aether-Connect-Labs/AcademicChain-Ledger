class BaseService {
  constructor() {
    this.maxRetries = parseInt(process.env.BLOCKCHAIN_MAX_RETRIES, 10) || 3;
    this.retryDelay = parseInt(process.env.BLOCKCHAIN_RETRY_DELAY, 10) || 1000;
  }

  async retryOperation(operation, retries = this.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0 && this.isTransientError(error)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryOperation(operation, retries - 1);
      }
      throw error;
    }
  }

  isTransientError(error) {
    return error.message.includes('network') || 
           error.message.includes('timeout') || 
           error.message.includes('rate limit') ||
           error.message.includes('503') ||
           error.message.includes('504');
  }

  async connect() {
    throw new Error('connect method must be implemented by subclass');
  }

  async sendTransaction(txData) {
    throw new Error('sendTransaction method must be implemented by subclass');
  }

  async getTransaction(txId) {
    throw new Error('getTransaction method must be implemented by subclass');
  }
}

module.exports = BaseService;