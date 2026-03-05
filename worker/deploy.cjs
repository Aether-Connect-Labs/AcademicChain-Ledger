const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting deployment wrapper (exec mode)...');

  // We will NOT override XDG_CONFIG_HOME to try to reuse existing credentials
  // But we MUST disable logging to avoid the ENOENT error
  
  const env = { 
    ...process.env, 
    WRANGLER_LOG: 'none',
    // Do NOT set CLOUDFLARE_API_TOKEN to placeholder, let it use existing auth
  };

  const command = 'npx wrangler whoami';
  
  // Determine correct CWD
  const cwd = process.cwd().endsWith('worker') ? process.cwd() : path.join(process.cwd(), 'worker');

  console.log(`Executing: ${command} in ${cwd}`);
  console.log('Using WRANGLER_LOG: none');

  exec(command, { 
    cwd: cwd,
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
