const fs = require('fs');
const path = require('path');
const cacheService = require('../src/services/cacheService');

async function main() {
  try { fs.mkdirSync(path.join(process.cwd(), 'server', 'logs'), { recursive: true }); } catch {}
  try {
    await cacheService.mset({
      'metrics:excel:files_total': 0,
      'metrics:excel:warnings_total': 0,
      'metrics:excel:security_blocks_total': 0
    }, 24 * 60 * 60);
  } catch {}
  process.stdout.write('Excel metrics initialized.\n');
}

main();
