const http = require('http');

const studentId = process.argv[2] || 'STU-1234';
const cid = process.argv[3] || 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

console.log(`Simulating n8n callback for Student: ${studentId}, CID: ${cid}`);

const data = JSON.stringify({
  studentId: studentId, 
  ipfsCid: cid,
  status: 'completed',
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook/n8n-callback',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-n8n-secret': 'academicchain-secret-key-2024'
  }
};

const req = http.request(options, res => {
  console.log('Status Code: ' + res.statusCode);
  let responseBody = '';
  res.on('data', chunk => { responseBody += chunk; });
  res.on('end', () => {
    console.log('Response Body: ' + responseBody);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
