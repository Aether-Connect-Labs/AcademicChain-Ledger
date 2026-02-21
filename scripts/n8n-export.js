// Exporta todos los workflows de n8n a JSON en n8n/workflows
// Uso (PowerShell):
//   $env:N8N_API_BASE="http://localhost:5678/api/v1"
//   $env:N8N_PUBLIC_API_TOKEN="<tu_public_api_key_o_N8N_API_KEY>"
//   node scripts/n8n-export.js

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_BASE = process.env.N8N_API_BASE || 'http://localhost:5678/api/v1';
const TOKEN = process.env.N8N_PUBLIC_API_TOKEN || process.env.N8N_TOKEN;

if (!TOKEN) {
  console.error('❌ Missing N8N_PUBLIC_API_TOKEN (or N8N_TOKEN) env var.');
  process.exit(1);
}

function httpRequest(method, urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const lib = u.protocol === 'https:' ? https : http;
      const options = {
        method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        headers: {
          'X-N8N-API-KEY': TOKEN,
          'Content-Type': 'application/json',
          ...(headers || {}),
        },
      };
      const req = lib.request(options, (res) => {
        let chunks = '';
        res.on('data', (d) => (chunks += d));
        res.on('end', () => {
          const status = res.statusCode || 0;
          if (!chunks) return resolve({ status, data: null });
          try {
            const parsed = JSON.parse(chunks);
            return resolve({ status, data: parsed });
          } catch {
            return resolve({ status, data: chunks });
          }
        });
      });
      req.on('error', reject);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function listWorkflows() {
  const url = `${API_BASE}/workflows?limit=250`;
  const { status, data } = await httpRequest('GET', url);
  if (status >= 200 && status < 300 && data && data.data) {
    return data.data;
  }
  throw new Error(`List failed (${status}): ${JSON.stringify(data)}`);
}

async function getWorkflow(id) {
  const url = `${API_BASE}/workflows/${encodeURIComponent(id)}`;
  const { status, data } = await httpRequest('GET', url);
  if (status >= 200 && status < 300 && data && data.data) {
    return data.data;
  }
  throw new Error(`Get failed (${status}): ${JSON.stringify(data)}`);
}

function safeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const outDir = path.resolve(__dirname, '..', 'n8n', 'workflows');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('📤 Exportando workflows desde n8n a', outDir);
  const list = await listWorkflows();
  let ok = 0;

  for (const w of list) {
    try {
      const full = await getWorkflow(w.id);
      const name = full.name || `workflow-${full.id}`;
      const fileName = `${safeFileName(name) || `workflow-${full.id}`}.json`;
      const dest = path.join(outDir, fileName);
      fs.writeFileSync(dest, JSON.stringify(full, null, 2), 'utf8');
      ok++;
      console.log(`✔ Exportado: ${name} -> ${fileName}`);
    } catch (e) {
      console.error(`✖ Error exportando ${w.name || w.id}:`, e.message);
    }
  }

  console.log(`Listo. Exportados ${ok} workflows.`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
