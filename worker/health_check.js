
const API_URL = 'http://127.0.0.1:8787';

async function check() {
  console.log('Checking health...');
  try {
    const res = await fetch(API_URL);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}

check();
