import axios from 'axios';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://primary-production-4224.up.railway.app/webhook/submit-document'; // Default or Env

const n8nService = {
    /**
     * Submits document data to n8n workflow
     * @param {Object} data - { documentHash, userId, metadata }
     */
    submitDocument: async (data) => {
        try {
            console.log('Sending to n8n:', data);
            const response = await axios.post(N8N_WEBHOOK_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-ACL-AUTH-KEY': import.meta.env.VITE_N8N_AUTH_KEY || 'demo-key'
                }
            });
            return response.data;
        } catch (error) {
            console.error('N8n Error:', error);
            throw new Error(error.response?.data?.message || 'Error connecting to n8n Headless API');
        }
    }
};

export default n8nService;
