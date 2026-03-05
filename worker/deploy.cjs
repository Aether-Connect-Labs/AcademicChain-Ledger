const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting deployment wrapper (exec mode)...');

const localConfigDir = path.join(__dirname, '.config');
if (!fs.existsSync(localConfigDir)) {
  try {
    fs.mkdirSync(localConfigDir, { recursive: true });
  } catch (err) {
    console.error(`Failed to create config directory: ${err.message}`);
  }
}

const env = { 
  ...process.env, 
  WRANGLER_LOG: 'none',
  XDG_CONFIG_HOME: localConfigDir,
  WRANGLER_HOME: undefined
};

exec('npx wrangler deploy', { 
  cwd: __dirname,
  env: env 
}, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    console.error(`stderr: ${stderr}`);
    try {
        fs.writeFileSync('deploy_error.log', `Error: ${error}\nStderr: ${stderr}\nStdout: ${stdout}`);
    } catch (e) {}
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
  try {
    fs.writeFileSync('deploy_success.log', stdout);
  } catch (e) {}
});
