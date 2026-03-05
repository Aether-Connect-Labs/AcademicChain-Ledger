
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:8787'; // Worker local dev server

async function testSupportChat() {
    console.log('\n--- Testing Support Chat ---');
    try {
        const response = await fetch(`${API_BASE_URL}/api/academic-chain-support`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hola, ¿cómo verifico un certificado?',
                history: []
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data.output ? 'VALID' : 'INVALID');
        if (data.output) console.log('Output:', data.output.substring(0, 100) + '...');
    } catch (error) {
        console.error('Support Chat Failed:', error.message);
    }
}

async function testDesignAI() {
    console.log('\n--- Testing Design AI ---');
    try {
        const response = await fetch(`${API_BASE_URL}/api/design/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Diseño moderno en azul',
                context: { currentPageSize: 'Landscape', institutionName: 'Test Inst' }
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Message:', data.message ? 'VALID' : 'INVALID');
        console.log('Modifications:', Array.isArray(data.modifications) ? 'VALID ARRAY' : 'INVALID');
    } catch (error) {
        console.error('Design AI Failed:', error.message);
    }
}

async function testSmartCV() {
    console.log('\n--- Testing Smart CV ---');
    try {
        const response = await fetch(`${API_BASE_URL}/api/smart-cv/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                specialization: 'Blockchain Dev',
                technologies: ['Solidity', 'React'],
                achievement: 'Hackathon Winner',
                experience: []
            })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Success:', data.success);
        console.log('CV Data:', data.cvData ? 'VALID' : 'INVALID');
    } catch (error) {
        console.error('Smart CV Failed:', error.message);
    }
}

async function run() {
    console.log('Starting Full Flow Test...');
    // Ensure worker is running on port 8787 or adjust
    // Since we are in a dev environment, we assume the worker might not be running on localhost:8787 
    // but we can try to run it or just test the logic via the previous worker test script.
    // However, the user asked for a "test", so a real HTTP test is better if the server is up.
    // If not, we will fall back to the internal logic test which we already ran.
    
    // For this environment, we'll try to hit the worker if it's running, 
    // otherwise we'll report that we need to start it.
    
    await testSupportChat();
    await testDesignAI();
    await testSmartCV();
}

run();
