import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('client/.env') });

const WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL;
const AUTH_KEY = process.env.VITE_N8N_AUTH_KEY;

console.log('Testing specific n8n endpoints...');

async function test(endpoint, payload) {
    try {
        const res = await axios.post(`${WEBHOOK_URL}/${endpoint}`, payload, {
            headers: { 'X-ACL-AUTH-KEY': AUTH_KEY }
        });
        console.log(`✅ ${endpoint}: Success`, res.data);
    } catch (e) {
        console.log(`❌ ${endpoint}: Failed`, e.response ? e.response.status : e.message);
        if (e.response) console.log(e.response.data);
    }
}

test('check-institution', { email: 'test@example.com' });
