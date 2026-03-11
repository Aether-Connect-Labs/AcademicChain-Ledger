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

console.log('🚀 Starting Deployment Script (Global Config Mode)...');

// Determine command based on args
const mode = process.argv[2] || 'deploy';
let args = [];

if (mode === 'login') {
  console.log('Tx Mode: LOGIN');
  args = ['login'];
} else if (mode === 'whoami') {
  console.log('Tx Mode: WHOAMI');
  args = ['whoami'];
} else {
  console.log('Tx Mode: DEPLOY');
  args = ['deploy']; 
}

// Resolve wrangler path from root node_modules
const wranglerPath = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
args.unshift(wranglerPath);

const isInteractive = mode === 'login' || mode === 'whoami';

// Merge current environment
const env = {
  ...process.env,
  // Ensure basic path variables are present for Windows
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  // Force color output
  FORCE_COLOR: '1',
  WRANGLER_LOG: 'none' // Set to none to prevent ENOENT errors
};

console.log(`Qw Executing: ${cmd} ${args.join(' ')}`);

const child = spawn(cmd, args, {
  env: env,
  stdio: 'pipe',
  shell: false,
  cwd: __dirname
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('error', (err) => {
  console.error('❌ Failed to start process:', err);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Operation completed successfully!');
  } else {
    console.error(`❌ Operation failed with exit code ${code}`);
    if (mode === 'deploy' && code !== 0) {
      console.log('💡 Tip: If authentication failed, try running: node deploy.js login');
    }
  }
});
