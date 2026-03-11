
import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 8787,
  path: '/api/creators/issue-full',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
const postData = JSON.stringify({
    student_name: "Test Student HTTP",
    course_name: "Test Course",
    graduation_date: new Date().toISOString().split('T')[0],
    institution_id: "inst-test",
    pdf_base64: "" 
});

req.write(postData);
req.end();
console.log('Request sent via http module');
