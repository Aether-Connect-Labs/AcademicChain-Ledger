
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Force local WRANGLER_HOME to avoid permission issues
// Use root node_modules if possible
const rootNodeModules = path.resolve(__dirname, '../node_modules')
const wranglerHome = path.join(rootNodeModules, '.cache', 'wrangler_home')

if (!fs.existsSync(wranglerHome)) {
  fs.mkdirSync(wranglerHome, { recursive: true })
}
const wranglerLogs = path.join(wranglerHome, '.wrangler', 'logs')
if (!fs.existsSync(wranglerLogs)) {
  fs.mkdirSync(wranglerLogs, { recursive: true })
}
console.log('Created log directory:', wranglerLogs)

const env = {
  ...process.env,
  WRANGLER_HOME: wranglerHome,
  XDG_CONFIG_HOME: wranglerHome,
  HOME: wranglerHome,
  USERPROFILE: wranglerHome,
  WRANGLER_LOG_PATH: wranglerLogs,
  WRANGLER_SEND_METRICS: 'false',
  // CI: 'true', // Force non-interactive
  // Add API Keys explicitly
  FILECOIN_API_KEY: 'placeholder', // Force mock to avoid crash
  AI_API_KEY: process.env.AI_API_KEY,
  // Force Mock Mode for Redis and Mongo to avoid hangs
  UPSTASH_REDIS_REST_URL: 'Mock',
  UPSTASH_REDIS_REST_TOKEN: 'Mock',
  MONGO_API_KEY: 'placeholder',
  MONGO_APP_ID: 'placeholder',
  // Ensure we are in development mode
  ENVIRONMENT: 'development'
}

const wranglerPath = path.resolve(__dirname, '../node_modules', 'wrangler', 'bin', 'wrangler.js')
const wranglerCmd = process.execPath // Use node directly
const wranglerArgs = [
  wranglerPath,
  'dev',
  '--config', 'wrangler.toml',
  '--log-level', 'debug',
  '--port', '8787',
  '--ip', '0.0.0.0'
]
/*
  '--version'
]
*/

console.log('Starting Wrangler Dev with local home:', wranglerHome)
console.log('Using Command:', wranglerCmd)
console.log('Args:', wranglerArgs)

// Keep process alive
const interval = setInterval(() => {}, 1000)

const child = spawn(wranglerCmd, wranglerArgs, {
  cwd: __dirname,
  env: env,
  stdio: ['pipe', 'pipe', 'pipe'], // Keep stdin open
  shell: false // Safe to use false when invoking node directly
})

child.stdout.on('data', (data) => {
  console.log(`[WRANGLER]: ${data}`)
})

child.stderr.on('data', (data) => {
  console.error(`[WRANGLER ERR]: ${data}`)
})
/*
child.on('error', (err) => {
  console.error('Failed to start wrangler:', err)
})
*/
child.on('error', (err) => {
    console.error('Failed to start wrangler:', err)
})

child.on('close', (code) => {
  console.log(`Wrangler process exited with code ${code}`)
  clearInterval(interval)
  process.exit(code)
})

process.on('exit', (code) => {
  console.log(`start-dev.js exiting with code ${code}`)
})

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT, killing wrangler...')
  child.kill()
  process.exit()
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, killing wrangler...')
  child.kill()
  process.exit()
})
