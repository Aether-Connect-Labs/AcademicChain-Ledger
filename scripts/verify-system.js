const BASE_URL = process.env.N8N_BASE_URL || 'https://n8n-b0be.onrender.com';
const AUTH_KEY = process.env.N8N_AUTH_KEY || 'acl_live_sec_8f92a3b4';
async function run() {
  const url = `${BASE_URL}/webhook/emitir-multichain?documentHash=${encodeURIComponent('hash-'+Date.now())}&studentName=${encodeURIComponent('Tester')}&&plan=triple`;
  const res = await fetch(url, { method: 'POST', headers: { 'X-ACL-AUTH-KEY': AUTH_KEY } });
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log('STATUS', res.status);
    console.log('BODY', JSON.stringify(json, null, 2));
  } catch {
    console.log('STATUS', res.status);
    console.log('BODY', text);
  }
}
run().catch(e => { console.error(e); process.exit(1); });
