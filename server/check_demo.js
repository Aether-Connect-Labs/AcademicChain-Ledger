const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('http://localhost:3001/api/demo/credentials');
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (e) {
    console.log('Error:', e.response ? e.response.status : e.message);
    if (e.response && e.response.data) console.log(e.response.data);
  }
}

check();