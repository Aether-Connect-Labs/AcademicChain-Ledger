import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a local temp directory for Wrangler config/logs to avoid system permission/path issues
const localConfigDir = path.join(__dirname, '.wrangler_local_config'); 
if (!fs.existsSync(localConfigDir)) {
  fs.mkdirSync(localConfigDir, { recursive: true });
}

// Ensure the logs directory exists to prevent ENOENT errors
const logsDir = path.join(localConfigDir, '.wrangler', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

console.log('🚀 Starting Robust Deployment Script...');
console.log(`📂 Setting XDG_CONFIG_HOME to: ${localConfigDir}`);

// Determine command based on args
const mode = process.argv[2] || 'deploy';
let args = [];

if (mode === 'login') {
  console.log('Tx Mode: LOGIN');
  args = ['login', '--browser=false'];
} else if (mode === 'whoami') {
  console.log('Tx Mode: WHOAMI');
  args = ['whoami'];
} else {

  console.log('Tx Mode: DEPLOY');
  // Remove -y as it is not a valid flag for wrangler deploy
  args = ['deploy']; 
}

// Resolve wrangler path from root node_modules to avoid npx issues
const wranglerPath = path.resolve(__dirname, '../node_modules/wrangler/bin/wrangler.js');
const cmd = `"${process.execPath}"`; // Quote node executable path
args.unshift(wranglerPath); // Prepend wrangler script path to args
args = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg); // Quote args with spaces

const isInteractive = mode === 'login' || mode === 'whoami';

// Merge current environment with our overrides
const env = {
  ...process.env,
  XDG_CONFIG_HOME: localConfigDir,
  // Ensure CI=true for non-interactive mode if not interactive
  CI: isInteractive ? 'false' : 'true',
  // Force terminal width to avoid line wrapping issues
  COLUMNS: '120',
  // Force color output
  FORCE_COLOR: '1',
  // Set log level to debug to see what's happening
  WRANGLER_LOG: 'debug',
   // Ensure basic path variables are present for Windows
   PATH: process.env.PATH,
   SystemRoot: process.env.SystemRoot
 };
 
 console.log(`Qw Executing: ${cmd} ${args.join(' ')}`);

const child = spawn(cmd, args, {
  env: env,
  stdio: 'pipe', // Always pipe to capture output
  shell: true,
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
