import fs from 'fs';
import path from 'path';

const userHome = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH;
const globalWranglerDir = path.join(userHome, '.wrangler');
const globalLogsDir = path.join(globalWranglerDir, 'logs');

if (!fs.existsSync(globalLogsDir)) {
  console.log(`Creating global logs directory: ${globalLogsDir}`);
  fs.mkdirSync(globalLogsDir, { recursive: true });
} else {
  console.log(`Global logs directory already exists: ${globalLogsDir}`);
}
