// Minimal importer for n8n Public API (no extra deps)
// Usage (PowerShell):
//   $env:N8N_API_BASE="http://localhost:5678/api/v1"
//   $env:N8N_PUBLIC_API_TOKEN="<pega_aqui_tu_token_public_api>"
//   node scripts/n8n-import.js
//
// It will:
// - Read all JSONs under n8n/workflows
// - Normalize webhook paths (trim, remove leading slash)
// - Resolve duplicate webhook paths by appending "-alt" suffix
// - Create or update each workflow via n8n Public API

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

function httpRequest(method, urlStr, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const lib = u.protocol === 'https:' ? https : http;
      const data = body ? JSON.stringify(body) : null;
      const options = {
        method,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + (u.search || ''),
        headers: {
          'X-N8N-API-KEY': TOKEN,
          'Content-Type': 'application/json',
          ...(headers || {})
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
      if (data) req.write(data);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function listWorkflows() {
  const url = `${API_BASE}/workflows?limit=1000`;
  const { status, data } = await httpRequest('GET', url);
  if (status >= 200 && status < 300 && data && data.data) {
    return data.data;
  }
  return [];
}

async function createWorkflow(payload) {
  const url = `${API_BASE}/workflows`;
  // 'active' is read-only on create in Public API
  const body = { ...payload };
  delete body.active;
  const { status, data } = await httpRequest('POST', url, body);
  if (status >= 200 && status < 300) return data;
  throw new Error(`Create failed (${status}): ${JSON.stringify(data)}`);
}

async function updateWorkflow(id, payload) {
  const url = `${API_BASE}/workflows/${encodeURIComponent(id)}`;
  // Some API versions treat 'active' as read-only in the PATCH body
  const body = { ...payload };
  delete body.active;
  const { status, data } = await httpRequest('PATCH', url, body);
  if (status >= 200 && status < 300) return data;
  throw new Error(`Update failed (${status}): ${JSON.stringify(data)}`);
}

async function activateWorkflow(id) {
  // Try explicit activate endpoint, fallback to PATCH active if necessary
  const activateUrl = `${API_BASE}/workflows/${encodeURIComponent(id)}/activate`;
  const patchUrl = `${API_BASE}/workflows/${encodeURIComponent(id)}`;
  let res = await httpRequest('POST', activateUrl, {});
  if (res.status >= 200 && res.status < 300) return true;
  res = await httpRequest('PATCH', patchUrl, { active: true });
  return res.status >= 200 && res.status < 300;
}

function normalizeAndFixWebhooks(workflowJson, usedPaths) {
  const wf = JSON.parse(JSON.stringify(workflowJson));
  const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];
  for (const n of nodes) {
    const isWebhook = typeof n.type === 'string' && n.type.includes('webhook');
    if (!isWebhook) continue;
    const p = n.parameters || {};
    if (typeof p.path === 'string') {
      let norm = p.path.trim().replace(/^\//, ''); // remove leading slash
      if (!norm) norm = `auto-${Math.random().toString(36).slice(2, 8)}`;
      // resolve duplicates
      let finalPath = norm;
      while (usedPaths.has(finalPath)) {
        finalPath = `${norm}-alt`;
      }
      usedPaths.add(finalPath);
      n.parameters.path = finalPath;
    }
  }
  return wf;
}

async function run() {
  const dir = path.resolve(__dirname, '..', 'n8n', 'workflows');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (!files.length) {
    console.log('No workflow files found in n8n/workflows');
    return;
  }

  const existing = await listWorkflows();
  const byName = new Map(existing.map(w => [w.name, w]));

  const usedPaths = new Set(
    existing
      .flatMap(w => (w.nodes || []))
      .filter(n => n?.type?.includes('webhook') && n?.parameters?.path)
      .map(n => String(n.parameters.path).trim().replace(/^\//, ''))
  );

  let ok = 0, updated = 0, created = 0, failed = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const wf = JSON.parse(raw);
      const name = wf.name || file.replace(/\.json$/,'');
      const fixed = normalizeAndFixWebhooks(wf, usedPaths);
      const payload = {
        name,
        nodes: fixed.nodes || [],
        connections: fixed.connections || {},
        settings: fixed.settings || {}
      };
      if (byName.has(name)) {
        const id = byName.get(name).id;
        const updatedWf = await updateWorkflow(id, payload);
        const wfId = updatedWf?.id || id;
        await activateWorkflow(wfId);
        updated++;
        console.log(`✔ Updated: ${name}`);
      } else {
        const createdWf = await createWorkflow(payload);
        const wfId = createdWf?.id;
        if (wfId) await activateWorkflow(wfId);
        created++;
        console.log(`✔ Created: ${name}`);
      }
      ok++;
    } catch (e) {
      failed++;
      console.error(`✖ Failed ${file}:`, e.message);
    }
  }
  console.log(`Done. OK:${ok} (created:${created}, updated:${updated}) failed:${failed}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

