const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
try { require('../src/polyfills/express-path-to-regexp'); } catch {}
