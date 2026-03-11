
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  console.log('Request received:', req.method, req.url);
  if (req.method === 'POST' && req.url === '/api/creators/issue-full') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { id: 'mock-id' } }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8787, '0.0.0.0', () => {
  console.log('Simple server running on port 8787');
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  process.exit();
});
