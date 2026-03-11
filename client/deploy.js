import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get user home directory correctly on Windows
const userHome = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH;
const globalWranglerDir = path.join(userHome, '.wrangler');
const globalLogsDir = path.join(globalWranglerDir, 'logs');

// Ensure the global logs directory exists to prevent ENOENT errors
if (!fs.existsSync(globalLogsDir)) {
  console.log(`Creating global logs directory: ${globalLogsDir}`);
  fs.mkdirSync(globalLogsDir, { recursive: true });
}

console.log('🚀 Starting Client Deployment Script...');

// Resolve wrangler path from root node_modules
// client/deploy.js -> client -> root
const wranglerPath = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');
const cmd = process.execPath; 

// Arguments for Pages deployment
const args = [
  wranglerPath,
  'pages',
  'deploy',
  'dist',
  '--project-name',
  'cadena-academica-libro-mayor'
];

const env = {
  ...process.env,
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  FORCE_COLOR: '1',
  WRANGLER_LOG: 'none' // Prevent log file issues
};

console.log(`Qw Executing: ${cmd} ${args.join(' ')}`);

const child = spawn(cmd, args, {
  env: env,
  stdio: 'inherit', // Use inherit to allow interactive login if needed
  shell: false,
  cwd: __dirname
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Client Deployment completed successfully!');
  } else {
    console.error(`❌ Client Deployment failed with exit code ${code}`);
  }
});
