const fs = require('fs');
const path = require('path');
const https = require('https');

const CLIENT_DIR = path.join(__dirname, 'client');
const COMPONENTS_DIR = path.join(CLIENT_DIR, 'components');

console.log('--- STARTING ACADEMICCHAIN VERIFICATION ---');

// 1. File Integrity Check
const criticalFiles = [
    'client/components/HomePage.jsx',
    'client/components/LoginPage.jsx',
    'client/components/EnhancedInstitutionDashboard.jsx',
    'client/components/EnhancedStudentPortal.jsx',
    'client/components/IssueTitleForm.jsx',
    'client/components/services/n8nService.js',
    'client/tailwind.config.js',
    'client/index.css'
];

let integrityPass = true;
console.log('\n[1/3] Checking Critical Files...');
criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`  ✅ Found: ${file}`);
    } else {
        console.log(`  ❌ MISSING: ${file}`);
        integrityPass = false;
    }
});

// 2. n8n Connectivity Check
console.log('\n[2/3] Testing n8n Backend Connectivity...');
const options = {
    hostname: 'n8n-b0be.onrender.com',
    path: '/webhook-test/submit-document',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`  ✅ Connection Status: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401) {
        console.log('  ✅ Service is REACHABLE and responding.');
    } else {
        console.log('  ⚠️ Service returned unexpected status.');
    }
    console.log('\n--- VERIFICATION COMPLETE ---');
});

req.on('error', (e) => {
    console.error(`  ❌ Connection Error: ${e.message}`);
    console.log('\n--- VERIFICATION COMPLETE ---');
});

req.write(JSON.stringify({}));
req.end();
